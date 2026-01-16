// supabase/functions/delete-account/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ORIGIN = Deno.env.get('CORS_ORIGIN') ?? '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    // Verify user authentication via Authorization header
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }

    // User-context client to verify identity
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: 'Not authenticated' }, 401);
    }

    const userId = userData.user.id;

    // Service-role client for privileged operations
    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Delete user data in order (respecting foreign key constraints)
    // Using service role bypasses RLS
    const errors: string[] = [];

    // Helper to safely delete and log errors
    const safeDelete = async (table: string, column: string) => {
      const { error } = await service.from(table).delete().eq(column, userId);
      if (error) {
        console.error(`Delete ${table} error:`, error);
        errors.push(`${table}: ${error.message}`);
      }
    };

    // Helper to nullify created_by references (for shared content we don't want to delete)
    const safeNullify = async (table: string, column: string) => {
      const { error } = await service.from(table).update({ [column]: null }).eq(column, userId);
      if (error) {
        console.error(`Nullify ${table}.${column} error:`, error);
        errors.push(`${table}.${column} nullify: ${error.message}`);
      }
    };

    // First, nullify created_by references on shared content (don't delete these)
    await safeNullify('events', 'created_by');
    await safeNullify('songs', 'created_by');
    await safeNullify('bands', 'created_by');
    await safeNullify('band_rosters', 'created_by');

    // Handle orphaned bands: promote another member to admin or delete band if empty
    const { data: userBands } = await service
      .from('band_members')
      .select('band_id, role')
      .eq('user_id', userId);

    console.log(`User ${userId} is member of ${userBands?.length ?? 0} bands`);

    if (userBands && userBands.length > 0) {
      for (const membership of userBands) {
        console.log(`Processing band ${membership.band_id}, user role: ${membership.role}`);

        // Check if user was admin of this band
        if (membership.role === 'admin') {
          // Find other members of this band
          const { data: otherMembers, error: otherMembersErr } = await service
            .from('band_members')
            .select('user_id, band_id, created_at')
            .eq('band_id', membership.band_id)
            .neq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(1);

          console.log(`Band ${membership.band_id} other members query:`, {
            count: otherMembers?.length ?? 0,
            error: otherMembersErr?.message,
            members: otherMembers
          });

          if (otherMembers && otherMembers.length > 0) {
            // Promote oldest member to admin
            const { error: promoteErr } = await service
              .from('band_members')
              .update({ role: 'admin' })
              .eq('band_id', otherMembers[0].band_id)
              .eq('user_id', otherMembers[0].user_id);

            if (promoteErr) {
              console.error(`Failed to promote member in band ${membership.band_id}:`, promoteErr);
              errors.push(`band_members promote: ${promoteErr.message}`);
            } else {
              console.log(`Promoted user ${otherMembers[0].user_id} to admin of band ${membership.band_id}`);
            }
          } else {
            // No other members - delete the band and all its data
            console.log(`Deleting orphaned band ${membership.band_id} (no other members)`);

            // Delete band-related data in order
            await service.from('event_setlist_items').delete().eq('event_id',
              service.from('events').select('id').eq('band_id', membership.band_id)
            );
            await service.from('event_message_reactions').delete().in('message_id',
              (await service.from('event_messages').select('id').eq('band_id', membership.band_id)).data?.map(m => m.id) || []
            );
            await service.from('event_messages').delete().eq('band_id', membership.band_id);
            await service.from('event_members').delete().in('event_id',
              (await service.from('events').select('id').eq('band_id', membership.band_id)).data?.map(e => e.id) || []
            );
            await service.from('event_attendance').delete().in('event_id',
              (await service.from('events').select('id').eq('band_id', membership.band_id)).data?.map(e => e.id) || []
            );
            await service.from('events').delete().eq('band_id', membership.band_id);
            await service.from('gig_proposal_votes').delete().in('proposal_id',
              (await service.from('gig_proposals').select('id').eq('band_id', membership.band_id)).data?.map(p => p.id) || []
            );
            await service.from('gig_proposal_options').delete().in('proposal_id',
              (await service.from('gig_proposals').select('id').eq('band_id', membership.band_id)).data?.map(p => p.id) || []
            );
            await service.from('gig_proposals').delete().eq('band_id', membership.band_id);
            await service.from('setlist_template_items').delete().in('template_id',
              (await service.from('setlist_templates').select('id').eq('band_id', membership.band_id)).data?.map(t => t.id) || []
            );
            await service.from('setlist_templates').delete().eq('band_id', membership.band_id);
            await service.from('song_comments').delete().in('song_id',
              (await service.from('songs').select('id').eq('band_id', membership.band_id)).data?.map(s => s.id) || []
            );
            await service.from('songs').delete().eq('band_id', membership.band_id);
            await service.from('band_roster_members').delete().in('roster_id',
              (await service.from('band_rosters').select('id').eq('band_id', membership.band_id)).data?.map(r => r.id) || []
            );
            await service.from('band_rosters').delete().eq('band_id', membership.band_id);
            await service.from('band_invitations').delete().eq('band_id', membership.band_id);
            await service.from('band_members').delete().eq('band_id', membership.band_id);

            const { error: bandDeleteErr } = await service
              .from('bands')
              .delete()
              .eq('id', membership.band_id);

            if (bandDeleteErr) {
              console.error(`Failed to delete band ${membership.band_id}:`, bandDeleteErr);
              errors.push(`bands delete: ${bandDeleteErr.message}`);
            }
          }
        }
      }
    }

    // 1. Delete user's song comments
    await safeDelete('song_comments', 'user_id');

    // 2. Delete user's availability dates
    await safeDelete('member_availability_dates', 'profile_id');

    // 3. Delete user's event message reactions
    await safeDelete('event_message_reactions', 'user_id');

    // 4. Delete user's event messages
    await safeDelete('event_messages', 'user_id');

    // 5. Delete user's event attendance records
    await safeDelete('event_attendance', 'user_id');

    // 6. Delete user's gig proposal votes
    await safeDelete('gig_proposal_votes', 'user_id');

    // 7. Delete user's gig proposal options (created_by)
    await safeDelete('gig_proposal_options', 'created_by');

    // 8. Delete user's gig proposals (created_by)
    await safeDelete('gig_proposals', 'created_by');

    // 9. Remove user from event memberships
    await safeDelete('event_members', 'user_id');

    // 10. Remove user from band memberships
    await safeDelete('band_members', 'user_id');

    // 11. Delete user's feedback
    await safeDelete('app_feedback', 'user_id');

    // Log any data deletion errors but continue
    if (errors.length > 0) {
      console.warn('Some data deletes had errors:', errors);
    }

    // 12. Delete from public.users table (legacy/duplicate user data)
    console.log(`Starting auth user deletion for: ${userId}`);
    const { error: publicUsersErr } = await service.from('users').delete().eq('id', userId);
    if (publicUsersErr) {
      console.error('Public users delete error:', publicUsersErr);
      errors.push(`users: ${publicUsersErr.message}`);
    } else {
      console.log('Public users record deleted successfully');
    }

    // 13. Delete the profile (required before auth.users due to FK constraint)
    const { error: profileDeleteErr } = await service.from('profiles').delete().eq('id', userId);
    if (profileDeleteErr) {
      console.error('Profile delete error:', profileDeleteErr);
      errors.push(`profiles: ${profileDeleteErr.message}`);
    } else {
      console.log('Profile deleted successfully');
    }

    // 13. Delete auth user using SQL function (more reliable than admin API)
    // The SQL function handles: auth.identities, auth.sessions, auth.refresh_tokens, auth.users
    console.log('Calling delete_auth_user SQL function...');
    const { error: authDeleteErr } = await service.rpc('delete_auth_user', { target_user_id: userId });

    if (authDeleteErr) {
      console.error('Auth user delete error:', authDeleteErr);

      // CRITICAL: If auth deletion failed but profile was deleted, restore profile
      if (!profileDeleteErr) {
        console.log('Attempting to restore profile after auth delete failure...');
        const { error: restoreErr } = await service.from('profiles').insert({
          id: userId,
          display_name: 'Account Pending Deletion',
          onboarded: false,
        });

        if (restoreErr) {
          console.error('CRITICAL: Failed to restore profile:', restoreErr);
          return jsonResponse({
            error: 'Account deletion failed and profile could not be restored. Please contact support.',
            details: authDeleteErr.message,
            restoreError: restoreErr.message,
            deleteErrors: errors
          }, 500);
        }
        console.log('Profile restored successfully');
      }

      return jsonResponse({
        error: 'Failed to delete account. Your profile has been preserved.',
        details: authDeleteErr.message,
        deleteErrors: errors
      }, 500);
    }

    console.log('Auth user deleted successfully via SQL');

    return jsonResponse({ ok: true, message: 'Account deleted successfully' }, 200);
  } catch (e) {
    console.error('Delete account error:', e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
