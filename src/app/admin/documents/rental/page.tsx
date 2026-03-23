import type { Metadata } from "next";
import DocumentEditor from "@/components/documents/DocumentEditor";

export const metadata: Metadata = {
  title: "Rental Agreement | Triple J Admin",
  robots: "noindex, nofollow",
};

export default async function RentalPage({ searchParams }: { searchParams: Promise<{ renew?: string }> }) {
  const params = await searchParams;
  return (
    <div className="px-3 md:px-8 py-3 md:py-10 max-w-7xl mx-auto">
      <div className="mb-4 md:mb-6" data-print-hide>
        <h1 className="font-serif text-xl md:text-3xl text-tj-cream tracking-wide">
          Rental Agreement
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {params.renew
            ? "Renewing from a previous rental agreement. Dates have been reset."
            : "Vehicle rental contract with insurance, mileage allowance, and payment schedule."}
        </p>
      </div>
      <DocumentEditor initialSection="rental" renewAgreementId={params.renew} />
    </div>
  );
}
