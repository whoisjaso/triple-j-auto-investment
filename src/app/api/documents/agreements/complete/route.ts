import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ============================================================
// POST — Public endpoint for customers to complete an agreement
// Updates an existing pending record to completed status
// ============================================================

// Normalize customer data fields across document types into DB columns
// Bill of Sale:  buyerAddress, buyerLicense, coBuyerName, etc.
// Rental:        renterAddress → buyer_address, renterLicense → buyer_license, etc.
// Financing:     buyerAddress, coBuyerName, etc.
// Form 130-U:    mailingAddress → buyer_address, applicantIdNumber → buyer_license, etc.
export function extractCustomerColumns(body: Record<string, unknown>): Record<string, unknown> {
  const cols: Record<string, unknown> = {};

  // Primary buyer/renter/applicant address
  cols.buyer_address = body.buyer_address || body.buyerAddress || body.renterAddress || body.mailingAddress || null;
  cols.buyer_city = body.buyer_city || body.buyerCity || body.renterCity || body.mailingCity || null;
  cols.buyer_state = body.buyer_state || body.buyerState || body.renterState || body.mailingState || null;
  cols.buyer_zip = body.buyer_zip || body.buyerZip || body.renterZip || body.mailingZip || null;

  // License / ID
  cols.buyer_license = body.buyer_license || body.buyerLicense || body.renterLicense || body.applicantIdNumber || null;
  cols.buyer_license_state = body.buyer_license_state || body.buyerLicenseState || body.renterLicenseState || body.applicantIdState || null;

  // Co-buyer / co-renter / co-applicant
  cols.co_buyer_name = body.co_buyer_name || body.coBuyerName || body.coRenterName || body.coApplicantName || null;
  cols.co_buyer_email = body.co_buyer_email || body.coBuyerEmail || body.coRenterEmail || null;
  cols.co_buyer_phone = body.co_buyer_phone || body.coBuyerPhone || body.coRenterPhone || null;
  cols.co_buyer_address = body.co_buyer_address || body.coBuyerAddress || body.coRenterAddress || null;
  cols.co_buyer_city = body.co_buyer_city || body.coBuyerCity || body.coRenterCity || null;
  cols.co_buyer_state = body.co_buyer_state || body.coBuyerState || body.coRenterState || null;
  cols.co_buyer_zip = body.co_buyer_zip || body.coBuyerZip || body.coRenterZip || null;
  cols.co_buyer_license = body.co_buyer_license || body.coBuyerLicense || body.coRenterLicense || null;
  cols.co_buyer_license_state = body.co_buyer_license_state || body.coBuyerLicenseState || body.coRenterLicenseState || null;

  return cols;
}

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

  // Extract normalized customer data columns
  const customerColumns = extractCustomerColumns(body);

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
    ...customerColumns,
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
