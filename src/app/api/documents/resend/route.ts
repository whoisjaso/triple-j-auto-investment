import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { Resend } from 'resend';

// ============================================================
// POST /api/documents/resend
//
// Re-sends the buyer copy PDF to the buyer's email.
// Requires: agreement is finalized, PDF exists in storage.
// ============================================================

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { agreementId } = body;

  if (!agreementId) {
    return NextResponse.json({ error: 'Missing agreementId' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch agreement
  const { data: agreement, error: fetchError } = await supabase
    .from('document_agreements')
    .select('id, status, buyer_name, buyer_email, vehicle_description, document_type, pdf_buyer_path')
    .eq('id', agreementId)
    .single();

  if (fetchError || !agreement) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }

  if (agreement.status !== 'finalized') {
    return NextResponse.json({ error: 'Agreement must be finalized before resending' }, { status: 400 });
  }

  if (!agreement.buyer_email) {
    return NextResponse.json({ error: 'No buyer email on record' }, { status: 400 });
  }

  if (!agreement.pdf_buyer_path) {
    return NextResponse.json({ error: 'No PDF found — please finalize first' }, { status: 400 });
  }

  // Download PDF from storage
  const { data: pdfData, error: downloadError } = await supabase.storage
    .from('documents')
    .download(agreement.pdf_buyer_path);

  if (downloadError || !pdfData) {
    console.error('[resend] PDF download failed:', downloadError);
    return NextResponse.json({ error: 'PDF file not found in storage' }, { status: 500 });
  }

  const pdfBuffer = Buffer.from(await pdfData.arrayBuffer());

  // Send email
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  const docTypeLabel =
    agreement.document_type === 'billOfSale' ? 'Bill of Sale' :
    agreement.document_type === 'financing' ? 'Retail Installment Contract' :
    agreement.document_type === 'rental' ? 'Vehicle Rental Agreement' :
    'Document';

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'documents@thetriplejauto.com';

  try {
    const resend = new Resend(resendApiKey);
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
          content: pdfBuffer.toString('base64'),
        },
      ],
    });
  } catch (e) {
    console.error('[resend] Email send failed:', e);
    return NextResponse.json(
      { error: 'Email delivery failed', details: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 },
    );
  }

  // Update last_emailed_at
  await supabase
    .from('document_agreements')
    .update({ last_emailed_at: new Date().toISOString() })
    .eq('id', agreementId);

  return NextResponse.json({ success: true, emailSent: true });
}
