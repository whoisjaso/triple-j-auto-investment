import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import PublicShell from "@/components/layout/PublicShell";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: {
      default: t("siteTitle"),
      template: "%s | Triple J Auto Investment",
    },
    description: t("siteDescription"),
    openGraph: {
      type: "website",
      locale: locale === "es" ? "es_US" : "en_US",
      siteName: "Triple J Auto Investment",
    },
    twitter: {
      card: "summary_large_image",
    },
    alternates: {
      languages: {
        en: "/en",
        es: "/es",
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  const autoDealer = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: "Triple J Auto Investment",
    url: "https://triplejautoinvestment.com",
    telephone: "+1-832-400-9760",
    address: {
      "@type": "PostalAddress",
      streetAddress: "8774 Almeda Genoa Rd",
      addressLocality: "Houston",
      addressRegion: "TX",
      postalCode: "77075",
      addressCountry: "US",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    priceRange: "$3,000 - $8,000",
  };

  return (
    <NextIntlClientProvider messages={messages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(autoDealer) }}
      />
      <PublicShell>{children}</PublicShell>
    </NextIntlClientProvider>
  );
}
