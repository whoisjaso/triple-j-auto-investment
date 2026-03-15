"use client";

import { useState, useEffect } from 'react';
import { Download, Printer, CheckCircle, Send, Copy, Check, AlertCircle } from 'lucide-react';
import { decodeCustomerLink, decodeCompletedLink, customerFields, encodeCompletedLink, saveAgreement, type CustomerLinkData, type CompletedLinkData, type CustomerSection } from '@/lib/documents/customerPortal';
import { ContractData } from '@/lib/documents/finance';
import { RentalData } from '@/lib/documents/rental';
import { BillOfSaleData } from '@/lib/documents/billOfSale';
import { Form130UData } from '@/lib/documents/form130U';
import { SignatureData, emptySignatures, DEALER_NAME, DEALER_ADDRESS, DEALER_PHONE } from '@/lib/documents/shared';
import ContractPreview from '@/components/documents/ContractPreview';
import RentalPreview from '@/components/documents/RentalPreview';
import BillOfSalePreview, { type BuyerAcknowledgments, emptyAcknowledgments } from '@/components/documents/BillOfSalePreview';
import Form130UPreview from '@/components/documents/Form130UPreview';
import AddressAutocomplete, { ParsedAddress } from '@/components/documents/AddressAutocomplete';
import SignaturePad from '@/components/documents/SignaturePad';
import IdUpload from '@/components/documents/IdUpload';

const sectionTitles: Record<CustomerSection, string> = {
  financing: 'Financing Contract', rental: 'Rental Agreement', billOfSale: 'Bill of Sale', form130U: 'Form 130-U',
};

const InputField = ({ label, name, type = "text", uppercase = false, value, onChange, disabled, placeholder }: { label: string; name: string; type?: string; uppercase?: boolean; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; disabled?: boolean; placeholder?: string }) => (
  <div>
    <label className="block text-[10px] font-semibold tracking-widest uppercase text-[#1a1a1a]/70 mb-2">{label}</label>
    <input type={type} name={name} value={value ?? ''} onChange={onChange} disabled={disabled} placeholder={placeholder} className={`w-full px-4 py-3 bg-white border border-[#1a1a1a]/10 rounded-lg focus:outline-none focus:border-[#b89b5e] focus:ring-1 focus:ring-[#b89b5e] transition-all text-sm ${uppercase ? 'uppercase' : ''} ${disabled ? 'bg-[#f5f2ed]/50 text-[#1a1a1a]/50 cursor-not-allowed' : ''}`} />
  </div>
);

function CompletedView({ data }: { data: CompletedLinkData }) {
  const mergedData = { ...data.dd, ...data.cd };
  const signatures: SignatureData = {
    buyerIdPhoto: data.bi || '', buyerSignature: data.bs || '', buyerSignatureDate: data.bsd || '',
    coBuyerSignature: data.cs || '', coBuyerSignatureDate: data.csd || '',
    dealerSignature: data.ds || '', dealerSignatureDate: data.dsd || '',
  };
  const acknowledgments: BuyerAcknowledgments = data.ack ? {
    inspected: !!data.ack.inspected,
    asIs: !!data.ack.asIs,
    receivedCopy: !!data.ack.receivedCopy,
    allSalesFinal: !!data.ack.allSalesFinal,
    odometerInformed: !!data.ack.odometerInformed,
    responsibility: !!data.ack.responsibility,
    financingSeparate: !!data.ack.financingSeparate,
  } : emptyAcknowledgments;

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      <div className="bg-[#f5f2ed]/80 backdrop-blur-md border-b border-[#1a1a1a]/10 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle size={16} />
            <span className="text-[10px] font-bold tracking-widest uppercase">Completed Document</span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={handleDownloadPDF} className="px-4 py-2 bg-[#1a1a1a] text-[#b89b5e] rounded-full text-[10px] font-semibold tracking-wider uppercase hover:bg-[#1a1a1a]/90 flex items-center space-x-1 border border-[#b89b5e]/30">
              <Download size={12} /><span>PDF</span>
            </button>
            <button onClick={() => window.print()} className="px-4 py-2 bg-[#b89b5e] text-white rounded-full text-[10px] font-semibold tracking-wider uppercase hover:bg-[#b89b5e]/90 flex items-center space-x-1">
              <Printer size={12} /><span>Print</span>
            </button>
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

function CustomerView({ linkData }: { linkData: CustomerLinkData }) {
  const [customerData, setCustomerData] = useState<Record<string, string>>({});
  const [signatures, setSignatures] = useState<SignatureData>(emptySignatures);
  const [acknowledgments, setAcknowledgments] = useState<BuyerAcknowledgments>(emptyAcknowledgments);
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [showReturnLink, setShowReturnLink] = useState(false);
  const [returnLink, setReturnLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [ackError, setAckError] = useState(false);

  const fields = customerFields[linkData.s];
  const dealerSig = linkData.ds || '';
  const dealerSigDate = linkData.dd || '';
  const mergedData = { ...linkData.d, ...customerData };

  const fullSignatures: SignatureData = {
    ...signatures,
    dealerSignature: dealerSig,
    dealerSignatureDate: dealerSigDate,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setCustomerData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    // Validate all required acknowledgments are checked
    const requiredAcks: (keyof BuyerAcknowledgments)[] = ['inspected', 'asIs', 'receivedCopy', 'allSalesFinal', 'odometerInformed', 'responsibility'];
    const allChecked = requiredAcks.every(key => acknowledgments[key]);
    if (linkData.s === 'billOfSale' && !allChecked) {
      setAckError(true);
      return;
    }
    setAckError(false);

    const baseUrl = window.location.origin;
    const link = encodeCompletedLink(
      linkData.s, linkData.d, customerData, baseUrl,
      dealerSig, dealerSigDate,
      signatures.buyerSignature, signatures.buyerSignatureDate,
      signatures.coBuyerSignature, signatures.coBuyerSignatureDate,
      signatures.buyerIdPhoto,
      acknowledgments as unknown as Record<string, boolean>,
    );
    setReturnLink(link);
    setShowReturnLink(true);

    await saveAgreement({
      documentType: linkData.s,
      data: { ...linkData.d, ...customerData },
      status: 'completed',
      acknowledgments: acknowledgments as unknown as Record<string, boolean>,
      buyerSignature: !!signatures.buyerSignature,
      coBuyerSignature: !!signatures.coBuyerSignature,
      dealerSignature: !!dealerSig,
      buyerIdPhoto: !!signatures.buyerIdPhoto,
      completedLink: link,
    });
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(returnLink); } catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadPDF = () => {
    setViewMode('preview');
    setTimeout(() => window.print(), 400);
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header className="bg-[#f5f2ed]/80 backdrop-blur-md border-b border-[#1a1a1a]/10 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-serif font-semibold">{DEALER_NAME}</h1>
            <p className="text-[10px] text-[#1a1a1a]/50">{sectionTitles[linkData.s]}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setViewMode(viewMode === 'form' ? 'preview' : 'form')} className="px-3 py-1.5 bg-[#1a1a1a] text-[#b89b5e] rounded-full text-[10px] font-semibold tracking-wider uppercase">
              {viewMode === 'form' ? 'Preview' : 'Edit'}
            </button>
            <button onClick={handleDownloadPDF} className="px-3 py-1.5 bg-[#b89b5e] text-white rounded-full text-[10px] font-semibold tracking-wider uppercase">
              PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 print:p-0">
        {viewMode === 'form' ? (
          <div className="space-y-8 print:hidden">
            {/* Dealer Info Banner */}
            <div className="bg-[#b89b5e]/10 border border-[#b89b5e]/30 p-6 rounded-2xl">
              <p className="text-xs text-[#1a1a1a]/60">
                <strong>{DEALER_NAME}</strong> has prepared a {sectionTitles[linkData.s].toLowerCase()} for you. Please fill in your information below, upload your ID, and sign to complete the document.
              </p>
              <p className="text-xs text-[#1a1a1a]/40 mt-1">{DEALER_ADDRESS} | {DEALER_PHONE}</p>
            </div>

            {/* Customer Fields */}
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-[#1a1a1a]/5 border border-[#1a1a1a]/5 space-y-4">
              <h2 className="text-xl font-serif border-b border-[#1a1a1a]/10 pb-3 mb-4">Your Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map(field => {
                  const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).replace(/co /i, 'Co-');
                  if (field.includes('Address') && !field.includes('City') && !field.includes('State') && !field.includes('Zip') && !field.includes('County')) {
                    return (
                      <AddressAutocomplete key={field} label={label} name={field} value={customerData[field] || ''} onChange={handleChange} onAddressSelect={(addr: ParsedAddress) => {
                        setCustomerData(prev => ({ ...prev, [field]: addr.street, [field.replace('Address', 'City')]: addr.city, [field.replace('Address', 'State')]: addr.state, [field.replace('Address', 'Zip')]: addr.zip }));
                      }} dark={false} />
                    );
                  }
                  if (field.includes('SameAsMailing')) {
                    return (
                      <label key={field} className="flex items-center space-x-2 md:col-span-2">
                        <input type="checkbox" name={field} checked={customerData[field] === 'true'} onChange={(e) => setCustomerData(prev => ({ ...prev, [field]: String(e.target.checked) }))} className="w-4 h-4 accent-[#b89b5e]" />
                        <span className="text-sm">Same as mailing address</span>
                      </label>
                    );
                  }
                  if (field === 'applicantType') {
                    return (
                      <div key={field}>
                        <label className="block text-[10px] font-semibold tracking-widest uppercase text-[#1a1a1a]/70 mb-2">{label}</label>
                        <select name={field} value={customerData[field] || 'Individual'} onChange={handleChange} className="w-full px-4 py-3 bg-black text-tj-cream border border-white/[0.06] rounded-lg focus:outline-none focus:border-[#b89b5e] text-sm">
                          <option value="Individual">Individual</option>
                          <option value="Business">Business</option>
                          <option value="Government">Government</option>
                          <option value="Trust">Trust</option>
                          <option value="Non-Profit">Non-Profit</option>
                        </select>
                      </div>
                    );
                  }
                  return <InputField key={field} label={label} name={field} value={customerData[field] || ''} onChange={handleChange} type={field.includes('Email') || field.includes('email') ? 'email' : field.includes('Dob') ? 'date' : 'text'} uppercase={field.includes('License') || field.includes('State') || field.includes('Vin')} />;
                })}
              </div>
            </div>

            {/* Signature & ID */}
            <div className="bg-white p-8 rounded-2xl shadow-xl shadow-[#1a1a1a]/5 border border-[#1a1a1a]/5 space-y-6">
              <h2 className="text-xl font-serif border-b border-[#1a1a1a]/10 pb-3 mb-4">Signature & ID Verification</h2>
              <IdUpload label="Your Photo ID (Driver&apos;s License / State ID)" value={signatures.buyerIdPhoto} onChange={(v) => setSignatures(prev => ({ ...prev, buyerIdPhoto: v }))} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SignaturePad label="Your Signature" value={signatures.buyerSignature} dateValue={signatures.buyerSignatureDate} onChange={(v) => setSignatures(prev => ({ ...prev, buyerSignature: v }))} onDateChange={(v) => setSignatures(prev => ({ ...prev, buyerSignatureDate: v }))} />
                <SignaturePad label="Co-Buyer / Co-Signer" value={signatures.coBuyerSignature} dateValue={signatures.coBuyerSignatureDate} onChange={(v) => setSignatures(prev => ({ ...prev, coBuyerSignature: v }))} onDateChange={(v) => setSignatures(prev => ({ ...prev, coBuyerSignatureDate: v }))} />
              </div>
            </div>

            {/* Buyer Acknowledgment Checklist */}
            {linkData.s === 'billOfSale' && (
              <div className="bg-white p-8 rounded-2xl shadow-xl shadow-[#1a1a1a]/5 border border-[#1a1a1a]/5 space-y-4">
                <h2 className="text-xl font-serif border-b border-[#1a1a1a]/10 pb-3 mb-4">Buyer Acknowledgment</h2>
                <p className="text-sm text-[#1a1a1a]/70 font-semibold">I, the undersigned Buyer, acknowledge:</p>
                {ackError && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">You must check all acknowledgments before submitting.</span>
                  </div>
                )}
                <div className="space-y-3">
                  {[
                    { key: 'inspected' as const, label: 'I have inspected the vehicle and accept it in its present condition.' },
                    { key: 'asIs' as const, label: `I understand this vehicle is sold ${(linkData.d as Record<string, unknown>).conditionType === 'as_is' ? '"AS IS" with NO dealer warranty' : 'with a LIMITED WARRANTY as described'}.` },
                    { key: 'receivedCopy' as const, label: 'I have received a copy of this Bill of Sale for my records.' },
                    { key: 'allSalesFinal' as const, label: 'I understand ALL SALES ARE FINAL — no refunds, returns, or exchanges.' },
                    { key: 'odometerInformed' as const, label: 'I have been informed of the odometer reading and its accuracy status.' },
                    { key: 'responsibility' as const, label: 'I accept full responsibility for the vehicle upon delivery, including insurance and registration.' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-start space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={acknowledgments[key]}
                        onChange={() => {
                          setAcknowledgments(prev => ({ ...prev, [key]: !prev[key] }));
                          setAckError(false);
                        }}
                        className="w-5 h-5 mt-0.5 accent-[#b89b5e] shrink-0 rounded border-[#1a1a1a]/20"
                      />
                      <span className="text-sm text-[#1a1a1a]/80 group-hover:text-[#1a1a1a] transition-colors">{label}</span>
                    </label>
                  ))}
                  {(linkData.d as Record<string, unknown>).paymentMethod === 'Financing' && (
                    <label className="flex items-start space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={acknowledgments.financingSeparate}
                        onChange={() => setAcknowledgments(prev => ({ ...prev, financingSeparate: !prev.financingSeparate }))}
                        className="w-5 h-5 mt-0.5 accent-[#b89b5e] shrink-0 rounded border-[#1a1a1a]/20"
                      />
                      <span className="text-sm text-[#1a1a1a]/80 group-hover:text-[#1a1a1a] transition-colors">I understand this purchase is financed under a separate Retail Installment Contract.</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <button onClick={handleSubmit} className="w-full py-4 bg-green-700 text-white rounded-full text-sm font-bold tracking-widest uppercase hover:bg-green-800 transition-all flex items-center justify-center space-x-2">
              <Send size={16} /><span>Complete & Send Back to Dealer</span>
            </button>
          </div>
        ) : (
          <div className="bg-white shadow-2xl shadow-[#1a1a1a]/5 border border-[#1a1a1a]/10 rounded-2xl overflow-hidden print:shadow-none print:border-none print:rounded-none">
            {linkData.s === 'financing' && <ContractPreview data={mergedData as unknown as ContractData} signatures={fullSignatures} />}
            {linkData.s === 'rental' && <RentalPreview data={mergedData as unknown as RentalData} signatures={fullSignatures} />}
            {linkData.s === 'billOfSale' && <BillOfSalePreview data={mergedData as unknown as BillOfSaleData} signatures={fullSignatures} acknowledgments={acknowledgments} />}
            {linkData.s === 'form130U' && <Form130UPreview data={mergedData as unknown as Form130UData} signatures={fullSignatures} />}
          </div>
        )}
      </main>

      {/* Return Link Modal */}
      {showReturnLink && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-green-700" />
              </div>
              <h3 className="text-2xl font-serif font-bold">Document Completed!</h3>
              <p className="text-sm text-[#1a1a1a]/60 mt-2">Send this link back to {DEALER_NAME} so they can view the completed document with your information and signatures.</p>
            </div>
            <div className="bg-[#f5f2ed] rounded-xl p-4 space-y-3">
              <label className="text-[10px] font-semibold tracking-widest uppercase text-[#1a1a1a]/50">Return Link for Dealer</label>
              <div className="flex items-center space-x-2">
                <input type="text" readOnly value={returnLink} className="flex-1 px-3 py-2 bg-white border border-[#1a1a1a]/10 rounded-lg text-xs font-mono text-[#1a1a1a]/70 truncate" />
                <button onClick={handleCopy} className={`px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase flex items-center space-x-1 transition-all ${copied ? 'bg-green-600 text-white' : 'bg-[#1a1a1a] text-[#b89b5e] border border-[#b89b5e]/30'}`}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDownloadPDF} className="flex-1 py-3 bg-[#1a1a1a] text-[#b89b5e] rounded-full text-sm font-bold tracking-widest uppercase border border-[#b89b5e]/30">
                Download Your Copy
              </button>
              <button onClick={() => window.print()} className="flex-1 py-3 bg-[#b89b5e] text-white rounded-full text-sm font-bold tracking-widest uppercase">
                Print Your Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerPortalClient() {
  const [mode, setMode] = useState<'loading' | 'customer' | 'completed' | 'error'>('loading');
  const [customerData, setCustomerData] = useState<CustomerLinkData | null>(null);
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

  if (mode === 'customer' && customerData) return <CustomerView linkData={customerData} />;
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
