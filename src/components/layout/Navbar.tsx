"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const LEFT_LINKS = [
  { label: "Inventory", href: "/inventory" },
  { label: "Financing", href: "/financing" },
  { label: "VIN Lookup", href: "/vin-decoder" },
];

const RIGHT_LINKS = [
  { label: "Contact", href: "/contact" },
];

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="relative font-accent text-[11px] uppercase tracking-[0.25em] text-tj-cream/60 hover:text-tj-cream transition-colors duration-300 group py-2"
    >
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-tj-gold/50 transition-all duration-500 ease-out group-hover:w-full" />
    </Link>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

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
      const closeBtn = menuEl.querySelector<HTMLElement>(
        '[aria-label="Close menu"]'
      );
      closeBtn?.focus();
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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-black/90 backdrop-blur-lg border-b border-white/[0.04]"
            : "bg-transparent"
        }`}
        aria-label="Main navigation"
      >
        <div className="relative mx-auto max-w-7xl px-4 md:px-8 flex items-center h-16 md:h-[72px]">
          {/* LEFT: Desktop nav links */}
          <div className="hidden md:flex flex-1 items-center gap-10">
            {LEFT_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
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
              aria-label="Open menu"
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
            aria-label="Triple J Auto Investment — Home"
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

          {/* RIGHT: Desktop nav links + phone */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-10">
            {RIGHT_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
            <span className="w-px h-3 bg-white/10" />
            <a
              href="tel:+18324009760"
              className="font-accent text-[11px] uppercase tracking-[0.15em] text-tj-gold/80 hover:text-tj-gold transition-colors duration-300"
            >
              (832) 400-9760
            </a>
          </div>

          {/* RIGHT: Mobile phone icon */}
          <div className="flex md:hidden flex-1 justify-end">
            <a
              href="tel:+18324009760"
              className="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 text-tj-gold/70 hover:text-tj-gold transition-colors"
              aria-label="Call (832) 400-9760"
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
        aria-label="Navigation menu"
        aria-hidden={!menuOpen}
      >
        {/* Close button */}
        <button
          type="button"
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-tj-cream/50 hover:text-tj-cream transition-colors"
          onClick={closeMenu}
          aria-label="Close menu"
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
          aria-label="Mobile navigation"
        >
          {[...LEFT_LINKS, ...RIGHT_LINKS].map((link, idx) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-accent text-sm uppercase tracking-[0.35em] text-tj-cream/60 hover:text-tj-cream transition-all duration-500 min-h-[44px] flex items-center"
              style={{
                transitionDelay: menuOpen ? `${100 + idx * 60}ms` : "0ms",
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? "translateY(0)" : "translateY(12px)",
              }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <span
            className="w-8 h-px bg-tj-gold/20 my-2 transition-all duration-500"
            style={{
              transitionDelay: menuOpen ? `${100 + ([...LEFT_LINKS, ...RIGHT_LINKS].length) * 60}ms` : "0ms",
              opacity: menuOpen ? 1 : 0,
            }}
          />

          <a
            href="tel:+18324009760"
            className="font-serif text-lg text-tj-gold/80 hover:text-tj-gold transition-all duration-500 min-h-[44px] flex items-center tracking-wide"
            style={{
              transitionDelay: menuOpen ? `${160 + ([...LEFT_LINKS, ...RIGHT_LINKS].length) * 60}ms` : "0ms",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(12px)",
            }}
          >
            (832) 400-9760
          </a>
        </nav>
      </div>
    </>
  );
}
