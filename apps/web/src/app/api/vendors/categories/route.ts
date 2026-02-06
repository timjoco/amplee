import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createCorsResponse, createCorsOptions } from '@/lib/api/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return createCorsOptions(req);
}

// GET /api/vendors/categories - List all vendor categories
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: categories, error } = await supabase
      .from('vendor_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      return createCorsResponse(req, { error: error.message }, { status: 400 });
    }

    return createCorsResponse(req, { categories }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(req, { error: msg }, { status: 500 });
  }
}
