import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { RRFooter } from './components/RRFooter';
import { LanguageProvider } from './context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import { RRNavbar } from './components/RRNavbar';
import BrowserCompatibilityCheck from './components/BrowserCompatibilityCheck';
import { ScrollToTop } from './components/ScrollToTop';
import { PageLoader } from './components/PageLoader';
import { OfflineBanner } from './components/OfflineBanner';
import { ConnectionErrorBanner } from './components/ConnectionErrorBanner';
import { useSessionTracking } from './hooks/useSessionTracking';
import { captureInitialUtm } from './services/attributionService';

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
    <div className={`min-h-screen flex flex-col text-tj-zinc400 font-sans relative ${location.pathname === '/' ? 'bg-[#F7F7F7]' : 'bg-black'}`}>
      <OfflineBanner />
      <BrowserCompatibilityCheck />
      <RRNavbar />
      <ErrorBoundary>
        <main id="main-content" className={`flex-grow ${location.pathname === '/' ? 'pt-0' : 'pt-[50px]'}`}>
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
      <RRFooter />
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
            <AppContent />
          </SmoothScroll>
        </Router>
      </StoreProvider>
    </LanguageProvider>
  );
}