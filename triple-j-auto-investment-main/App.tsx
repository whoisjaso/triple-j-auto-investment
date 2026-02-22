
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { Menu, X, LayoutDashboard, Lock, ShieldCheck, MapPin, FileText, Car, Database, Globe, Key, CreditCard, Phone, Clock, Facebook, Twitter } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import BrowserCompatibilityCheck from './components/BrowserCompatibilityCheck';
import { ScrollToTop } from './components/ScrollToTop';
import { PageLoader } from './components/PageLoader';
import { OfflineBanner } from './components/OfflineBanner';
import { ConnectionErrorBanner } from './components/ConnectionErrorBanner';
import { useSessionTracking } from './hooks/useSessionTracking';
import { captureInitialUtm } from './services/attributionService';
import { NoiseOverlay, SmoothScroll } from './components/luxury';

// Critical Pages (Eagerly Loaded)
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import Contact from './pages/Contact';

// Helper function for lazy loading with error handling
const lazyWithErrorHandling = (importFn: () => Promise<any>, pageName: string) => {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error(`Failed to load ${pageName}:`, error);
      // Return a fallback component
      return {
        default: () => (
          <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
            <div className="text-center max-w-2xl">
              <img
                src="/GoldTripleJLogo.png"
                alt="Triple J Auto Investment"
                className="w-16 h-16 mx-auto mb-6 opacity-50"
              />
              <h1 className="font-display text-3xl text-tj-gold mb-4">Error Loading {pageName}</h1>
              <p className="text-gray-400 mb-2">
                Failed to load the {pageName} page.
              </p>
              <p className="text-gray-400 text-sm mb-8">
                Please refresh the page or call us at (832) 400-9760.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-tj-gold text-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-white transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      };
    }
  });
};

// Non-Critical Pages (Lazy Loaded)
const VinLookup = lazyWithErrorHandling(() => import('./pages/VinLookup'), 'VIN Lookup');
const Services = lazyWithErrorHandling(() => import('./pages/Services'), 'Services');
const Finance = lazyWithErrorHandling(() => import('./pages/Finance'), 'Finance');
const FAQ = lazyWithErrorHandling(() => import('./pages/FAQ'), 'FAQ');
const Policies = lazyWithErrorHandling(() => import('./pages/Policies'), 'Policies');
const PaymentOptions = lazyWithErrorHandling(() => import('./pages/PaymentOptions'), 'Payment Options');
const NotFound = lazyWithErrorHandling(() => import('./pages/NotFound'), 'Not Found');
const Login = lazyWithErrorHandling(() => import('./pages/Login'), 'Login');
const About = lazyWithErrorHandling(() => import('./pages/About'), 'About');
const Legal = lazyWithErrorHandling(() => import('./pages/Legal'), 'Legal');
const RegistrationTracker = lazyWithErrorHandling(() => import('./pages/RegistrationTracker'), 'Registration Tracker');
const CustomerStatusTracker = lazyWithErrorHandling(() => import('./pages/CustomerStatusTracker'), 'Customer Status Tracker');
const VehicleDetail = lazyWithErrorHandling(() => import('./pages/VehicleDetail'), 'Vehicle Detail');

// Customer Portal Pages (Lazy Loaded)
const CustomerLogin = lazyWithErrorHandling(() => import('./pages/CustomerLogin'), 'Customer Login');
const CustomerDashboard = lazyWithErrorHandling(() => import('./pages/CustomerDashboard'), 'Customer Dashboard');

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazyWithErrorHandling(() => import('./pages/admin/Dashboard'), 'Admin Dashboard');
const AdminInventory = lazyWithErrorHandling(() => import('./pages/admin/Inventory'), 'Admin Inventory');
const AdminRegistrations = lazyWithErrorHandling(() => import('./pages/admin/Registrations'), 'Admin Registrations');
const AdminRentals = lazyWithErrorHandling(() => import('./pages/admin/Rentals'), 'Admin Rentals');
const AdminPlates = lazyWithErrorHandling(() => import('./pages/admin/Plates'), 'Admin Plates');

// Utility for Map Routing
export const openSmartMap = () => {
  const address = "8774 Almeda Genoa Road, Houston, TX 77075";
  const encoded = encodeURIComponent(address);
  const isIOS = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);

  if (isIOS) {
    window.open(`http://maps.apple.com/?q=${encoded}`, '_blank');
  } else {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
  }
};

// Redirect legacy hash URLs (/#/about -> /about) for SEO and bookmarks
const HashRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      const path = window.location.hash.slice(1); // remove '#', keep '/about'
      navigate(path, { replace: true });
    }
  }, [navigate]);
  return null;
};

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, logout } = useStore();
  const { t, lang, toggleLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const menuToggleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  // Escape key closes mobile menu
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const NavLink = ({ to, label }: { to: string, label: string }) => (
    <Link
      to={to}
      className={`link-brutal ${location.pathname === to ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
      onClick={() => setIsOpen(false)}
    >
      {label}
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col justify-start">
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black via-black/90 to-transparent pointer-events-none h-32 transition-opacity duration-700"></div>

      <div className="relative z-10">
        <div className="max-w-[1920px] mx-auto px-6 md:px-12">
          <div className="relative flex justify-between items-start h-32 pt-8">

            {/* STRICT LEFT ANCHOR: LOGO */}
            <div className="flex-shrink-0 z-[100]">
              <button
                onClick={handleLogoClick}
                className="group relative flex items-center justify-start cursor-pointer bg-transparent border-none p-0 focus:outline-none"
              >
                <img
                  src="/GoldTripleJLogo.png"
                  alt="Triple J Auto Investment Logo"
                  className="w-16 h-16 md:w-20 md:h-20 object-contain text-left"
                />
              </button>
            </div>

            {/* STRICT RIGHT ANCHOR: NAVIGATION & TOOLS */}
            <div className="hidden md:flex items-start justify-end gap-12 z-[100]">

              <div className="flex flex-col items-end gap-6 pt-2">
                <div className="flex items-center gap-8">
                  <NavLink to="/inventory" label={t.nav.inventory} />
                  <NavLink to="/vin" label={t.vinLookup.badge} />
                  <NavLink to="/about" label={t.nav.about} />
                </div>

                <div className="flex items-center gap-6 text-[9px] uppercase tracking-micro text-gray-500">
                  <span className="font-display text-tj-gold">{t.home.seHabla}</span>
                  <button onClick={toggleLang} className="hover:text-white transition-colors uppercase tracking-micro">
                    {lang === 'en' ? 'ESPAÑOL' : 'ENGLISH'}
                  </button>
                  {!user ? (
                    <Link to="/login" className="hover:text-white transition-colors uppercase tracking-micro" aria-label="Dealer Login">
                      LOGIN
                    </Link>
                  ) : (
                    <button onClick={logout} className="text-red-800 hover:text-red-500 transition-colors uppercase tracking-micro">Logout</button>
                  )}
                </div>
              </div>

              {user && (
                <div className="flex flex-col items-end gap-4 hairline-l pl-8 pb-4">
                  <span className="text-[8px] uppercase tracking-ultra text-tj-gold mb-2">Command</span>
                  <Link to="/admin/dashboard" className={`link-brutal ${location.pathname.includes('dashboard') ? 'text-tj-gold' : 'text-gray-400'}`}>Dashboard</Link>
                  <Link to="/admin/inventory" className={`link-brutal ${location.pathname.includes('inventory') ? 'text-tj-gold' : 'text-gray-400'}`}>Assets</Link>
                  <Link to="/admin/registrations" className={`link-brutal ${location.pathname.includes('registrations') ? 'text-tj-gold' : 'text-gray-400'}`}>Ledger</Link>
                  <Link to="/admin/rentals" className={`link-brutal ${location.pathname.includes('rentals') ? 'text-tj-gold' : 'text-gray-400'}`}>Rentals</Link>
                  <Link to="/admin/plates" className={`link-brutal ${location.pathname.includes('plates') ? 'text-tj-gold' : 'text-gray-400'}`}>Plates</Link>
                </div>
              )}
            </div>

            {/* Mobile Trigger */}
            <div className="flex flex-1 justify-end md:hidden z-[70] pr-2 items-center gap-4">
              {/* Se Habla -- mobile indicator */}
              <span className="text-[8px] uppercase tracking-[0.15em] text-tj-gold/70 font-display select-none whitespace-nowrap">
                {t.home.seHabla}
              </span>

              <button
                onClick={toggleLang}
                className="text-tj-gold p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={lang === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
              >
                <span className="text-[10px] font-bold">{lang === 'en' ? 'ES' : 'EN'}</span>
              </button>

              <button
                ref={menuToggleRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative p-3 border transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden ${isOpen ? 'border-tj-gold text-tj-gold bg-black' : 'border-white/10 text-white bg-black/50 backdrop-blur'}`}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
              >
                <div className={`absolute inset-0 bg-tj-gold/10 transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}></div>
                <div className={`relative z-10 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpen ? 'rotate-90 scale-110' : 'rotate-0'}`}>
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {/* Pure black background, no overlays */}
      {isOpen && (
        <div
          className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen flex flex-col justify-center items-center md:hidden"
          style={{ zIndex: 99999, position: 'fixed', backgroundColor: '#000000' }}
        >
          <div className="flex flex-col items-center gap-8 w-full px-8">
            {/* Public Navigation Links */}
            {[
              { to: "/", label: t.nav.home.toUpperCase(), sub: "" },
              { to: "/inventory", label: t.nav.inventory.toUpperCase(), sub: "" },
              { to: "/vin", label: t.vinLookup.title, sub: "" },
              { to: "/about", label: t.nav.about.toUpperCase(), sub: "" }
            ].map((link) => (
              <div key={link.to} className="w-full text-center group">
                <Link
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className="block font-display text-3xl text-white tracking-[0.15em] hover:text-tj-gold transition-all duration-300"
                >
                  {link.label}
                </Link>
                {link.sub && (
                  <p className="text-[9px] text-gray-400 uppercase tracking-[0.3em] mt-1 group-hover:text-tj-gold/60 transition-colors">
                    {link.sub}
                  </p>
                )}
              </div>
            ))}

            {/* Admin Links */}
            <div className="w-full border-t border-tj-gold/30 pt-6 mt-2">
              {user ? (
                <>
                  <p className="text-[9px] text-tj-gold uppercase tracking-[0.3em] mb-4 text-center">Admin Access</p>
                  <div className="flex flex-col gap-4">
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-3 text-white hover:text-tj-gold transition-colors py-2"
                    >
                      <LayoutDashboard size={18} />
                      <span className="text-lg font-display tracking-widest">DASHBOARD</span>
                    </Link>
                    <Link
                      to="/admin/inventory"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-3 text-white hover:text-tj-gold transition-colors py-2"
                    >
                      <Car size={18} />
                      <span className="text-lg font-display tracking-widest">INVENTORY</span>
                    </Link>
                    <Link
                      to="/admin/registrations"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-3 text-white hover:text-tj-gold transition-colors py-2"
                    >
                      <ShieldCheck size={18} />
                      <span className="text-lg font-display tracking-widest">LEDGER</span>
                    </Link>
                    <Link
                      to="/admin/rentals"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-3 text-white hover:text-tj-gold transition-colors py-2"
                    >
                      <Key size={18} />
                      <span className="text-lg font-display tracking-widest">RENTALS</span>
                    </Link>
                    <button
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="flex items-center justify-center gap-3 text-red-500 hover:text-red-400 transition-colors py-2"
                    >
                      <Lock size={18} />
                      <span className="text-lg font-display tracking-widest">LOGOUT</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[9px] text-gray-400 uppercase tracking-[0.3em] mb-4 text-center">Dealer Portal</p>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-3 text-white hover:text-tj-gold transition-colors py-3 border border-gray-700 hover:border-tj-gold/50 bg-black/50"
                  >
                    <Lock size={16} />
                    <span className="text-sm font-display tracking-widest">ADMIN LOGIN</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="absolute bottom-12">
            <button
              onClick={toggleLang}
              className="text-gray-400 hover:text-tj-gold px-6 py-2 text-[10px] uppercase tracking-widest transition-colors"
            >
              {lang === 'en' ? 'ESPAÑOL' : 'ENGLISH'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-tj-darker text-gray-400 py-24 md:py-32 hairline-t relative overflow-hidden">
      {/* Background Crest Watermark (Slowly floating and pulsing) */}
      <div className="absolute top-0 right-0 pointer-events-none select-none opacity-[0.03] mix-blend-screen -mt-20 -mr-20">
        <img
          src="/GoldTripleJLogo.png"
          alt=""
          className="w-[60vw] max-w-[800px] h-auto"
          aria-hidden="true"
        />
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-16">

        {/* ABOUT & BRANDING */}
        <div className="flex flex-col items-start md:col-span-1 hairline-r pr-8">
          <div className="flex items-start gap-3 mb-8">
            <img
              src="/GoldTripleJLogo.png"
              alt="Triple J Auto Investment"
              className="w-16 h-16 object-contain"
            />
            <div className="pt-1">
              <p className="text-white font-display text-2xl tracking-[0.2em] leading-none mb-2">TRIPLE J</p>
              <p className="text-tj-gold text-[8px] uppercase tracking-ultra">Auto Investment</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-500 uppercase tracking-widest leading-loose mb-12">{t.footer.tagline}</p>

          {/* Social Media Links */}
          <div className="mb-8 w-full hairline-t pt-8">
            <p className="text-[8px] uppercase tracking-ultra text-tj-gold mb-6 block w-full">{t.footer.followUs}</p>
            <div className="flex items-start gap-4">
              <a
                href="https://www.facebook.com/thetriplejauto"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://x.com/thetriplejauto"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="X (Twitter)"
              >
                <Twitter size={16} />
              </a>
            </div>
          </div>

          <p className="text-[8px] uppercase tracking-ultra text-gray-600 mt-auto pt-8 hairline-t w-full">
            &copy; {new Date().getFullYear()} {t.footer.copyright}. {t.footer.rights}
          </p>
        </div>

        {/* LOCATION & CONTACT */}
        <div className="flex flex-col items-start hairline-r pr-8">
          <h3 className="text-white font-bold tracking-ultra text-[9px] uppercase mb-8 hairline-b border-white/10 pb-4 w-full">{t.footer.location.toUpperCase()}</h3>
          <div className="mb-8 w-full">
            <button
              onClick={openSmartMap}
              className="not-italic text-[11px] uppercase tracking-widest text-gray-500 leading-loose text-left hover:text-white transition-colors group flex items-start gap-4"
            >
              <MapPin size={12} className="text-tj-gold mt-1 flex-shrink-0" />
              <div>
                <span className="block">{t.footer.address}</span>
                <span className="block text-gray-600">{t.footer.city}</span>
              </div>
            </button>
          </div>
          <div className="space-y-6 text-[11px] uppercase tracking-widest text-gray-500 w-full hairline-t border-white/10 pt-8">
            <a href="tel:+18324009760" className="flex items-start gap-4 hover:text-white transition-colors">
              <Phone size={12} className="text-tj-gold mt-1 flex-shrink-0" />
              <span>{t.footer.phone}</span>
            </a>
            <div className="flex items-start gap-4">
              <Clock size={12} className="text-tj-gold mt-1 flex-shrink-0" />
              <div>
                <p className="mb-1">{t.footer.hoursDetail}</p>
                <p className="text-gray-600">{t.footer.closed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* COMPLIANCE & LEGAL */}
        <div className="flex flex-col items-start hairline-r pr-8">
          <h3 className="text-white font-bold tracking-ultra text-[9px] uppercase mb-8 hairline-b border-white/10 pb-4 w-full flex items-center justify-between">
            <span>{t.footer.legal.toUpperCase()}</span>
            <ShieldCheck size={12} className="text-tj-gold" />
          </h3>
          <div className="mb-8 w-full">
            <div className="flex justify-between items-start hairline-b border-white/10 pb-4 mb-4">
              <span className="text-[9px] uppercase tracking-ultra text-gray-600">{t.footer.dealerLicense}</span>
              <span className="font-mono text-tj-gold text-[10px]">P171632</span>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <Link to="/legal/dmv" className="link-brutal text-gray-500 self-start">Texas DMV</Link>
            <Link to="/legal/privacy" className="link-brutal text-gray-500 self-start">{t.footer.privacy}</Link>
            <Link to="/legal/terms" className="link-brutal text-gray-500 self-start">{t.footer.terms}</Link>
            <Link to="/legal/arbitration" className="link-brutal text-gray-500 self-start">Arbitration</Link>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div className="flex flex-col items-start">
          <h3 className="text-white font-bold tracking-ultra text-[9px] uppercase mb-8 hairline-b border-white/10 pb-4 w-full">{t.footer.quickLinks.toUpperCase()}</h3>
          <div className="flex flex-col gap-5 w-full">
            <Link to="/inventory" className="link-brutal self-start text-gray-400">{t.nav.inventory}</Link>
            <Link to="/about" className="link-brutal self-start text-gray-400">{t.nav.about}</Link>
            <Link to="/services" className="link-brutal self-start text-gray-400">{t.nav.services}</Link>
            <Link to="/vin" className="link-brutal self-start text-gray-400">{t.vinLookup.title}</Link>
            <Link to="/contact" className="link-brutal self-start text-gray-400">{t.footer.contact}</Link>

            <div className="hairline-t border-white/10 pt-5 mt-3 w-full">
              <Link to="/login" className="link-brutal self-start text-tj-gold">{t.nav.login}</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user } = useStore();
  if (!user?.isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// AnimatePresence is already imported at top from 'framer-motion'

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
          <div className="text-center max-w-2xl">
            <img
              src="/GoldTripleJLogo.png"
              alt="Triple J Auto Investment"
              className="w-16 h-16 mx-auto mb-6 opacity-50"
            />
            <h1 className="font-display text-3xl text-tj-gold mb-4">Something Went Wrong</h1>
            <p className="text-gray-400 mb-2">
              We're sorry, but this page encountered an error.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              Please reload the page or contact us at (832) 400-9760.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-tj-gold text-black px-6 py-3 font-bold uppercase tracking-widest hover:bg-white transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent = () => {
  const location = useLocation();
  const { t } = useLanguage();

  // Phase 16: Track page views on every route change
  useSessionTracking();

  // Phase 16: Capture UTM params from landing URL before SPA navigation strips them
  useEffect(() => {
    captureInitialUtm();
  }, []);

  return (
    <SmoothScroll>
    <div className="min-h-screen flex flex-col bg-tj-green text-gray-200 font-sans">
      {/* Skip to content - hidden off-screen, slides in on keyboard focus */}
      <a
        href="#main-content"
        style={{ position: 'absolute', left: '-9999px', top: 'auto', width: '1px', height: '1px', overflow: 'hidden' }}
        onFocus={(e) => { e.currentTarget.style.cssText = 'position:fixed;top:16px;left:16px;z-index:99999;background:#D4AF37;color:#000;padding:12px 24px;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.3em;outline:2px solid #fff;box-shadow:0 4px 20px rgba(0,0,0,0.5);width:auto;height:auto;overflow:visible;'; }}
        onBlur={(e) => { e.currentTarget.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;'; }}
      >
        {t.polish.skipToContent}
      </a>
      <OfflineBanner />
      <BrowserCompatibilityCheck />
      <Navbar />
      <ErrorBoundary>
        {/* Top padding matches navbar height (h-32 = 128px = pt-32) plus buffer */}
        <main id="main-content" className="flex-grow pt-36">
          <ConnectionErrorBanner />
          {/* Global Page Transition Wrapper */}
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoader />}>
              <div key={location.pathname} className="min-h-full origin-top">
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/vehicles/:slug" element={<VehicleDetail />} />
                  <Route path="/vin" element={<VinLookup />} />
                  <Route path="/vin/free-check" element={<VinLookup />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/finance" element={<Finance />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/policies" element={<Policies />} />
                  <Route path="/terms" element={<Policies />} />
                  <Route path="/payment-options" element={<PaymentOptions />} />
                  <Route path="/commercial-wholesale" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/legal/:section" element={<Legal />} />
                  {/* Customer tracking - token-based access (new format: /track/{orderId}-{token}) */}
                  <Route path="/track/:accessKey" element={<CustomerStatusTracker />} />
                  {/* Legacy order ID lookup - keep for admin testing */}
                  <Route path="/track" element={<RegistrationTracker />} />

                  {/* Customer Portal - phone OTP auth (NOT admin /login) */}
                  <Route path="/customer/login" element={<CustomerLogin />} />
                  <Route path="/customer/dashboard" element={<CustomerDashboard />} />

                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
                  <Route path="/admin/registrations" element={<ProtectedRoute><AdminRegistrations /></ProtectedRoute>} />
                  <Route path="/admin/rentals" element={<ProtectedRoute><AdminRentals /></ProtectedRoute>} />
                  <Route path="/admin/plates" element={<ProtectedRoute><AdminPlates /></ProtectedRoute>} />

                  {/* 404 Catch-All */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </Suspense>
          </AnimatePresence>
        </main>
      </ErrorBoundary>
      <Footer />
      <NoiseOverlay opacity={0.03} />
    </div>
    </SmoothScroll>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <StoreProvider>
        <Router>
          <ScrollToTop />
          <HashRedirect />
          <AppContent />
        </Router>
      </StoreProvider>
    </LanguageProvider>
  );
}
