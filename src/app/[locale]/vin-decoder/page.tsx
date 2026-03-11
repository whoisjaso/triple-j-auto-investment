import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import VinDecoder from "@/components/inventory/VinDecoder";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("vinDecoderTitle"),
    description: t("vinDecoderDescription"),
    openGraph: {
      locale: locale === "es" ? "es_US" : "en_US",
    },
  };
}

export default async function VinDecoderPage() {
  const t = await getTranslations("vinDecoder");

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        {/* Page header */}
        <div className="mb-10 md:mb-14 text-center">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-tj-cream font-light">
            {t("title")}
          </h1>
          <p className="mt-4 text-sm md:text-base text-white/35 max-w-lg mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Decoder card */}
        <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-6 md:p-8">
          <VinDecoder alwaysOpen />
        </div>

        {/* Info cards */}
        <div className="mt-10 md:mt-14 grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="border border-white/[0.04] rounded-sm bg-white/[0.01] p-5 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-tj-gold/15 mb-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                className="text-tj-gold/50"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-tj-gold/40 mb-1.5">
              {t("freeInstant")}
            </p>
            <p className="text-xs text-white/25 leading-relaxed">
              {t("freeInstantDesc")}
            </p>
          </div>

          <div className="border border-white/[0.04] rounded-sm bg-white/[0.01] p-5 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-tj-gold/15 mb-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                className="text-tj-gold/50"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-tj-gold/40 mb-1.5">
              {t("factorySpecs")}
            </p>
            <p className="text-xs text-white/25 leading-relaxed">
              {t("factorySpecsDesc")}
            </p>
          </div>

          <div className="border border-white/[0.04] rounded-sm bg-white/[0.01] p-5 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-tj-gold/15 mb-3">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                className="text-tj-gold/50"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-tj-gold/40 mb-1.5">
              {t("whereToFind")}
            </p>
            <p className="text-xs text-white/25 leading-relaxed">
              {t("whereToFindDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
