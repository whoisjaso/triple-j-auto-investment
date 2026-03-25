import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { buildPdfFromAgreement } from '@/lib/documents/pdf-builder';
import { decodeCompletedLinkFromUrl } from '@/lib/documents/customerPortal';
import { createClient } from '@/lib/supabase/server';

// GET /api/documents/agreements/[id]/pdf?copy=BUYER+COPY
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const url = new URL(req.url);
  const copy = url.searchParams.get('copy') || 'BUYER COPY';
  const inline = url.searchParams.get('inline') === 'true';

  // Fetch agreement with completed_link
  const supabase = await createClient();
  const { data: agreement, error } = await supabase
    .from('document_agreements')
    .select('id, status, vehicle_description, buyer_name, document_type, completed_link')
    .eq('id', id)
    .single();

  if (error || !agreement) {
    return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
  }

  if (!agreement.completed_link) {
    return NextResponse.json({ error: 'No completed document data' }, { status: 400 });
  }

  // Decode the completed link data
  const decoded = decodeCompletedLinkFromUrl(agreement.completed_link);
  if (!decoded) {
    return NextResponse.json({ error: 'Failed to decode document data' }, { status: 400 });
  }

  try {
    // Generate PDF using pdf-lib (pure JS, no browser needed — works on Vercel)
    const pdfBytes = await buildPdfFromAgreement(decoded, copy);

    const docTypeLabels: Record<string, string> = {
      billOfSale: 'BillOfSale',
      financing: 'Financing',
      rental: 'Rental',
      form130U: 'Form130U',
    };
    const docLabel = docTypeLabels[agreement.document_type] || 'Document';
    const safeName = (agreement.buyer_name || 'Customer')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `TripleJ_${docLabel}_${safeName}_${dateStr}.pdf`;

    const disposition = inline ? 'inline' : 'attachment';
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
      },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? `${e.message}\n${e.stack}` : String(e);
    console.error('[pdf] Generation failed:', errMsg);
    return NextResponse.json(
      { error: 'PDF generation failed', details: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 },
    );
  }
}
