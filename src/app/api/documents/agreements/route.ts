import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

// ============================================================
// GET — Admin only, excludes completed_link blob for performance
// ============================================================

// Core columns (always present). New customer data columns (migration-13)
// are fetched on-demand via the individual agreement endpoint using select('*').
// NOTE: finalized_at, last_emailed_at, pdf_buyer_path, pdf_dealer_path
// are fetched on-demand via the individual agreement endpoint (select('*')).
// They require migration-14 — do NOT add them here until migration is confirmed.
const LISTING_COLUMNS = [
  'id', 'document_type', 'buyer_name', 'buyer_email', 'buyer_phone',
  'vehicle_description', 'vehicle_vin', 'status', 'sent_at', 'completed_at',
  'acknowledgments', 'has_buyer_signature', 'has_cobuyer_signature',
  'has_dealer_signature', 'has_buyer_id',
].join(', ');

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document_agreements')
    .select(LISTING_COLUMNS)
    .order('sent_at', { ascending: false });

  if (error) {
    console.error('[agreements GET] Supabase error:', error.message, error.code, error.details);
    // Fallback: try minimal query if column-related error
    if (error.message?.includes('column') || error.code === '42703') {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('document_agreements')
        .select('*')
        .order('sent_at', { ascending: false });
      if (!fallbackError && fallbackData) {
        // Strip large blobs from response
        const clean = fallbackData.map(({ completed_link, buyer_id_photo, ...rest }: Record<string, unknown>) => rest);
        return NextResponse.json(clean);
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

// ============================================================
// POST — Public (customers submit completed agreements)
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  if (!body.document_type) {
    return NextResponse.json({ error: 'Missing document_type' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('document_agreements')
    .insert({
      document_type: body.document_type,
      buyer_name: body.buyer_name || null,
      buyer_email: body.buyer_email || null,
      buyer_phone: body.buyer_phone || null,
      vehicle_description: body.vehicle_description || null,
      vehicle_vin: body.vehicle_vin || null,
      status: body.status || 'pending',
      completed_at: body.status === 'completed' ? new Date().toISOString() : null,
      acknowledgments: body.acknowledgments || {},
      has_buyer_signature: body.has_buyer_signature || false,
      has_cobuyer_signature: body.has_cobuyer_signature || false,
      has_dealer_signature: body.has_dealer_signature || false,
      has_buyer_id: body.has_buyer_id || false,
      completed_link: body.completed_link || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// ============================================================
// PATCH — Admin only
// ============================================================

export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const supabase = await createClient();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: 'Missing agreement id' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.status) {
    updates.status = body.status;
    if (body.status === 'completed') updates.completed_at = new Date().toISOString();
  }
  if (body.buyer_name !== undefined) updates.buyer_name = body.buyer_name;
  if (body.buyer_email !== undefined) updates.buyer_email = body.buyer_email;
  if (body.buyer_phone !== undefined) updates.buyer_phone = body.buyer_phone;
  if (body.acknowledgments !== undefined) updates.acknowledgments = body.acknowledgments;
  if (body.has_buyer_signature !== undefined) updates.has_buyer_signature = body.has_buyer_signature;
  if (body.has_cobuyer_signature !== undefined) updates.has_cobuyer_signature = body.has_cobuyer_signature;
  if (body.has_dealer_signature !== undefined) updates.has_dealer_signature = body.has_dealer_signature;
  if (body.has_buyer_id !== undefined) updates.has_buyer_id = body.has_buyer_id;
  if (body.completed_link !== undefined) updates.completed_link = body.completed_link;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('document_agreements')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
