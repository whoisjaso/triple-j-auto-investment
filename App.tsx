
import React, { useState, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { Menu, X, LayoutDashboard, Lock, ShieldCheck, MapPin, FileText, Car, Database, Globe } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

// Critical Pages (Eagerly Loaded)
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import Contact from './pages/Contact';

// Non-Critical Pages (Lazy Loaded)
const VinLookup = lazy(() => import('./pages/VinLookup'));
const Services = lazy(() => import('./pages/Services'));
const Finance = lazy(() => import('./pages/Finance'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Policies = lazy(() => import('./pages/Policies'));
const PaymentOptions = lazy(() => import('./pages/PaymentOptions'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/Login'));
const About = lazy(() => import('./pages/About'));
const Legal = lazy(() => import('./pages/Legal'));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory'));
const AdminRegistrations = lazy(() => import('./pages/admin/Registrations'));

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
      <span className={`absolute bottom-2 w-1 h-1 bg-tj-gold rotate-45 transition-all duration-500 ${location.pathname === to ? 'scale-100 opacity-100' : 'scale-0 opacity-0 group-hover:scale-75 group-hover:opacity-50'}`}></span>
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
              <NavLink to="/vin" label="Intel" />
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
      <div
        className={`fixed inset-0 z-[60] bg-[#020202] flex flex-col justify-center items-center md:hidden transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] transform-gpu ${isOpen ? 'opacity-100 visible clip-circle-full' : 'opacity-0 invisible pointer-events-none'}`}
        style={{ clipPath: isOpen ? 'circle(150% at 90% 5%)' : 'circle(0% at 90% 5%)' }}
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tj-gold/5 via-black to-black pointer-events-none animate-subtle-zoom"></div>

        <div className="flex flex-col items-center gap-10 z-10 w-full px-6 perspective-1000">
          {[
            { to: "/", label: t.nav.home.toUpperCase(), sub: "ORIGIN POINT", delay: 100 },
            { to: "/inventory", label: t.nav.inventory.toUpperCase(), sub: "ACQUIRE ASSETS", delay: 150 },
            { to: "/vin", label: "INTEL", sub: "DEEP DATA ANALYSIS", delay: 200 },
            { to: "/about", label: t.nav.about.toUpperCase(), sub: "THE PHILOSOPHY", delay: 250 }
          ].map((link, idx) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={`group relative text-center transition-all duration-[800ms] ease-[cubic-bezier(0.215,0.61,0.355,1)] transform-gpu`}
              style={{
                transitionDelay: `${isOpen ? link.delay : 0}ms`,
                transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                opacity: isOpen ? 1 : 0,
                filter: isOpen ? 'blur(0px)' : 'blur(10px)'
              }}
            >
              <span className="block font-display text-5xl text-white tracking-[0.05em] group-hover:text-tj-gold transition-colors duration-500 font-bold mix-blend-difference leading-none">
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        <div className={`absolute bottom-16 transition-all duration-1000 delay-[400ms] ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <button
            onClick={toggleLang}
            className="mb-8 block mx-auto text-tj-gold border border-tj-gold/30 px-6 py-2 rounded-full text-[10px] uppercase tracking-widest"
          >
            Language: {lang === 'en' ? 'ENGLISH' : 'ESPAÑOL'}
          </button>
        </div>
      </div>
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

import { AnimatePresence } from 'framer-motion';

const AppContent = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-tj-green text-gray-200 font-sans">
      <Navbar />
      {/* Adjusted top padding since crest is gone */}
      <main className="flex-grow pt-32">
        {/* Global Page Transition Wrapper */}
        <AnimatePresence mode="wait">
          <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-tj-gold border-t-transparent rounded-full animate-spin"></div></div>}>
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
