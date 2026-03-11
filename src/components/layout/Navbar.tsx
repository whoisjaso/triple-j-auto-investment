"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import LanguageToggle from "./LanguageToggle";

const LEFT_LINKS = [
  { labelKey: "inventory" as const, href: "/inventory" as const },
  { labelKey: "financing" as const, href: "/financing" as const },
  { labelKey: "vinLookup" as const, href: "/vin-decoder" as const },
];

const RIGHT_LINKS = [
  { labelKey: "contact" as const, href: "/contact" as const },
];

function NavLink({
  href,
  children,
}: {
  href: "/inventory" | "/financing" | "/vin-decoder" | "/contact";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative font-accent text-[11px] uppercase tracking-[0.15em] lg:tracking-[0.25em] text-tj-cream/60 hover:text-tj-cream transition-colors duration-300 group py-2 whitespace-nowrap"
    >
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-tj-gold/50 transition-all duration-500 ease-out group-hover:w-full" />
    </Link>
  );
}

export default function Navbar() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Scroll detection — transparent at top, solid after 50px
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Body scroll lock when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Set inert attribute on menu when closed
  useEffect(() => {
    if (menuRef.current) {
      if (menuOpen) {
        menuRef.current.removeAttribute("inert");
      } else {
        menuRef.current.setAttribute("inert", "");
      }
    }
  }, [menuOpen]);

  // Focus trap + escape handler when menu is open
  useEffect(() => {
    if (!menuOpen) return;
    const menuEl = menuRef.current;
    if (!menuEl) return;

    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;

      const focusableEls = menuEl.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableEls.length === 0) return;

      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
    hamburgerRef.current?.focus();
  };

  const ALL_LINKS = [...LEFT_LINKS, ...RIGHT_LINKS];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/90 backdrop-blur-lg border-b border-white/[0.04]"
            : "bg-transparent"
        }`}
        aria-label={t("mainNav")}
      >
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 flex items-center h-16 md:h-[72px]">
          {/* LEFT: Desktop nav links */}
          <div className="hidden md:flex flex-1 items-center gap-5 lg:gap-8 xl:gap-10">
            {LEFT_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {t(link.labelKey)}
              </NavLink>
            ))}
          </div>

          {/* LEFT: Mobile hamburger */}
          <div className="flex md:hidden flex-1">
            <button
              ref={hamburgerRef}
              type="button"
              className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 text-tj-cream/60 hover:text-tj-cream transition-colors"
              onClick={() => setMenuOpen(true)}
              aria-label={t("openMenu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              >
                <line x1="3" y1="7" x2="21" y2="7" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="17" x2="21" y2="17" />
              </svg>
            </button>
          </div>

          {/* CENTER: Logo — absolutely centered */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex-shrink-0"
            aria-label={t("homeLink")}
          >
            <Image
              src="/GoldTripleJLogo.png"
              alt=""
              width={48}
              height={48}
              className="w-10 h-10 md:w-12 md:h-12 object-contain"
              priority
            />
          </Link>

          {/* RIGHT: Desktop nav links + language toggle + phone */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-5 lg:gap-8 xl:gap-10">
            {RIGHT_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {t(link.labelKey)}
              </NavLink>
            ))}
            <LanguageToggle />
            <span className="w-px h-3 bg-white/10" />
            <a
              href="tel:+18324009760"
              className="font-accent text-[11px] uppercase tracking-[0.15em] text-tj-gold/80 hover:text-tj-gold transition-colors duration-300"
            >
              (832) 400-9760
            </a>
            <span className="w-px h-3 bg-white/10" />
            <a
              href="/admin/login"
              className="flex items-center gap-1.5 font-accent text-[10px] uppercase tracking-[0.2em] text-white/25 hover:text-tj-gold/60 transition-colors duration-300"
              title={t("dealerPortal")}
            >
              <svg
                width="14"
                height="14"
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
              {t("dealerPortal")}
            </a>
          </div>

          {/* RIGHT: Mobile phone icon */}
          <div className="flex md:hidden flex-1 justify-end">
            <a
              href="tel:+18324009760"
              className="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 text-tj-gold/70 hover:text-tj-gold transition-colors"
              aria-label={t("callPhone")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay — always rendered, toggled via CSS + inert */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className={`fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center transition-all duration-500 ease-out ${
          menuOpen
            ? "opacity-100 scale-100"
            : "opacity-0 scale-[0.97] pointer-events-none"
        }`}
        role="dialog"
        aria-modal={menuOpen || undefined}
        aria-label={t("navMenu")}
        aria-hidden={!menuOpen}
      >
        {/* Close button */}
        <button
          ref={closeBtnRef}
          type="button"
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-tj-cream/50 hover:text-tj-cream transition-colors"
          onClick={closeMenu}
          aria-label={t("closeMenu")}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        {/* Logo in menu */}
        <div className="mb-12">
          <Image
            src="/GoldTripleJLogo.png"
            alt="Triple J Auto Investment"
            width={64}
            height={64}
            className="w-16 h-16 object-contain"
          />
        </div>

        {/* Menu nav links */}
        <nav
          className="flex flex-col items-center gap-7"
          aria-label={t("mobileNav")}
        >
          {ALL_LINKS.map((link, idx) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-accent text-sm uppercase tracking-[0.2em] text-tj-cream/60 hover:text-tj-cream transition-all duration-500 min-h-[44px] flex items-center"
              style={{
                transitionDelay: menuOpen ? `${100 + idx * 60}ms` : "0ms",
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(12px)",
              }}
              onClick={() => setMenuOpen(false)}
            >
              {t(link.labelKey)}
            </Link>
          ))}

          <span
            className="w-8 h-px bg-tj-gold/20 my-2 transition-all duration-500"
            style={{
              transitionDelay: menuOpen
                ? `${100 + ALL_LINKS.length * 60}ms`
                : "0ms",
              opacity: menuOpen ? 1 : 0,
            }}
          />

          {/* Language toggle in mobile menu */}
          <div
            className="transition-all duration-500"
            style={{
              transitionDelay: menuOpen
                ? `${130 + ALL_LINKS.length * 60}ms`
                : "0ms",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(12px)",
            }}
          >
            <LanguageToggle />
          </div>

          <a
            href="tel:+18324009760"
            className="font-serif text-lg text-tj-gold/80 hover:text-tj-gold transition-all duration-500 min-h-[44px] flex items-center tracking-wide"
            style={{
              transitionDelay: menuOpen
                ? `${190 + ALL_LINKS.length * 60}ms`
                : "0ms",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(12px)",
            }}
          >
            (832) 400-9760
          </a>

          {/* Dealer Portal divider + link */}
          <span
            className="w-6 h-px bg-white/10 my-1 transition-all duration-500"
            style={{
              transitionDelay: menuOpen
                ? `${250 + ALL_LINKS.length * 60}ms`
                : "0ms",
              opacity: menuOpen ? 1 : 0,
            }}
          />
          <a
            href="/admin/login"
            className="flex items-center gap-2.5 font-accent text-[11px] uppercase tracking-[0.3em] text-white/25 hover:text-tj-gold/50 transition-all duration-500 min-h-[44px]"
            style={{
              transitionDelay: menuOpen
                ? `${280 + ALL_LINKS.length * 60}ms`
                : "0ms",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(12px)",
            }}
            onClick={() => setMenuOpen(false)}
          >
            <svg
              width="15"
              height="15"
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
            {t("dealerPortal")}
          </a>
        </nav>
      </div>
    </>
  );
}
