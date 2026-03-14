import type { Metadata } from "next";
import DocumentEditor from "@/components/documents/DocumentEditor";

export const metadata: Metadata = {
  title: "Financing Contract | Triple J Admin",
  robots: "noindex, nofollow",
};

export default function FinancingPage() {
  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto print:!p-0 print:!max-w-none">
      <div className="mb-6 print:hidden">
        <h1 className="font-serif text-2xl md:text-3xl text-tj-cream tracking-wide">
          Financing Contract
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Retail installment contract with Truth in Lending disclosure and amortization schedule.
        </p>
      </div>
      <DocumentEditor initialSection="financing" />
    </div>
  );
}
