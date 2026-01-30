import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createCorsResponse, createCorsOptions } from '@/lib/api/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return createCorsOptions(req);
}

// GET /api/vendor-jobs - List jobs for current user
// Query params: role=vendor|band, vendor_id, band_id, status
export async function GET(req: NextRequest) {
  try {
    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return createCorsResponse(
        req,
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // 'vendor' or 'band'
    const vendorId = searchParams.get('vendor_id');
    const bandId = searchParams.get('band_id');
    const status = searchParams.get('status');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    let query = supabase
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
          state
        ),
        bands (
          id,
          name,
          avatar_url
        )
      `
      )
      .order('created_at', { ascending: false });

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    if (bandId) {
      query = query.eq('band_id', bandId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: jobs, error } = await query;

    if (error) {
      return createCorsResponse(req, { error: error.message }, { status: 400 });
    }

    // Transform to rename nested objects
    const result = (jobs || []).map((j: any) => ({
      ...j,
      vendor: j.vendors,
      band: j.bands,
      vendors: undefined,
      bands: undefined,
    }));

    return createCorsResponse(req, { jobs: result }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(req, { error: msg }, { status: 500 });
  }
}

// POST /api/vendor-jobs - Create a new job (inquiry)
// Only band admins can create jobs
export async function POST(req: NextRequest) {
  try {
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
    const { vendor_id, band_id, title, description, event_date, event_id, initial_message } =
      body;

    if (!vendor_id || !band_id || !title) {
      return createCorsResponse(
        req,
        { error: 'vendor_id, band_id, and title are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return createCorsResponse(
        req,
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a band admin (RLS will also check this, but better UX to fail early)
    const { data: membership } = await supabase
      .from('band_members')
      .select('role')
      .eq('band_id', band_id)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'admin') {
      return createCorsResponse(
        req,
        { error: 'Only band admins can create vendor inquiries' },
        { status: 403 }
      );
    }

    // Create the job
    const { data: job, error: insertError } = await supabase
      .from('vendor_jobs')
      .insert({
        vendor_id,
        band_id,
        created_by: user.id,
        title,
        description: description || null,
        event_date: event_date || null,
        event_id: event_id || null,
        status: 'inquiry',
      })
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

    if (insertError) {
      return createCorsResponse(
        req,
        { error: insertError.message },
        { status: 400 }
      );
    }

    // If initial message provided, create it
    if (initial_message && typeof initial_message === 'string') {
      await supabase.from('vendor_job_messages').insert({
        job_id: job.id,
        user_id: user.id,
        body: initial_message.trim(),
      });
    }

    const result = {
      ...job,
      vendor: job.vendors,
      band: job.bands,
      vendors: undefined,
      bands: undefined,
    };

    return createCorsResponse(req, { job: result }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(req, { error: msg }, { status: 500 });
  }
}
