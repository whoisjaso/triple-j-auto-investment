"use client";

import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { decodeCustomerLink, decodeCompletedLink, type CompletedLinkData, type CustomerSection } from '@/lib/documents/customerPortal';
import { ContractData } from '@/lib/documents/finance';
import { RentalData } from '@/lib/documents/rental';
import { BillOfSaleData } from '@/lib/documents/billOfSale';
import { Form130UData } from '@/lib/documents/form130U';
import { SignatureData, DEALER_ADDRESS, DEALER_PHONE } from '@/lib/documents/shared';
import { type BuyerAcknowledgments, emptyAcknowledgments } from '@/components/documents/BillOfSalePreview';
import ContractPreview from '@/components/documents/ContractPreview';
import RentalPreview from '@/components/documents/RentalPreview';
import BillOfSalePreview from '@/components/documents/BillOfSalePreview';
import Form130UPreview from '@/components/documents/Form130UPreview';
import PaymentMethodSection from '@/components/documents/PaymentMethodSection';
import PrintButton from '@/components/documents/PrintButton';
import CustomerWizard, { WizardErrorBoundary } from '@/components/documents/CustomerWizard';

const sectionTitles: Record<CustomerSection, string> = {
  financing: 'Financing Contract', rental: 'Rental Agreement', billOfSale: 'Bill of Sale', form130U: 'Form 130-U',
};

function CompletedView({ data }: { data: CompletedLinkData }) {
  const mergedData = { ...data.dd, ...data.cd };
  const signatures: SignatureData = {
    buyerIdPhoto: data.bi || '', buyerSignature: data.bs || '', buyerSignatureDate: data.bsd || '',
    coBuyerSignature: data.cs || '', coBuyerSignatureDate: data.csd || '',
    dealerSignature: data.ds || '', dealerSignatureDate: data.dsd || '',
  };
  const acknowledgments: BuyerAcknowledgments = data.ack ? {
    inspected: !!data.ack.inspected, asIs: !!data.ack.asIs, receivedCopy: !!data.ack.receivedCopy,
    allSalesFinal: !!data.ack.allSalesFinal, odometerInformed: !!data.ack.odometerInformed,
    responsibility: !!data.ack.responsibility, financingSeparate: !!data.ack.financingSeparate,
  } : emptyAcknowledgments;

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      <div className="bg-[#f5f2ed]/80 backdrop-blur-md border-b border-[#1a1a1a]/10 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle size={16} />
            <span className="text-[10px] font-bold tracking-widest uppercase">Completed Document</span>
          </div>
          <div className="flex items-center space-x-3">
            <PrintButton variant="pdf" light />
            <PrintButton variant="print" light />
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 pt-8 print:hidden">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start space-x-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <CheckCircle size={24} className="text-green-700" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-green-900">{sectionTitles[data.s]} — Fully Completed</h2>
            <p className="text-sm text-green-700/80 mt-1">Both the dealer and customer have signed. Print or download for your records.</p>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <PaymentMethodSection />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 print:p-0 print:m-0 print:max-w-none">
        <div className="bg-white shadow-2xl shadow-[#1a1a1a]/5 border border-[#1a1a1a]/10 rounded-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
          {data.s === 'financing' && <ContractPreview data={mergedData as unknown as ContractData} signatures={signatures} />}
          {data.s === 'rental' && <RentalPreview data={mergedData as unknown as RentalData} signatures={signatures} />}
          {data.s === 'billOfSale' && <BillOfSalePreview data={mergedData as unknown as BillOfSaleData} signatures={signatures} acknowledgments={acknowledgments} />}
          {data.s === 'form130U' && <Form130UPreview data={mergedData as unknown as Form130UData} signatures={signatures} />}
        </div>
      </div>
    </div>
  );
}

export default function CustomerPortalClient() {
  const [mode, setMode] = useState<'loading' | 'customer' | 'completed' | 'error'>('loading');
  const [customerData, setCustomerData] = useState<ReturnType<typeof decodeCustomerLink>>(null);
  const [completedData, setCompletedData] = useState<CompletedLinkData | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#customer/')) {
      const data = decodeCustomerLink(hash);
      if (data) { setCustomerData(data); setMode('customer'); }
      else setMode('error');
    } else if (hash.startsWith('#completed/')) {
      const data = decodeCompletedLink(hash);
      if (data) { setCompletedData(data); setMode('completed'); }
      else setMode('error');
    } else {
      setMode('error');
    }
  }, []);

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#b89b5e]/30 border-t-[#b89b5e] rounded-full animate-spin" />
      </div>
    );
  }

  if (mode === 'customer' && customerData) {
    return (
      <WizardErrorBoundary>
        <CustomerWizard linkData={customerData} />
      </WizardErrorBoundary>
    );
  }

  if (mode === 'completed' && completedData) return <CompletedView data={completedData} />;

  return (
    <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-serif font-bold mb-2">Invalid Link</h1>
        <p className="text-sm text-[#1a1a1a]/60">This document link is invalid or has expired. Please contact Triple J Auto Investment for a new link.</p>
        <p className="text-xs text-[#1a1a1a]/40 mt-4">{DEALER_PHONE} | {DEALER_ADDRESS}</p>
      </div>
    </div>
  );
}
