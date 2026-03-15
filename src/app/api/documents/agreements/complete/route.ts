import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// POST — Public endpoint for customers to complete an agreement
// Updates an existing pending record to completed status
// ============================================================

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: 'Missing agreement id' }, { status: 400 });
  }

  // Verify the agreement exists and is pending
  const { data: existing, error: fetchError } = await supabase
    .from('document_agreements')
    .select('id, status, buyer_name')
    .eq('id', body.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }

  // Name priority: if admin already set buyer_name, keep it; otherwise use customer's
  const buyerName = existing.buyer_name || body.buyer_name || null;

  const updates: Record<string, unknown> = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    buyer_name: buyerName,
    buyer_email: body.buyer_email || null,
    buyer_phone: body.buyer_phone || null,
    acknowledgments: body.acknowledgments || {},
    has_buyer_signature: body.has_buyer_signature || false,
    has_cobuyer_signature: body.has_cobuyer_signature || false,
    has_dealer_signature: body.has_dealer_signature || false,
    has_buyer_id: body.has_buyer_id || false,
    completed_link: body.completed_link || null,
  };

  // Store ID photo if provided
  if (body.buyer_id_photo) {
    updates.buyer_id_photo = body.buyer_id_photo;
  }

  const { data, error } = await supabase
    .from('document_agreements')
    .update(updates)
    .eq('id', body.id)
    .select('id, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
