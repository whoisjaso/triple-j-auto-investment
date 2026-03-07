# Rolls-Royce Architecture Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild Triple J's visual layer with Rolls-Royce Motor Cars' navigation, animation system, typography, and cinematic pacing — while keeping React+Vite, all services, and the light #F7F7F7 theme.

**Architecture:** Extract Navbar and Footer from App.tsx into standalone components. Replace the current Navbar with a Rolls-Royce full-screen overlay menu system using GSAP timelines. Add global design tokens, new fonts, and a `data-animate` GSAP ScrollTrigger system. Rebuild Home page sections with Rolls-Royce spacing. Keep all frame animations.

**Tech Stack:** React 19, Vite, GSAP 3.14 + ScrollTrigger (already installed), Tailwind CSS 3, Playfair Display + Plus Jakarta Sans + Cormorant Garamond (Google Fonts)

---

## Batch 1: Foundation (Design Tokens + Fonts)

### Task 1: Update Google Fonts in index.html

**Files:**
- Modify: `index.html` (font import lines ~569-571)

**Step 1: Replace font imports**

Find the existing font link tags (Cormorant Garamond, DM Sans, JetBrains Mono) and replace with:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400&family=Plus+Jakarta+Sans:wght@200;300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

Keep JetBrains Mono (used in admin). Add Playfair Display. Replace DM Sans with Plus Jakarta Sans.

**Step 2: Verify fonts load**

Run: `npx vite dev` and check Network tab for fonts loading.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat(fonts): add Playfair Display and Plus Jakarta Sans"
```

---

### Task 2: Add CSS custom properties + update Tailwind config

**Files:**
- Modify: `src/index.css` (add CSS vars at top)
- Modify: `tailwind.config.js` (update fonts, add colors, add spacing)

**Step 1: Add CSS custom properties to index.css**

Add this block at the very top of `src/index.css`, before the `@tailwind` directives:

```css
:root {
  /* Rolls-Royce Architecture Tokens */
  --tj-black: #0A0A0A;
  --tj-forest: #1B3A2D;
  --tj-forest-deep: #0F2A1E;
  --tj-gold: #C9A84C;
  --tj-gold-light: #D4BA6A;
  --tj-cream: #F5F0E8;
  --tj-white: #FAFAF8;
  --tj-charcoal: #2A2A2A;
  --tj-bg: #F7F7F7;

  --text-primary: #0e1b16;
  --text-muted: rgba(14, 27, 22, 0.5);
  --text-ghost: rgba(14, 27, 22, 0.3);
  --gold-muted: rgba(201, 168, 76, 0.5);
  --border-rr: rgba(201, 168, 76, 0.08);
  --border-rr-hover: rgba(201, 168, 76, 0.2);
  --overlay-bg: rgba(15, 42, 30, 0.96);
  --sub-panel-bg: rgba(10, 10, 10, 0.4);

  --ease-rr: cubic-bezier(0.76, 0, 0.24, 1);

  --space-section: clamp(120px, 18vh, 240px);
  --space-inner: clamp(60px, 8vh, 120px);
  --space-element: clamp(24px, 3vh, 48px);
}
```

**Step 2: Update tailwind.config.js fonts**

Replace the `fontFamily` section:

```js
fontFamily: {
  sans: ['"Plus Jakarta Sans"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
  serif: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'],
  accent: ['"Cormorant Garamond"', 'Georgia', 'serif'],
  mono: ['"JetBrains Mono"', 'monospace'],
},
```

Add to `extend.colors.tj`:
```js
tj: {
  green: '#0e1b16',
  greenElevated: '#132a21',
  greenAccent: '#1a3d2e',
  greenAtmo: '#224137',
  gold: '#d4af37',
  goldMuted: '#b8962f',
  zinc100: '#f4f4f5',
  zinc400: '#a1a1aa',
  zinc500: '#71717a',
  // NEW Rolls-Royce tokens
  black: '#0A0A0A',
  forest: '#1B3A2D',
  forestDeep: '#0F2A1E',
  goldRR: '#C9A84C',
  goldLight: '#D4BA6A',
  cream: '#F5F0E8',
  charcoal: '#2A2A2A',
},
```

**Step 3: Add the global .btn-rr style to index.css**

Add at the end of `src/index.css`:

```css
/* Rolls-Royce Button */
.btn-rr {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 36px;
  border: 1px solid rgba(201, 168, 76, 0.45);
  background: transparent;
  color: #C9A84C;
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.45s cubic-bezier(0.76, 0, 0.24, 1);
}

.btn-rr:hover {
  background: #C9A84C;
  color: #0A0A0A;
  border-color: #C9A84C;
}

.btn-rr::after {
  content: "\2192";
  font-size: 13px;
  transition: transform 0.35s cubic-bezier(0.76, 0, 0.24, 1);
}

.btn-rr:hover::after {
  transform: translateX(5px);
}

@media (max-width: 1023px) {
  .btn-rr {
    width: 100%;
    justify-content: center;
    padding: 18px 36px;
  }
}
```

**Step 4: Build to verify**

Run: `npx vite build`
Expected: Build succeeds with no errors.

**Step 5: Commit**

```bash
git add src/index.css tailwind.config.js
git commit -m "feat(tokens): add Rolls-Royce design tokens, fonts, and button style"
```

---

## Batch 2: Navigation System (The Core of the Redesign)

### Task 3: Extract Navbar into standalone component

**Files:**
- Create: `components/RRNavbar.tsx`
- Modify: `App.tsx` (replace inline Navbar with import)

**Step 1: Create components/RRNavbar.tsx**

This is the new Rolls-Royce navigation with:
- 70px fixed bar: logo text left, "MENU" text right
- Transparent → solid on scroll with backdrop blur
- "MENU" / "CLOSE" crossfade
- Full-screen overlay with GSAP-animated stagger
- Desktop: left panel (5 links) + right sub-panel slide
- Mobile: horizontal screen slide with back button

The complete component is large (~600 lines). Here is the exact implementation:

```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/Store';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';

const RR_EASE = 'power2.inOut';

interface SubPanelItem {
  label: string;
  to: string;
  image?: string;
  description?: string;
}

interface NavItem {
  label: string;
  to: string;
  subItems?: SubPanelItem[];
}

export const RRNavbar = () => {
  const { user, logout, vehicles } = useStore();
  const { lang, toggleLang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSubPanel, setActiveSubPanel] = useState<number | null>(null);
  const [mobileScreen, setMobileScreen] = useState<'main' | 'sub'>('main');
  const [mobileSubIndex, setMobileSubIndex] = useState<number>(0);

  const overlayRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const subPanelRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);

  // Build nav items from translations
  const navItems: NavItem[] = [
    {
      label: 'Inventory',
      to: '/inventory',
      subItems: [
        { label: 'Full Collection', to: '/inventory', description: 'Browse all vehicles' },
        { label: 'VIN Lookup', to: '/vin', description: 'Verify any vehicle' },
      ],
    },
    {
      label: 'Financing',
      to: '/finance',
      subItems: [
        { label: 'Buy Here Pay Here', to: '/finance', description: 'In-house financing' },
        { label: 'Cash Purchase', to: '/payment-options', description: 'Payment options' },
      ],
    },
    {
      label: 'Rentals',
      to: '/services',
      subItems: [
        { label: 'Rental Vehicles', to: '/services', description: 'Cars and trucks' },
        { label: 'Tow Trucks', to: '/services', description: 'Commercial rentals' },
      ],
    },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    if (isOpen) closeMenu();
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const openMenu = useCallback(() => {
    setIsOpen(true);
    setActiveSubPanel(null);
    setMobileScreen('main');

    // Wait for DOM render
    requestAnimationFrame(() => {
      const tl = gsap.timeline();
      openTlRef.current = tl;

      // Step 1: Backdrop fade in
      tl.fromTo(overlayRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.5, ease: RR_EASE }
      );

      // Step 2: Primary links stagger in
      if (linksRef.current) {
        const items = linksRef.current.querySelectorAll('.nav-link-item');
        tl.fromTo(items,
          { y: 25, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.5, ease: RR_EASE },
          '-=0.25'
        );
      }

      // Step 3: Footer fade in
      if (footerRef.current) {
        tl.fromTo(footerRef.current,
          { y: 20, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, ease: RR_EASE },
          '-=0.2'
        );
      }
    });
  }, []);

  const closeMenu = useCallback(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setIsOpen(false);
        setActiveSubPanel(null);
        setMobileScreen('main');
      }
    });

    // Close sub-panel first if open
    if (subPanelRef.current && activeSubPanel !== null) {
      tl.to(subPanelRef.current, {
        x: '100%', duration: 0.4, ease: RR_EASE
      });
    }

    // Reverse stagger out links (last in, first out)
    if (linksRef.current) {
      const items = linksRef.current.querySelectorAll('.nav-link-item');
      const reversed = Array.from(items).reverse();
      tl.to(reversed, {
        y: 15, autoAlpha: 0, stagger: 0.04, duration: 0.35, ease: RR_EASE
      }, activeSubPanel !== null ? '-=0.2' : '0');
    }

    // Footer out
    if (footerRef.current) {
      tl.to(footerRef.current, {
        autoAlpha: 0, duration: 0.3, ease: RR_EASE
      }, '-=0.2');
    }

    // Backdrop out
    tl.to(overlayRef.current, {
      autoAlpha: 0, duration: 0.35, ease: RR_EASE
    }, '-=0.15');
  }, [activeSubPanel]);

  const openSubPanel = useCallback((index: number) => {
    setActiveSubPanel(index);
    requestAnimationFrame(() => {
      if (!subPanelRef.current) return;
      const tl = gsap.timeline();

      // Slide sub-panel in
      tl.fromTo(subPanelRef.current,
        { x: '100%' },
        { x: '0%', duration: 0.6, ease: RR_EASE }
      );

      // Stagger sub-items
      const subItems = subPanelRef.current.querySelectorAll('.sub-item');
      if (subItems.length) {
        tl.fromTo(subItems,
          { y: 30, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.1, duration: 0.5, ease: RR_EASE },
          '-=0.3'
        );
      }
    });
  }, []);

  const closeSubPanel = useCallback(() => {
    if (!subPanelRef.current) return;
    gsap.to(subPanelRef.current, {
      x: '100%', duration: 0.5, ease: RR_EASE,
      onComplete: () => setActiveSubPanel(null)
    });
  }, []);

  // Mobile sub-panel slide
  const openMobileSub = useCallback((index: number) => {
    setMobileSubIndex(index);
    setMobileScreen('sub');
    if (mobileContainerRef.current) {
      gsap.to(mobileContainerRef.current, {
        x: '-100vw', duration: 0.5, ease: RR_EASE
      });
    }
  }, []);

  const closeMobileSub = useCallback(() => {
    if (mobileContainerRef.current) {
      gsap.to(mobileContainerRef.current, {
        x: '0vw', duration: 0.5, ease: RR_EASE,
        onComplete: () => setMobileScreen('main')
      });
    }
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const isHome = location.pathname === '/';

  // Nav bar background
  const navBg = isOpen
    ? 'bg-transparent'
    : scrolled
      ? (isHome ? 'bg-[#F7F7F7]/95 backdrop-blur-[14px] border-b border-[rgba(201,168,76,0.08)]' : 'bg-black/95 backdrop-blur-[14px] border-b border-[rgba(201,168,76,0.08)]')
      : 'bg-transparent';

  const textColor = isOpen ? 'text-[#F5F0E8]' : (isHome ? 'text-[#0e1b16]' : 'text-[#F5F0E8]');
  const textMuted = isOpen ? 'text-[#F5F0E8]/80' : (isHome ? 'text-[#0e1b16]/60' : 'text-[#F5F0E8]/80');

  return (
    <>
      {/* ── Persistent Nav Bar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[9999] h-[70px] flex items-center transition-all duration-500 ${navBg}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
      >
        <div className="w-full flex items-center justify-between px-[clamp(28px,5vw,72px)]">
          {/* Logo */}
          <button onClick={handleLogoClick} className="focus:outline-none group flex flex-col">
            <span
              className={`font-serif text-[16px] md:text-[18px] font-normal tracking-[0.04em] transition-colors duration-400 ${isOpen ? 'text-[#C9A84C]' : (isHome ? 'text-[#C9A84C]' : 'text-[#C9A84C]')}`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
            >
              TRIPLE J
            </span>
            <span
              className={`font-sans text-[9px] font-light tracking-[0.2em] uppercase transition-colors duration-400 ${isOpen ? 'text-[rgba(201,168,76,0.5)]' : (isHome ? 'text-[rgba(201,168,76,0.5)]' : 'text-[rgba(201,168,76,0.5)]')}`}
            >
              AUTO INVESTMENT
            </span>
          </button>

          {/* Right side: lang toggle + MENU/CLOSE */}
          <div className="flex items-center gap-6">
            <button
              onClick={toggleLang}
              className={`font-sans text-[10px] font-normal tracking-[0.18em] uppercase transition-colors duration-300 ${textMuted} hover:${textColor}`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
            >
              {lang === 'en' ? 'ES' : 'EN'}
            </button>
            <button
              onClick={isOpen ? closeMenu : openMenu}
              className="relative font-sans text-[10px] font-normal tracking-[0.18em] uppercase h-[20px] w-[50px] focus:outline-none"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              <span
                className={`absolute inset-0 flex items-center justify-end transition-opacity duration-300 ${textMuted} hover:opacity-100`}
                style={{
                  opacity: isOpen ? 0 : 1,
                  transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                }}
              >
                MENU
              </span>
              <span
                className="absolute inset-0 flex items-center justify-end transition-opacity duration-300 text-[#F5F0E8]/80 hover:text-[#F5F0E8]"
                style={{
                  opacity: isOpen ? 1 : 0,
                  transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                }}
              >
                CLOSE
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Full-Screen Menu Overlay ── */}
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[9998] overflow-hidden"
          style={{ visibility: 'hidden', opacity: 0 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'var(--overlay-bg, rgba(15, 42, 30, 0.96))', backdropFilter: 'blur(20px)' }}
          />

          {/* ── Desktop Layout (>=1024px) ── */}
          <div className="hidden lg:flex relative w-full h-full">
            {/* Left Panel — Primary Links */}
            <div
              className="flex flex-col justify-center h-full transition-all duration-600"
              style={{
                width: activeSubPanel !== null ? '42%' : '100%',
                paddingLeft: 'clamp(48px, 6vw, 120px)',
                paddingTop: '120px',
                paddingBottom: '60px',
                transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
              }}
            >
              <div ref={linksRef} className="flex flex-col gap-[4px]">
                {navItems.map((item, i) => (
                  <div key={i} className="nav-link-item" style={{ visibility: 'hidden', opacity: 0 }}>
                    {item.subItems ? (
                      <button
                        onClick={() => activeSubPanel === i ? closeSubPanel() : openSubPanel(i)}
                        className="group flex items-center gap-4 text-left w-full"
                      >
                        {/* Gold cursor line */}
                        <span
                          className="block h-[1px] bg-[#C9A84C] transition-all duration-400"
                          style={{
                            width: activeSubPanel === i ? '24px' : '0px',
                            transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                          }}
                        />
                        <span
                          className="font-serif font-light leading-[1.3] transition-all duration-400"
                          style={{
                            fontSize: 'clamp(32px, 4.2vw, 52px)',
                            letterSpacing: '0.03em',
                            color: activeSubPanel === i ? '#C9A84C' : '#F5F0E8',
                            transform: activeSubPanel === i ? 'translateX(8px)' : 'translateX(0)',
                            transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                          }}
                        >
                          {item.label}
                        </span>
                      </button>
                    ) : (
                      <Link
                        to={item.to}
                        className="group flex items-center gap-4"
                        onClick={closeMenu}
                      >
                        <span className="block w-0 h-[1px] bg-[#C9A84C] transition-all duration-400 group-hover:w-[24px]"
                          style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
                        />
                        <span
                          className="font-serif font-light leading-[1.3] text-[#F5F0E8] group-hover:text-[#C9A84C] transition-all duration-400 group-hover:translate-x-2"
                          style={{
                            fontSize: 'clamp(32px, 4.2vw, 52px)',
                            letterSpacing: '0.03em',
                            transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                          }}
                        >
                          {item.label}
                        </span>
                      </Link>
                    )}
                  </div>
                ))}

                {user && (
                  <div className="nav-link-item mt-4 pt-4 border-t border-[rgba(201,168,76,0.08)]" style={{ visibility: 'hidden', opacity: 0 }}>
                    <Link
                      to="/admin/command-center"
                      className="group flex items-center gap-4"
                      onClick={closeMenu}
                    >
                      <span className="block w-0 h-[1px] bg-[#C9A84C] transition-all duration-400 group-hover:w-[24px]"
                        style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
                      />
                      <span
                        className="font-sans text-[12px] font-normal tracking-[0.18em] uppercase text-[rgba(201,168,76,0.5)] group-hover:text-[#C9A84C] transition-all duration-400 group-hover:translate-x-2"
                        style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
                      >
                        Dashboard
                      </span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer area */}
              <div
                ref={footerRef}
                className="mt-auto pt-[30px] border-t border-[rgba(201,168,76,0.08)]"
                style={{ visibility: 'hidden', opacity: 0 }}
              >
                <p className="font-sans text-[12px] font-light tracking-[0.06em] text-[rgba(245,240,232,0.4)] leading-[1.8]">
                  8774 Almeda Genoa Rd<br />Houston, TX 77075
                </p>
                <a href="tel:+18324009760" className="font-sans text-[12px] font-normal text-[#C9A84C] mt-2 block">(832) 400-9760</a>
                <div className="flex gap-6 mt-4">
                  <a href="https://www.facebook.com/thetriplejauto" target="_blank" rel="noopener noreferrer" className="font-sans text-[10px] uppercase tracking-[0.2em] text-[rgba(245,240,232,0.3)] hover:text-[#C9A84C] transition-colors duration-400" style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}>Facebook</a>
                  <a href="https://www.instagram.com/thetriplejauto" target="_blank" rel="noopener noreferrer" className="font-sans text-[10px] uppercase tracking-[0.2em] text-[rgba(245,240,232,0.3)] hover:text-[#C9A84C] transition-colors duration-400" style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}>Instagram</a>
                </div>
              </div>
            </div>

            {/* Right Panel — Sub-content */}
            {activeSubPanel !== null && navItems[activeSubPanel]?.subItems && (
              <div
                ref={subPanelRef}
                className="absolute right-0 top-0 h-full overflow-y-auto"
                style={{
                  width: '58%',
                  background: 'var(--sub-panel-bg, rgba(10, 10, 10, 0.4))',
                  borderLeft: '1px solid rgba(201, 168, 76, 0.06)',
                  padding: '120px clamp(40px, 5vw, 80px) 60px',
                  transform: 'translateX(100%)',
                }}
              >
                {/* Sub-panel header */}
                <div className="mb-10">
                  <span className="font-sans text-[10px] font-normal tracking-[0.25em] uppercase text-[rgba(201,168,76,0.5)]">
                    {navItems[activeSubPanel].label}
                  </span>
                  <div className="w-[30px] h-[1px] bg-[rgba(201,168,76,0.3)] mt-3" />
                </div>

                {/* Sub-items */}
                <div className="flex flex-col gap-0">
                  {navItems[activeSubPanel].subItems!.map((sub, si) => (
                    <Link
                      key={si}
                      to={sub.to}
                      onClick={closeMenu}
                      className="sub-item group py-5 border-b border-[rgba(201,168,76,0.04)] flex flex-col transition-all duration-400"
                      style={{
                        visibility: 'hidden',
                        opacity: 0,
                        transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                      }}
                    >
                      <span
                        className="font-serif font-light text-[#F5F0E8] group-hover:text-[#C9A84C] group-hover:translate-x-3 transition-all duration-400"
                        style={{
                          fontSize: 'clamp(20px, 2.5vw, 30px)',
                          transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                        }}
                      >
                        {sub.label}
                      </span>
                      {sub.description && (
                        <span className="font-sans text-[11px] font-light text-[rgba(245,240,232,0.3)] mt-1 tracking-[0.04em]">
                          {sub.description}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {/* View all button */}
                <div className="mt-10">
                  <Link
                    to={navItems[activeSubPanel].to}
                    onClick={closeMenu}
                    className="btn-rr"
                  >
                    VIEW ALL
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── Mobile Layout (<1024px) ── */}
          <div className="lg:hidden relative w-full h-full overflow-hidden">
            <div
              ref={mobileContainerRef}
              className="flex w-[200vw] h-full"
              style={{ transform: 'translateX(0)' }}
            >
              {/* Screen 1: Primary Nav */}
              <div className="w-screen h-full flex flex-col pt-[100px] px-7 pb-10 overflow-y-auto">
                <div ref={linksRef} className="flex flex-col gap-0">
                  {navItems.map((item, i) => (
                    <div key={i} className="nav-link-item" style={{ visibility: 'hidden', opacity: 0 }}>
                      {item.subItems ? (
                        <button
                          onClick={() => openMobileSub(i)}
                          className="w-full flex items-center justify-between py-4 border-b border-[rgba(201,168,76,0.04)]"
                          style={{ minHeight: '52px', touchAction: 'manipulation' }}
                        >
                          <span className="font-serif font-light text-[#F5F0E8]" style={{ fontSize: 'clamp(26px, 7vw, 36px)' }}>
                            {item.label}
                          </span>
                          <span className="text-[rgba(201,168,76,0.4)] text-[14px]">&#8250;</span>
                        </button>
                      ) : (
                        <Link
                          to={item.to}
                          onClick={closeMenu}
                          className="w-full flex items-center py-4 border-b border-[rgba(201,168,76,0.04)]"
                          style={{ minHeight: '52px', touchAction: 'manipulation' }}
                        >
                          <span className="font-serif font-light text-[#F5F0E8]" style={{ fontSize: 'clamp(26px, 7vw, 36px)' }}>
                            {item.label}
                          </span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                {/* Mobile footer */}
                <div ref={footerRef} className="mt-auto pt-8 border-t border-[rgba(201,168,76,0.08)]" style={{ visibility: 'hidden', opacity: 0 }}>
                  <p className="font-sans text-[12px] font-light text-[rgba(245,240,232,0.4)] leading-[1.8]">
                    8774 Almeda Genoa Rd, Houston TX 77075
                  </p>
                  <a href="tel:+18324009760" className="font-sans text-[12px] text-[#C9A84C] mt-1 block">(832) 400-9760</a>
                </div>
              </div>

              {/* Screen 2: Sub-Nav */}
              <div className="w-screen h-full flex flex-col pt-[100px] px-7 pb-10 overflow-y-auto">
                {/* Back button */}
                <button
                  onClick={closeMobileSub}
                  className="flex items-center gap-2 font-sans text-[11px] font-normal tracking-[0.15em] uppercase text-[rgba(201,168,76,0.6)] hover:text-[#C9A84C] py-4 mb-4"
                  style={{ minHeight: '52px', touchAction: 'manipulation' }}
                >
                  <span>&#8592;</span> Back to menu
                </button>

                {/* Sub-panel header */}
                <div className="mb-7">
                  <span className="font-sans text-[10px] font-normal tracking-[0.25em] uppercase text-[rgba(201,168,76,0.5)]">
                    {navItems[mobileSubIndex]?.label}
                  </span>
                  <div className="w-[24px] h-[1px] bg-[rgba(201,168,76,0.3)] mt-3" />
                </div>

                {/* Sub-items */}
                {navItems[mobileSubIndex]?.subItems?.map((sub, si) => (
                  <Link
                    key={si}
                    to={sub.to}
                    onClick={closeMenu}
                    className="w-full py-[18px] border-b border-[rgba(201,168,76,0.04)] block"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <span className="font-serif font-light text-[#F5F0E8]" style={{ fontSize: 'clamp(22px, 5.5vw, 30px)' }}>
                      {sub.label}
                    </span>
                    {sub.description && (
                      <span className="block font-sans text-[11px] font-light text-[rgba(245,240,232,0.3)] mt-1">{sub.description}</span>
                    )}
                  </Link>
                ))}

                {/* View all */}
                <div className="mt-8">
                  <Link
                    to={navItems[mobileSubIndex]?.to || '/'}
                    onClick={closeMenu}
                    className="btn-rr"
                  >
                    VIEW ALL
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RRNavbar;
```

**Step 2: Update App.tsx — replace Navbar**

In `App.tsx`:
1. Remove the entire inline `Navbar` component (lines ~111-303)
2. Add import: `import { RRNavbar } from './components/RRNavbar';`
3. Replace `<Navbar />` with `<RRNavbar />`
4. Update main padding: change `pt-24` to `pt-[70px]` (matches new 70px nav height)
5. Keep the home page condition: `location.pathname === '/' ? 'pt-0' : 'pt-[70px]'`
6. Remove unused imports: `Menu, X` from lucide-react, `AnimatePresence, motion` from framer-motion (if only used by old Navbar)

**Step 3: Build and verify**

Run: `npx vite build`
Expected: Build succeeds. No type errors related to Navbar.

**Step 4: Commit**

```bash
git add components/RRNavbar.tsx App.tsx
git commit -m "feat(nav): Rolls-Royce full-screen overlay menu system"
```

---

### Task 4: Extract Footer into standalone component

**Files:**
- Create: `components/RRFooter.tsx`
- Modify: `App.tsx` (replace inline Footer)

**Step 1: Create components/RRFooter.tsx**

Rolls-Royce minimal centered footer:

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { openSmartMap } from '../App';

export const RRFooter = () => {
  return (
    <footer
      className="relative overflow-hidden text-center"
      style={{
        backgroundColor: 'var(--tj-forest-deep, #0F2A1E)',
        padding: 'clamp(80px, 12vh, 160px) clamp(24px, 5vw, 80px)',
      }}
    >
      {/* Crest */}
      <img
        src="/GoldTripleJLogo.png"
        alt="Triple J Auto Investment"
        className="w-14 h-14 mx-auto mb-8 opacity-50"
      />

      {/* Company name */}
      <h2 className="font-serif text-[20px] font-normal tracking-[0.06em] text-[#F5F0E8] mb-2">
        TRIPLE J AUTO INVESTMENT LLC
      </h2>
      <p className="font-sans text-[12px] font-light tracking-[0.06em] text-[rgba(245,240,232,0.4)] leading-[1.8]">
        8774 Almeda Genoa Rd<br />Houston, TX 77075
      </p>

      {/* Separator */}
      <div className="w-[60px] h-[1px] bg-[rgba(201,168,76,0.15)] mx-auto my-10" />

      {/* Nav links */}
      <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10">
        {[
          { to: '/inventory', label: 'Inventory' },
          { to: '/finance', label: 'Financing' },
          { to: '/services', label: 'Rentals' },
          { to: '/about', label: 'About' },
          { to: '/contact', label: 'Contact' },
          { to: '/legal/privacy', label: 'Privacy' },
        ].map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="font-sans text-[11px] font-normal tracking-[0.15em] uppercase text-[rgba(245,240,232,0.4)] hover:text-[#C9A84C] transition-colors duration-400"
            style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Socials */}
      <div className="flex justify-center gap-8 mb-10">
        <a href="https://www.facebook.com/thetriplejauto" target="_blank" rel="noopener noreferrer" className="font-sans text-[10px] uppercase tracking-[0.2em] text-[rgba(245,240,232,0.3)] hover:text-[#C9A84C] transition-colors duration-400" style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}>Facebook</a>
        <a href="https://www.instagram.com/thetriplejauto" target="_blank" rel="noopener noreferrer" className="font-sans text-[10px] uppercase tracking-[0.2em] text-[rgba(245,240,232,0.3)] hover:text-[#C9A84C] transition-colors duration-400" style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}>Instagram</a>
      </div>

      {/* Copyright */}
      <p className="font-sans text-[10px] font-light tracking-[0.15em] uppercase text-[rgba(245,240,232,0.25)]">
        &copy; {new Date().getFullYear()} Triple J Auto Investment LLC
      </p>
    </footer>
  );
};

export default RRFooter;
```

**Step 2: Update App.tsx**

Replace the inline Footer component with:
```tsx
import { RRFooter } from './components/RRFooter';
```
Replace `<Footer />` with `<RRFooter />`.
Remove old Footer from App.tsx.

**Step 3: Build and verify**

Run: `npx vite build`

**Step 4: Commit**

```bash
git add components/RRFooter.tsx App.tsx
git commit -m "feat(footer): Rolls-Royce minimal centered footer"
```

---

## Batch 3: Scroll Indicator + Hero Carousel

### Task 5: Add scroll indicator component

**Files:**
- Create: `components/luxury/ScrollIndicator.tsx`

**Step 1: Create the component**

```tsx
import React from 'react';

export const ScrollIndicator = () => (
  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-[10px] z-10">
    <span className="hidden md:block font-sans text-[9px] tracking-[0.3em] uppercase text-[rgba(201,168,76,0.35)] font-light">
      Scroll
    </span>
    <div className="scroll-indicator-line" />
    <style>{`
      .scroll-indicator-line {
        width: 1px;
        height: 48px;
        position: relative;
        overflow: hidden;
        background: rgba(201, 168, 76, 0.08);
      }
      .scroll-indicator-line::after {
        content: "";
        position: absolute;
        top: -100%;
        left: 0;
        width: 100%;
        height: 100%;
        background: #C9A84C;
        animation: scrollPulse 2.4s cubic-bezier(0.76, 0, 0.24, 1) infinite;
      }
      @keyframes scrollPulse {
        0%   { top: -100%; }
        45%  { top: 0%; }
        55%  { top: 0%; }
        100% { top: 100%; }
      }
      @media (max-width: 768px) {
        .scroll-indicator-line { height: 36px; }
      }
    `}</style>
  </div>
);
```

**Step 2: Commit**

```bash
git add components/luxury/ScrollIndicator.tsx
git commit -m "feat: add Rolls-Royce scroll indicator component"
```

---

### Task 6: Add GSAP data-animate scroll system

**Files:**
- Create: `hooks/useGSAPAnimations.ts`

**Step 1: Create the hook**

```ts
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useGSAPAnimations = () => {
  useEffect(() => {
    // Fade up
    gsap.utils.toArray<HTMLElement>('[data-animate="fade-up"]').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        y: 50, autoAlpha: 0, duration: 0.8, ease: 'power2.inOut',
      });
    });

    // Image reveal (clip-path)
    gsap.utils.toArray<HTMLElement>('[data-animate="reveal"]').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none none' },
        clipPath: 'inset(12% 12% 12% 12%)', duration: 1.2, ease: 'power4.out',
      });
    });

    // Horizontal rule grow
    gsap.utils.toArray<HTMLElement>('[data-animate="rule"]').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        width: 0, duration: 0.8, ease: 'power2.inOut',
      });
    });

    // Stagger children
    gsap.utils.toArray<HTMLElement>('[data-animate="stagger"]').forEach(container => {
      gsap.from(container.children, {
        scrollTrigger: { trigger: container, start: 'top 80%' },
        y: 40, autoAlpha: 0, stagger: 0.12, duration: 0.6, ease: 'power2.inOut',
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);
};
```

**Step 2: Commit**

```bash
git add hooks/useGSAPAnimations.ts
git commit -m "feat: add GSAP data-animate scroll animation system"
```

---

## Batch 4: Home Page Rebuild

### Task 7: Rebuild Home page with Rolls-Royce section architecture

**Files:**
- Modify: `pages/Home.tsx`

This task integrates the hero carousel, existing frame animations, and new section spacing. The Home page structure becomes:

1. Hero carousel (new) — 100vh with Ken Burns, scroll indicator
2. MaybachScrollAnimation (existing)
3. KeyScrollAnimation (existing)
4. Sovereign Assets / Our Collection (redesigned with GSAP reveals)
5. ScrollAnimation (existing, logo forge)
6. AI Concierge CTA (redesigned with Rolls-Royce spacing)
7. Trust Strip (redesigned)

The hero carousel uses the existing maybach video first frame or a static hero image. Keep existing frame animations exactly as-is. Apply `data-animate` attributes to static sections.

**Step 1: Update Home.tsx**

Add `useGSAPAnimations` hook call. Wrap static sections with `data-animate` attributes. Add `<ScrollIndicator />` to hero. Increase section padding to `var(--space-section)`. Replace current button styles with `.btn-rr`.

**Step 2: Build and verify**

Run: `npx vite build`

**Step 3: Commit**

```bash
git add pages/Home.tsx
git commit -m "feat(home): Rolls-Royce section architecture with GSAP reveals"
```

---

## Batch 5: Other Page Updates

### Task 8: Update Inventory page typography and spacing

**Files:** Modify `pages/Inventory.tsx`

Apply Rolls-Royce typography (Playfair for headings, Plus Jakarta for body), extreme section spacing, GSAP reveals on vehicle cards, `.btn-rr` buttons.

### Task 9: Update VehicleDetail page

**Files:** Modify `pages/VehicleDetail.tsx`

New image gallery with clip-path reveals, Cormorant Garamond for pricing, Rolls-Royce spacing.

### Task 10: Update About, Contact, Services, Finance pages

**Files:** Modify `pages/About.tsx`, `pages/Contact.tsx`, `pages/Services.tsx`, `pages/Finance.tsx`

Apply typography, spacing, GSAP animations, `.btn-rr` buttons.

---

## Batch 6: Polish Pass

### Task 11: Performance audit and mobile testing

- Verify all animations use only `transform` and `opacity`
- Test on iOS Safari (iPad/iPhone)
- Verify touch targets >= 48px
- Run Lighthouse
- Remove unused CSS from old Navbar/Footer

### Task 12: Final build, push, deploy

```bash
npx vite build
npx tsc --noEmit
git push origin master && git push origin master:main
```

Deploy to Vercel.
