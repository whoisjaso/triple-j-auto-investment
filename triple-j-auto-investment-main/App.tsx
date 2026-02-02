import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ErrorProvider } from './components/ErrorProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Lock, LayoutDashboard, Car, ShieldCheck, Globe, MapPin, Phone, ArrowRight } from 'lucide-react';

// Critical Pages
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import Contact from './pages/Contact';

// Lazy loaded pages
const VinLookup = React.lazy(() => import('./pages/VinLookup'));
const Services = React.lazy(() => import('./pages/Services'));
const Finance = React.lazy(() => import('./pages/Finance'));
const FAQ = React.lazy(() => import('./pages/FAQ'));
const Policies = React.lazy(() => import('./pages/Policies'));
const PaymentOptions = React.lazy(() => import('./pages/PaymentOptions'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const Login = React.lazy(() => import('./pages/Login'));
const About = React.lazy(() => import('./pages/About'));
const Legal = React.lazy(() => import('./pages/Legal'));
const RegistrationTracker = React.lazy(() => import('./pages/RegistrationTracker'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminInventory = React.lazy(() => import('./pages/admin/Inventory'));
const AdminRegistrations = React.lazy(() => import('./pages/admin/Registrations'));

// Map utility
export const openSmartMap = () => {
  const address = "8774 Almeda Genoa Road, Houston, TX 77075";
  const encoded = encodeURIComponent(address);
  const isIOS = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
  window.open(isIOS ? `http://maps.apple.com/?q=${encoded}` : `https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
};

// Clean Navigation
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useStore();
  const { t, lang, toggleLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/inventory', label: t.nav.inventory },
    { to: '/services', label: 'Services' },
    { to: '/about', label: t.nav.about },
    { to: '/contact', label: t.nav.contact },
  ];

  return (
    <>
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/GoldTripleJLogo.png" alt="Triple J" className="h-12 w-12 object-contain" />
              <div className="hidden sm:block">
                <span className={`font-semibold tracking-wide ${scrolled ? 'text-gray-900' : 'text-white'}`}>Triple J</span>
                <span className={`text-xs block ${scrolled ? 'text-gray-500' : 'text-white/70'}`}>Auto Investment</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition-colors hover:text-yellow-600 ${
                    location.pathname === link.to ? 'text-yellow-600' : scrolled ? 'text-gray-700' : 'text-white/90'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              <button onClick={toggleLang} className={`text-sm ${scrolled ? 'text-gray-600' : 'text-white/80'}`}>
                {lang === 'en' ? 'ES' : 'EN'}
              </button>

              {!user ? (
                <Link to="/login" className={`${scrolled ? 'text-gray-600' : 'text-white/80'}`}>
                  <Lock size={16} />
                </Link>
              ) : (
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                  <Link to="/admin/dashboard" className="text-sm text-gray-600 hover:text-yellow-600">Admin</Link>
                  <button onClick={logout} className="text-sm text-red-500">Logout</button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2">
              {isOpen ? <X size={24} className={scrolled ? 'text-gray-900' : 'text-white'} /> : <Menu size={24} className={scrolled ? 'text-gray-900' : 'text-white'} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-24"
          >
            <div className="flex flex-col items-center gap-6 p-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className="text-xl font-medium text-gray-900 hover:text-yellow-600"
                >
                  {link.label}
                </Link>
              ))}
              <button onClick={toggleLang} className="text-gray-600 mt-4">
                {lang === 'en' ? 'Switch to Español' : 'Switch to English'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Clean Footer
const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/GoldTripleJLogo.png" alt="Triple J" className="h-10 w-10 object-contain" />
              <div>
                <span className="font-semibold text-lg">Triple J Auto Investment</span>
                <p className="text-gray-400 text-sm">Houston's Premier Luxury Auto Dealer</p>
              </div>
            </div>
            <button onClick={openSmartMap} className="flex items-start gap-2 text-gray-400 hover:text-white mt-4">
              <MapPin size={18} className="mt-0.5 flex-shrink-0" />
              <div className="text-left text-sm">
                <p>8774 Almeda Genoa Road</p>
                <p>Houston, TX 77075</p>
              </div>
            </button>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/inventory" className="hover:text-white">Inventory</Link></li>
              <li><Link to="/services" className="hover:text-white">Services</Link></li>
              <li><Link to="/about" className="hover:text-white">About</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Phone size={14} />
                <a href="tel:+18324009760" className="hover:text-white">832-400-9760</a>
              </li>
              <li>TX License: P171632</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Triple J Auto Investment. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/legal/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Protected Route
const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user } = useStore();
  if (!user?.isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Scroll to top
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
};

// App Content
const AppContent = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <ScrollToTop />
      <Navbar />
      
      <main className="flex-grow">
        <React.Suspense fallback={null}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/vin" element={<VinLookup />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/services" element={<Services />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/payment-options" element={<PaymentOptions />} />
                <Route path="/login" element={<Login />} />
                <Route path="/legal/:section" element={<Legal />} />
                <Route path="/track" element={<RegistrationTracker />} />
                <Route path="/track/:orderId" element={<RegistrationTracker />} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
                <Route path="/admin/registrations" element={<ProtectedRoute><AdminRegistrations /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </React.Suspense>
      </main>
      
      <Footer />
    </div>
  );
};

// Main App
export default function App() {
  return (
    <LanguageProvider>
      <ErrorProvider showAdminDetails={true}>
        <StoreProvider>
          <Router>
            <AppContent />
          </Router>
        </StoreProvider>
      </ErrorProvider>
    </LanguageProvider>
  );
}
