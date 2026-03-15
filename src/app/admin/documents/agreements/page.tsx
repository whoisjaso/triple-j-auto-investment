import type { Metadata } from "next";
import AgreementTracker from "./AgreementTracker";

export const metadata: Metadata = {
  title: "Document Agreements | Triple J Admin",
  robots: "noindex, nofollow",
};

export default function AgreementsPage() {
  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl text-tj-cream tracking-wide">
          Document Agreements
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Track customer signatures, acknowledgments, and document completion status.
        </p>
      </div>
      <AgreementTracker />
    </div>
  );
}
