import type { Metadata } from "next";
import DocumentEditor from "@/components/documents/DocumentEditor";

export const metadata: Metadata = {
  title: "Form 130-U | Triple J Admin",
  robots: "noindex, nofollow",
};

export default function Form130UPage() {
  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-7xl mx-auto">
      <div className="mb-6" data-print-hide>
        <h1 className="font-serif text-2xl md:text-3xl text-tj-cream tracking-wide">
          Form 130-U
        </h1>
        <p className="text-white/40 text-sm mt-1">
          Texas DMV application for title and/or registration with motor vehicle tax statement.
        </p>
      </div>
      <DocumentEditor initialSection="form130U" />
    </div>
  );
}
