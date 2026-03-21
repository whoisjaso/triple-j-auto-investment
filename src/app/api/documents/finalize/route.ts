import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { generatePdf } from '@/lib/documents/pdf-generator';
import { Resend } from 'resend';

// Allow up to 60s for PDF generation (Puppeteer + Chromium + storage upload + email)
export const maxDuration = 60;

// ============================================================
// POST /api/documents/finalize
//
// FLOW:
//   1. Validate: agreement exists, is completed, has buyer email
//   2. Generate BUYER COPY + DEALER COPY PDFs via Puppeteer (headless Chromium)
//   3. Upload both PDFs to Supabase Storage
//   4. Email BUYER COPY to buyer
//   5. Update agreement: status=finalized, pdf paths, timestamps
//
// Returns 200 on full success, 207 on partial (PDF ok, email/storage failed)
// ============================================================

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { agreementId } = body;

  if (!agreementId) {
    return NextResponse.json({ error: 'Missing agreementId' }, { status: 400 });
  }

  // 1. Fetch agreement
  const supabase = await createClient();
  const { data: agreement, error: fetchError } = await supabase
    .from('document_agreements')
    .select('id, status, buyer_name, buyer_email, vehicle_description, document_type, completed_link')
    .eq('id', agreementId)
    .single();

  if (fetchError || !agreement) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }

  if (agreement.status === 'finalized') {
    return NextResponse.json({ error: 'Agreement already finalized' }, { status: 409 });
  }

  if (agreement.status !== 'completed') {
    return NextResponse.json({ error: 'Agreement must be completed before finalizing' }, { status: 400 });
  }

  if (!agreement.buyer_email) {
    return NextResponse.json({ error: 'Buyer email required for finalization' }, { status: 400 });
  }

  if (!agreement.completed_link) {
    return NextResponse.json({ error: 'No completed document data found' }, { status: 400 });
  }

  // 2. Generate PDFs
  let buyerPdf: Buffer;
  let dealerPdf: Buffer;
  try {
    [buyerPdf, dealerPdf] = await Promise.all([
      generatePdf({ agreementId, copyLabel: 'BUYER COPY' }),
      generatePdf({ agreementId, copyLabel: 'DEALER COPY' }),
    ]);
  } catch (e) {
    console.error('[finalize] PDF generation failed:', e);
    return NextResponse.json(
      { error: 'PDF generation failed', details: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 },
    );
  }

  const warnings: string[] = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeVehicle = (agreement.vehicle_description || 'vehicle').replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-');
  const buyerFileName = `${safeVehicle}-BuyerCopy-${timestamp}.pdf`;
  const dealerFileName = `${safeVehicle}-DealerCopy-${timestamp}.pdf`;
  const storagePath = `agreements/${agreementId}`;

  // 3. Upload to Supabase Storage
  let pdfBuyerPath: string | null = null;
  let pdfDealerPath: string | null = null;
  try {
    const [buyerUpload, dealerUpload] = await Promise.all([
      supabase.storage.from('documents').upload(`${storagePath}/${buyerFileName}`, buyerPdf, {
        contentType: 'application/pdf',
        upsert: true,
      }),
      supabase.storage.from('documents').upload(`${storagePath}/${dealerFileName}`, dealerPdf, {
        contentType: 'application/pdf',
        upsert: true,
      }),
    ]);

    if (buyerUpload.error) {
      console.error('[finalize] Buyer PDF upload failed:', buyerUpload.error);
      warnings.push('Buyer PDF storage failed');
    } else {
      pdfBuyerPath = buyerUpload.data.path;
    }

    if (dealerUpload.error) {
      console.error('[finalize] Dealer PDF upload failed:', dealerUpload.error);
      warnings.push('Dealer PDF storage failed');
    } else {
      pdfDealerPath = dealerUpload.data.path;
    }
  } catch (e) {
    console.error('[finalize] Storage upload failed:', e);
    warnings.push('PDF storage failed');
  }

  // 4. Email buyer copy
  let emailSent = false;
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      warnings.push('RESEND_API_KEY not configured — email skipped');
    } else {
      const resend = new Resend(resendApiKey);
      const docTypeLabel =
        agreement.document_type === 'billOfSale' ? 'Bill of Sale' :
        agreement.document_type === 'financing' ? 'Retail Installment Contract' :
        agreement.document_type === 'rental' ? 'Vehicle Rental Agreement' :
        'Document';

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'documents@thetriplejauto.com';

      await resend.emails.send({
        from: `Triple J Auto Investment <${fromEmail}>`,
        to: agreement.buyer_email,
        subject: `Your ${docTypeLabel} — ${agreement.vehicle_description || 'Triple J Auto'}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <h2 style="color: #1a1a1a; margin-bottom: 8px;">Triple J Auto Investment LLC</h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 32px;">8774 Almeda Genoa Road, Houston, Texas 77075</p>

            <p style="color: #1a1a1a; font-size: 16px;">Dear ${agreement.buyer_name || 'Valued Customer'},</p>

            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              Please find attached your <strong>${docTypeLabel}</strong> for the
              <strong>${agreement.vehicle_description || 'vehicle'}</strong>.
            </p>

            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              This is your official copy for your records. Please keep it in a safe place.
            </p>

            <p style="color: #333; font-size: 15px; line-height: 1.6;">
              If you have any questions, please contact us at <strong>(281) 253-3602</strong>.
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Thank you for your business.<br/>
              <strong>Triple J Auto Investment LLC</strong>
            </p>
          </div>
        `,
        attachments: [
          {
            filename: `${docTypeLabel.replace(/\s+/g, '-')}-${agreement.vehicle_description || 'document'}.pdf`,
            content: buyerPdf.toString('base64'),
          },
        ],
      });
      emailSent = true;
    }
  } catch (e) {
    console.error('[finalize] Email send failed:', e);
    warnings.push('Email delivery failed');
  }

  // 5. Update agreement status
  const updateData: Record<string, unknown> = {
    status: 'finalized',
    finalized_at: new Date().toISOString(),
  };
  if (pdfBuyerPath) updateData.pdf_buyer_path = pdfBuyerPath;
  if (pdfDealerPath) updateData.pdf_dealer_path = pdfDealerPath;
  if (emailSent) updateData.last_emailed_at = new Date().toISOString();

  await supabase
    .from('document_agreements')
    .update(updateData)
    .eq('id', agreementId);

  const status = warnings.length > 0 ? 207 : 200;
  return NextResponse.json({
    success: true,
    finalized: true,
    emailSent,
    pdfBuyerPath,
    pdfDealerPath,
    warnings: warnings.length > 0 ? warnings : undefined,
  }, { status });
}
