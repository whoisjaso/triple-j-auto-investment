import type { Metadata } from "next";
import DocumentEditor from "@/components/documents/DocumentEditor";

export const metadata: Metadata = {
  title: "Financing Contract | Triple J Admin",
  robots: "noindex, nofollow",
};

export default function FinancingPage() {
  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      <div className="mb-6">
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
