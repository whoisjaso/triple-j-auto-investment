"use client";

import { MapPin } from 'lucide-react';
import { DEALER_ADDRESS } from '@/lib/documents/shared';

const ZELLE_PHONE = '+1 (281) 253-3602';
const CASHAPP_TAG = '$JasonObawemimo';
const CASHAPP_URL = 'https://cash.app/$JasonObawemimo';

function ZelleLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-label="Zelle">
      <path d="M4 7h12l-8 10h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CashAppLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-label="Cash App">
      <path d="M12 3v2m0 14v2M9.5 7.5C9.5 6.12 10.62 5 12 5s2.5 1.12 2.5 2.5c0 2.5-5 2.5-5 5C9.5 13.88 10.62 15 12 15s2.5-1.12 2.5-2.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function PaymentMethodSection() {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl shadow-[#1a1a1a]/5 border border-[#1a1a1a]/5 space-y-4 print:hidden">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-[#b89b5e] text-xl font-bold">$</span>
        <h2 className="text-xl font-serif">Payment Methods</h2>
      </div>
      <p className="text-sm text-[#1a1a1a]/60">Choose your preferred payment method below.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Zelle */}
        <a
          href="https://enroll.zellepay.com/qr-codes?data=eyJuYW1lIjoiVFJJUExFIEogQVVUTyIsInRva2VuIjoiMjgxMjUzMzYwMiIsImFjdGlvbiI6InBheW1lbnQifQ=="
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center p-6 bg-[#6d1ed4]/5 border-2 border-[#6d1ed4]/20 rounded-2xl hover:bg-[#6d1ed4]/10 hover:border-[#6d1ed4]/40 transition-all group"
        >
          <div className="w-14 h-14 bg-[#6d1ed4] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ZelleLogo />
          </div>
          <span className="text-sm font-bold text-[#6d1ed4]">Zelle</span>
          <span className="text-[10px] text-[#1a1a1a]/50 mt-1">{ZELLE_PHONE}</span>
        </a>

        {/* CashApp */}
        <a
          href={CASHAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center p-6 bg-[#00d632]/5 border-2 border-[#00d632]/20 rounded-2xl hover:bg-[#00d632]/10 hover:border-[#00d632]/40 transition-all group"
        >
          <div className="w-14 h-14 bg-[#00d632] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <CashAppLogo />
          </div>
          <span className="text-sm font-bold text-[#00d632]">Cash App</span>
          <span className="text-[10px] text-[#1a1a1a]/50 mt-1">{CASHAPP_TAG}</span>
        </a>

        {/* Cash */}
        <div className="flex flex-col items-center p-6 bg-[#b89b5e]/5 border-2 border-[#b89b5e]/20 rounded-2xl">
          <div className="w-14 h-14 bg-[#b89b5e] rounded-full flex items-center justify-center mb-3">
            <MapPin size={24} className="text-white" />
          </div>
          <span className="text-sm font-bold text-[#b89b5e]">Pay in Cash</span>
          <span className="text-[10px] text-[#1a1a1a]/50 mt-1 text-center leading-relaxed">{DEALER_ADDRESS}</span>
        </div>
      </div>
    </div>
  );
}
