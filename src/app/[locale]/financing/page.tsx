import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ContactForm from "@/components/leads/ContactForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("financingTitle"),
    description: t("financingDescription"),
    openGraph: {
      locale: locale === "es" ? "es_US" : "en_US",
    },
  };
}

const STEP_KEYS = [
  { number: "01", titleKey: "step1Title", descKey: "step1Desc" },
  { number: "02", titleKey: "step2Title", descKey: "step2Desc" },
  { number: "03", titleKey: "step3Title", descKey: "step3Desc" },
  { number: "04", titleKey: "step4Title", descKey: "step4Desc" },
] as const;

const BENEFIT_KEYS = [
  "benefit1",
  "benefit2",
  "benefit3",
  "benefit4",
  "benefit5",
  "benefit6",
] as const;

export default async function FinancingPage() {
  const t = await getTranslations("financing");

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 md:pb-24">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* LEFT: Form */}
          <div className="lg:col-span-7">
            <h1 className="font-serif text-2xl md:text-3xl text-tj-cream font-light mb-2">
              {t("title")}
            </h1>
            <p className="text-sm text-white/40 leading-relaxed mb-8">
              {t("subtitle")}
            </p>

            <ContactForm
              source="financing_inquiry"
              showVehicleField
              showDownPayment
            />
          </div>

          {/* RIGHT: Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* How It Works */}
            <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-6">
              <h2 className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-5">
                {t("howItWorks")}
              </h2>
              <div className="space-y-5">
                {STEP_KEYS.map((step) => (
                  <div key={step.number} className="flex gap-4">
                    <span className="font-serif text-lg text-tj-gold/40 flex-none w-6">
                      {step.number}
                    </span>
                    <div>
                      <p className="text-sm text-tj-cream/80 font-medium">
                        {t(step.titleKey)}
                      </p>
                      <p className="text-[12px] text-white/30 mt-0.5">
                        {t(step.descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BHPH Benefits */}
            <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-6">
              <h2 className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-4">
                {t("whyBhph")}
              </h2>
              <ul className="space-y-3">
                {BENEFIT_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-tj-gold/50 mt-0.5 flex-none"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm text-tj-cream/70">
                      {t(key)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Direct call CTA */}
            <div className="border border-white/[0.06] rounded-sm bg-white/[0.02] p-6 text-center">
              <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-white/30 mb-3">
                {t("readyToStart")}
              </p>
              <a
                href="tel:+18324009760"
                className="flex items-center justify-center gap-2.5 w-full min-h-[52px] bg-tj-gold/90 hover:bg-tj-gold text-black font-accent text-[11px] uppercase tracking-[0.2em] rounded-sm transition-colors duration-300"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {t("callNowCta")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
