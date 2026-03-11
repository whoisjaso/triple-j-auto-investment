"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

export default function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const nextLocale = locale === "en" ? "es" : "en";

  const handleSwitch = () => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      type="button"
      onClick={handleSwitch}
      className="font-accent text-[10px] uppercase tracking-[0.2em] text-tj-cream/40 hover:text-tj-cream transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center gap-1"
      aria-label={locale === "en" ? "Cambiar a español" : "Switch to English"}
    >
      <span className={locale === "en" ? "text-tj-gold" : ""}>EN</span>
      <span className="text-white/15">/</span>
      <span className={locale === "es" ? "text-tj-gold" : ""}>ES</span>
    </button>
  );
}
