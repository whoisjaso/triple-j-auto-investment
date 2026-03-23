import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { fill130U } from '@/lib/fill-130u/fill-pdf';
import { type AgreementData, DEALER } from '@/lib/fill-130u/field-mapping';
import { decodeCompletedLinkFromUrl, type CompletedLinkData } from '@/lib/documents/customerPortal';

// ── Helper: split "First Middle Last" into parts ─────────────────────

function splitName(fullName: string): { first: string; middle: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], middle: '', last: '' };
  if (parts.length === 2) return { first: parts[0], middle: '', last: parts[1] };
  return {
    first: parts[0],
    middle: parts.slice(1, -1).join(' '),
    last: parts[parts.length - 1],
  };
}

// ── Helper: build AgreementData from decoded completed_link + vehicle ─

function buildAgreementData(
  decoded: CompletedLinkData,
  agreement: Record<string, unknown>,
  vehicle: Record<string, unknown> | null,
): AgreementData {
  const dd = decoded.dd as Record<string, unknown>; // dealer data
  const cd = decoded.cd as Record<string, unknown>; // customer data
  const section = decoded.s;

  // Buyer name — try customer data first, then agreement columns
  const rawBuyerName =
    (cd.buyerName as string) ||
    (cd.renterName as string) ||
    [cd.applicantFirstName, cd.applicantMiddleName, cd.applicantLastName].filter(Boolean).join(' ') ||
    (agreement.buyer_name as string) ||
    '';

  const nameParts = splitName(rawBuyerName);

  // For form130U section, use customer data directly for names
  const buyerFirst = (cd.applicantFirstName as string) || nameParts.first;
  const buyerMiddle = (cd.applicantMiddleName as string) || nameParts.middle;
  const buyerLast = (cd.applicantLastName as string) || nameParts.last;

  // Address — customer data → agreement columns
  const buyerAddress = (cd.buyerAddress as string) || (cd.renterAddress as string) || (cd.mailingAddress as string) || (agreement.buyer_address as string) || '';
  const buyerCity = (cd.buyerCity as string) || (cd.renterCity as string) || (cd.mailingCity as string) || (agreement.buyer_city as string) || '';
  const buyerState = (cd.buyerState as string) || (cd.renterState as string) || (cd.mailingState as string) || (agreement.buyer_state as string) || 'TX';
  const buyerZip = (cd.buyerZip as string) || (cd.renterZip as string) || (cd.mailingZip as string) || (agreement.buyer_zip as string) || '';
  const buyerCounty = (cd.countyOfResidence as string) || '';

  // Vehicle info — dealer data → vehicle table
  const vin = (dd.vehicleVin as string) || (dd.vin as string) || (agreement.vehicle_vin as string) || (vehicle?.vin as string) || '';
  const year = (dd.vehicleYear as string) || (dd.year as string) || (vehicle?.year?.toString()) || '';
  const make = (dd.vehicleMake as string) || (dd.make as string) || (vehicle?.make as string) || '';
  const model = (dd.vehicleModel as string) || (dd.model as string) || (vehicle?.model as string) || '';
  const bodyStyle = (dd.vehicleBodyStyle as string) || (dd.bodyStyle as string) || (vehicle?.body_style as string) || '';
  const majorColor = (dd.vehicleColor as string) || (dd.majorColor as string) || (vehicle?.exterior_color as string) || '';
  const minorColor = (dd.minorColor as string) || '';
  const odometer = (dd.odometerReading as string) || (dd.vehicleMileage as string) || (vehicle?.mileage?.toString()) || '';

  // Odometer brand
  const odometerStatus = (dd.odometerStatus as string) || (dd.odometerBrand as string) || 'A';
  const odometerBrand: 'A' | 'N' | 'X' =
    odometerStatus === 'not_actual' || odometerStatus === 'N' ? 'N' :
    odometerStatus === 'exceeds' || odometerStatus === 'X' ? 'X' : 'A';

  // Sale info
  const salePrice = Number(dd.salePrice ?? dd.salesPrice ?? 0);
  const tradeInAmount = Number(dd.tradeInAllowance ?? dd.tradeInAmount ?? 0);
  const tradeInDescription = (dd.tradeInDescription as string) || '';
  const rebateAmount = Number(dd.rebateOrIncentive ?? 0);
  const saleDate = (dd.saleDate as string) || '';

  // Lien info — BHPH deals use Triple J as lienholder
  const hasLien = (cd.hasLien as boolean) || false;

  // DL info
  const buyerDl = (cd.buyerLicense as string) || (cd.renterLicense as string) || (cd.applicantIdNumber as string) || (agreement.buyer_license as string) || '';
  const buyerDlState = (cd.buyerLicenseState as string) || (cd.renterLicenseState as string) || (cd.applicantIdState as string) || (agreement.buyer_license_state as string) || '';

  // Co-buyer
  const coBuyerName = (cd.coBuyerName as string) || (cd.coRenterName as string) || (cd.coApplicantName as string) || (agreement.co_buyer_name as string) || '';

  // Application type
  const applyingFor: AgreementData['applying_for'] =
    section === 'form130U'
      ? ((dd.applicationType as string) === 'titleOnly' ? 'title_only'
        : (dd.applicationType as string) === 'registrationOnly' ? 'registration_only'
        : 'title_and_registration')
      : 'title_and_registration'; // default for bill of sale / financing

  const applicantType: AgreementData['applicant_type'] =
    (cd.applicantType as string)?.toLowerCase() === 'business' ? 'business' : 'individual';

  return {
    vin,
    year,
    make,
    model,
    body_style: bodyStyle,
    major_color: majorColor,
    minor_color: minorColor || undefined,
    odometer,
    odometer_brand: odometerBrand,
    empty_weight: (dd.emptyWeight as string) || (vehicle?.weight_lbs?.toString()) || undefined,
    carrying_capacity: (dd.carryingCapacity as string) || undefined,
    tx_plate_no: (dd.vehiclePlate as string) || (dd.licensePlateNo as string) || (vehicle?.license_plate as string) || undefined,
    buyer_first_name: buyerFirst,
    buyer_middle_name: buyerMiddle || undefined,
    buyer_last_name: buyerLast,
    buyer_address: buyerAddress,
    buyer_city: buyerCity,
    buyer_state: buyerState,
    buyer_zip: buyerZip,
    buyer_county: buyerCounty,
    buyer_phone: (cd.buyerPhone as string) || (cd.renterPhone as string) || (cd.applicantPhone as string) || (agreement.buyer_phone as string) || undefined,
    buyer_email: (cd.buyerEmail as string) || (cd.renterEmail as string) || (cd.applicantEmail as string) || (agreement.buyer_email as string) || undefined,
    buyer_dl_number: buyerDl || undefined,
    buyer_dl_state: buyerDlState || undefined,
    co_buyer_name: coBuyerName || undefined,
    sale_price: salePrice,
    sale_date: saleDate || undefined,
    trade_in_amount: tradeInAmount || undefined,
    trade_in_description: tradeInDescription || undefined,
    rebate_amount: rebateAmount || undefined,
    applying_for: applyingFor,
    applicant_type: applicantType,
    has_lien: hasLien,
    lien_date: hasLien ? saleDate : undefined,
    etitle_lienholder_id: undefined, // Populated manually if needed
  };
}

// ═════════════════════════════════════════════════════════════════════
// GET /api/generate-130u?agreement_id=xxx
// ═════════════════════════════════════════════════════════════════════

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const agreementId = req.nextUrl.searchParams.get('agreement_id');
  if (!agreementId) {
    return NextResponse.json({ error: 'Missing agreement_id parameter' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch agreement
  const { data: agreement, error: agError } = await supabase
    .from('document_agreements')
    .select('*')
    .eq('id', agreementId)
    .single();

  if (agError || !agreement) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }

  // Decode completed_link to get full form data
  const completedLink = agreement.completed_link as string;
  if (!completedLink) {
    return NextResponse.json({ error: 'Agreement has no completed data — it must be completed first' }, { status: 400 });
  }

  const decoded = decodeCompletedLinkFromUrl(completedLink);
  if (!decoded) {
    return NextResponse.json({ error: 'Could not decode agreement data' }, { status: 500 });
  }

  // Look up vehicle by VIN for additional details
  const vin = (decoded.dd as Record<string, unknown>).vehicleVin ||
    (decoded.dd as Record<string, unknown>).vin ||
    agreement.vehicle_vin;

  let vehicle: Record<string, unknown> | null = null;
  if (vin) {
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('vin', vin as string)
      .single();
    vehicle = vehicleData;
  }

  // Build the data object and fill the PDF
  const agreementData = buildAgreementData(decoded, agreement, vehicle);

  try {
    const pdfBytes = await fill130U(agreementData);
    const buyerLast = agreementData.buyer_last_name || 'Unknown';
    const vinLast6 = agreementData.vin.slice(-6) || 'NOVIN';
    const filename = `130-U_${buyerLast}_${vinLast6}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[generate-130u] PDF generation failed:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}

// ═════════════════════════════════════════════════════════════════════
// POST /api/generate-130u — Manual / preview mode (accepts AgreementData JSON)
// ═════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();

  // Merge dealer defaults for any missing seller fields
  const data: AgreementData = {
    ...body,
    applying_for: body.applying_for || 'title_and_registration',
    applicant_type: body.applicant_type || 'individual',
    sale_price: Number(body.sale_price ?? 0),
  };

  try {
    const pdfBytes = await fill130U(data);
    const buyerLast = data.buyer_last_name || 'Unknown';
    const vinLast6 = (data.vin || '').slice(-6) || 'NOVIN';
    const filename = `130-U_${buyerLast}_${vinLast6}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[generate-130u] PDF generation failed:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
