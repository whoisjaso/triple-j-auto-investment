
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/Store';
import { Menu, X, LayoutDashboard, Lock, ShieldCheck, MapPin, FileText, Car, Database } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import VinLookup from './pages/VinLookup';
import Contact from './pages/Contact';
import Services from './pages/Services';
import Finance from './pages/Finance';
import FAQ from './pages/FAQ';
import Policies from './pages/Policies';
import PaymentOptions from './pages/PaymentOptions';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/Dashboard';
import AdminInventory from './pages/admin/Inventory';
import AdminRegistrations from './pages/admin/Registrations';
import Login from './pages/Login';
import About from './pages/About';
import Legal from './pages/Legal';

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
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // On home page: smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // On other pages: navigate home
      navigate('/');
    }
  };

  // Mobile Menu Scroll Lock & Touch Action
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
      {/* Gradient Backdrop for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-transparent pointer-events-none h-48 transition-opacity duration-500"></div>
      
      <div className="border-b border-white/5 backdrop-blur-[2px] relative z-10">
        <div className="max-w-[1920px] mx-auto px-6 md:px-12">
          <div className="relative flex justify-between items-center h-24 md:h-32">
            
            {/* Left Axis: Operational */}
            <div className="hidden md:flex flex-1 items-center justify-start space-x-10 pl-12">
               <NavLink to="/inventory" label="The Collection" />
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
            <div className="hidden md:flex flex-1 items-center justify-end space-x-10 pr-12">
               {!user ? (
                 <>
                   <NavLink to="/about" label="Doctrine" />
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
                    <Link to="/admin/registrations" className={`flex items-center gap-2 text-[10px] uppercase tracking-widest hover:text-tj-gold transition-colors ${location.pathname.includes('registrations') ? 'text-tj-gold' : 'text-gray-400'}`}>
                      <FileText size={14} /> Compliance
                    </Link>
                    <button onClick={logout} className="text-[10px] uppercase tracking-widest text-red-900 hover:text-red-500 transition-colors ml-4">Logout</button>
                 </div>
               )}
            </div>

            {/* Mobile Trigger (High Z-Index) */}
            <div className="flex flex-1 justify-end md:hidden z-[70] pr-2">
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`group relative p-3 border transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden ${isOpen ? 'border-tj-gold text-tj-gold bg-black' : 'border-white/10 text-white bg-black/50 backdrop-blur'}`}
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
          
          {/* Layer 1: Cinematic Grain Overlay (Subconscious Texture) */}
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none mix-blend-overlay"></div>
          
          {/* Layer 2: The Void Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tj-gold/5 via-black to-black pointer-events-none animate-subtle-zoom"></div>

          {/* Layer 3: Architectural Backdrop (Spinning Logo) */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] opacity-[0.04] pointer-events-none transition-all duration-[1500ms] ease-out transform-gpu ${isOpen ? 'scale-100 rotate-0 blur-0' : 'scale-50 rotate-90 blur-2xl'}`}>
               <img src="/GoldTripleJLogo.png" alt="Triple J Logo" className="w-full h-full object-contain animate-[spin_120s_linear_infinite]" />
          </div>

          {/* Layer 4: Content Stagger */}
          <div className="flex flex-col items-center gap-10 z-10 w-full px-6 perspective-1000">
            {[
              { to: "/", label: "HOME", sub: "ORIGIN POINT", delay: 100 },
              { to: "/inventory", label: "COLLECTION", sub: "ACQUIRE ASSETS", delay: 150 },
              { to: "/vin", label: "INTEL", sub: "DEEP DATA ANALYSIS", delay: 200 },
              { to: "/about", label: "DOCTRINE", sub: "THE PHILOSOPHY", delay: 250 }
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
                 
                 {/* Decorative Sub-line with Reveal */}
                 <div className="overflow-hidden h-6 mt-3 flex justify-center">
                    <div className="flex items-center gap-2">
                        <span className={`w-1 h-px bg-tj-gold/50 transition-all duration-700 ${isOpen ? 'w-4 opacity-100' : 'w-0 opacity-0'}`} style={{ transitionDelay: `${link.delay + 300}ms` }}></span>
                        <span className={`block text-[9px] uppercase tracking-[0.4em] text-tj-gold/60 transition-transform duration-700 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`} style={{ transitionDelay: `${link.delay + 200}ms` }}>
                            {link.sub}
                        </span>
                        <span className={`w-1 h-px bg-tj-gold/50 transition-all duration-700 ${isOpen ? 'w-4 opacity-100' : 'w-0 opacity-0'}`} style={{ transitionDelay: `${link.delay + 300}ms` }}></span>
                    </div>
                 </div>
               </Link>
            ))}
            
            {/* Admin Links Mobile */}
            {user && (
              <div className={`flex flex-col items-center gap-6 mt-8 pt-8 border-t border-white/10 w-1/2 transition-all duration-1000 delay-500 ${isOpen ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-8 blur-sm'}`}>
                 <Link to="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2 hover:bg-white/5 px-4 py-2 rounded-full transition-colors"><LayoutDashboard size={14}/> Command</Link>
                 <Link to="/admin/inventory" onClick={() => setIsOpen(false)} className="text-[10px] uppercase tracking-widest text-tj-gold flex items-center gap-2 hover:bg-white/5 px-4 py-2 rounded-full transition-colors"><Car size={14}/> Assets</Link>
              </div>
            )}
          </div>

          {/* Footer / Login in Menu */}
          <div className={`absolute bottom-16 transition-all duration-1000 delay-[400ms] ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            {!user ? (
               <Link to="/login" onClick={() => setIsOpen(false)} className="relative px-12 py-5 border border-tj-gold/30 text-tj-gold text-[10px] uppercase tracking-[0.3em] hover:bg-tj-gold hover:text-black transition-all group overflow-hidden block bg-black/50 backdrop-blur-md">
                  <span className="relative z-10 flex items-center gap-3"><Lock size={12} /> Initiate Sequence</span>
                  <div className="absolute inset-0 bg-tj-gold transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
               </Link>
            ) : (
                <button onClick={() => { logout(); setIsOpen(false); }} className="text-red-500 text-xs uppercase tracking-widest hover:text-red-400 border border-red-900/30 px-8 py-3 bg-black/50 backdrop-blur">
                  End Session
                </button>
            )}
          </div>
      </div>
    </nav>
  );
};

const Footer = () => {
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
             <p className="text-white font-display text-xl tracking-wider mb-4">TRIPLE J <br/><span className="text-gray-500 text-sm">AUTO INVESTMENT</span></p>
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
              © {new Date().getFullYear()} Sovereign Entity.
           </p>
        </div>
        
        {/* COMPLIANCE */}
        <div className="flex flex-col items-start">
           <h3 className="text-tj-gold font-bold tracking-[0.2em] text-[10px] uppercase mb-6 border-b border-tj-gold/20 pb-2 w-full flex items-center gap-2">
             <ShieldCheck size={14} /> Compliance
           </h3>
           <div className="mb-6 w-full">
             <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-3">
                <span className="text-[10px] uppercase tracking-widest text-gray-500">TX Dealer License</span>
                <span className="font-mono text-tj-gold text-sm">P171632</span>
             </div>
           </div>
           <ul className="space-y-3 text-[10px] uppercase tracking-widest text-gray-500 w-full">
             <li><Link to="/legal/dmv" className="hover:text-tj-gold transition-colors block py-1">Texas DMV</Link></li>
             <li><Link to="/legal/doc-fee" className="hover:text-tj-gold transition-colors block py-1">Doc Fee Disclosure</Link></li>
             <li><Link to="/legal/title-policy" className="hover:text-tj-gold transition-colors block py-1">Title & ID Policy</Link></li>
             <li><Link to="/legal/returns" className="hover:text-tj-gold transition-colors block py-1">Returns & Deposits</Link></li>
             <li><Link to="/legal/arbitration" className="hover:text-tj-gold transition-colors block py-1">Arbitration</Link></li>
             <li><Link to="/legal/privacy" className="hover:text-tj-gold transition-colors block py-1">Privacy Policy</Link></li>
             <li><Link to="/legal/terms" className="hover:text-tj-gold transition-colors block py-1">Terms & Conditions</Link></li>
           </ul>
        </div>

        {/* SYSTEM LINKS */}
        <div className="flex flex-col items-start">
          <h3 className="text-tj-gold font-bold tracking-[0.2em] text-[10px] uppercase mb-6 border-b border-tj-gold/20 pb-2 w-full">System Access</h3>
          <ul className="space-y-4 text-[10px] uppercase tracking-widest w-full">
            <li><Link to="/inventory" className="hover:text-white transition-colors block hover:translate-x-2 transition-transform duration-300">The Collection</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors block hover:translate-x-2 transition-transform duration-300">Manifesto</Link></li>
            <li><Link to="/vin" className="hover:text-white transition-colors block hover:translate-x-2 transition-transform duration-300">Intelligence</Link></li>
            <li className="pt-4 border-t border-white/5 mt-4"><Link to="/login" className="hover:text-white transition-colors text-gray-600 flex items-center gap-2"><Lock size={10}/> Portal Access</Link></li>
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

const AppContent = () => {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-tj-green text-gray-200 font-sans">
      <Navbar />
      {/* Adjusted top padding since crest is gone */}
      <main className="flex-grow pt-32">
        {/* Global Page Transition Wrapper */}
        <div key={location.pathname} className="animate-page-enter min-h-full origin-top">
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
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Router>
        <AppContent />
      </Router>
    </StoreProvider>
  );
}
