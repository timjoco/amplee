import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createCorsResponse, createCorsOptions } from '@/lib/api/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function OPTIONS(req: NextRequest) {
  return createCorsOptions(req);
}

// GET /api/vendors - List public vendors (with optional filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let query = supabase
      .from('vendors')
      .select(
        `
        *,
        vendor_category_assignments!inner (
          category_id,
          vendor_categories (
            id,
            name,
            slug,
            icon
          )
        )
      `
      )
      .eq('is_public', true)
      .eq('subscription_status', 'active')
      .order('is_featured', { ascending: false })
      .order('average_rating', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (featured) {
      query = query.eq('is_featured', true);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (state) {
      query = query.eq('state', state);
    }
    if (category) {
      query = query.eq('vendor_category_assignments.vendor_categories.slug', category);
    }

    const { data, error, count } = await query;

    if (error) {
      return createCorsResponse(req, { error: error.message }, { status: 400 });
    }

    // Transform data to flatten categories
    const vendors = (data || []).map((v: any) => ({
      ...v,
      categories: v.vendor_category_assignments?.map(
        (a: any) => a.vendor_categories
      ) || [],
      vendor_category_assignments: undefined,
    }));

    return createCorsResponse(
      req,
      { vendors, count: vendors.length },
      { status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(req, { error: msg }, { status: 500 });
  }
}

// POST /api/vendors - Create a new vendor
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
    const { name, bio, city, state, email, categories } = body;

    if (!name || !email) {
      return createCorsResponse(
        req,
        { error: 'name and email are required' },
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

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Create vendor
    const { data: vendor, error: insertError } = await supabase
      .from('vendors')
      .insert({
        user_id: user.id,
        name,
        slug: `${slug}-${Date.now().toString(36)}`, // Ensure unique
        bio: bio || null,
        city: city || null,
        state: state || null,
        email,
        is_public: false, // Not public until subscription
        subscription_status: 'none',
        subscription_tier: 'free',
      })
      .select()
      .single();

    if (insertError) {
      return createCorsResponse(
        req,
        { error: insertError.message },
        { status: 400 }
      );
    }

    // Assign categories if provided
    if (categories && Array.isArray(categories) && categories.length > 0) {
      const categoryAssignments = categories.map((categoryId: string) => ({
        vendor_id: vendor.id,
        category_id: categoryId,
      }));

      await supabase.from('vendor_category_assignments').insert(categoryAssignments);
    }

    return createCorsResponse(req, { vendor }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(req, { error: msg }, { status: 500 });
  }
}
