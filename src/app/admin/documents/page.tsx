import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documents | Triple J Admin",
  robots: "noindex, nofollow",
};

const documentTypes = [
  {
    title: "Bill of Sale",
    description: "Vehicle purchase agreement with federal odometer disclosure, as-is/warranty terms, and buyer acknowledgment.",
    href: "/admin/documents/bill-of-sale",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: "Financing Contract",
    description: "Retail installment contract with Truth in Lending disclosure, amortization schedule, and payment terms.",
    href: "/admin/documents/financing",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: "Rental Agreement",
    description: "Vehicle rental contract with insurance, mileage, payment schedule, and 24 legal clauses.",
    href: "/admin/documents/rental",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    title: "Form 130-U",
    description: "Texas DMV application for title and/or registration with motor vehicle tax statement.",
    href: "/admin/documents/form-130u",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      </svg>
    ),
  },
];

export default function DocumentsPage() {
  return (
    <div className="px-3 md:px-8 py-3 md:py-10 max-w-6xl mx-auto">
      <div className="mb-5 md:mb-8">
        <h1 className="font-serif text-xl md:text-3xl text-tj-cream tracking-wide">
          Documents
        </h1>
        <p className="text-white/40 text-sm mt-2">
          Generate legal documents, send to customers for digital signing, and download PDFs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentTypes.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 md:p-6 hover:bg-white/[0.04] hover:border-tj-gold/20 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-tj-gold/10 flex items-center justify-center text-tj-gold shrink-0 group-hover:bg-tj-gold/20 transition-colors [&>svg]:w-6 [&>svg]:h-6 md:[&>svg]:w-8 md:[&>svg]:h-8">
                {doc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-lg text-tj-cream group-hover:text-tj-gold transition-colors">
                  {doc.title}
                </h2>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">
                  {doc.description}
                </p>
              </div>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-white/20 group-hover:text-tj-gold/60 transition-colors shrink-0 mt-1"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Agreement Tracker Link */}
      <div className="mt-6">
        <Link
          href="/admin/documents/agreements"
          className="group bg-emerald-500/[0.05] border border-emerald-500/10 rounded-2xl p-4 md:p-6 flex items-center justify-between hover:bg-emerald-500/[0.08] hover:border-emerald-500/20 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors [&>svg]:w-6 [&>svg]:h-6 md:[&>svg]:w-8 md:[&>svg]:h-8">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h2 className="font-serif text-lg text-emerald-400 group-hover:text-emerald-300 transition-colors">
                Agreement Tracker
              </h2>
              <p className="text-xs text-white/40 mt-1">
                View customer signatures, acknowledgments, and document completion status.
              </p>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20 group-hover:text-emerald-400/60 transition-colors shrink-0">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 md:mt-10 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 md:p-6">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-white/40">
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-tj-gold/20 text-tj-gold flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
            <div>
              <p className="text-white/60 font-medium">Fill in vehicle & deal details</p>
              <p className="mt-0.5">Vehicle info auto-populates from VIN decode. Sale terms, fees, and conditions.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-tj-gold/20 text-tj-gold flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
            <div>
              <p className="text-white/60 font-medium">Send link to customer</p>
              <p className="mt-0.5">Customer fills in their info, uploads ID, signs digitally, and gets their copy.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-tj-gold/20 text-tj-gold flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
            <div>
              <p className="text-white/60 font-medium">Download or print PDF</p>
              <p className="mt-0.5">Preview the completed document, download as PDF, or print directly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
