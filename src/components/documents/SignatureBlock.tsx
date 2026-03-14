"use client";

import { SignatureData } from '@/lib/documents/shared';
import SignaturePad from './SignaturePad';
import IdUpload from './IdUpload';

interface Props {
  signatures: SignatureData;
  onChange: (signatures: SignatureData) => void;
  showCoBuyer?: boolean;
  mode?: 'dealer' | 'customer' | 'all';
}

export default function SignatureBlock({ signatures, onChange, showCoBuyer = true, mode = 'all' }: Props) {
  const update = (field: keyof SignatureData, value: string) => {
    onChange({ ...signatures, [field]: value });
  };

  const showCustomerSigs = mode === 'all' || mode === 'customer';
  const showDealerSig = mode === 'all' || mode === 'dealer';

  const title = mode === 'dealer' ? 'Dealer Signature'
    : mode === 'customer' ? 'Customer Signature & ID Verification'
    : 'Digital Signatures & ID Verification';

  const subtitle = mode === 'dealer'
    ? 'Sign your section below. Customer signatures will be collected separately via the shared link.'
    : mode === 'customer'
    ? 'Upload your ID and sign below to complete the document.'
    : 'Signatures and ID photos are applied across all documents for this transaction.';

  return (
    <div className="mt-8">
      <div className="bg-white/[0.02] border border-white/[0.06] p-6 md:p-8 rounded-2xl space-y-8">
        <div className="border-b border-white/[0.06] pb-4">
          <h2 className="text-xl font-serif text-tj-cream">{title}</h2>
          <p className="text-xs text-white/40 mt-1">{subtitle}</p>
        </div>
        {showCustomerSigs && (
          <IdUpload label="Customer ID Photo (Driver's License / State ID)" value={signatures.buyerIdPhoto} onChange={(v) => update('buyerIdPhoto', v)} />
        )}
        <div className={`grid grid-cols-1 ${
          mode === 'dealer' ? 'md:grid-cols-1 max-w-sm' :
          mode === 'customer' ? (showCoBuyer ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-sm') :
          (showCoBuyer ? 'md:grid-cols-3' : 'md:grid-cols-2')
        } gap-6`}>
          {showCustomerSigs && (
            <SignaturePad label="Buyer / Renter Signature" value={signatures.buyerSignature} dateValue={signatures.buyerSignatureDate} onChange={(v) => update('buyerSignature', v)} onDateChange={(v) => update('buyerSignatureDate', v)} />
          )}
          {showCustomerSigs && showCoBuyer && (
            <SignaturePad label="Co-Buyer / Additional Driver" value={signatures.coBuyerSignature} dateValue={signatures.coBuyerSignatureDate} onChange={(v) => update('coBuyerSignature', v)} onDateChange={(v) => update('coBuyerSignatureDate', v)} />
          )}
          {showDealerSig && (
            <SignaturePad label="Dealer Representative" value={signatures.dealerSignature} dateValue={signatures.dealerSignatureDate} onChange={(v) => update('dealerSignature', v)} onDateChange={(v) => update('dealerSignatureDate', v)} />
          )}
        </div>
      </div>
    </div>
  );
}
