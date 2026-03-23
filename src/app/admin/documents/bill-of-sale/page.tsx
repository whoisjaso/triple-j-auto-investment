import type { Metadata } from "next";
import DocumentEditor from "@/components/documents/DocumentEditor";

export const metadata: Metadata = {
  title: "Bill of Sale | Triple J Admin",
  robots: "noindex, nofollow",
};

export default function BillOfSalePage() {
  return (
    <div className="px-3 md:px-8 py-3 md:py-10 max-w-7xl mx-auto">
      <div className="mb-4 md:mb-6" data-print-hide>
        <h1 className="font-serif text-xl md:text-3xl text-tj-cream tracking-wide">
          Bill of Sale
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Vehicle purchase agreement with odometer disclosure and buyer acknowledgment.
        </p>
      </div>
      <DocumentEditor initialSection="billOfSale" />
    </div>
  );
}
