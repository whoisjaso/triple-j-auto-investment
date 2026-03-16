import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { decodeCompletedLinkFromUrl, type CompletedLinkData } from '@/lib/documents/customerPortal';
import BillOfSalePreview from '@/components/documents/BillOfSalePreview';
import ContractPreview from '@/components/documents/ContractPreview';
import RentalPreview from '@/components/documents/RentalPreview';
import type { BillOfSaleData } from '@/lib/documents/billOfSale';
import type { ContractData } from '@/lib/documents/finance';
import type { RentalData } from '@/lib/documents/rental';
import type { SignatureData } from '@/lib/documents/shared';

// ============================================================
// Internal render route for PDF generation via Puppeteer.
// URL: /documents/render/[id]?copy=BUYER+COPY&token=SECRET
// ============================================================

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ copy?: string; token?: string }>;
}

function buildDocData(decoded: CompletedLinkData) {
  return { ...decoded.dd, ...decoded.cd } as Record<string, unknown>;
}

function buildSignatures(decoded: CompletedLinkData): SignatureData {
  return {
    dealerSignature: decoded.ds || '',
    dealerSignatureDate: decoded.dsd || '',
    buyerSignature: decoded.bs || '',
    buyerSignatureDate: decoded.bsd || '',
    coBuyerSignature: decoded.cs || '',
    coBuyerSignatureDate: decoded.csd || '',
    buyerIdPhoto: decoded.bi || '',
  };
}

export default async function RenderPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { copy, token } = await searchParams;

  // Auth: require internal render token
  const expectedToken = process.env.INTERNAL_RENDER_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    notFound();
  }

  // Fetch agreement with completed_link
  const supabase = await createClient();
  const { data: agreement, error } = await supabase
    .from('document_agreements')
    .select('completed_link, document_type, status')
    .eq('id', id)
    .single();

  if (error || !agreement?.completed_link) {
    notFound();
  }

  // Decode the compressed document data
  const decoded = decodeCompletedLinkFromUrl(agreement.completed_link);
  if (!decoded) {
    notFound();
  }

  const docData = buildDocData(decoded);
  const signatures = buildSignatures(decoded);
  const copyLabel = copy || undefined;

  // Render the appropriate preview component
  switch (decoded.s) {
    case 'billOfSale':
      return (
        <BillOfSalePreview
          data={docData as unknown as BillOfSaleData}
          signatures={signatures}
          acknowledgments={decoded.ack as Record<string, boolean> & { inspected: boolean; asIs: boolean; receivedCopy: boolean; allSalesFinal: boolean; odometerInformed: boolean; responsibility: boolean; financingSeparate: boolean }}
          copyLabel={copyLabel}
        />
      );
    case 'financing':
      return (
        <ContractPreview
          data={docData as unknown as ContractData}
          signatures={signatures}
          copyLabel={copyLabel}
        />
      );
    case 'rental':
      // For rental PDFs, render a single copy (not dual-copy)
      return (
        <RentalPreview
          data={docData as unknown as RentalData}
          signatures={signatures}
          copyLabel={copyLabel}
        />
      );
    default:
      notFound();
  }
}
