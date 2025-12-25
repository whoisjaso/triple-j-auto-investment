import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../context/Store';
import { VehicleStatus, Vehicle } from '../types';
import { Filter, Hexagon, ArrowUpRight, ArrowDownUp, X, Loader2, Phone, Mic, ShieldAlert, Globe, ChevronLeft, ChevronRight, FileText, CheckCircle, AlertTriangle, CreditCard, ClipboardCheck, Eye, Layers, Target, MapPin, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- LANGUAGE DICTIONARY ---
const t = {
  en: {
    title: "The Collection",
    subtext: "Secure Asset Allocations",
    sort: "Sort Order",
    filter: "Status Filter",
    viewAll: "View All",
    sold: "Deployed (Sold)",
    available: "Available",
    pending: "Pending",
    expressInterest: "Express Interest",
    price: "Capital Requirement",
    mileage: "Miles",
    asIs: "(AS-IS)",
    soldStamp: "SOLD",
    searchPlaceholder: "Search by Make/Model...",
    modal: {
      tabs: {
        overview: "Overview",
        specs: "Specs & Report",
        transparency: "Condition",
        purchase: "Acquire"
      },
      submit: "Send Inquiry",
      submitting: "Transmitting...",
      successTitle: "Signal Received",
      successMsg: "Our agent has received your dossier. We will contact you shortly to finalize the acquisition.",
      disclaimer: "By submitting, you acknowledge this vehicle is sold AS-IS without warranty.",
      return: "Return to Collection"
    }
  },
  es: {
    title: "La Colección",
    subtext: "Asignación de Activos",
    sort: "Orden",
    filter: "Estado",
    viewAll: "Ver Todos",
    sold: "Vendido",
    available: "Disponible",
    pending: "Pendiente",
    expressInterest: "Me Interesa",
    price: "Precio",
    mileage: "Millas",
    asIs: "(ASI COMO ESTA)",
    soldStamp: "VENDIDO",
    searchPlaceholder: "Buscar marca/modelo...",
    modal: {
      tabs: {
        overview: "Resumen",
        specs: "Reporte y Specs",
        transparency: "Condición",
        purchase: "Comprar"
      },
      submit: "Enviar Mensaje",
      submitting: "Enviando...",
      successTitle: "Mensaje Recibido",
      successMsg: "Nuestro agente ha recibido sus datos. Nos pondremos en contacto pronto para finalizar la adquisición.",
      disclaimer: "Al enviar, usted reconoce que este vehículo se vende 'AS-IS' (Tal cual) sin garantía.",
      return: "Volver a la Colección"
    }
  }
};

type SortOption = 'alphabetical' | 'price_desc' | 'price_asc' | 'year_desc' | 'year_asc' | 'mileage_asc';
type Language = 'en' | 'es';

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
  lang: Language;
}

// --- VEHICLE CARD COMPONENT (With Carousel) ---
const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onClick, lang }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const images = [vehicle.imageUrl, ...(vehicle.gallery || [])].filter(Boolean);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex(prev => (prev + 1) % images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className="group relative bg-black transition-all duration-500 ease-out hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] hover:z-30 border border-transparent hover:border-tj-gold/40 flex flex-col h-full cursor-pointer select-none overflow-hidden"
    >
      {/* Golden Glow Effect on Hover */}
      <div className="absolute inset-0 bg-tj-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-0"></div>

      {/* Status Indicator */}
      <div className="absolute top-0 left-0 w-full flex justify-between items-center z-20 p-6 pointer-events-none">
        <div className={`px-3 py-1 text-[8px] font-bold uppercase tracking-[0.2em] border shadow-lg backdrop-blur-md ${vehicle.status === 'Available' ? 'border-tj-gold text-tj-gold bg-black/90' : 'border-gray-700 text-gray-500 bg-black/90'}`}>
          {vehicle.status === 'Available' ? `• ${t[lang].available.toUpperCase()}` : `• ${vehicle.status.toUpperCase()}`}
        </div>
      </div>

      {/* Image Carousel Area */}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-white/5 group/image bg-gray-900">
        {vehicle.status === VehicleStatus.SOLD && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <div className="transform -rotate-12 bg-tj-gold border-y-4 border-white shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[120%] flex justify-center py-3">
              <span className="font-display font-black text-5xl md:text-6xl tracking-[0.3em] text-black uppercase drop-shadow-md">
                {t[lang].soldStamp}
              </span>
            </div>
          </div>
        )}

        <motion.img
          key={imgIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          src={images[imgIndex]}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          className={`w-full h-full object-cover transition-all duration-1000 ${vehicle.status === VehicleStatus.SOLD ? 'grayscale opacity-40' : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'}`}
        />

        {/* Carousel Controls (Improved Visibility on Mobile) */}
        {images.length > 1 && vehicle.status !== VehicleStatus.SOLD && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-0 top-0 bottom-0 z-30 px-3 flex items-center justify-center bg-gradient-to-r from-black/60 to-transparent text-white active:text-tj-gold transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft size={32} strokeWidth={1} />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-0 top-0 bottom-0 z-30 px-3 flex items-center justify-center bg-gradient-to-l from-black/60 to-transparent text-white active:text-tj-gold transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight size={32} strokeWidth={1} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-0 w-full flex justify-center gap-1 z-20 pointer-events-none">
              {images.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === imgIndex ? 'bg-tj-gold w-6 shadow-[0_0_10px_rgba(212,175,55,0.8)]' : 'bg-white/30 w-1.5'}`}></div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 relative flex flex-col flex-grow bg-gradient-to-b from-black via-black to-tj-dark/30">
        <div className="mb-6 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-ultra text-gray-500 mb-2 transition-colors group-hover:text-tj-gold/80">{vehicle.make}</p>
              <h3 className="font-display text-2xl md:text-3xl text-white mb-2 group-hover:text-tj-gold transition-colors leading-none tracking-tight">
                {vehicle.model}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-600 block">{vehicle.year}</span>
              <span className="text-[10px] font-mono text-gray-600 block">{vehicle.mileage.toLocaleString()} {t[lang].mileage}</span>
            </div>
          </div>
        </div>

        <div className="h-px w-12 bg-gray-800 mb-6 group-hover:w-full group-hover:bg-tj-gold/50 transition-all duration-700 ease-out"></div>

        <p className="font-serif text-gray-400 italic leading-loose mb-8 text-sm line-clamp-3 flex-grow opacity-60 group-hover:opacity-100 transition-opacity">
          "{vehicle.description}"
        </p>

        <div className="flex items-end justify-between mt-auto border-t border-white/5 pt-6 relative z-10">
          <div>
            <p className="text-[8px] uppercase tracking-widest text-gray-600 mb-1 group-hover:text-tj-gold transition-colors">{t[lang].price}</p>
            <div className="flex items-baseline gap-2">
              <p className="font-display text-xl text-white tracking-wider group-hover:scale-105 transition-transform origin-left">
                {vehicle.price > 0 ? `$${vehicle.price.toLocaleString()}` : 'INQUIRE'}
              </p>
              <span className="text-[9px] font-bold text-red-900 uppercase tracking-widest group-hover:text-red-500 transition-colors">{t[lang].asIs}</span>
            </div>
          </div>

          {vehicle.status !== VehicleStatus.SOLD && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="group/btn flex items-center gap-2 bg-white/5 text-gray-300 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.25em] transition-all hover:bg-tj-gold hover:text-black active:scale-95 border border-white/10 hover:border-tj-gold"
            >
              <span className="hidden md:inline">{t[lang].expressInterest}</span>
              <span className="md:hidden">View</span>
              <ArrowUpRight size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Inventory = () => {
  const { vehicles, addLead } = useStore();
  const [filter, setFilter] = useState<VehicleStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [lang, setLang] = useState<Language>('en');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'specs' | 'transparency' | 'purchase'>('overview');
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Modal Carousel State
  const [modalImgIndex, setModalImgIndex] = useState(0);

  const filteredVehicles = vehicles.filter(v => {
    // Filter by status
    const matchesStatus = filter === 'All' || v.status === filter;

    // Filter by search term
    const matchesSearch = searchTerm === '' ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.year.toString().includes(searchTerm) ||
      v.vin.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical': return a.make.localeCompare(b.make) || a.model.localeCompare(b.model);
      case 'price_desc': return b.price - a.price;
      case 'price_asc': return a.price - b.price;
      case 'year_desc': return b.year - a.year;
      case 'year_asc': return a.year - b.year;
      case 'mileage_asc': return a.mileage - b.mileage;
      default: return 0;
    }
  });

  const handleOpenModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setLeadForm({ name: '', email: '', phone: '' });
    setSubmitStatus('idle');
    setModalTab('overview');
    setModalImgIndex(0);
    // iOS-compatible scroll lock
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
  };

  const handleCloseModal = () => {
    setSelectedVehicle(null);
    // Restore scroll position
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    setTimeout(() => {
      addLead({
        id: Math.random().toString(36).substr(2, 9),
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone,
        interest: `Interest in ${selectedVehicle?.year} ${selectedVehicle?.make} ${selectedVehicle?.model} (VIN: ${selectedVehicle?.vin})`,
        date: new Date().toISOString(),
        status: 'New'
      });
      setSubmitStatus('success');
    }, 1500);
  };

  const toggleLang = () => setLang(prev => prev === 'en' ? 'es' : 'en');

  // For Modal Image Carousel
  const modalImages = selectedVehicle ? [selectedVehicle.imageUrl, ...(selectedVehicle.gallery || [])].filter(Boolean) : [];
  const nextModalImg = () => setModalImgIndex(prev => (prev + 1) % modalImages.length);
  const prevModalImg = () => setModalImgIndex(prev => (prev === 0 ? modalImages.length - 1 : prev - 1));

  // Key press handler for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedVehicle) return;
      if (e.key === 'ArrowRight') nextModalImg();
      if (e.key === 'ArrowLeft') prevModalImg();
      if (e.key === 'Escape') handleCloseModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVehicle, modalImages.length]);

  return (
    <div className="bg-black min-h-screen px-4 md:px-6 pb-20 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      {/* Language Switcher Fixed Bottom Right */}
      <button
        onClick={toggleLang}
        className="fixed bottom-8 right-8 z-40 bg-tj-gold text-black p-4 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.6)] hover:scale-110 transition-transform group"
        title="Switch Language / Cambiar Idioma"
      >
        <Globe size={24} className="group-hover:animate-spin-slow" />
        <span className="absolute -top-10 right-0 bg-black text-tj-gold text-[10px] font-bold px-2 py-1 border border-tj-gold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {lang === 'en' ? 'ESPAÑOL' : 'ENGLISH'}
        </span>
      </button>

      <div className="max-w-[1800px] mx-auto relative z-10">

        {/* Header */}
        <div className="pt-24 pb-12 border-b border-white/10 flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 bg-tj-gold animate-pulse"></div>
              <p className="text-tj-gold uppercase tracking-[0.4em] text-[10px]">{t[lang].subtext}</p>
            </div>
            <motion.h1
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="font-display text-5xl md:text-8xl text-white tracking-tight leading-none"
            >
              {t[lang].title.toUpperCase()}
            </motion.h1>
          </div>

          <div className="flex flex-col items-end gap-6 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input
                type="text"
                placeholder={t[lang].searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-white/10 pl-12 pr-4 py-4 text-white placeholder-gray-600 text-sm focus:border-tj-gold focus:outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-tj-gold transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row justify-end items-stretch md:items-center gap-4 w-full">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-4 bg-tj-dark border border-white/10 p-1 w-full md:w-auto">
                <div className="relative group w-full">
                  <select
                    className="appearance-none bg-black text-white pl-4 pr-10 py-3 text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:bg-white/5 transition-colors cursor-pointer w-full md:min-w-[200px]"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                  >
                    <option className="bg-black text-white" value="alphabetical">A-Z</option>
                    <option className="bg-black text-white" value="price_desc">{t[lang].price}: High-Low</option>
                    <option className="bg-black text-white" value="price_asc">{t[lang].price}: Low-High</option>
                    <option className="bg-black text-white" value="year_desc">Year: Newest</option>
                    <option className="bg-black text-white" value="year_asc">Year: Oldest</option>
                    <option className="bg-black text-white" value="mileage_asc">Mileage: Low-High</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-tj-gold">
                    <ArrowDownUp size={10} />
                  </div>
                </div>
              </div>

              {/* Filter Dropdown */}
              <div className="flex items-center gap-4 bg-tj-dark border border-white/10 p-1 w-full md:w-auto">
                <div className="relative group w-full">
                  <select
                    className="appearance-none bg-black text-white pl-4 pr-10 py-3 text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:bg-white/5 transition-colors cursor-pointer w-full md:min-w-[200px]"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                  >
                    <option className="bg-black text-white" value="All">{t[lang].viewAll}</option>
                    <option className="bg-black text-white" value={VehicleStatus.AVAILABLE}>{t[lang].available}</option>
                    <option className="bg-black text-white" value={VehicleStatus.PENDING}>{t[lang].pending}</option>
                    <option className="bg-black text-white" value={VehicleStatus.SOLD}>{t[lang].sold}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-tj-gold">
                    <Hexagon size={10} fill="currentColor" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 mt-8 md:mt-12"
        >
          <AnimatePresence mode="popLayout">
            {sortedVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onClick={() => handleOpenModal(vehicle)}
                lang={lang}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {sortedVehicles.length === 0 && (
          <div className="py-32 text-center border border-white/10 mt-12 bg-white/5">
            <Loader2 size={32} className="mx-auto text-tj-gold mb-4 animate-spin" />
            <p className="font-display text-xl text-white tracking-widest animate-pulse">UPLINKING COMMAND LEDGER...</p>
          </div>
        )}
      </div>

      {/* DETAILED REPORT MODAL (Rendered via Portal to bypass Stacking Contexts) */}
      {createPortal(
        <AnimatePresence>
          {selectedVehicle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6"
              style={{ overscrollBehavior: 'none' }}
            >

              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                onClick={handleCloseModal}
              ></motion.div>

              {/* Modal Container - FULL SCREEN ON MOBILE (100dvh) */}
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative w-full h-[100dvh] md:h-[85vh] md:max-h-[800px] max-w-7xl bg-[#080808] md:border border-tj-gold/30 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col md:flex-row overflow-hidden md:rounded-sm"
              >

                {/* Close Button - Optimized Touch Target */}
                <button
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 z-[120] text-white hover:text-tj-gold bg-black/80 backdrop-blur-md rounded-full p-4 md:p-3 border border-white/10 hover:border-tj-gold transition-all shadow-lg active:scale-90"
                >
                  <X size={24} />
                </button>

                {/* LEFT: Image Gallery (Mobile: Top 40% / Desktop: Left 55%) */}
                <div className="w-full md:w-[55%] h-[40%] md:h-full bg-black relative flex flex-col border-b md:border-b-0 md:border-r border-white/10 shrink-0">
                  <div className="flex-grow relative overflow-hidden group select-none">
                    <img
                      src={modalImages[modalImgIndex]}
                      alt="Detail"
                      className="w-full h-full object-cover opacity-90"
                    />

                    {/* Carousel Controls */}
                    {modalImages.length > 1 && (
                      <>
                        <button onClick={prevModalImg} className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/80 to-transparent text-white flex items-center justify-center hover:text-tj-gold transition-colors z-20 active:bg-black/40">
                          <ChevronLeft size={40} strokeWidth={1} />
                        </button>
                        <button onClick={nextModalImg} className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/80 to-transparent text-white flex items-center justify-center hover:text-tj-gold transition-colors z-20 active:bg-black/40">
                          <ChevronRight size={40} strokeWidth={1} />
                        </button>
                      </>
                    )}

                    {/* Mobile Only Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20 md:hidden pointer-events-none">
                      <p className="text-tj-gold text-[10px] uppercase tracking-widest mb-1">{selectedVehicle.year} {selectedVehicle.make}</p>
                      <h2 className="text-white font-display text-3xl leading-none">{selectedVehicle.model}</h2>
                    </div>
                  </div>

                  {/* Desktop Thumbnails */}
                  {modalImages.length > 1 && (
                    <div className="hidden md:flex h-24 bg-[#050505] border-t border-white/10 overflow-x-auto scrollbar-none">
                      {modalImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setModalImgIndex(idx)}
                          className={`h-full aspect-[4/3] border-r border-white/10 relative ${modalImgIndex === idx ? 'opacity-100 border-t-2 border-t-tj-gold grayscale-0' : 'opacity-40 hover:opacity-100 grayscale'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT: Content & Tabs */}
                <div className="w-full md:w-[45%] flex flex-col bg-[#080808] h-[60%] md:h-full relative">

                  {/* Desktop Header */}
                  <div className="hidden md:block p-8 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-tj-gold font-bold text-xs uppercase tracking-widest flex items-center gap-2"><Target size={12} /> Asset Dossier</span>
                      <span className="bg-red-900/20 text-red-500 text-[9px] px-2 py-0.5 uppercase tracking-widest font-bold border border-red-900/50">AS-IS</span>
                    </div>
                    <h2 className="font-display text-4xl text-white leading-none mb-1">{selectedVehicle.year} {selectedVehicle.model}</h2>
                    <p className="text-gray-500 text-xs font-mono">{selectedVehicle.vin}</p>
                  </div>

                  {/* Tabs - Sticky & Scrollable */}
                  <div className="flex border-b border-white/10 overflow-x-auto scrollbar-none bg-[#050505] sticky top-0 z-30 shadow-lg shrink-0">
                    <button
                      onClick={() => setModalTab('overview')}
                      className={`flex-1 py-4 px-4 text-[10px] uppercase tracking-widest font-bold transition-colors whitespace-nowrap ${modalTab === 'overview' ? 'bg-white/5 text-tj-gold border-b-2 border-tj-gold' : 'text-gray-500 hover:text-white'}`}
                    >
                      {t[lang].modal.tabs.overview}
                    </button>
                    <button
                      onClick={() => setModalTab('specs')}
                      className={`flex-1 py-4 px-4 text-[10px] uppercase tracking-widest font-bold transition-colors whitespace-nowrap ${modalTab === 'specs' ? 'bg-white/5 text-tj-gold border-b-2 border-tj-gold' : 'text-gray-500 hover:text-white'}`}
                    >
                      {t[lang].modal.tabs.specs}
                    </button>
                    <button
                      onClick={() => setModalTab('transparency')}
                      className={`flex-1 py-4 px-4 text-[10px] uppercase tracking-widest font-bold transition-colors whitespace-nowrap ${modalTab === 'transparency' ? 'bg-white/5 text-tj-gold border-b-2 border-tj-gold' : 'text-gray-500 hover:text-white'}`}
                    >
                      {t[lang].modal.tabs.transparency}
                    </button>
                    <button
                      onClick={() => setModalTab('purchase')}
                      className={`flex-1 py-4 px-4 text-[10px] uppercase tracking-widest font-bold transition-colors whitespace-nowrap ${modalTab === 'purchase' ? 'bg-white/5 text-tj-gold border-b-2 border-tj-gold' : 'text-gray-500 hover:text-white'}`}
                    >
                      {t[lang].modal.tabs.purchase}
                    </button>
                  </div>

                  {/* Tab Content Area - Scrollable with bottom padding for FAB */}
                  <div className="flex-grow p-6 md:p-8 overflow-y-auto custom-scrollbar bg-[#080808] pb-32 md:pb-8">

                    {modalTab === 'overview' && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white/5 border border-white/5">
                            <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1">{t[lang].mileage}</p>
                            <p className="text-white font-mono text-lg">{selectedVehicle.mileage.toLocaleString()}</p>
                          </div>
                          <div className="p-4 bg-white/5 border border-white/5">
                            <p className="text-[10px] uppercase text-gray-500 tracking-widest mb-1">{t[lang].price}</p>
                            <p className="text-tj-gold font-display text-xl">${selectedVehicle.price.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="relative pl-6 border-l border-tj-gold/30">
                          <div className="absolute top-0 left-[-2px] w-1 h-8 bg-tj-gold"></div>
                          <p className="text-gray-300 font-serif italic leading-loose text-sm">
                            "{selectedVehicle.description}"
                          </p>
                        </div>

                        {/* Snapshot of Diagnostics in Overview */}
                        <div className="bg-red-900/10 p-4 border border-red-900/30">
                          <h3 className="text-[10px] uppercase tracking-widest text-tj-gold mb-3 flex items-center gap-2">
                            <ShieldAlert size={14} /> Condition Snapshot
                          </h3>
                          {selectedVehicle.diagnostics && selectedVehicle.diagnostics.length > 0 ? (
                            <ul className="space-y-2">
                              {selectedVehicle.diagnostics.slice(0, 3).map((issue, i) => (
                                <li key={i} className="flex items-start gap-2 text-[10px] text-gray-400 font-mono">
                                  <span className="text-red-500">!</span> {issue}
                                </li>
                              ))}
                              {selectedVehicle.diagnostics.length > 3 && (
                                <li className="text-[10px] text-gray-500 italic pt-1">
                                  ... {selectedVehicle.diagnostics.length - 3} more issues logged.
                                </li>
                              )}
                            </ul>
                          ) : (
                            <p className="text-[10px] text-green-500 flex items-center gap-2">
                              <CheckCircle size={14} /> Systems Nominal / Clean Scan
                            </p>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setModalTab('transparency'); }}
                            className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-white mt-3 underline decoration-gray-700 underline-offset-4"
                          >
                            Review Full Diagnostics
                          </button>
                        </div>
                      </div>
                    )}

                    {modalTab === 'specs' && (
                      <div className="space-y-6 animate-fade-in">
                        {/* VIN Card */}
                        <div className="p-4 bg-white/5 border border-white/10 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] uppercase text-gray-500 tracking-widest">VIN Identity</p>
                            <p className="text-white font-mono text-xs mt-1">{selectedVehicle.vin}</p>
                          </div>
                          <ClipboardCheck className="text-tj-gold opacity-50" />
                        </div>

                        {/* Exterior Section */}
                        <div className="bg-black/40 p-5 border border-white/5">
                          <h3 className="text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Eye size={14} className="text-tj-gold" /> Exterior Systems
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-gray-500 text-xs">Paint Finish</span>
                              <span className="text-white text-xs font-mono">Original Spec</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-gray-500 text-xs">Body Integrity</span>
                              <span className="text-white text-xs font-mono">Structured</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-gray-500 text-xs">Glass/Optics</span>
                              <span className="text-white text-xs font-mono">Inspection Complete</span>
                            </div>
                          </div>
                        </div>

                        {/* Interior Section */}
                        <div className="bg-black/40 p-5 border border-white/5">
                          <h3 className="text-gray-400 text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Layers size={14} className="text-tj-gold" /> Interior Configuration
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-gray-500 text-xs">Upholstery</span>
                              <span className="text-white text-xs font-mono">Verified Clean</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-2">
                              <span className="text-gray-500 text-xs">Controls & Electronics</span>
                              <span className="text-white text-xs font-mono">Functional</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* NEW TRANSPARENCY TAB */}
                    {modalTab === 'transparency' && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="bg-tj-gold/10 border border-tj-gold p-4 mb-4">
                          <p className="text-tj-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-1 flex items-center gap-2">
                            <ShieldAlert size={14} /> Transparency Protocol
                          </p>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            We believe in absolute clarity. The following diagnostic notes are provided by our team to ensure you have a complete operational picture.
                          </p>
                        </div>

                        <div className="bg-black p-6 border border-white/10">
                          <h3 className="text-white text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <ClipboardCheck size={14} className="text-tj-gold" /> Mechanic's Diagnostic Log
                          </h3>

                          {selectedVehicle.diagnostics && selectedVehicle.diagnostics.length > 0 ? (
                            <ul className="space-y-3">
                              {selectedVehicle.diagnostics.map((issue, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs text-gray-300 font-mono border-b border-gray-800 pb-2 last:border-0">
                                  <span className="text-tj-gold mt-1">{'>'}{'>'}</span>
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-center py-8 opacity-50">
                              <CheckCircle className="mx-auto text-green-500 mb-2" size={24} />
                              <p className="text-xs text-gray-500 uppercase tracking-widest">No Major Faults Logged</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 p-4 border border-gray-800 bg-white/5">
                          <MapPin size={16} className="text-gray-500" />
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500">Physical Location</p>
                            <p className="text-white text-xs">Houston, TX (77075)</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {modalTab === 'purchase' && (
                      <div className="animate-fade-in h-full flex flex-col">
                        {submitStatus === 'success' ? (
                          <div className="text-center py-8 flex-grow flex flex-col justify-center">
                            <div className="w-16 h-16 mx-auto border border-tj-gold rounded-full flex items-center justify-center bg-tj-gold/10 animate-gold-pulse mb-6">
                              <Mic className="text-tj-gold" size={24} />
                            </div>
                            <h3 className="font-display text-xl text-white tracking-widest mb-2">{t[lang].modal.successTitle.toUpperCase()}</h3>
                            <p className="text-gray-400 text-xs mb-8 leading-relaxed max-w-xs mx-auto">
                              {t[lang].modal.successMsg}
                            </p>
                            <a href="tel:+18324009760" className="w-full bg-tj-gold text-black font-bold py-4 text-sm uppercase tracking-[0.2em] hover:bg-white transition-colors flex items-center justify-center gap-2 mb-4">
                              <Phone size={16} /> Call Agent
                            </a>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col">
                            <div className="flex-grow space-y-4">
                              <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Your Name</label>
                                <input
                                  required
                                  type="text"
                                  value={leadForm.name}
                                  onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                                  className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                                  placeholder="Full Name / Nombre Completo"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Phone Number</label>
                                <input
                                  required
                                  type="tel"
                                  value={leadForm.phone}
                                  onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                                  className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                                  placeholder="(XXX) XXX-XXXX"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Email</label>
                                <input
                                  type="email"
                                  value={leadForm.email}
                                  onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                                  className="w-full bg-black border border-gray-700 p-4 text-white text-sm focus:border-tj-gold outline-none transition-colors"
                                  placeholder="email@address.com"
                                />
                              </div>
                              <div className="flex items-center gap-2 p-3 bg-red-900/10 border border-red-900/30">
                                <ShieldAlert size={16} className="text-red-500 flex-shrink-0" />
                                <p className="text-[10px] text-gray-400 leading-tight">
                                  {t[lang].modal.disclaimer}
                                </p>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={submitStatus === 'submitting'}
                              className="w-full bg-tj-gold text-black font-bold py-5 text-sm uppercase tracking-[0.2em] hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-auto shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                            >
                              {submitStatus === 'submitting' ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <>
                                  {t[lang].modal.submit} <ArrowUpRight size={16} />
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Mobile Floating Action Button (Only visible if not on Purchase Tab) */}
                  {modalTab !== 'purchase' && (
                    <div className="md:hidden absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/90 to-transparent z-40">
                      <button
                        onClick={() => setModalTab('purchase')}
                        className="w-full bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(212,175,55,0.3)] border border-tj-gold/50 active:scale-95 transition-transform"
                      >
                        {t[lang].modal.tabs.purchase}
                      </button>
                    </div>
                  )}
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default Inventory;
