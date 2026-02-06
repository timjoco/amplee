import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createCorsResponse, createCorsOptions } from '@/lib/api/cors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getVendorId(ctx: { params: any }) {
  const p = ctx?.params;
  if (!p) throw new Error('Missing params');
  if (typeof p.then === 'function') return (await p).id as string;
  return p.id as string;
}

export function OPTIONS(req: NextRequest) {
  return createCorsOptions(req);
}

// GET /api/vendors/[id] - Get a single vendor
export async function GET(req: NextRequest, ctx: { params: any }) {
  try {
    const vendorId = await getVendorId(ctx);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select(
        `
        *,
        vendor_category_assignments (
          category_id,
          vendor_categories (
            id,
            name,
            slug,
            icon
          )
        ),
        vendor_services (
          id,
          name,
          description,
          base_price,
          price_unit,
          is_active,
          display_order
        ),
        vendor_gallery (
          id,
          image_url,
          caption,
          display_order
        )
      `
      )
      .eq('id', vendorId)
      .single();

    if (error) {
      return createCorsResponse(req, { error: error.message }, { status: 404 });
    }

    // Check if vendor is public or user owns it
    if (!vendor.is_public || vendor.subscription_status !== 'active') {
      // Check if user owns this vendor
      const authHeader =
        req.headers.get('authorization') ?? req.headers.get('Authorization');

      if (authHeader) {
        const userSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          { global: { headers: { Authorization: authHeader } } }
        );

        const {
          data: { user },
        } = await userSupabase.auth.getUser();

        if (user?.id !== vendor.user_id) {
          return createCorsResponse(
            req,
            { error: 'Vendor not found' },
            { status: 404 }
          );
        }
      } else {
        return createCorsResponse(
          req,
          { error: 'Vendor not found' },
          { status: 404 }
        );
      }
    }

    // Transform data to flatten categories
    const result = {
      ...vendor,
      categories:
        vendor.vendor_category_assignments?.map(
          (a: any) => a.vendor_categories
        ) || [],
      services: vendor.vendor_services || [],
      gallery: vendor.vendor_gallery || [],
      vendor_category_assignments: undefined,
      vendor_services: undefined,
      vendor_gallery: undefined,
    };

    return createCorsResponse(req, { vendor: result }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(req, { error: msg }, { status: 500 });
  }
}

// PATCH /api/vendors/[id] - Update a vendor
export async function PATCH(req: NextRequest, ctx: { params: any }) {
  try {
    const vendorId = await getVendorId(ctx);

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
      'name',
      'bio',
      'avatar_url',
      'cover_image_url',
      'city',
      'state',
      'country',
      'service_radius_miles',
      'email',
      'phone',
      'website',
      'social_links',
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return createCorsResponse(
        req,
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
      .select()
      .single();

    if (error) {
      return createCorsResponse(req, { error: error.message }, { status: 400 });
    }

    // Handle category updates if provided
    if (body.categories && Array.isArray(body.categories)) {
      // Delete existing assignments
      await supabase
        .from('vendor_category_assignments')
        .delete()
        .eq('vendor_id', vendorId);

      // Insert new assignments
      if (body.categories.length > 0) {
        const categoryAssignments = body.categories.map(
          (categoryId: string) => ({
            vendor_id: vendorId,
            category_id: categoryId,
          })
        );
        await supabase
          .from('vendor_category_assignments')
          .insert(categoryAssignments);
      }
    }

    return createCorsResponse(req, { vendor }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(req, { error: msg }, { status: 500 });
  }
}

// DELETE /api/vendors/[id] - Delete a vendor
export async function DELETE(req: NextRequest, ctx: { params: any }) {
  try {
    const vendorId = await getVendorId(ctx);

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

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', vendorId);

    if (error) {
      return createCorsResponse(req, { error: error.message }, { status: 400 });
    }

    return createCorsResponse(req, { ok: true }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(req, { error: msg }, { status: 500 });
  }
}
