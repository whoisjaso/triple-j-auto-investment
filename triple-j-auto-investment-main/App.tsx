import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { Menu, X, ShieldCheck, MapPin, Phone, Clock, Facebook, Twitter } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import BrowserCompatibilityCheck from './components/BrowserCompatibilityCheck';
import { ScrollToTop } from './components/ScrollToTop';
import { PageLoader } from './components/PageLoader';
import { OfflineBanner } from './components/OfflineBanner';
import { ConnectionErrorBanner } from './components/ConnectionErrorBanner';
import { useSessionTracking } from './hooks/useSessionTracking';
import { captureInitialUtm } from './services/attributionService';
import { SplashScreen } from './components/SplashScreen';
import { SmoothScroll } from './components/luxury';

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
      return {
        default: () => (
          <div className="min-h-screen flex items-center justify-center bg-tj-green text-tj-zinc100 p-8">
            <div className="text-center max-w-2xl">
              <img
                src="/GoldTripleJLogo.png"
                alt="Triple J Auto Investment"
                className="w-16 h-16 mx-auto mb-6 opacity-50"
              />
              <h1 className="font-serif text-3xl text-tj-gold mb-4">Error Loading {pageName}</h1>
              <p className="text-tj-zinc400 mb-2">
                Failed to load the {pageName} page.
              </p>
              <p className="text-tj-zinc400 text-sm mb-8">
                Please refresh the page or call us at (832) 400-9760.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-tj-gold text-tj-green px-6 py-3 font-bold uppercase tracking-widest hover:bg-tj-goldMuted transition-colors"
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
const OwnerPortal = lazyWithErrorHandling(() => import('./pages/OwnerPortal'), 'Owner Portal');
const ReferralLanding = lazyWithErrorHandling(() => import('./pages/ReferralLanding'), 'Referral');

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazyWithErrorHandling(() => import('./pages/admin/Dashboard'), 'Admin Dashboard');
const AdminInventory = lazyWithErrorHandling(() => import('./pages/admin/Inventory'), 'Admin Inventory');
const AdminRegistrations = lazyWithErrorHandling(() => import('./pages/admin/Registrations'), 'Admin Registrations');
const AdminRentals = lazyWithErrorHandling(() => import('./pages/admin/Rentals'), 'Admin Rentals');
const AdminPlates = lazyWithErrorHandling(() => import('./pages/admin/Plates'), 'Admin Plates');
const AdminTemplates = lazyWithErrorHandling(() => import('./pages/admin/Templates'), 'Templates');
const CommandCenter = lazyWithErrorHandling(() => import('./pages/admin/CommandCenter'), 'Command Center');

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

const HashRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      const path = window.location.hash.slice(1);
      navigate(path, { replace: true });
    }
  }, [navigate]);
  return null;
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isWhiteSection, setIsWhiteSection] = useState(false);
  
  const { user, logout } = useStore();
  const { lang, toggleLang, t } = useLanguage();
  const nav = t.home.luxuryNav;
  const location = useLocation();
  const navigate = useNavigate();
  const menuToggleRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      // The Maybach (250vh) + Key (250vh) + brand reveal section. White navbar throughout.
      if (location.pathname === '/') {
        setIsWhiteSection(window.scrollY < window.innerHeight * 6);
      } else {
        setIsWhiteSection(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // init
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
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

  useEffect(() => {
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

  const NavLink = ({ to, label }: { to: string, label: string }) => {
    const isActive = location.pathname === to;
    
    // Dynamic text colors based on background
    const textColor = isWhiteSection 
      ? (isActive ? 'text-tj-gold' : 'text-[#0e1b16] hover:text-tj-gold')
      : (isActive ? 'text-tj-gold' : 'text-tj-zinc400 hover:text-tj-zinc100');
      
    return (
      <Link
        to={to}
        className={`relative inline-block text-[11px] font-medium uppercase tracking-[0.2em] transition-colors duration-500 pb-1 group ${textColor}`}
        onClick={() => setIsOpen(false)}
      >
        {label}
        <span className={`absolute bottom-0 left-0 w-full h-[1px] bg-tj-gold transform origin-left transition-transform duration-300 ease-out ${isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100'}`}></span>
      </Link>
    );
  };

  const navClasses = isWhiteSection
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-1000 ease-out bg-[#F7F7F7]`
    : `fixed top-0 left-0 right-0 z-50 transition-all duration-1000 ease-out ${scrolled ? 'bg-black/95 backdrop-blur-xl' : 'bg-black'}`;

  return (
    <nav className={navClasses}>
      <div className="w-full px-6 md:px-10 lg:px-16">
        <div className="relative flex items-center justify-between h-16 md:h-20">

          {/* Left nav group */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            <NavLink to="/inventory" label={nav.sovereignAssets} />
            <NavLink to="/vin" label={nav.authentication} />
            <NavLink to="/about" label={nav.philosophy} />
            {user && (
              <>
                <span className={`w-px h-4 ${isWhiteSection ? 'bg-[#0e1b16]/10' : 'bg-tj-gold/15'}`}></span>
                <NavLink to="/admin/dashboard" label={nav.dashboard} />
              </>
            )}
          </div>

          {/* Center logo — hidden on home page */}
          {location.pathname !== '/' && (
            <button
              onClick={handleLogoClick}
              className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 focus:outline-none group"
              aria-label="Home"
            >
              <img
                src="/GoldTripleJLogo.png"
                alt="Triple J"
                className="w-9 h-9 object-contain opacity-50 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110"
              />
            </button>
          )}

          {/* Right nav group */}
          <div className="hidden md:flex items-center gap-8 lg:gap-10">
            <a href="tel:+18324009760" className={`text-[11px] uppercase tracking-[0.2em] transition-colors font-medium ${isWhiteSection ? 'text-[#0e1b16] hover:text-tj-gold' : 'text-tj-zinc400 hover:text-tj-gold'}`}>{nav.concierge}</a>
            <button onClick={toggleLang} className={`text-[11px] uppercase tracking-[0.2em] transition-colors font-medium ${isWhiteSection ? 'text-[#0e1b16] hover:text-tj-gold' : 'text-tj-zinc400 hover:text-tj-zinc100'}`}>
              {lang === 'en' ? 'ES' : 'EN'}
            </button>
            {!user ? (
              <Link to="/login" className={`text-[11px] uppercase tracking-[0.2em] transition-colors font-medium ${isWhiteSection ? 'text-[#0e1b16] hover:text-tj-gold' : 'text-tj-zinc400 hover:text-tj-zinc100'}`}>{nav.portal}</Link>
            ) : (
              <button onClick={logout} className={`text-[11px] uppercase tracking-[0.2em] transition-colors font-medium ${isWhiteSection ? 'text-tj-gold hover:text-[#0e1b16]' : 'text-tj-gold hover:text-tj-zinc100'}`}>{nav.exit}</button>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-5 md:hidden w-full justify-between">
            <button onClick={toggleLang} className={`p-2 text-[11px] font-medium tracking-widest uppercase transition-colors ${isWhiteSection ? 'text-[#0e1b16] hover:text-tj-gold' : 'text-tj-zinc400 hover:text-tj-zinc100'}`}>
              {lang === 'en' ? 'ES' : 'EN'}
            </button>
            <button onClick={handleLogoClick} className="focus:outline-none group">
              <img src="/GoldTripleJLogo.png" alt="Triple J" className="w-8 h-8 object-contain opacity-60 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
            </button>
            <button ref={menuToggleRef} onClick={() => setIsOpen(!isOpen)} className={`p-2 transition-colors ${isWhiteSection ? 'text-[#0e1b16] hover:text-tj-gold' : 'text-tj-zinc400 hover:text-tj-zinc100'}`}>
              {isOpen ? <X size={24} strokeWidth={1} /> : <Menu size={24} strokeWidth={1} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 w-screen h-screen flex flex-col justify-center items-center md:hidden bg-tj-green/95 backdrop-blur-2xl z-[99999]"
          >
            <button onClick={() => setIsOpen(false)} className="absolute top-8 right-6 text-tj-zinc400 hover:text-tj-zinc100 transition-colors p-2">
              <X size={28} strokeWidth={1} />
            </button>
            <img src="/GoldTripleJLogo.png" alt="Crest" className="w-16 h-16 mb-12 opacity-60 gold-glow" />
            <div className="flex flex-col items-center gap-10 w-full px-8">
              {[
                { to: "/", label: t.nav.home },
                { to: "/inventory", label: nav.sovereignAssets },
                { to: "/vin", label: nav.authentication },
                { to: "/about", label: nav.philosophy },
                { to: "/contact", label: nav.concierge }
              ].map((link, idx) => (
                <motion.div 
                  key={link.to} 
                  className="w-full text-center"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 + 0.2 }}
                >
                  <Link to={link.to} onClick={() => setIsOpen(false)} className="block font-serif text-3xl text-tj-zinc100 hover:text-tj-gold transition-colors duration-500">
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {user && (
                 <div className="w-full border-t border-tj-gold/10 pt-10 mt-4 text-center">
                    <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="block text-sm uppercase tracking-[0.3em] text-tj-gold hover:text-tj-zinc100 transition-colors mb-6">{nav.dashboard}</Link>
                    <button onClick={() => { logout(); setIsOpen(false); }} className="text-xs uppercase tracking-[0.3em] text-red-900/50 hover:text-red-500 transition-colors">{nav.exitPortal}</button>
                 </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  return (
    <footer className="bg-black text-tj-zinc500 py-24 md:py-32 border-t border-tj-gold/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 pointer-events-none select-none opacity-[0.02] mix-blend-screen -mt-20 -mr-20">
        <img src="/GoldTripleJLogo.png" alt="" className="w-[60vw] max-w-[800px] h-auto" aria-hidden="true" />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-8 lg:px-16 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-24">

        <div className="flex flex-col items-start md:col-span-1 border-r border-tj-gold/10 pr-12">
          <div className="flex items-center gap-4 mb-10">
            <img src="/GoldTripleJLogo.png" alt="Triple J Auto Investment" className="w-12 h-12 object-contain opacity-80 hover:opacity-100 transition-all duration-700 gold-glow" />
            <div className="pt-1">
              <p className="text-tj-zinc100 font-serif text-xl tracking-wide leading-none mb-1">TRIPLE J</p>
              <p className="text-tj-gold text-[10px] uppercase tracking-[0.3em] label-small-caps">Auto Investment</p>
            </div>
          </div>
          <p className="text-[12px] text-tj-zinc400 leading-[1.8] mb-12">
             Curators of mechanical excellence and understated luxury.
          </p>

          <div className="mb-8 w-full border-t border-tj-gold/10 pt-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-tj-zinc500 mb-6 block w-full label-small-caps">Connect</p>
            <div className="flex items-center gap-6">
              <a href="https://www.facebook.com/thetriplejauto" target="_blank" rel="noopener noreferrer" className="text-tj-zinc400 hover:text-tj-gold transition-colors">
                <Facebook size={16} strokeWidth={1.5} />
              </a>
              <a href="https://x.com/thetriplejauto" target="_blank" rel="noopener noreferrer" className="text-tj-zinc400 hover:text-tj-gold transition-colors">
                <Twitter size={16} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-[0.2em] text-tj-zinc500 mt-auto pt-8 border-t border-tj-gold/10 w-full">
            &copy; {new Date().getFullYear()} Triple J. All rights reserved.
          </p>
        </div>

        <div className="flex flex-col items-start md:border-r border-tj-gold/10 pr-12">
          <h3 className="text-tj-zinc100 font-medium tracking-[0.2em] text-[11px] uppercase mb-8 border-b border-tj-gold/10 pb-4 w-full label-small-caps">Concierge</h3>
          <div className="mb-10 w-full">
            <button onClick={openSmartMap} className="not-italic text-[12px] leading-[1.8] text-left hover:text-tj-zinc100 transition-colors group flex items-start gap-4 text-tj-zinc400">
              <MapPin size={16} strokeWidth={1} className="text-tj-gold mt-1 flex-shrink-0" />
              <div>
                <span className="block">8774 Almeda Genoa Rd</span>
                <span className="block text-tj-zinc500">Houston, TX 77075</span>
              </div>
            </button>
          </div>
          <div className="space-y-8 text-[12px] text-tj-zinc400 w-full border-t border-tj-gold/10 pt-8">
            <a href="tel:+18324009760" className="flex items-start gap-4 hover:text-tj-zinc100 transition-colors">
              <Phone size={16} strokeWidth={1} className="text-tj-gold mt-1 flex-shrink-0" />
              <span>(832) 400-9760</span>
            </a>
            <div className="flex items-start gap-4">
              <Clock size={16} strokeWidth={1} className="text-tj-gold mt-1 flex-shrink-0" />
              <div>
                <p className="mb-1">Mon-Sat: 10:00 - 18:00</p>
                <p className="text-tj-zinc500">Sunday: By Appointment</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start md:border-r border-tj-gold/10 pr-12">
          <h3 className="text-tj-zinc100 font-medium tracking-[0.2em] text-[11px] uppercase mb-8 border-b border-tj-gold/10 pb-4 w-full flex items-center justify-between label-small-caps">
            <span>Compliance</span>
            <ShieldCheck size={14} strokeWidth={1} className="text-tj-gold" />
          </h3>
          <div className="mb-10 w-full">
            <div className="flex justify-between items-start border-b border-tj-gold/10 pb-4 mb-4">
              <span className="text-[11px] uppercase tracking-[0.2em] text-tj-zinc400">Dealer License</span>
              <span className="font-mono text-tj-gold text-[12px]">P171632</span>
            </div>
          </div>
          <div className="flex flex-col gap-6 w-full">
            <Link to="/legal/dmv" className="text-[12px] text-tj-zinc400 hover:text-tj-gold transition-colors">Texas DMV</Link>
            <Link to="/legal/privacy" className="text-[12px] text-tj-zinc400 hover:text-tj-gold transition-colors">Privacy Policy</Link>
            <Link to="/legal/terms" className="text-[12px] text-tj-zinc400 hover:text-tj-gold transition-colors">Terms of Service</Link>
            <Link to="/legal/arbitration" className="text-[12px] text-tj-zinc400 hover:text-tj-gold transition-colors">Arbitration</Link>
          </div>
        </div>

        <div className="flex flex-col items-start">
          <h3 className="text-tj-zinc100 font-medium tracking-[0.2em] text-[11px] uppercase mb-8 border-b border-tj-gold/10 pb-4 w-full label-small-caps">Sovereign Assets</h3>
          <div className="flex flex-col gap-6 w-full">
            <Link to="/inventory" className="text-[12px] text-tj-zinc400 hover:text-tj-gold transition-colors">The Collection</Link>
            <Link to="/about" className="text-[12px] text-tj-zinc400 hover:text-tj-gold transition-colors">Our Philosophy</Link>
            <Link to="/services" className="text-[12px] text-tj-zinc400 hover:text-tj-gold transition-colors">Bespoke Services</Link>
            <Link to="/vin" className="text-[12px] text-tj-zinc400 hover:text-tj-gold transition-colors">Authentication</Link>

            <div className="border-t border-tj-gold/10 pt-8 mt-4 w-full">
              <Link to="/login" className="text-[11px] uppercase tracking-[0.2em] text-tj-goldMuted hover:text-tj-gold transition-colors">Client Portal</Link>
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
        <div className="min-h-screen flex items-center justify-center bg-tj-green text-tj-zinc100 p-8">
          <div className="text-center max-w-2xl">
            <img src="/GoldTripleJLogo.png" alt="Triple J Auto Investment" className="w-16 h-16 mx-auto mb-6 opacity-50" />
            <h1 className="font-serif text-3xl text-tj-gold mb-4">Something Went Wrong</h1>
            <p className="text-tj-zinc400 mb-2">We're sorry, but this page encountered an error.</p>
            <p className="text-tj-zinc400 text-sm mb-8">Please reload the page or contact us at (832) 400-9760.</p>
            <button onClick={() => window.location.reload()} className="bg-tj-gold text-tj-green px-6 py-3 font-bold uppercase tracking-widest hover:bg-tj-goldMuted transition-colors">Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const location = useLocation();

  useSessionTracking();

  useEffect(() => {
    captureInitialUtm();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black text-tj-zinc400 font-sans relative">
      <OfflineBanner />
      <BrowserCompatibilityCheck />
      <Navbar />
      <ErrorBoundary>
        <main id="main-content" className="flex-grow pt-24">
          <ConnectionErrorBanner />
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoader />}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="min-h-full origin-top"
              >
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
                  <Route path="/track/:accessKey" element={<CustomerStatusTracker />} />
                  <Route path="/track" element={<RegistrationTracker />} />

                  <Route path="/customer/login" element={<CustomerLogin />} />
                  <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                  <Route path="/owner" element={<OwnerPortal />} />
                  <Route path="/refer/:code" element={<ReferralLanding />} />

                  <Route path="/admin" element={<Navigate to="/admin/command-center" replace />} />
                  <Route path="/admin/command-center" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
                  <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
                  <Route path="/admin/registrations" element={<ProtectedRoute><AdminRegistrations /></ProtectedRoute>} />
                  <Route path="/admin/rentals" element={<ProtectedRoute><AdminRentals /></ProtectedRoute>} />
                  <Route path="/admin/plates" element={<ProtectedRoute><AdminPlates /></ProtectedRoute>} />
                  <Route path="/admin/templates" element={<ProtectedRoute><AdminTemplates /></ProtectedRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </motion.div>
            </Suspense>
          </AnimatePresence>
        </main>
      </ErrorBoundary>
      <Footer />
      <div className="grain-overlay"></div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <StoreProvider>
        <Router>
          <SmoothScroll>
          <ScrollToTop />
          <HashRedirect />
          <SplashScreen duration={1800}>
            <AppContent />
          </SplashScreen>
          </SmoothScroll>
        </Router>
      </StoreProvider>
    </LanguageProvider>
  );
}