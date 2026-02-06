import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createCorsResponse, createCorsOptions } from '@/lib/api/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getJobId(ctx: { params: any }) {
  const p = ctx?.params;
  if (!p) throw new Error('Missing params');
  if (typeof p.then === 'function') return (await p).id as string;
  return p.id as string;
}

export function OPTIONS(req: NextRequest) {
  return createCorsOptions(req);
}

// GET /api/vendor-jobs/[id] - Get a single job with messages
export async function GET(req: NextRequest, ctx: { params: any }) {
  try {
    const jobId = await getJobId(ctx);

    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return createCorsResponse(
        req,
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get job details
    const { data: job, error } = await supabase
      .from('vendor_jobs')
      .select(
        `
        *,
        vendors (
          id,
          name,
          slug,
          avatar_url,
          city,
          state,
          user_id
        ),
        bands (
          id,
          name,
          avatar_url
        ),
        events (
          id,
          title,
          starts_at
        )
      `
      )
      .eq('id', jobId)
      .single();

    if (error) {
      return createCorsResponse(req, { error: 'Job not found' }, { status: 404 });
    }

    // Get messages with profiles
    const { data: messages } = await supabase
      .from('vendor_job_messages')
      .select(
        `
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url
        )
      `
      )
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    // Get reactions for all messages
    const messageIds = (messages || []).map((m: any) => m.id);
    const { data: reactions } = messageIds.length > 0
      ? await supabase
          .from('vendor_job_message_reactions')
          .select('*')
          .in('message_id', messageIds)
      : { data: [] };

    // Group reactions by message
    const reactionsByMessage: Record<number, any[]> = {};
    (reactions || []).forEach((r: any) => {
      if (!reactionsByMessage[r.message_id]) {
        reactionsByMessage[r.message_id] = [];
      }
      reactionsByMessage[r.message_id].push(r);
    });

    // Transform messages
    const messagesWithReactions = (messages || []).map((m: any) => ({
      ...m,
      profile: m.profiles,
      profiles: undefined,
      reactions: reactionsByMessage[m.id] || [],
    }));

    const result = {
      ...job,
      vendor: job.vendors,
      band: job.bands,
      event: job.events,
      vendors: undefined,
      bands: undefined,
      events: undefined,
      messages: messagesWithReactions,
    };

    return createCorsResponse(req, { job: result }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(req, { error: msg }, { status: 500 });
  }
}

// PATCH /api/vendor-jobs/[id] - Update a job
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const jobId = await getJobId(ctx);

    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return createCorsResponse(
        req,
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Allowed fields to update
    const allowedFields = [
      'title',
      'description',
      'event_date',
      'event_id',
      'status',
      'quoted_amount',
      'final_amount',
      'notes',
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Set timestamps based on status changes
    if (body.status === 'quoted' && !body.quoted_at) {
      updates.quoted_at = new Date().toISOString();
    }
    if (body.status === 'accepted' && !body.accepted_at) {
      updates.accepted_at = new Date().toISOString();
    }
    if (body.status === 'completed' && !body.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return createCorsResponse(
        req,
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: job, error } = await supabase
      .from('vendor_jobs')
      .update(updates)
      .eq('id', jobId)
      .select(
        `
        *,
        vendors (
          id,
          name,
          slug,
          avatar_url
        ),
        bands (
          id,
          name,
          avatar_url
        )
      `
      )
      .single();

    if (error) {
      return createCorsResponse(req, { error: error.message }, { status: 400 });
    }

    const result = {
      ...job,
      vendor: job.vendors,
      band: job.bands,
      vendors: undefined,
      bands: undefined,
    };

    return createCorsResponse(req, { job: result }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(req, { error: msg }, { status: 500 });
  }
}
