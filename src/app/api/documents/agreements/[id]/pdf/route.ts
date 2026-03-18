import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { generatePdf } from '@/lib/documents/pdf-generator';
import { createClient } from '@/lib/supabase/server';

// Allow up to 60s for PDF generation (Puppeteer cold start + render)
export const maxDuration = 60;

// GET /api/documents/agreements/[id]/pdf?copy=BUYER+COPY
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const url = new URL(req.url);
  const copy = url.searchParams.get('copy') || 'BUYER COPY';
  const inline = url.searchParams.get('inline') === 'true';

  // Verify agreement exists and has completed data
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

  try {
    const pdfBuffer = await generatePdf({ agreementId: id, copyLabel: copy });

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
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error('[pdf] Generation failed:', e);
    return NextResponse.json(
      { error: 'PDF generation failed', details: e instanceof Error ? e.message : 'Unknown' },
      { status: 500 },
    );
  }
}
