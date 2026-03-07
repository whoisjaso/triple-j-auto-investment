import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../context/Store';
import { VehicleStatus, Vehicle } from '../types';
import { Filter, Hexagon, ArrowUpRight, ArrowDownUp, X, Loader2, Phone, Mic, ShieldAlert, Globe, ChevronLeft, ChevronRight, FileText, CheckCircle, AlertTriangle, CreditCard, ClipboardCheck, Eye, Layers, Target, MapPin, Search, RefreshCw, Car, ZoomIn, WifiOff, PackageOpen, Key, Mail, User, Calendar, Shield, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

import { useLanguage } from '../context/LanguageContext';
import { SEO } from '../components/SEO';
import { useScrollLock } from '../hooks/useScrollLock';
import { ImageGallery } from '../components/ImageGallery';
import { triggerOutboundCall } from '../services/retellService';
import { Link } from 'react-router-dom';
import { VehicleVerifiedBadge } from '../components/VehicleVerifiedBadge';
import { generateVehicleSlug } from '../utils/vehicleSlug';
import { SaveButton } from '../components/SaveButton';
import { useSavedVehicles } from '../hooks/useSavedVehicles';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { RecentlyViewedRow } from '../components/RecentlyViewedRow';
import { Heart } from 'lucide-react';
import { useUrgencyBadges } from '../hooks/useUrgencyBadges';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { ChatWidget } from '../components/chat/ChatWidget';
import type { UrgencyBadgeData } from '../services/urgencyService';

type SortOption = 'alphabetical' | 'price_desc' | 'price_asc' | 'year_desc' | 'year_asc' | 'mileage_asc';

const isRentable = (_v: Vehicle): boolean => true;

const generalChatVehicle: Vehicle = {
  id: 'general',
  make: 'Triple J',
  model: 'Collection',
  year: new Date().getFullYear(),
  price: 0,
  mileage: 0,
  cost: 0,
  vin: '',
  status: VehicleStatus.AVAILABLE,
  description: 'Inquire regarding our exclusive fleet.',
  imageUrl: '',
};

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
  onImageClick: (imgIndex: number) => void;
  getBadges: (vehicle: Vehicle) => UrgencyBadgeData[];
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onClick, onImageClick, getBadges }) => {
  const { t, lang } = useLanguage();
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

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vehicle.status !== VehicleStatus.SOLD) {
      onImageClick(imgIndex);
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold || info.velocity.x > 0.5) {
      setImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    } else if (info.offset.x < -threshold || info.velocity.x < -0.5) {
      setImgIndex(prev => (prev + 1) % images.length);
    }
  };

  const isSold = vehicle.status === VehicleStatus.SOLD;
  const badges = getBadges(vehicle);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="group relative bg-[#020202] transition-all duration-700 ease-out hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/[0.04] flex flex-col h-full cursor-pointer select-none overflow-hidden"
    >
      <div
        className={`relative aspect-[16/10] overflow-hidden bg-[#000] ${!isSold && images.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onClick={handleImageClick}
      >
        <div className="absolute top-0 left-0 right-0 z-20 p-5 flex justify-between items-start pointer-events-none">
          <div className={`px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.3em] backdrop-blur-md ${vehicle.status === 'Available' ? 'bg-[#050505]/60 text-tj-gold border border-tj-gold/20' : 'bg-[#050505]/60 text-white/50 border border-white/10'}`}>
            {vehicle.status === 'Available' ? t.common.available : vehicle.status}
          </div>
          <div className="flex flex-col items-end gap-2">
            {vehicle.isVerified && (
              <div className="pointer-events-auto mix-blend-screen">
                <VehicleVerifiedBadge isVerified={true} size="sm" />
              </div>
            )}
            <div className="pointer-events-auto">
              <SaveButton vehicleId={vehicle.id} size="sm" />
            </div>
            {badges.length > 0 && (
              <UrgencyBadge badges={badges} />
            )}
          </div>
        </div>

        {isSold && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm">
            <span className="font-serif text-3xl md:text-4xl tracking-widest text-white/40 italic">
              Acquired
            </span>
          </div>
        )}

        <motion.img
          key={imgIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          src={images[imgIndex]}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          loading="lazy"
          drag={!isSold && images.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          className={`w-full h-full object-cover transition-transform duration-[1.5s] ease-out mix-blend-luminosity group-hover:mix-blend-normal ${isSold ? 'opacity-30' : 'opacity-80 group-hover:opacity-100 group-hover:scale-105'}`}
        />

        {images.length > 1 && !isSold && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-0 top-0 bottom-0 z-30 w-16 flex items-center justify-center bg-gradient-to-r from-black/50 to-transparent text-white/30 hover:text-white transition-all opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft size={24} strokeWidth={1} />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-0 top-0 bottom-0 z-30 w-16 flex items-center justify-center bg-gradient-to-l from-black/50 to-transparent text-white/30 hover:text-white transition-all opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight size={24} strokeWidth={1} />
            </button>
          </>
        )}

        {images.length > 1 && !isSold && (
          <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 z-20 pointer-events-none">
            {images.map((_, i) => (
              <div key={i} className={`h-[1px] transition-all duration-500 ${i === imgIndex ? 'bg-tj-gold w-6' : 'bg-white/30 w-3'}`} />
            ))}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-transparent opacity-60 z-10 pointer-events-none" />
      </div>

      <div className="p-6 relative flex flex-col flex-grow bg-[#020202] z-20">
        <div className="flex justify-between items-start mb-6">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/50 mb-2">{vehicle.year} — {vehicle.make}</p>
            <h3 className="font-serif text-2xl md:text-3xl text-white group-hover:text-tj-gold transition-colors duration-500 leading-tight tracking-tight truncate">
              {vehicle.model}
            </h3>
          </div>
          <div className="text-right flex-shrink-0 ml-4 pt-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">{vehicle.mileage.toLocaleString()} mi</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/[0.04]">
          <div>
            <p className="font-display text-xl text-white tracking-widest">
              {vehicle.price > 0 ? `$${vehicle.price.toLocaleString()}` : 'INQUIRE'}
            </p>
          </div>

          {!isSold && (
            <Link
              to={`/vehicles/${vehicle.slug || generateVehicleSlug(vehicle.year, vehicle.make, vehicle.model, vehicle.id)}`}
              onClick={(e) => e.stopPropagation()}
              className="link-elegant flex items-center gap-2"
            >
              Discover <ArrowUpRight size={12} strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Inventory = () => {
  const { vehicles, addLead, isLoading, connectionError, refreshVehicles } = useStore();
  const { t, lang, toggleLang } = useLanguage();
  const { savedIds, savedCount } = useSavedVehicles();
  const { vehicleIds: recentIds } = useRecentlyViewed();
  const { getBadges } = useUrgencyBadges();
  const [filter, setFilter] = useState<VehicleStatus | 'All'>('All');
  const [makeFilter, setMakeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');
  const [searchTerm, setSearchTerm] = useState('');
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'sale' | 'rental'>('all');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'specs' | 'transparency' | 'purchase' | 'rent'>('overview');
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState<string>('');

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setLeadForm({ ...leadForm, phone: formatted });
    if (formError) setFormError('');
  };

  const [modalImgIndex, setModalImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [cardGalleryImages, setCardGalleryImages] = useState<string[]>([]);
  const [cardGalleryIndex, setCardGalleryIndex] = useState(0);
  const [cardGalleryOpen, setCardGalleryOpen] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useScrollLock(!!selectedVehicle && !lightboxOpen);

  useEffect(() => {
    const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  const uniqueMakes = useMemo(() => {
    const makes = [...new Set(vehicles.map(v => v.make))].filter(Boolean).sort();
    return ['All', ...makes];
  }, [vehicles]);

  const filteredVehicles = vehicles.filter(v => {
    const matchesStatus = filter === 'All' || v.status === filter;
    const matchesMake = makeFilter === 'All' || v.make === makeFilter;
    const matchesSearch = searchTerm === '' ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.year.toString().includes(searchTerm) ||
      v.vin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesListingType = listingTypeFilter === 'all' ||
      (listingTypeFilter === 'sale' && (!v.listingType || v.listingType === 'sale_only' || v.listingType === 'both')) ||
      (listingTypeFilter === 'rental' && (v.listingType === 'rental_only' || v.listingType === 'both'));

    return matchesStatus && matchesMake && matchesSearch && matchesListingType;
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

  const displayVehicles = showSavedOnly ? sortedVehicles.filter(v => savedIds.includes(v.id)) : sortedVehicles;

  const handleOpenModal = useCallback((vehicle: Vehicle) => {
    triggerRef.current = document.activeElement as HTMLElement;
    setSelectedVehicle(vehicle);
    setLeadForm({ name: '', email: '', phone: '' });
    setSubmitStatus('idle');
    setFormError('');
    setModalTab(vehicle.listingType === 'rental_only' ? 'rent' : 'overview');
    setModalImgIndex(0);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedVehicle(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  const handleCardImageClick = useCallback((vehicle: Vehicle, imgIndex: number) => {
    const images = [vehicle.imageUrl, ...(vehicle.gallery || [])].filter(Boolean);
    setCardGalleryImages(images);
    setCardGalleryIndex(imgIndex);
    setCardGalleryOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const phoneDigits = leadForm.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) { setFormError('Valid 10-digit phone required.'); setSubmitStatus('error'); return; }
    if (!leadForm.name.trim()) { setFormError('Name required.'); setSubmitStatus('error'); return; }
    setSubmitStatus('submitting');
    try {
      await addLead({ id: Math.random().toString(36).substr(2, 9), name: leadForm.name, email: leadForm.email, phone: leadForm.phone, interest: `Interest in ${selectedVehicle?.year} ${selectedVehicle?.make} ${selectedVehicle?.model} (VIN: ${selectedVehicle?.vin})`, date: new Date().toISOString(), status: 'New' });
      if (selectedVehicle) {
        await triggerOutboundCall({ customer_name: leadForm.name.trim(), phone_number: `+1${phoneDigits}`, email: leadForm.email.trim(), vehicle_year: selectedVehicle.year.toString(), vehicle_make: selectedVehicle.make, vehicle_model: selectedVehicle.model, vehicle_full: `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`, vehicle_price: selectedVehicle.price > 0 ? `$${selectedVehicle.price.toLocaleString()}` : 'Inquire', vehicle_condition: selectedVehicle.description || 'No known issues', vehicle_status: selectedVehicle.status, vehicle_id: selectedVehicle.id, inquiry_source: 'Website Inventory', inquiry_timestamp: new Date().toISOString() });
      }
      setSubmitStatus('success');
    } catch (error) { setFormError('Submission failed.'); setSubmitStatus('error'); }
  };

  const modalImages = selectedVehicle ? [selectedVehicle.imageUrl, ...(selectedVehicle.gallery || [])].filter(Boolean) : [];
  const nextModalImg = () => setModalImgIndex(prev => (prev + 1) % modalImages.length);
  const prevModalImg = () => setModalImgIndex(prev => (prev === 0 ? modalImages.length - 1 : prev - 1));

  useEffect(() => { if (selectedVehicle && modalRef.current) modalRef.current.focus(); }, [selectedVehicle]);

  useEffect(() => {
    if (!selectedVehicle) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextModalImg();
      if (e.key === 'ArrowLeft') prevModalImg();
      if (e.key === 'Escape') handleCloseModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedVehicle, modalImages.length, handleCloseModal]);

  return (
    <>
    <SEO title="The Collection | Triple J Auto Investment" description="Explore our curated fleet of exceptional pre-owned vehicles." path="/inventory" />
    <div className="bg-[#050505] min-h-screen px-6 md:px-12 pb-32 relative">

      <div className="max-w-[1600px] mx-auto relative z-10 pt-32">
        {/* Elegant Header */}
        <div className="flex flex-col items-center text-center mb-24">
           <img src="/GoldTripleJLogo.png" alt="Crest" className="w-12 h-12 mb-6 opacity-80 mix-blend-screen" />
           <p className="text-[10px] uppercase tracking-[0.4em] text-tj-gold mb-6">Our Fleet</p>
           <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white tracking-tight leading-none mb-8">
              The <span className="italic text-white/70">Collection</span>
           </h1>
           <div className="w-px h-16 bg-gradient-to-b from-tj-gold/50 to-transparent" />
        </div>

        {/* Sophisticated Filtering */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-16 border-y border-white/[0.04] py-6">
           <div className="flex-1 w-full lg:w-auto relative">
              <input
                type="text"
                placeholder="Search by Make, Model, or VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none text-white placeholder-white/30 text-sm font-light tracking-wide focus:outline-none focus:ring-0"
              />
              <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30" size={16} strokeWidth={1} />
           </div>

           <div className="flex flex-wrap items-center gap-6 text-[10px] uppercase tracking-[0.2em] w-full lg:w-auto justify-end">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-transparent text-white/60 focus:outline-none cursor-pointer hover:text-white transition-colors border-none appearance-none pr-4">
                 <option value="alphabetical" className="bg-[#050505]">A-Z</option>
                 <option value="price_desc" className="bg-[#050505]">Price: High to Low</option>
                 <option value="price_asc" className="bg-[#050505]">Price: Low to High</option>
              </select>

              <select value={makeFilter} onChange={(e) => setMakeFilter(e.target.value)} className="bg-transparent text-white/60 focus:outline-none cursor-pointer hover:text-white transition-colors border-none appearance-none pr-4">
                 {uniqueMakes.map(make => (
                    <option key={make} value={make} className="bg-[#050505]">{make === 'All' ? 'All Marques' : make}</option>
                 ))}
              </select>

              <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="bg-transparent text-white/60 focus:outline-none cursor-pointer hover:text-white transition-colors border-none appearance-none pr-4">
                 <option value="All" className="bg-[#050505]">All Statuses</option>
                 <option value={VehicleStatus.AVAILABLE} className="bg-[#050505]">Available</option>
                 <option value={VehicleStatus.PENDING} className="bg-[#050505]">Reserved</option>
                 <option value={VehicleStatus.SOLD} className="bg-[#050505]">Acquired</option>
              </select>

              {savedCount > 0 && (
                <button onClick={() => setShowSavedOnly(!showSavedOnly)} className={`flex items-center gap-2 transition-colors ${showSavedOnly ? 'text-tj-gold' : 'text-white/60 hover:text-white'}`}>
                  <Heart size={12} strokeWidth={1.5} className={showSavedOnly ? 'fill-tj-gold' : ''} />
                  Saved ({savedCount})
                </button>
              )}
           </div>
        </div>

        {/* Grid Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-[#020202] border border-white/[0.02] animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayVehicles.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center">
            <Diamond size={32} className="text-tj-gold/30 mb-6" strokeWidth={1} />
            <p className="font-serif text-3xl text-white mb-4">No vehicles found</p>
            <p className="text-white/40 font-light max-w-md mx-auto mb-8">Adjust your filters or contact our concierge to source a specific request.</p>
            <a href="tel:+18324009760" className="btn-luxury">Contact Concierge</a>
          </div>
        )}

        {/* Display Grid */}
        {!isLoading && displayVehicles.length > 0 && (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            <AnimatePresence mode="popLayout">
              {displayVehicles.map((vehicle, idx) => (
                <motion.div 
                   key={vehicle.id}
                   initial={{ opacity: 0, y: 30 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                   <VehicleCard
                     vehicle={vehicle}
                     onClick={() => handleOpenModal(vehicle)}
                     onImageClick={(imgIndex) => handleCardImageClick(vehicle, imgIndex)}
                     getBadges={getBadges}
                   />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Elegant Modal Implementation */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedVehicle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-12"
              style={{ overscrollBehavior: 'none' }}
            >
              <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl" onClick={handleCloseModal} />

              <motion.div
                ref={modalRef}
                role="dialog"
                tabIndex={-1}
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full h-full md:h-[85vh] max-w-[1400px] bg-[#020202] border border-white/[0.04] shadow-2xl flex flex-col md:flex-row overflow-hidden"
              >
                <button
                  onClick={handleCloseModal}
                  className="absolute top-6 right-6 z-50 text-white/50 hover:text-white transition-colors"
                >
                  <X size={24} strokeWidth={1} />
                </button>

                {/* Left: Image Side */}
                <div className="w-full md:w-3/5 h-[45%] md:h-full bg-[#000] relative">
                   <button onClick={() => { setLightboxIndex(modalImgIndex); setLightboxOpen(true); }} className="w-full h-full cursor-zoom-in">
                      <motion.img
                        key={modalImgIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        src={modalImages[modalImgIndex]}
                        alt={selectedVehicle.model}
                        className="w-full h-full object-cover mix-blend-luminosity hover:mix-blend-normal transition-all duration-700"
                      />
                   </button>
                   {modalImages.length > 1 && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                         {modalImages.map((_, i) => (
                            <button key={i} onClick={() => setModalImgIndex(i)} className={`h-[1px] transition-all duration-500 ${i === modalImgIndex ? 'w-8 bg-tj-gold' : 'w-4 bg-white/30'}`} />
                         ))}
                      </div>
                   )}
                </div>

                {/* Right: Content Side */}
                <div className="w-full md:w-2/5 h-[55%] md:h-full bg-[#020202] flex flex-col pt-8 md:pt-16 px-8 md:px-12 relative overflow-y-auto custom-scrollbar border-l border-white/[0.02]">
                   <p className="text-[10px] uppercase tracking-[0.4em] text-tj-gold mb-3">{selectedVehicle.year} {selectedVehicle.make}</p>
                   <h2 className="font-serif text-4xl md:text-5xl text-white leading-none mb-6">{selectedVehicle.model}</h2>
                   <div className="h-px w-16 bg-white/[0.08] mb-8" />
                   
                   <p className="text-white/60 font-light leading-relaxed mb-8">{selectedVehicle.description || "Inquire for comprehensive documentation and heritage report."}</p>

                   <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-12">
                      <div>
                         <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1">Acquisition</p>
                         <p className="font-display text-2xl text-white">{selectedVehicle.price > 0 ? `$${selectedVehicle.price.toLocaleString()}` : 'Inquire'}</p>
                      </div>
                      <div>
                         <p className="text-[9px] uppercase tracking-[0.2em] text-white/30 mb-1">Mileage</p>
                         <p className="font-mono text-sm text-white/80 mt-1">{selectedVehicle.mileage.toLocaleString()} mi</p>
                      </div>
                   </div>

                   {/* Form Placeholder - Refined */}
                   <div className="mt-auto pb-12">
                      <p className="text-[9px] uppercase tracking-[0.2em] text-tj-gold mb-4 border-b border-white/[0.04] pb-2">Express Interest</p>
                      <form onSubmit={handleSubmit} className="space-y-4">
                         <input type="text" placeholder="Name" className="w-full bg-transparent border-b border-white/[0.08] py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-tj-gold transition-colors font-light" />
                         <input type="tel" placeholder="Phone" className="w-full bg-transparent border-b border-white/[0.08] py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-tj-gold transition-colors font-light" />
                         <button type="submit" className="w-full btn-luxury mt-4 flex items-center justify-center gap-2">
                            Request Dossier <ArrowUpRight size={14} />
                         </button>
                      </form>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <ImageGallery images={modalImages} initialIndex={lightboxIndex} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      <ImageGallery images={cardGalleryImages} initialIndex={cardGalleryIndex} isOpen={cardGalleryOpen} onClose={() => setCardGalleryOpen(false)} />
    </div>
    </>
  );
};

export default Inventory;