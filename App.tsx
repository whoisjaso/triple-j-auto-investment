
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { Menu, X, LayoutDashboard, Lock, ShieldCheck, MapPin, FileText, Car, Database, Globe } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import BrowserCompatibilityCheck from './components/BrowserCompatibilityCheck';
import { CrestLoader } from './components/CrestLoader';

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
          <div className="min-h-screen flex items-center justify-center bg-tj-green text-white p-8">
            <div className="text-center max-w-2xl">
              <h1 className="font-display text-3xl text-tj-gold mb-4">Error Loading {pageName}</h1>
              <p className="text-gray-300 mb-6">
                Failed to load the {pageName} page. Please refresh the page or contact support.
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

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazyWithErrorHandling(() => import('./pages/admin/Dashboard'), 'Admin Dashboard');
const AdminInventory = lazyWithErrorHandling(() => import('./pages/admin/Inventory'), 'Admin Inventory');
const AdminRegistrations = lazyWithErrorHandling(() => import('./pages/admin/Registrations'), 'Admin Registrations');

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

  const NavLink = ({ to, label }: { to: string, label: string }) => (
    <Link
      to={to}
      className={`group relative flex flex-col items-center px-6 py-4 transition-all duration-700 ${location.pathname === to ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
      onClick={() => setIsOpen(false)}
    >
      <span className={`text-[10px] uppercase tracking-[0.3em] font-display ${location.pathname === to ? 'text-tj-gold' : 'text-white'} group-hover:text-tj-gold transition-colors`}>
        {label}
      </span>
      {/* Clean, sophisticated active indicator - Underline instead of floating dot */}
      <span className={`absolute bottom-3 w-full h-[1px] bg-tj-gold transition-all duration-500 ${location.pathname === to ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-50'}`}></span>
    </Link>
  );

  return (
    <nav className="fixed w-full z-50">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-transparent pointer-events-none h-48 transition-opacity duration-500"></div>

      <div className="border-b border-white/5 backdrop-blur-[2px] relative z-10">
        <div className="max-w-[1920px] mx-auto px-6 md:px-12">
          <div className="relative flex justify-between items-center h-24 md:h-32">

            {/* Left Axis: Operational */}
            <div className="hidden md:flex flex-1 items-center justify-start space-x-10 pl-12">
              <NavLink to="/inventory" label={t.nav.inventory} />
              <NavLink to="/vin" label="INTEL" />
            </div>

            {/* CENTER AXIS: OFFICIAL LOGO */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]">
              <button onClick={handleLogoClick} className="group relative flex flex-col items-center justify-center cursor-pointer bg-transparent border-none p-0">
                <img
                  src="/GoldTripleJLogo.png"
                  alt="Triple J Auto Investment Logo"
                  className="w-20 h-20 md:w-24 md:h-24 object-contain transition-transform duration-700 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                />
              </button>
            </div>

            {/* Right Axis: Philosophical */}
            <div className="hidden md:flex flex-1 items-center justify-end space-x-8 pr-12">
              {/* Language Toggle */}
              <button
                onClick={toggleLang}
                className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400 hover:text-white transition-colors mr-4"
              >
                <Globe size={12} />
                <span>{lang === 'en' ? 'ESPAÑOL' : 'ENGLISH'}</span>
              </button>

              {!user ? (
                <>
                  <NavLink to="/about" label={t.nav.about} />
                  <Link to="/login" className="opacity-50 hover:opacity-100 hover:text-tj-gold transition-all p-2" aria-label="Restricted Access">
                    <Lock size={12} />
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-8 border-l border-white/10 pl-8">
                  <Link to="/admin/dashboard" className={`flex items-center gap-2 text-[10px] uppercase tracking-widest hover:text-tj-gold transition-colors ${location.pathname.includes('dashboard') ? 'text-tj-gold' : 'text-gray-400'}`}>
                    <LayoutDashboard size={14} /> Command
                  </Link>
                  <Link to="/admin/inventory" className={`flex items-center gap-2 text-[10px] uppercase tracking-widest hover:text-tj-gold transition-colors ${location.pathname.includes('inventory') ? 'text-tj-gold' : 'text-gray-400'}`}>
                    <Car size={14} /> Assets
                  </Link>
                  <button onClick={logout} className="text-[10px] uppercase tracking-widest text-red-900 hover:text-red-500 transition-colors ml-4">Logout</button>
                </div>
              )}
            </div>

            {/* Mobile Trigger */}
            <div className="flex flex-1 justify-end md:hidden z-[70] pr-2 items-center gap-4">
              <button
                onClick={toggleLang}
                className="text-tj-gold p-2"
                aria-label={lang === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
              >
                <span className="text-[10px] font-bold">{lang === 'en' ? 'ES' : 'EN'}</span>
              </button>

              <button
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

      {/* --- PSYCHOLOGICAL PORTAL (MOBILE MENU) --- */}
      {/* Enhanced Mobile Menu with Solid Black Background & Staggered Slide Animations */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[60] bg-black flex flex-col justify-center items-center md:hidden overflow-hidden"
          >
            {/* Subtle animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-tj-gold/5 via-transparent to-tj-gold/5 pointer-events-none"></div>

            {/* Decorative corner accents */}
            <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-tj-gold/30"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-tj-gold/30"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-tj-gold/30"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-tj-gold/30"></div>

            <motion.div
              className="flex flex-col items-center gap-8 z-10 w-full px-8"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
                hidden: { transition: { staggerChildren: 0.05, staggerDirection: -1 } }
              }}
            >
              {/* Public Navigation Links */}
              {[
                { to: "/", label: t.nav.home.toUpperCase(), sub: "ORIGIN POINT" },
                { to: "/inventory", label: t.nav.inventory.toUpperCase(), sub: "ACQUIRE ASSETS" },
                { to: "/vin", label: "INTEL", sub: "DEEP DATA ANALYSIS" },
                { to: "/about", label: t.nav.about.toUpperCase(), sub: "THE PHILOSOPHY" }
              ].map((link, index) => (
                <motion.div
                  key={link.to}
                  variants={{
                    hidden: { opacity: 0, x: -40, y: 20 },
                    visible: {
                      opacity: 1,
                      x: 0,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 80,
                        damping: 12,
                        duration: 0.6
                      }
                    }
                  }}
                  className="w-full text-center group"
                >
                  <Link
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className="block font-display text-3xl text-white tracking-[0.15em] hover:text-tj-gold transition-all duration-300 hover:tracking-[0.2em]"
                  >
                    <motion.span
                      className="inline-block"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {link.label}
                    </motion.span>
                  </Link>
                  <motion.p
                    className="text-[9px] text-gray-600 uppercase tracking-[0.3em] mt-1 group-hover:text-tj-gold/60 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    {link.sub}
                  </motion.p>
                </motion.div>
              ))}

              {/* Admin Links - Only shown when logged in */}
              {user && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { delay: 0.5 } }
                  }}
                  className="w-full border-t border-tj-gold/30 pt-6 mt-2"
                >
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
                    <button
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="flex items-center justify-center gap-3 text-red-500 hover:text-red-400 transition-colors py-2"
                    >
                      <Lock size={18} />
                      <span className="text-lg font-display tracking-widest">LOGOUT</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* AI Voice Agent CTA in Mobile Menu */}
            <motion.a
              href="tel:+18324009760"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              className="absolute bottom-28 flex items-center gap-3 text-tj-gold border border-tj-gold px-6 py-3 hover:bg-tj-gold hover:text-black transition-colors"
            >
              <span className="text-[10px] uppercase tracking-widest font-bold">Speak to AI Agent</span>
            </motion.a>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-12"
            >
              <button
                onClick={toggleLang}
                className="text-gray-500 hover:text-tj-gold px-6 py-2 text-[10px] uppercase tracking-widest transition-colors"
              >
                {lang === 'en' ? 'ESPAÑOL' : 'ENGLISH'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-black text-gray-600 py-20 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[15vw] font-display font-bold text-white/[0.02] pointer-events-none whitespace-nowrap select-none leading-none">
        TRIPLE J
      </div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-24">

        {/* HEADQUARTERS */}
        <div className="flex flex-col items-start">
          <h3 className="text-tj-gold font-bold tracking-[0.2em] text-[10px] uppercase mb-6 border-b border-tj-gold/20 pb-2 w-full">Headquarters</h3>
          <div className="mb-6">
            <p className="text-white font-display text-xl tracking-wider mb-4">TRIPLE J <br /><span className="text-gray-500 text-sm">AUTO INVESTMENT</span></p>
            <p className="text-xs text-gray-500 italic mb-4">{t.footer.tagline}</p>
            <button
              onClick={openSmartMap}
              className="not-italic text-sm text-gray-400 leading-loose text-left hover:text-tj-gold transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-tj-gold group-hover:animate-bounce" />
                <span>8774 Almeda Genoa Road</span>
              </div>
              <span className="pl-6 block">Houston, Texas 77075</span>
            </button>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-gray-600 mt-auto">
            © {new Date().getFullYear()} Sovereign Entity. {t.footer.rights}
          </p>
        </div>

        {/* COMPLIANCE */}
        <div className="flex flex-col items-start">
          <h3 className="text-tj-gold font-bold tracking-[0.2em] text-[10px] uppercase mb-6 border-b border-tj-gold/20 pb-2 w-full flex items-center gap-2">
            <ShieldCheck size={14} /> {t.footer.legal.toUpperCase()}
          </h3>
          <div className="mb-6 w-full">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3">
              <span className="text-[10px] uppercase tracking-widest text-gray-500">TX Dealer License</span>
              <span className="font-mono text-tj-gold text-sm">P171632</span>
            </div>
          </div>
          <ul className="space-y-3 text-[10px] uppercase tracking-widest text-gray-500 w-full">
            <li><Link to="/legal/dmv" className="hover:text-tj-gold transition-colors block py-1">Texas DMV</Link></li>
            <li><Link to="/legal/privacy" className="hover:text-tj-gold transition-colors block py-1">{t.footer.privacy}</Link></li>
            <li><Link to="/legal/terms" className="hover:text-tj-gold transition-colors block py-1">{t.footer.terms}</Link></li>
            <li><Link to="/legal/arbitration" className="hover:text-tj-gold transition-colors block py-1">Arbitration</Link></li>
          </ul>
        </div>

        {/* SYSTEM LINKS */}
        <div className="flex flex-col items-start">
          <h3 className="text-tj-gold font-bold tracking-[0.2em] text-[10px] uppercase mb-6 border-b border-tj-gold/20 pb-2 w-full">{t.footer.quickLinks.toUpperCase()}</h3>
          <ul className="space-y-4 text-[10px] uppercase tracking-widest w-full">
            <li><Link to="/inventory" className="hover:text-white transition-colors block hover:translate-x-2 transition-transform duration-300">{t.nav.inventory}</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors block hover:translate-x-2 transition-transform duration-300">{t.nav.about}</Link></li>
            <li><Link to="/vin" className="hover:text-white transition-colors block hover:translate-x-2 transition-transform duration-300">Intel</Link></li>
            <li className="pt-4 border-t border-white/5 mt-4"><Link to="/login" className="hover:text-white transition-colors text-gray-600 flex items-center gap-2"><Lock size={10} /> {t.nav.login}</Link></li>
          </ul>
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
        <div className="min-h-screen flex items-center justify-center bg-tj-green text-white p-8">
          <div className="text-center max-w-2xl">
            <h1 className="font-display text-3xl text-tj-gold mb-4">Error Loading Page</h1>
            <p className="text-gray-300 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
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

  return (
    <div className="min-h-screen flex flex-col bg-tj-green text-gray-200 font-sans">
      <ErrorBoundary>
        <BrowserCompatibilityCheck />
      </ErrorBoundary>
      <Navbar />
      {/* Adjusted top padding since crest is gone */}
      <main className="flex-grow pt-32">
        {/* Global Page Transition Wrapper */}
        <AnimatePresence mode="wait">
          <Suspense fallback={<CrestLoader />}>
            <div key={location.pathname} className="min-h-full origin-top">
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/inventory" element={<Inventory />} />
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

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
                <Route path="/admin/registrations" element={<ProtectedRoute><AdminRegistrations /></ProtectedRoute>} />

                {/* 404 Catch-All */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Suspense>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <StoreProvider>
        <Router>
          <AppContent />
        </Router>
      </StoreProvider>
    </LanguageProvider>
  );
}
