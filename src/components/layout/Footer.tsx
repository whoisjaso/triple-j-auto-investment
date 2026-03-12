"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const NAV_LINKS = [
  { labelKey: "inventory" as const, href: "/inventory" as const },
  { labelKey: "financing" as const, href: "/financing" as const },
  { labelKey: "contact" as const, href: "/contact" as const },
];

export default function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="bg-black border-t border-tj-gold/10">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center md:text-left">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <Image
              src="/GoldTripleJLogo.webp"
              alt="Triple J Auto Investment"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <p className="mt-3 font-serif text-sm text-tj-cream/80">
              {t("brand")}
            </p>
            <p className="mt-1 text-[11px] text-white/30 tracking-wide">
              {t("tagline")}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h4 className="font-accent text-[10px] uppercase tracking-[0.3em] text-tj-gold/60 mb-1">
              {t("navigate")}
            </h4>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-accent text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-tj-gold transition-colors"
              >
                {tNav(link.labelKey)}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <h4 className="font-accent text-[10px] uppercase tracking-[0.3em] text-tj-gold/60 mb-1">
              {t("contactHeading")}
            </h4>
            <a
              href="tel:+18324009760"
              className="font-serif text-sm text-tj-gold hover:text-tj-gold-light transition-colors"
            >
              (832) 400-9760
            </a>
            <address className="not-italic text-[11px] text-white/30 leading-relaxed">
              {t("address")}
              <br />
              {t("addressCity")}
            </address>
            <p className="text-[11px] text-white/20">{t("hours")}</p>
          </div>
        </div>
      </div>

      {/* Bottom compliance bar */}
      <div className="border-t border-white/5 py-6">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-white/20 text-[10px] tracking-wide">
            {t("allRights")}
          </p>
          <a
            href="/admin/login"
            className="flex items-center gap-1.5 text-white/25 text-[10px] tracking-wide hover:text-tj-gold/50 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {t("dealerLogin")}
          </a>
          <p className="text-white/20 text-[10px] tracking-wide">
            {t("dealerLicense")}
          </p>
        </div>
      </div>
    </footer>
  );
}
