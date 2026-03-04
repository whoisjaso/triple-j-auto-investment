import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/Store';
import { useLanguage } from '../context/LanguageContext';
import gsap from 'gsap';

/* ─── Sub-panel data ─── */
interface SubItem {
  label: string;
  to: string;
}

interface NavItem {
  label: string;
  to?: string;
  sub?: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Inventory',
    sub: [
      { label: 'Full Collection', to: '/inventory' },
      { label: 'VIN Lookup', to: '/vin' },
    ],
  },
  {
    label: 'Financing',
    sub: [
      { label: 'Buy Here Pay Here', to: '/finance' },
      { label: 'Payment Options', to: '/payment-options' },
    ],
  },
  {
    label: 'Rentals',
    sub: [
      { label: 'Rental Vehicles', to: '/services' },
      { label: 'Tow Trucks', to: '/services' },
    ],
  },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

/* ─── Component ─── */
export const RRNavbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);
  const [activeSubIdx, setActiveSubIdx] = useState<number | null>(null);
  const [mobileScreen, setMobileScreen] = useState<'main' | 'sub'>('main');
  const [mobileSubIdx, setMobileSubIdx] = useState<number | null>(null);

  const lastScrollYRef = useRef(0);

  const { user } = useStore();
  const { lang, toggleLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const overlayRef = useRef<HTMLDivElement>(null);
  const primaryLinksRef = useRef<HTMLDivElement>(null);
  const subPanelRef = useRef<HTMLDivElement>(null);
  const subItemsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const tlOpenRef = useRef<gsap.core.Timeline | null>(null);
  const tlCloseRef = useRef<gsap.core.Timeline | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const isHome = location.pathname === '/';

  /* ─── Scroll detection + smart hide ─── */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);

      // Smart hide: hide on scroll down, show on scroll up
      if (menuOpen || y < 100) {
        setNavVisible(true);
      } else if (y > lastScrollYRef.current + 5) {
        setNavVisible(false); // scrolling down
      } else if (y < lastScrollYRef.current - 5) {
        setNavVisible(true); // scrolling up
      }
      lastScrollYRef.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [menuOpen]);

  /* ─── Body scroll lock ─── */
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [menuOpen]);

  /* ─── Escape key ─── */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  /* ─── Close menu on route change ─── */
  useEffect(() => {
    if (menuOpen) closeMenu();
  }, [location.pathname]);

  /* ─── GSAP open animation ─── */
  const animateOpen = useCallback(() => {
    if (tlOpenRef.current) tlOpenRef.current.kill();

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
    });

    // Set initial states
    gsap.set(overlayRef.current, { opacity: 0, visibility: 'visible' });

    const primaryLinks = primaryLinksRef.current?.querySelectorAll('.rr-nav-link');
    if (primaryLinks) {
      gsap.set(primaryLinks, { opacity: 0, y: 25 });
    }
    if (footerRef.current) {
      gsap.set(footerRef.current, { opacity: 0 });
    }

    // Animate
    tl.to(overlayRef.current, { opacity: 1, duration: 0.5 });
    if (primaryLinks) {
      tl.to(
        primaryLinks,
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.07 },
        '-=0.2'
      );
    }
    if (footerRef.current) {
      tl.to(footerRef.current, { opacity: 1, duration: 0.4 }, '-=0.15');
    }

    tlOpenRef.current = tl;
  }, []);

  /* ─── GSAP close animation ─── */
  const animateClose = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (tlCloseRef.current) tlCloseRef.current.kill();

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete: () => {
          gsap.set(overlayRef.current, { visibility: 'hidden' });
          resolve();
        },
      });

      // Close sub-panel first if open
      if (subPanelRef.current && activeSubIdx !== null) {
        tl.to(subPanelRef.current, { x: '100%', duration: 0.35 }, 0);
      }

      // Reverse-stagger links out
      const primaryLinks = primaryLinksRef.current?.querySelectorAll('.rr-nav-link');
      if (primaryLinks && primaryLinks.length) {
        tl.to(
          Array.from(primaryLinks).reverse(),
          { opacity: 0, y: -15, duration: 0.25, stagger: 0.04 },
          activeSubIdx !== null ? 0.15 : 0
        );
      }

      if (footerRef.current) {
        tl.to(footerRef.current, { opacity: 0, duration: 0.2 }, 0);
      }

      tl.to(overlayRef.current, { opacity: 0, duration: 0.4 }, '-=0.15');

      tlCloseRef.current = tl;
    });
  }, [activeSubIdx]);

  /* ─── Open / Close handlers ─── */
  const openMenu = () => {
    setActiveSubIdx(null);
    setMobileScreen('main');
    setMobileSubIdx(null);
    setMenuOpen(true);
    requestAnimationFrame(() => {
      animateOpen();
    });
  };

  const closeMenu = async () => {
    await animateClose();
    setMenuOpen(false);
    setActiveSubIdx(null);
    setMobileScreen('main');
    setMobileSubIdx(null);
    menuBtnRef.current?.focus();
  };

  const handleMenuToggle = () => {
    if (menuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  /* ─── Desktop sub-panel open ─── */
  const openSubPanel = (idx: number) => {
    setActiveSubIdx(idx);
    requestAnimationFrame(() => {
      if (subPanelRef.current) {
        gsap.fromTo(
          subPanelRef.current,
          { x: '100%' },
          { x: '0%', duration: 0.5, ease: 'power2.inOut' }
        );
      }
      const subItems = subItemsRef.current?.querySelectorAll('.rr-sub-item');
      if (subItems) {
        gsap.fromTo(
          subItems,
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out', delay: 0.2 }
        );
      }
    });
  };

  const closeSubPanel = () => {
    if (subPanelRef.current) {
      gsap.to(subPanelRef.current, {
        x: '100%',
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => setActiveSubIdx(null),
      });
    } else {
      setActiveSubIdx(null);
    }
  };

  /* ─── Mobile sub-panel ─── */
  const openMobileSub = (idx: number) => {
    setMobileSubIdx(idx);
    setMobileScreen('sub');
    requestAnimationFrame(() => {
      if (mobileContainerRef.current) {
        gsap.to(mobileContainerRef.current, {
          x: '-100vw',
          duration: 0.45,
          ease: 'power2.inOut',
        });
      }
    });
  };

  const closeMobileSub = () => {
    if (mobileContainerRef.current) {
      gsap.to(mobileContainerRef.current, {
        x: '0vw',
        duration: 0.45,
        ease: 'power2.inOut',
        onComplete: () => {
          setMobileScreen('main');
          setMobileSubIdx(null);
        },
      });
    }
  };

  /* ─── Logo click ─── */
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (menuOpen) closeMenu();
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  /* ─── Navigate from overlay ─── */
  const navTo = (to: string) => {
    closeMenu();
    navigate(to);
  };

  /* ─── Nav bar background ─── */
  const getNavBg = (): string => {
    if (menuOpen) return 'bg-transparent';
    if (!scrolled) return 'bg-transparent';
    if (isHome) return 'bg-[#F7F7F7]/80 backdrop-blur-xl';
    return 'bg-[rgba(10,10,10,0.80)] backdrop-blur-xl';
  };

  /* ─── Text color for nav bar ─── */
  const getBarTextColor = (): string => {
    if (menuOpen) return 'text-[#F5F0E8]';
    if (isHome) return scrolled ? 'text-[#0e1b16]' : 'text-[#0e1b16]';
    return 'text-[#F5F0E8]';
  };

  const barText = getBarTextColor();

  return (
    <>
      {/* ────────────────────────────────────────────────
          PERSISTENT NAV BAR — 70px fixed
      ──────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 h-[50px] z-[9999] flex items-center justify-between px-6 md:px-10 lg:px-16 transition-all duration-700 ${getNavBg()} ${navVisible ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="focus:outline-none group flex flex-col items-start"
          aria-label="Home"
        >
          <span
            className={`font-serif text-[14px] md:text-[15px] tracking-[0.08em] leading-none transition-colors duration-500 ${
              menuOpen ? 'text-tj-goldRR' : 'text-tj-goldRR'
            }`}
            style={{ fontWeight: 400 }}
          >
            TRIPLE J
          </span>
          <span
            className={`text-[8px] uppercase tracking-[0.25em] mt-[2px] transition-colors duration-500 ${
              menuOpen
                ? 'text-[#F5F0E8]/60'
                : isHome
                ? 'text-[#0e1b16]/50'
                : 'text-[#F5F0E8]/50'
            }`}
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            AUTO INVESTMENT
          </span>
        </button>

        {/* Right side: lang toggle + MENU/CLOSE */}
        <div className="flex items-center gap-6 md:gap-8">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className={`text-[9px] uppercase tracking-[0.2em] font-medium transition-colors duration-500 hover:text-tj-goldRR opacity-60 hover:opacity-100 ${barText}`}
            style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
          >
            {lang === 'en' ? 'ES' : 'EN'}
          </button>

          {/* Hamburger → X morph */}
          <button
            ref={menuBtnRef}
            onClick={handleMenuToggle}
            className={`relative w-[44px] h-[44px] flex items-center justify-center transition-colors duration-500 group ${barText}`}
            aria-expanded={menuOpen}
            aria-controls="rr-overlay"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <div className="relative w-[22px] h-[14px]">
              {/* Top line */}
              <span
                className="absolute left-0 w-full h-[1.5px] bg-current transition-all group-hover:bg-tj-goldRR"
                style={{
                  top: menuOpen ? '50%' : '0',
                  transform: menuOpen ? 'translateY(-50%) rotate(45deg)' : 'translateY(0) rotate(0)',
                  transitionDuration: '500ms',
                  transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                }}
              />
              {/* Middle line */}
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1.5px] bg-current transition-all group-hover:bg-tj-goldRR"
                style={{
                  opacity: menuOpen ? 0 : 1,
                  transitionDuration: '300ms',
                  transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                }}
              />
              {/* Bottom line */}
              <span
                className="absolute left-0 w-full h-[1.5px] bg-current transition-all group-hover:bg-tj-goldRR"
                style={{
                  bottom: menuOpen ? 'auto' : '0',
                  top: menuOpen ? '50%' : 'auto',
                  transform: menuOpen ? 'translateY(-50%) rotate(-45deg)' : 'translateY(0) rotate(0)',
                  transitionDuration: '500ms',
                  transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                }}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* ────────────────────────────────────────────────
          FULL-SCREEN OVERLAY
      ──────────────────────────────────────────────── */}
      <div
        id="rr-overlay"
        ref={overlayRef}
        className="fixed inset-0 z-[9998] overflow-hidden"
        style={{
          background: 'rgba(15, 42, 30, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          visibility: 'hidden',
          opacity: 0,
        }}
        aria-hidden={!menuOpen}
      >
        {/* ── DESKTOP LAYOUT (>=1024px) ── */}
        <div className="hidden lg:flex h-full pt-[50px]">
          {/* Left panel */}
          <div
            className={`flex flex-col justify-between h-full px-10 xl:px-16 py-12 transition-all duration-500 ${
              activeSubIdx !== null ? 'w-[50%]' : 'w-[60%]'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)' }}
          >
            {/* Primary links */}
            <div ref={primaryLinksRef} className="flex flex-col gap-2 mt-4">
              {NAV_ITEMS.map((item, idx) => (
                <button
                  key={item.label}
                  className="rr-nav-link group relative flex items-center text-left py-3 focus:outline-none"
                  onClick={() => {
                    if (item.sub) {
                      if (activeSubIdx === idx) {
                        closeSubPanel();
                      } else {
                        openSubPanel(idx);
                      }
                    } else if (item.to) {
                      navTo(item.to);
                    }
                  }}
                >
                  {/* Gold line on hover */}
                  <span className="absolute left-0 w-0 h-[1px] bg-tj-goldRR transition-all duration-500 group-hover:w-6 opacity-0 group-hover:opacity-100 -translate-x-8 group-hover:translate-x-0" />
                  <span
                    className="font-serif font-light text-[#F5F0E8] group-hover:text-tj-goldRR transition-all duration-500 group-hover:translate-x-2 pl-0 group-hover:pl-8"
                    style={{
                      fontSize: 'clamp(32px, 4.2vw, 52px)',
                      fontWeight: 300,
                      transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}

              {/* Admin link */}
              {user && (
                <button
                  className="rr-nav-link group relative flex items-center text-left py-3 mt-4 border-t border-tj-goldRR/15 pt-6 focus:outline-none"
                  onClick={() => navTo('/admin/dashboard')}
                >
                  <span
                    className="font-serif font-light text-tj-goldRR/60 group-hover:text-tj-goldRR transition-all duration-500 group-hover:translate-x-2"
                    style={{
                      fontSize: 'clamp(18px, 2vw, 24px)',
                      fontWeight: 300,
                      transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
                    }}
                  >
                    Dashboard
                  </span>
                </button>
              )}
            </div>

            {/* Footer in overlay */}
            <div ref={footerRef} className="opacity-0">
              <div className="border-t border-[#F5F0E8]/10 pt-8 space-y-4">
                <p
                  className="text-[12px] text-[#F5F0E8]/40 leading-relaxed"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  8774 Almeda Genoa Rd, Houston TX 77075
                </p>
                <a
                  href="tel:+18324009760"
                  className="text-[13px] text-tj-goldRR hover:text-tj-goldLight transition-colors duration-300 block"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  (832) 400-9760
                </a>
                <div className="flex items-center gap-6 pt-2">
                  <a
                    href="https://www.facebook.com/thetriplejauto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] uppercase tracking-[0.15em] text-[#F5F0E8]/30 hover:text-tj-goldRR transition-colors duration-300"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    Facebook
                  </a>
                  <a
                    href="https://www.instagram.com/thetriplejauto"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] uppercase tracking-[0.15em] text-[#F5F0E8]/30 hover:text-tj-goldRR transition-colors duration-300"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    Instagram
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right sub-panel */}
          <div
            ref={subPanelRef}
            className="h-full overflow-y-auto"
            style={{
              width: activeSubIdx !== null ? '50%' : '0%',
              background: 'rgba(10, 30, 20, 0.6)',
              transform: 'translateX(100%)',
            }}
          >
            {activeSubIdx !== null && NAV_ITEMS[activeSubIdx]?.sub && (
              <div ref={subItemsRef} className="px-10 xl:px-16 py-16 pt-[50px]">
                <p
                  className="text-[10px] uppercase tracking-[0.3em] text-tj-goldRR/60 mb-10"
                  style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                >
                  {NAV_ITEMS[activeSubIdx].label}
                </p>
                <div className="flex flex-col gap-1">
                  {NAV_ITEMS[activeSubIdx].sub!.map((subItem) => (
                    <button
                      key={subItem.to + subItem.label}
                      className="rr-sub-item group text-left py-4 border-b border-[#F5F0E8]/5 hover:border-tj-goldRR/20 transition-all duration-400 focus:outline-none"
                      onClick={() => navTo(subItem.to)}
                    >
                      <span
                        className="text-[18px] xl:text-[20px] text-[#F5F0E8]/80 group-hover:text-tj-goldRR transition-colors duration-400 font-light"
                        style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                      >
                        {subItem.label}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  className="btn-rr mt-10"
                  onClick={() => {
                    const firstSub = NAV_ITEMS[activeSubIdx]?.sub?.[0];
                    if (firstSub) navTo(firstSub.to);
                  }}
                >
                  VIEW ALL
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE LAYOUT (<1024px) ── */}
        <div className="lg:hidden h-full pt-[50px] overflow-hidden">
          <div
            ref={mobileContainerRef}
            className="flex h-full"
            style={{ width: '200vw', transform: 'translateX(0)' }}
          >
            {/* Screen 1: Primary links */}
            <div className="w-screen h-full overflow-y-auto flex flex-col justify-between px-6 py-8">
              <div ref={primaryLinksRef} className="flex flex-col gap-1 mt-2">
                {NAV_ITEMS.map((item, idx) => (
                  <button
                    key={item.label}
                    className="rr-nav-link group flex items-center justify-between text-left py-4 border-b border-[#F5F0E8]/8 focus:outline-none min-h-[52px]"
                    onClick={() => {
                      if (item.sub) {
                        openMobileSub(idx);
                      } else if (item.to) {
                        navTo(item.to);
                      }
                    }}
                  >
                    <span
                      className="font-serif font-light text-[#F5F0E8] group-hover:text-tj-goldRR transition-colors duration-400"
                      style={{ fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 300 }}
                    >
                      {item.label}
                    </span>
                    {item.sub && (
                      <span className="text-[#F5F0E8]/30 text-[22px] font-light mr-2 group-hover:text-tj-goldRR transition-colors duration-300">
                        &#x203A;
                      </span>
                    )}
                  </button>
                ))}

                {/* Admin link (mobile) */}
                {user && (
                  <button
                    className="rr-nav-link group flex items-center text-left py-4 mt-4 border-t border-tj-goldRR/15 pt-6 focus:outline-none min-h-[52px]"
                    onClick={() => navTo('/admin/dashboard')}
                  >
                    <span
                      className="font-serif font-light text-tj-goldRR/60 group-hover:text-tj-goldRR transition-colors duration-400"
                      style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 300 }}
                    >
                      Dashboard
                    </span>
                  </button>
                )}
              </div>

              {/* Mobile footer */}
              <div ref={footerRef} className="mt-auto pt-8 pb-4 opacity-0">
                <div className="border-t border-[#F5F0E8]/10 pt-6 space-y-3">
                  <p
                    className="text-[11px] text-[#F5F0E8]/35"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    8774 Almeda Genoa Rd, Houston TX 77075
                  </p>
                  <a
                    href="tel:+18324009760"
                    className="text-[12px] text-tj-goldRR block"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    (832) 400-9760
                  </a>
                  <div className="flex items-center gap-5 pt-1">
                    <a
                      href="https://www.facebook.com/thetriplejauto"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-[0.15em] text-[#F5F0E8]/25 hover:text-tj-goldRR transition-colors"
                      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                    >
                      Facebook
                    </a>
                    <a
                      href="https://www.instagram.com/thetriplejauto"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-[0.15em] text-[#F5F0E8]/25 hover:text-tj-goldRR transition-colors"
                      style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                    >
                      Instagram
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Screen 2: Sub-items */}
            <div className="w-screen h-full overflow-y-auto px-6 py-8">
              {/* Back button */}
              <button
                onClick={closeMobileSub}
                className="flex items-center gap-2 text-[#F5F0E8]/50 hover:text-tj-goldRR transition-colors duration-300 mb-8 min-h-[52px] focus:outline-none"
                style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
              >
                <span className="text-[18px]">&larr;</span>
                <span className="text-[12px] uppercase tracking-[0.15em]">Back to menu</span>
              </button>

              {mobileSubIdx !== null && NAV_ITEMS[mobileSubIdx]?.sub && (
                <>
                  <p
                    className="text-[10px] uppercase tracking-[0.3em] text-tj-goldRR/60 mb-8"
                    style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                  >
                    {NAV_ITEMS[mobileSubIdx].label}
                  </p>
                  <div className="flex flex-col gap-1">
                    {NAV_ITEMS[mobileSubIdx].sub!.map((subItem) => (
                      <button
                        key={subItem.to + subItem.label}
                        className="group text-left py-5 border-b border-[#F5F0E8]/5 hover:border-tj-goldRR/20 transition-all duration-300 focus:outline-none min-h-[52px]"
                        onClick={() => navTo(subItem.to)}
                      >
                        <span
                          className="text-[20px] text-[#F5F0E8]/80 group-hover:text-tj-goldRR transition-colors duration-300 font-light"
                          style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}
                        >
                          {subItem.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn-rr mt-10"
                    onClick={() => {
                      const firstSub = NAV_ITEMS[mobileSubIdx]?.sub?.[0];
                      if (firstSub) navTo(firstSub.to);
                    }}
                  >
                    VIEW ALL
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
