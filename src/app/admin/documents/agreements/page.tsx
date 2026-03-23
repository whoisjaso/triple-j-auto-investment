import type { Metadata } from "next";
import AgreementTracker from "./AgreementTracker";

export const metadata: Metadata = {
  title: "Agreement Tracker | Triple J Admin",
  robots: "noindex, nofollow",
};

export default function AgreementsPage() {
  return (
    <div className="px-3 md:px-8 py-3 md:py-10 max-w-7xl mx-auto">
      <div className="mb-4 md:mb-6" data-print-hide>
        <h1 className="font-serif text-xl md:text-3xl text-tj-cream tracking-wide">
          Agreement Tracker
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Track customer signatures, acknowledgments, and document completion status.
        </p>
      </div>
      <AgreementTracker />
    </div>
  );
}
