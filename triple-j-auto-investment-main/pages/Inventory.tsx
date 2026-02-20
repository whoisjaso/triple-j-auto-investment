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
import type { UrgencyBadgeData } from '../services/urgencyService';

type SortOption = 'alphabetical' | 'price_desc' | 'price_asc' | 'year_desc' | 'year_asc' | 'mileage_asc';

const isRentable = (_v: Vehicle): boolean => true;

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: () => void;
  onImageClick: (imgIndex: number) => void;
  getBadges: (vehicle: Vehicle) => UrgencyBadgeData[];
}

// --- VEHICLE CARD COMPONENT (Swipeable Carousel + Sleek Design) ---
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

  // Swipe gesture handler (pattern from ImageGallery.tsx)
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold || info.velocity.x > 0.5) {
      setImgIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    } else if (info.offset.x < -threshold || info.velocity.x < -0.5) {
      setImgIndex(prev => (prev + 1) % images.length);
    }
  };

  const isSold = vehicle.status === VehicleStatus.SOLD;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      onClick={onClick}
      className="group relative bg-black transition-all duration-500 ease-out hover:shadow-[0_0_50px_rgba(212,175,55,0.12)] hover:z-30 hover:-translate-y-1 border border-white/[0.06] hover:border-tj-gold/30 flex flex-col h-full cursor-pointer select-none overflow-hidden"
    >
      {/* Image Area — Swipeable, 16:10 aspect for full car view */}
      <div
        className={`relative aspect-[16/10] overflow-hidden bg-gray-900 ${!isSold && images.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onClick={handleImageClick}
      >
        {/* Badges — Top Row */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start pointer-events-none">
          <div className={`px-2.5 py-1 text-[7px] font-bold uppercase tracking-[0.2em] backdrop-blur-md shadow-lg ${vehicle.status === 'Available' ? 'border border-tj-gold/60 text-tj-gold bg-black/80' : 'border border-gray-700 text-gray-400 bg-black/80'}`}>
            {vehicle.status === 'Available' ? `${t.common.available.toUpperCase()}` : vehicle.status.toUpperCase()}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {vehicle.status === VehicleStatus.AVAILABLE && (
              <div className="px-2.5 py-1 text-[7px] font-bold uppercase tracking-[0.15em] bg-tj-gold text-black shadow-lg">
                {t.common.saleAndRental}
              </div>
            )}
            {vehicle.isVerified && (
              <div className="pointer-events-auto">
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

        {/* SOLD Overlay */}
        {isSold && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <div className="transform -rotate-12 bg-tj-gold border-y-4 border-white shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[120%] flex justify-center py-3">
              <span className="font-display font-black text-5xl md:text-6xl tracking-[0.3em] text-black uppercase">
                {t.common.sold.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Swipeable Image */}
        <motion.img
          key={imgIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          src={images[imgIndex]}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          loading="lazy"
          drag={!isSold && images.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          className={`w-full h-full object-cover transition-all duration-700 ${isSold ? 'grayscale opacity-40' : 'opacity-95 group-hover:opacity-100 group-hover:scale-[1.03]'}`}
        />

        {/* Image count badge */}
        {images.length > 1 && !isSold && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-black/60 backdrop-blur-sm text-[9px] font-mono text-white/80 tracking-wider pointer-events-none">
            {imgIndex + 1} / {images.length}
          </div>
        )}

        {/* Carousel Arrow Controls */}
        {images.length > 1 && !isSold && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-0 top-0 bottom-0 z-30 w-12 flex items-center justify-center bg-gradient-to-r from-black/40 to-transparent text-white/60 hover:text-white active:text-tj-gold transition-all opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft size={24} strokeWidth={1.5} />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-0 top-0 bottom-0 z-30 w-12 flex items-center justify-center bg-gradient-to-l from-black/40 to-transparent text-white/60 hover:text-white active:text-tj-gold transition-all opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight size={24} strokeWidth={1.5} />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {images.length > 1 && !isSold && (
          <div className="absolute bottom-3 left-0 w-full flex justify-center gap-1.5 z-20 pointer-events-none">
            {images.map((_, i) => (
              <div key={i} className={`h-[3px] rounded-full transition-all duration-300 ${i === imgIndex ? 'bg-tj-gold w-5 shadow-[0_0_8px_rgba(212,175,55,0.6)]' : 'bg-white/25 w-[6px]'}`} />
            ))}
          </div>
        )}

        {/* Bottom gradient fade into content */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
      </div>

      {/* Content — Compact & Clean */}
      <div className="px-5 pt-4 pb-5 relative flex flex-col flex-grow">
        {/* Vehicle Info Row */}
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0 flex-1">
            {(lang === 'es' ? vehicle.identityHeadlineEs : vehicle.identityHeadline) && (
              <p className="text-[8px] uppercase tracking-[0.15em] text-tj-gold/70 mb-1 truncate">
                {lang === 'es' ? vehicle.identityHeadlineEs : vehicle.identityHeadline}
              </p>
            )}
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1 group-hover:text-tj-gold/60 transition-colors">{vehicle.year} {vehicle.make}</p>
            <h3 className="font-display text-xl md:text-2xl text-white group-hover:text-tj-gold transition-colors leading-none tracking-tight truncate">
              {vehicle.model}
            </h3>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <span className="text-[9px] font-mono text-gray-400 block">{vehicle.mileage.toLocaleString()} mi</span>
          </div>
        </div>

        {/* Price + Dual CTA Row */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.04]">
          <div>
            <p className="font-display text-lg text-white tracking-wider">
              {vehicle.price > 0 ? `$${vehicle.price.toLocaleString()}` : 'INQUIRE'}
            </p>
            {vehicle.dailyRate && (
              <p className="text-[9px] font-mono text-tj-gold mt-0.5">${vehicle.dailyRate}{t.common.perDay}</p>
            )}
          </div>

          {!isSold && (
            <div className="flex gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="group/btn px-3 py-2.5 min-h-[44px] text-[9px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:bg-white/10 hover:text-white hover:border-white/20"
              >
                {t.common.expressInterest}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className="group/btn px-3 py-2.5 min-h-[44px] text-[9px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 bg-tj-gold/10 text-tj-gold border border-tj-gold/20 hover:bg-tj-gold hover:text-black hover:border-tj-gold"
              >
                {t.common.bookNow}
              </button>
              <Link
                to={`/vehicles/${vehicle.slug || generateVehicleSlug(vehicle.year, vehicle.make, vehicle.model, vehicle.id)}`}
                onClick={(e) => e.stopPropagation()}
                className="group/btn px-3 py-2.5 min-h-[44px] text-[9px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 bg-white/[0.04] text-gray-400 border border-white/[0.08] hover:bg-white/10 hover:text-white hover:border-white/20 flex items-center gap-1"
              >
                {t.vehicleDetail.viewDetails}
                <ArrowUpRight size={10} />
              </Link>
            </div>
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

  // Modal State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'specs' | 'transparency' | 'purchase' | 'rent'>('overview');
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '' });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState<string>('');

  // Phone number formatting helper
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setLeadForm({ ...leadForm, phone: formatted });
    // Clear error when user starts typing
    if (formError) setFormError('');
  };

  // Modal Carousel State
  const [modalImgIndex, setModalImgIndex] = useState(0);

  // Lightbox State (from within the detail modal)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Card-level fullscreen image viewer state (direct from inventory grid)
  const [cardGalleryImages, setCardGalleryImages] = useState<string[]>([]);
  const [cardGalleryIndex, setCardGalleryIndex] = useState(0);
  const [cardGalleryOpen, setCardGalleryOpen] = useState(false);

  // Accessibility: refs for focus management
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Use scroll lock hook for modal only (ImageGallery handles its own lock)
  // When lightbox is open, let ImageGallery handle scroll lock to avoid double-locking
  useScrollLock(!!selectedVehicle && !lightboxOpen);

  // Set mobile viewport height variable for proper fullscreen
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  // Derive unique makes for dropdown
  const uniqueMakes = useMemo(() => {
    const makes = [...new Set(vehicles.map(v => v.make))].filter(Boolean).sort();
    return ['All', ...makes];
  }, [vehicles]);

  const filteredVehicles = vehicles.filter(v => {
    // Filter by status
    const matchesStatus = filter === 'All' || v.status === filter;

    // Filter by make
    const matchesMake = makeFilter === 'All' || v.make === makeFilter;

    // Filter by search term
    const matchesSearch = searchTerm === '' ||
      v.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.year.toString().includes(searchTerm) ||
      v.vin.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by listing type
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

  // Phase 15: Saved vehicles filter
  const displayVehicles = showSavedOnly
    ? sortedVehicles.filter(v => savedIds.includes(v.id))
    : sortedVehicles;

  const handleOpenModal = useCallback((vehicle: Vehicle) => {
    // Store trigger element for focus restoration
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
    // Restore focus to the element that opened the modal
    requestAnimationFrame(() => {
      triggerRef.current?.focus();
    });
  }, []);

  // Open fullscreen image viewer directly from inventory card
  const handleCardImageClick = useCallback((vehicle: Vehicle, imgIndex: number) => {
    const images = [vehicle.imageUrl, ...(vehicle.gallery || [])].filter(Boolean);
    setCardGalleryImages(images);
    setCardGalleryIndex(imgIndex);
    setCardGalleryOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate phone number (must be 10 digits)
    const phoneDigits = leadForm.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setFormError(t.inventory.formErrors.invalidPhone);
      setSubmitStatus('error');
      return;
    }

    // Validate name
    if (!leadForm.name.trim()) {
      setFormError(t.inventory.formErrors.nameRequired);
      setSubmitStatus('error');
      return;
    }

    setSubmitStatus('submitting');

    try {
      // Add lead to store
      await addLead({
        id: Math.random().toString(36).substr(2, 9),
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone,
        interest: `Interest in ${selectedVehicle?.year} ${selectedVehicle?.make} ${selectedVehicle?.model} (VIN: ${selectedVehicle?.vin})`,
        date: new Date().toISOString(),
        status: 'New'
      });

      // Trigger Divine outbound call via Retell AI
      if (selectedVehicle) {
        const callResult = await triggerOutboundCall({
          customer_name: leadForm.name.trim(),
          phone_number: `+1${phoneDigits}`,
          email: leadForm.email.trim(),
          vehicle_year: selectedVehicle.year.toString(),
          vehicle_make: selectedVehicle.make,
          vehicle_model: selectedVehicle.model,
          vehicle_full: `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`,
          vehicle_price: selectedVehicle.price > 0 ? `$${selectedVehicle.price.toLocaleString()}` : 'Inquire',
          vehicle_condition: selectedVehicle.description || 'No known issues',
          vehicle_status: selectedVehicle.status,
          vehicle_id: selectedVehicle.id,
          inquiry_source: 'Website Inventory',
          inquiry_timestamp: new Date().toISOString()
        });

        if (!callResult.success) {
          console.error('Retell call failed:', callResult.error);
          // Still show success since lead was saved - just log the call failure
        }
      }

      setSubmitStatus('success');
    } catch (error) {
      console.error('Failed to submit lead:', error);
      setFormError(t.inventory.formErrors.genericError);
      setSubmitStatus('error');
    }
  };

  const handleRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const phoneDigits = leadForm.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setFormError(t.inventory.formErrors.invalidPhone);
      setSubmitStatus('error');
      return;
    }
    if (!leadForm.name.trim()) {
      setFormError(t.inventory.formErrors.nameRequired);
      setSubmitStatus('error');
      return;
    }

    setSubmitStatus('submitting');
    try {
      await addLead({
        id: Math.random().toString(36).substr(2, 9),
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone,
        interest: `RENTAL inquiry: ${selectedVehicle?.year} ${selectedVehicle?.make} ${selectedVehicle?.model} (VIN: ${selectedVehicle?.vin})`,
        date: new Date().toISOString(),
        status: 'New'
      });

      if (selectedVehicle) {
        const callResult = await triggerOutboundCall({
          customer_name: leadForm.name.trim(),
          phone_number: `+1${phoneDigits}`,
          email: leadForm.email.trim(),
          vehicle_year: selectedVehicle.year.toString(),
          vehicle_make: selectedVehicle.make,
          vehicle_model: selectedVehicle.model,
          vehicle_full: `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`,
          vehicle_price: selectedVehicle.dailyRate ? `$${selectedVehicle.dailyRate}/day` : 'Inquire',
          vehicle_condition: selectedVehicle.description || 'No known issues',
          vehicle_status: 'Rental Inquiry',
          vehicle_id: selectedVehicle.id,
          inquiry_source: 'Website Rental Inquiry',
          inquiry_timestamp: new Date().toISOString()
        });
        if (!callResult.success) {
          console.error('Retell rental call failed:', callResult.error);
        }
      }
      setSubmitStatus('success');
    } catch (error) {
      console.error('Failed to submit rental lead:', error);
      setFormError(t.inventory.formErrors.genericError);
      setSubmitStatus('error');
    }
  };

  // For Modal Image Carousel
  const modalImages = selectedVehicle ? [selectedVehicle.imageUrl, ...(selectedVehicle.gallery || [])].filter(Boolean) : [];
  const nextModalImg = () => setModalImgIndex(prev => (prev + 1) % modalImages.length);
  const prevModalImg = () => setModalImgIndex(prev => (prev === 0 ? modalImages.length - 1 : prev - 1));

  // Focus modal on open
  useEffect(() => {
    if (selectedVehicle && modalRef.current) {
      modalRef.current.focus();
    }
  }, [selectedVehicle]);

  // Key press handler for gallery + focus trap
  useEffect(() => {
    if (!selectedVehicle) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextModalImg();
      if (e.key === 'ArrowLeft') prevModalImg();
      if (e.key === 'Escape') handleCloseModal();
      // Focus trap: cycle Tab within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedVehicle, modalImages.length, handleCloseModal]);

  return (
    <>
    <SEO
      title="Used Cars for Sale in Houston | Triple J Auto Investment"
      description="Browse affordable used cars, trucks, and SUVs in Houston. Vehicles from $3,000-$8,000 with transparent pricing. Visit us at 8774 Almeda Genoa Rd or call (832) 400-9760."
      path="/inventory"
    />
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
              <p className="text-tj-gold uppercase tracking-[0.4em] text-[10px]">{t.inventory.subtext}</p>
            </div>
            <motion.h1
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="font-display text-5xl md:text-8xl text-white tracking-tight leading-none"
            >
              {t.inventory.title.toUpperCase()}
            </motion.h1>
          </div>

          <div className="flex flex-col items-end gap-6 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={t.inventory.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black border border-white/10 pl-12 pr-4 py-4 text-white placeholder-gray-500 text-sm focus:border-tj-gold focus:outline-none focus:ring-2 focus:ring-tj-gold/50 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-tj-gold transition-colors"
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
                    className="appearance-none bg-black text-white pl-4 pr-10 py-3 text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-tj-gold/50 focus:bg-white/5 transition-colors cursor-pointer w-full md:min-w-[200px]"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                  >
                    <option className="bg-black text-white" value="alphabetical">A-Z</option>
                    <option className="bg-black text-white" value="price_desc">{t.inventory.sortOptions.priceHighLow}</option>
                    <option className="bg-black text-white" value="price_asc">{t.inventory.sortOptions.priceLowHigh}</option>
                    <option className="bg-black text-white" value="year_desc">{t.inventory.sortOptions.yearNewest}</option>
                    <option className="bg-black text-white" value="year_asc">{t.inventory.sortOptions.yearOldest}</option>
                    <option className="bg-black text-white" value="mileage_asc">{t.inventory.sortOptions.mileageLowHigh}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-tj-gold">
                    <ArrowDownUp size={10} />
                  </div>
                </div>
              </div>

              {/* Make Filter Dropdown */}
              <div className="flex items-center gap-4 bg-tj-dark border border-white/10 p-1 w-full md:w-auto">
                <div className="relative group w-full">
                  <select
                    className="appearance-none bg-black text-white pl-4 pr-10 py-3 text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-tj-gold/50 focus:bg-white/5 transition-colors cursor-pointer w-full md:min-w-[160px]"
                    value={makeFilter}
                    onChange={(e) => setMakeFilter(e.target.value)}
                  >
                    {uniqueMakes.map(make => (
                      <option key={make} className="bg-black text-white" value={make}>
                        {make === 'All' ? t.inventory.sortOptions.allMakes : make}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-tj-gold">
                    <Car size={10} />
                  </div>
                </div>
              </div>

              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-4 bg-tj-dark border border-white/10 p-1 w-full md:w-auto">
                <div className="relative group w-full">
                  <select
                    className="appearance-none bg-black text-white pl-4 pr-10 py-3 text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-tj-gold/50 focus:bg-white/5 transition-colors cursor-pointer w-full md:min-w-[160px]"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                  >
                    <option className="bg-black text-white" value="All">{t.common.viewAll}</option>
                    <option className="bg-black text-white" value={VehicleStatus.AVAILABLE}>{t.common.available}</option>
                    <option className="bg-black text-white" value={VehicleStatus.PENDING}>{t.common.pending}</option>
                    <option className="bg-black text-white" value={VehicleStatus.SOLD}>{t.common.sold}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-tj-gold">
                    <Hexagon size={10} fill="currentColor" />
                  </div>
                </div>
              </div>

              {/* Listing Type Filter */}
              <div className="flex items-center gap-4 bg-tj-dark border border-white/10 p-1 w-full md:w-auto">
                <div className="relative group w-full">
                  <select
                    className="appearance-none bg-black text-white pl-4 pr-10 py-3 text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-tj-gold/50 focus:bg-white/5 transition-colors cursor-pointer w-full md:min-w-[140px]"
                    value={listingTypeFilter}
                    onChange={(e) => setListingTypeFilter(e.target.value as any)}
                  >
                    <option className="bg-black text-white" value="all">{t.common.allListings}</option>
                    <option className="bg-black text-white" value="sale">{t.common.forSale}</option>
                    <option className="bg-black text-white" value="rental">{t.common.forRent}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-tj-gold">
                    <Key size={10} />
                  </div>
                </div>
              </div>

              {/* Saved Vehicles Filter */}
              {savedCount > 0 && (
                <button
                  onClick={() => setShowSavedOnly(!showSavedOnly)}
                  className={`flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] border transition-all min-h-[44px] ${
                    showSavedOnly
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-white/[0.04] text-gray-400 border-white/[0.08] hover:bg-white/[0.08]'
                  }`}
                >
                  <Heart size={12} className={showSavedOnly ? 'fill-red-400' : ''} />
                  {t.engagement?.saved || 'Saved'} ({savedCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Phase 16: Recently Viewed Row */}
        {!isLoading && recentIds.length > 0 && (
          <div className="py-8 border-b border-white/[0.06] mb-8">
            <RecentlyViewedRow vehicleIds={recentIds} />
          </div>
        )}

        {/* Loading State: Skeleton Grid */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 mt-8 md:mt-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-black border border-white/5 overflow-hidden">
                <div className="aspect-[4/3] bg-gray-800 animate-pulse" />
                <div className="p-6 md:p-8 space-y-4">
                  <div className="h-3 w-16 bg-gray-800 animate-pulse rounded" />
                  <div className="h-7 w-40 bg-gray-800 animate-pulse rounded" />
                  <div className="h-px w-12 bg-gray-800" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-gray-800 animate-pulse rounded" />
                    <div className="h-3 w-3/4 bg-gray-800 animate-pulse rounded" />
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-white/5">
                    <div className="h-6 w-24 bg-gray-800 animate-pulse rounded" />
                    <div className="h-10 w-28 bg-gray-800 animate-pulse rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State: Connection/fetch failure */}
        {!isLoading && connectionError && sortedVehicles.length === 0 && (
          <div className="py-20 text-center border border-red-900/30 mt-8 md:mt-12 bg-red-900/5">
            <WifiOff size={48} className="mx-auto text-red-500/80 mb-6" />
            <p className="font-display text-2xl text-white tracking-widest uppercase mb-3">
              {t.polish.errorLoadFailed}
            </p>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-8">
              {t.polish.errorCallUs} <a href="tel:+18324009760" className="text-tj-gold hover:text-white transition-colors">{t.common.phone}</a>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => refreshVehicles()}
                className="text-xs uppercase tracking-[0.3em] bg-tj-gold text-black hover:bg-white px-8 py-4 transition-all flex items-center gap-2 font-bold"
              >
                <RefreshCw size={14} /> {t.polish.errorTryAgain}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="text-xs uppercase tracking-[0.3em] text-tj-gold hover:text-white border border-tj-gold/30 hover:border-tj-gold px-8 py-4 transition-all flex items-center gap-2 font-bold"
              >
                <RefreshCw size={14} /> {t.polish.errorReload}
              </button>
            </div>
          </div>
        )}

        {/* Empty State: Fetch succeeded but zero vehicles */}
        {!isLoading && !connectionError && sortedVehicles.length === 0 && (
          <div className="py-20 text-center border border-tj-gold/20 mt-8 md:mt-12 bg-tj-gold/5">
            <PackageOpen size={48} className="mx-auto text-tj-gold/60 mb-6" />
            <p className="font-display text-2xl text-white tracking-widest uppercase mb-3">
              {t.polish.emptyInventory}
            </p>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-8">
              {t.polish.emptyInventorySubtext}
            </p>
            <a
              href="tel:+18324009760"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] bg-tj-gold text-black hover:bg-white px-8 py-4 transition-all font-bold"
            >
              <Phone size={14} /> {t.common.phone}
            </a>
          </div>
        )}

        {/* Saved Filter Empty State */}
        {!isLoading && sortedVehicles.length > 0 && displayVehicles.length === 0 && showSavedOnly && (
          <div className="py-20 text-center mt-8 md:mt-12">
            <Heart size={48} className="mx-auto text-gray-600 mb-6" />
            <p className="font-display text-2xl text-white tracking-widest uppercase mb-3">
              {t.engagement?.noSavedVehicles || 'No Saved Vehicles'}
            </p>
            <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
              {t.engagement?.tapToSave || 'Tap the heart icon on any vehicle to save it here.'}
            </p>
            <button
              onClick={() => setShowSavedOnly(false)}
              className="text-xs uppercase tracking-[0.3em] text-tj-gold hover:text-white border border-tj-gold/30 hover:border-tj-gold px-8 py-4 transition-all font-bold"
            >
              {t.engagement?.viewAllInventory || 'View All Inventory'}
            </button>
          </div>
        )}

        {/* Vehicle Grid: Has vehicles to display */}
        {!isLoading && displayVehicles.length > 0 && (
          <motion.div
            layout
            className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 mt-8 md:mt-12"
          >
            <AnimatePresence mode="popLayout">
              {displayVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onClick={() => handleOpenModal(vehicle)}
                  onImageClick={(imgIndex) => handleCardImageClick(vehicle, imgIndex)}
                  getBadges={getBadges}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* VEHICLE DETAIL MODAL */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedVehicle && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
              style={{ overscrollBehavior: 'none' }}
            >

              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/90 backdrop-blur-lg"
                onClick={handleCloseModal}
                aria-hidden="true"
              />

              {/* Modal Container */}
              <motion.div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-label={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} details`}
                tabIndex={-1}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="relative w-full h-screen md:h-[90vh] md:max-h-[900px] max-w-6xl bg-black md:border border-white/[0.08] shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col md:flex-row overflow-hidden focus:outline-none"
                style={{ height: 'calc(var(--vh, 1vh) * 100)', maxHeight: '100vh' }}
              >

                {/* Close Button */}
                <button
                  onClick={handleCloseModal}
                  aria-label="Close vehicle details"
                  className="absolute top-4 right-4 z-40 w-11 h-11 flex items-center justify-center text-white/60 hover:text-white bg-black/60 backdrop-blur-md border border-white/10 hover:border-white/30 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-tj-gold"
                >
                  <X size={18} />
                </button>

                {/* LEFT: Image Gallery */}
                <div className="w-full md:w-[55%] h-[38%] md:h-full bg-black relative flex flex-col shrink-0">
                  <div className="flex-grow relative overflow-hidden group select-none">
                    {/* Main Image */}
                    <button
                      onClick={() => { setLightboxIndex(modalImgIndex); setLightboxOpen(true); }}
                      className="w-full h-full cursor-zoom-in"
                    >
                      <motion.img
                        key={modalImgIndex}
                        initial={{ opacity: 0.6 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        src={modalImages[modalImgIndex]}
                        alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                        className="w-full h-full object-contain bg-black"
                      />
                    </button>

                    {/* Image Counter */}
                    {modalImages.length > 1 && (
                      <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-black/50 backdrop-blur-sm text-[10px] font-mono text-white/70 tracking-wider pointer-events-none">
                        {modalImgIndex + 1} / {modalImages.length}
                      </div>
                    )}

                    {/* Fullscreen Hint */}
                    <div className="absolute top-4 right-16 md:right-4 z-20 px-3 py-1.5 bg-black/50 backdrop-blur-sm text-[9px] text-white/40 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-1.5">
                      <ZoomIn size={12} /> {t.inventory.modal.fullscreen}
                    </div>

                    {/* Carousel Controls */}
                    {modalImages.length > 1 && (
                      <>
                        <button onClick={prevModalImg} className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/50 to-transparent text-white/40 flex items-center justify-center hover:text-white transition-colors z-20">
                          <ChevronLeft size={28} strokeWidth={1.5} />
                        </button>
                        <button onClick={nextModalImg} className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/50 to-transparent text-white/40 flex items-center justify-center hover:text-white transition-colors z-20">
                          <ChevronRight size={28} strokeWidth={1.5} />
                        </button>
                      </>
                    )}

                    {/* Dot Indicators (Mobile) */}
                    {modalImages.length > 1 && (
                      <div className="absolute bottom-3 left-0 w-full flex justify-center gap-1.5 z-20 pointer-events-none md:hidden">
                        {modalImages.map((_, i) => (
                          <div key={i} className={`h-[3px] rounded-full transition-all duration-300 ${i === modalImgIndex ? 'bg-tj-gold w-5' : 'bg-white/30 w-[6px]'}`} />
                        ))}
                      </div>
                    )}

                    {/* Bottom Gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

                    {/* Mobile Vehicle Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 z-20 md:hidden pointer-events-none">
                      <p className="text-[9px] uppercase tracking-[0.3em] text-tj-gold mb-1">{selectedVehicle.year} {selectedVehicle.make}</p>
                      <h2 className="text-white font-display text-2xl leading-none tracking-tight">{selectedVehicle.model}</h2>
                    </div>
                  </div>

                  {/* Desktop Thumbnail Strip */}
                  {modalImages.length > 1 && (
                    <div className="hidden md:flex h-20 bg-black border-t border-white/[0.06] overflow-x-auto scrollbar-none">
                      {modalImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setModalImgIndex(idx)}
                          className={`h-full aspect-[4/3] relative flex-shrink-0 transition-all ${modalImgIndex === idx ? 'opacity-100 ring-1 ring-inset ring-tj-gold' : 'opacity-30 hover:opacity-70'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* RIGHT: Content Panel */}
                <div className="w-full md:w-[45%] flex flex-col bg-[#060606] h-[62%] md:h-full relative">

                  {/* Desktop Vehicle Header */}
                  <div className="hidden md:flex flex-col p-7 pb-5 border-b border-white/[0.06] shrink-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[9px] uppercase tracking-[0.3em] text-gray-400 mb-2">{selectedVehicle.year} {selectedVehicle.make}</p>
                        <h2 className="font-display text-3xl text-white leading-none tracking-tight">{selectedVehicle.model}</h2>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-tj-gold font-display text-2xl tracking-wide">
                          {selectedVehicle.price > 0 ? `$${selectedVehicle.price.toLocaleString()}` : 'INQUIRE'}
                        </p>
                        {selectedVehicle.dailyRate && (
                          <p className="text-[9px] font-mono text-gray-400 mt-1">${selectedVehicle.dailyRate}{t.common.perDay}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-gray-400">{selectedVehicle.vin}</span>
                      <span className="px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold bg-white/[0.04] border border-white/[0.08] text-gray-400">
                        {selectedVehicle.mileage.toLocaleString()} mi
                      </span>
                      <span className="px-2 py-0.5 text-[8px] uppercase tracking-widest font-bold bg-red-950/40 border border-red-900/30 text-red-400">
                        AS-IS
                      </span>
                    </div>
                  </div>

                  {/* Tab Bar */}
                  <div className="flex border-b border-white/[0.06] overflow-x-auto scrollbar-none bg-black/40 sticky top-0 z-30 shrink-0">
                    {[
                      { key: 'overview', label: t.inventory.modal.tabs.overview },
                      { key: 'specs', label: t.inventory.modal.tabs.specs },
                      { key: 'transparency', label: t.inventory.modal.tabs.transparency },
                      { key: 'purchase', label: t.inventory.modal.tabs.purchase },
                      ...(isRentable(selectedVehicle) ? [{ key: 'rent', label: t.inventory.rental.tabLabel }] : []),
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setModalTab(tab.key as typeof modalTab)}
                        className={`flex-1 py-3.5 px-3 text-[9px] uppercase tracking-[0.15em] font-bold transition-all whitespace-nowrap relative ${
                          modalTab === tab.key
                            ? 'text-tj-gold'
                            : 'text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        {tab.label}
                        {modalTab === tab.key && (
                          <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-tj-gold" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-grow p-5 md:p-7 overflow-y-auto custom-scrollbar bg-[#060606] pb-28 md:pb-6">

                    {/* OVERVIEW TAB */}
                    {modalTab === 'overview' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-1">
                          <div className="p-3 bg-white/[0.02] border border-white/[0.06] text-center">
                            <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-1">{t.common.mileage}</p>
                            <p className="text-white font-mono text-sm">{selectedVehicle.mileage.toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-white/[0.02] border border-white/[0.06] text-center">
                            <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-1">{t.common.price}</p>
                            <p className="text-tj-gold font-display text-sm">${selectedVehicle.price.toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-white/[0.02] border border-white/[0.06] text-center">
                            <p className="text-[8px] uppercase tracking-widest text-gray-400 mb-1">{t.common.status}</p>
                            <p className="text-white text-sm">{selectedVehicle.status}</p>
                          </div>
                        </div>

                        {/* Rental Rates */}
                        {isRentable(selectedVehicle) && selectedVehicle.dailyRate && (
                          <div className="flex items-center justify-between p-4 bg-tj-gold/[0.03] border border-tj-gold/20">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center bg-tj-gold/10 border border-tj-gold/30">
                                <Key size={14} className="text-tj-gold" />
                              </div>
                              <div>
                                <p className="text-white font-mono text-sm">
                                  ${selectedVehicle.dailyRate}{t.common.perDay}
                                  {selectedVehicle.weeklyRate && (
                                    <span className="text-gray-400 text-xs ml-2">/ ${selectedVehicle.weeklyRate}{t.common.perWeek}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setModalTab('rent')}
                              className="px-4 py-2.5 min-h-[44px] bg-tj-gold text-black text-[9px] uppercase tracking-widest font-bold hover:bg-white transition-colors"
                            >
                              {t.common.bookNow}
                            </button>
                          </div>
                        )}

                        {/* Description */}
                        {selectedVehicle.description && (
                          <div className="py-4 border-y border-white/[0.04]">
                            <p className="text-gray-400 text-sm leading-relaxed">
                              {selectedVehicle.description}
                            </p>
                          </div>
                        )}

                        {/* Condition */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold flex items-center gap-2">
                              <ShieldAlert size={12} className="text-tj-gold" /> {t.inventory.modal.conditionReport}
                            </h4>
                            <button
                              onClick={() => setModalTab('transparency')}
                              className="text-[9px] uppercase tracking-widest text-gray-400 hover:text-tj-gold transition-colors"
                            >
                              {t.inventory.modal.viewFullReport}
                            </button>
                          </div>
                          {selectedVehicle.diagnostics && selectedVehicle.diagnostics.length > 0 ? (
                            <div className="space-y-1.5">
                              {selectedVehicle.diagnostics.slice(0, 3).map((issue, i) => (
                                <div key={i} className="flex items-start gap-2 p-2.5 bg-white/[0.02] border border-white/[0.04]">
                                  <AlertTriangle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-[11px] text-gray-400 font-mono leading-relaxed">{issue}</p>
                                </div>
                              ))}
                              {selectedVehicle.diagnostics.length > 3 && (
                                <p className="text-[10px] text-gray-400 pl-2">+ {selectedVehicle.diagnostics.length - 3} {t.inventory.modal.moreNoted}</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-3 bg-green-950/20 border border-green-900/20">
                              <CheckCircle size={14} className="text-green-500" />
                              <p className="text-[11px] text-green-400">{t.inventory.modal.noIssues}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons (Desktop) */}
                        <div className="hidden md:flex gap-2 pt-2">
                          <button
                            onClick={() => setModalTab('purchase')}
                            className="flex-1 py-3.5 min-h-[44px] text-[9px] font-bold uppercase tracking-[0.2em] bg-white/[0.04] text-gray-300 border border-white/[0.08] hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
                          >
                            {t.inventory.modal.tabs.purchase}
                          </button>
                          <button
                            onClick={() => setModalTab('rent')}
                            className="flex-1 py-3.5 min-h-[44px] text-[9px] font-bold uppercase tracking-[0.2em] bg-tj-gold text-black hover:bg-white transition-all active:scale-[0.98]"
                          >
                            {t.common.bookNow}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* SPECS TAB */}
                    {modalTab === 'specs' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        {/* VIN */}
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06]">
                          <div>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">VIN</p>
                            <p className="text-white font-mono text-xs tracking-wider">{selectedVehicle.vin}</p>
                          </div>
                          <Fingerprint size={20} className="text-tj-gold/20" />
                        </div>

                        {/* Spec Rows */}
                        <div className="space-y-0">
                          {[
                            { label: t.common.year, value: selectedVehicle.year.toString() },
                            { label: t.inventory.modal.specs.make, value: selectedVehicle.make },
                            { label: t.inventory.modal.specs.model, value: selectedVehicle.model },
                            { label: t.common.mileage, value: `${selectedVehicle.mileage.toLocaleString()} mi` },
                          ].map((spec, i) => (
                            <div key={i} className="flex justify-between items-center py-3 border-b border-white/[0.04]">
                              <span className="text-gray-400 text-xs">{spec.label}</span>
                              <span className="text-white text-sm font-mono">{spec.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Systems */}
                        <div>
                          <h4 className="text-[9px] uppercase tracking-[0.2em] text-tj-gold font-bold mb-4 flex items-center gap-2">
                            <Eye size={12} /> {t.inventory.modal.specs.exterior}
                          </h4>
                          <div className="space-y-0">
                            {[t.inventory.modal.specs.paintFinish, t.inventory.modal.specs.bodyIntegrity, t.inventory.modal.specs.glassOptics].map((item, i) => (
                              <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/[0.04]">
                                <span className="text-gray-400 text-xs">{item}</span>
                                <span className="flex items-center gap-1.5 text-xs">
                                  <CheckCircle size={11} className="text-green-500/60" />
                                  <span className="text-gray-300 font-mono">{t.inventory.modal.specs.inspected}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[9px] uppercase tracking-[0.2em] text-tj-gold font-bold mb-4 flex items-center gap-2">
                            <Layers size={12} /> {t.inventory.modal.specs.interior}
                          </h4>
                          <div className="space-y-0">
                            {[t.inventory.modal.specs.upholstery, t.inventory.modal.specs.controlsElectronics, t.inventory.modal.specs.climateSystem].map((item, i) => (
                              <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/[0.04]">
                                <span className="text-gray-400 text-xs">{item}</span>
                                <span className="flex items-center gap-1.5 text-xs">
                                  <CheckCircle size={11} className="text-green-500/60" />
                                  <span className="text-gray-300 font-mono">{t.inventory.modal.specs.functional}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TRANSPARENCY TAB */}
                    {modalTab === 'transparency' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                        <div className="p-4 bg-tj-gold/[0.03] border border-tj-gold/20">
                          <h4 className="text-[9px] uppercase tracking-[0.2em] text-tj-gold font-bold mb-2 flex items-center gap-2">
                            <ShieldAlert size={12} /> {t.inventory.modal.transparencyProtocol}
                          </h4>
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {t.inventory.modal.transparencyDesc}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-[9px] uppercase tracking-[0.2em] text-gray-400 font-bold flex items-center gap-2 mb-3">
                            <ClipboardCheck size={12} className="text-tj-gold" /> {t.inventory.modal.diagnosticLog}
                          </h4>
                          {selectedVehicle.diagnostics && selectedVehicle.diagnostics.length > 0 ? (
                            <div className="space-y-1.5">
                              {selectedVehicle.diagnostics.map((issue, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.04]">
                                  <span className="text-tj-gold text-[10px] font-mono mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                                  <p className="text-xs text-gray-400 font-mono leading-relaxed">{issue}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-10 border border-white/[0.04]">
                              <CheckCircle className="mx-auto text-green-500/60 mb-3" size={28} />
                              <p className="text-xs text-gray-400 uppercase tracking-widest">{t.inventory.modal.noFaultsLogged}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06]">
                          <MapPin size={14} className="text-gray-400" />
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-gray-400">{t.inventory.modal.location}</p>
                            <p className="text-gray-300 text-xs">Houston, TX (77075)</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* PURCHASE TAB */}
                    {modalTab === 'purchase' && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col">
                        {submitStatus === 'success' ? (
                          <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
                              className="relative mb-8"
                            >
                              <div className="w-20 h-20 rounded-full border-2 border-tj-gold/40 flex items-center justify-center bg-tj-gold/5">
                                <CheckCircle className="text-tj-gold" size={36} />
                              </div>
                              <div className="absolute -inset-3 rounded-full border border-tj-gold/10 animate-pulse" />
                            </motion.div>
                            <h3 className="font-display text-2xl text-white tracking-wider mb-3">{t.inventory.modal.allSet}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-1">
                              {t.inventory.modal.advisorMsg}
                            </p>
                            <p className="text-tj-gold font-display text-lg tracking-wide mb-8">
                              {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                            </p>
                            <div className="w-full max-w-sm space-y-3">
                              <a href="tel:+18324009760" className="w-full flex items-center justify-center gap-2 bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors">
                                <Phone size={16} /> {t.inventory.modal.callUsNow}
                              </a>
                              <button onClick={handleCloseModal} className="w-full py-3 text-[10px] uppercase tracking-widest text-gray-400 hover:text-white transition-colors">
                                {t.inventory.modal.backToInventory}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                            {/* Vehicle Summary */}
                            <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.06] mb-5">
                              <img src={modalImages[0]} alt="" className="w-14 h-10 object-cover opacity-80" />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-display text-sm truncate">{selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}</p>
                                <p className="text-gray-400 text-[9px] font-mono truncate">{selectedVehicle?.vin}</p>
                              </div>
                              <p className="text-tj-gold font-display text-lg flex-shrink-0">
                                {selectedVehicle && selectedVehicle.price > 0 ? `$${selectedVehicle.price.toLocaleString()}` : 'TBD'}
                              </p>
                            </div>

                            {/* Form */}
                            <div className="flex-grow space-y-3">
                              <div className="relative group/input">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-tj-gold transition-colors" />
                                <input required type="text" value={leadForm.name}
                                  onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                                  className="w-full bg-black/50 border border-white/10 pl-12 pr-4 py-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-1 focus:ring-tj-gold/30 transition-all placeholder-gray-600"
                                  placeholder={t.inventory.modal.form.name} />
                              </div>
                              <div className="relative group/input">
                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-tj-gold transition-colors" />
                                <input required type="tel" value={leadForm.phone}
                                  onChange={e => handlePhoneChange(e.target.value)}
                                  className={`w-full bg-black/50 border pl-12 pr-4 py-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-1 focus:ring-tj-gold/30 transition-all placeholder-gray-600 font-mono ${
                                    submitStatus === 'error' && formError.includes('phone') ? 'border-red-500' : 'border-white/10'
                                  }`}
                                  placeholder="(832) 400-9760" maxLength={14} />
                              </div>
                              <div className="relative group/input">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-tj-gold transition-colors" />
                                <input type="email" value={leadForm.email}
                                  onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                                  className="w-full bg-black/50 border border-white/10 pl-12 pr-4 py-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-1 focus:ring-tj-gold/30 transition-all placeholder-gray-600"
                                  placeholder="email@address.com" />
                              </div>
                              {submitStatus === 'error' && formError && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-red-950/40 border border-red-500/30">
                                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                                  <p className="text-xs text-red-400">{formError}</p>
                                </div>
                              )}
                              <div className="flex items-start gap-3 px-4 py-3 bg-white/[0.02] border border-white/[0.05]">
                                <Shield size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-gray-400 leading-relaxed">{t.inventory.modal.disclaimer}</p>
                              </div>
                            </div>
                            <button type="submit" disabled={submitStatus === 'submitting'}
                              className="w-full bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-5 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                              {submitStatus === 'submitting' ? <Loader2 className="animate-spin" size={16} /> : <>{t.inventory.modal.submit} <ArrowUpRight size={16} /></>}
                            </button>
                          </form>
                        )}
                      </motion.div>
                    )}

                    {/* RENT TAB */}
                    {modalTab === 'rent' && selectedVehicle && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col">
                        {submitStatus === 'success' ? (
                          <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }} className="relative mb-8">
                              <div className="w-20 h-20 rounded-full border-2 border-tj-gold/40 flex items-center justify-center bg-tj-gold/5">
                                <Key className="text-tj-gold" size={36} />
                              </div>
                              <div className="absolute -inset-3 rounded-full border border-tj-gold/10 animate-pulse" />
                            </motion.div>
                            <h3 className="font-display text-2xl text-white tracking-wider mb-3">{t.inventory.rental.successTitle}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-1">{t.inventory.rental.successMsg}</p>
                            <p className="text-tj-gold font-display text-lg tracking-wide mb-8">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                            <div className="w-full max-w-sm space-y-3">
                              <a href="tel:+18324009760" className="w-full flex items-center justify-center gap-2 bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-colors">
                                <Phone size={16} /> {t.common.phone}
                              </a>
                              <button onClick={handleCloseModal} className="w-full py-3 text-[10px] uppercase tracking-widest text-gray-400 hover:text-white transition-colors">{t.inventory.modal.backToInventory}</button>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleRentalSubmit} className="flex-grow flex flex-col">
                            {/* Vehicle + Rates */}
                            <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.06] mb-4">
                              <img src={modalImages[0]} alt="" className="w-14 h-10 object-cover opacity-80" />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-display text-sm truncate">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</p>
                                <p className="text-gray-400 text-[9px] font-mono truncate">{selectedVehicle.vin}</p>
                              </div>
                            </div>
                            <div className="flex border border-tj-gold/20 mb-5 overflow-hidden">
                              <div className="flex-1 p-3 bg-tj-gold/[0.04] text-center border-r border-tj-gold/20">
                                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">{t.common.dailyRate}</p>
                                <p className="text-white font-mono text-lg">{selectedVehicle.dailyRate ? `$${selectedVehicle.dailyRate}` : '—'}</p>
                              </div>
                              <div className="flex-1 p-3 bg-tj-gold/[0.04] text-center">
                                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-1">{t.common.weeklyRate}</p>
                                <p className="text-white font-mono text-lg">{selectedVehicle.weeklyRate ? `$${selectedVehicle.weeklyRate}` : '—'}</p>
                              </div>
                            </div>
                            {/* Form */}
                            <div className="flex-grow space-y-3">
                              <p className="text-gray-400 text-xs leading-relaxed mb-1">{t.inventory.rental.formSubtitle}</p>
                              <div className="relative group/input">
                                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-tj-gold transition-colors" />
                                <input required type="text" value={leadForm.name} onChange={e => setLeadForm({...leadForm, name: e.target.value})}
                                  className="w-full bg-black/50 border border-white/10 pl-12 pr-4 py-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-1 focus:ring-tj-gold/30 transition-all placeholder-gray-600"
                                  placeholder={t.inventory.modal.form.name} />
                              </div>
                              <div className="relative group/input">
                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-tj-gold transition-colors" />
                                <input required type="tel" value={leadForm.phone} onChange={e => handlePhoneChange(e.target.value)}
                                  className="w-full bg-black/50 border border-white/10 pl-12 pr-4 py-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-1 focus:ring-tj-gold/30 transition-all placeholder-gray-600 font-mono"
                                  placeholder="(832) 400-9760" maxLength={14} />
                              </div>
                              <div className="relative group/input">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-tj-gold transition-colors" />
                                <input type="email" value={leadForm.email} onChange={e => setLeadForm({...leadForm, email: e.target.value})}
                                  className="w-full bg-black/50 border border-white/10 pl-12 pr-4 py-4 text-white text-sm focus:border-tj-gold outline-none focus:ring-1 focus:ring-tj-gold/30 transition-all placeholder-gray-600"
                                  placeholder={t.inventory.modal.form.email} />
                              </div>
                              {submitStatus === 'error' && formError && (
                                <div className="flex items-center gap-2 px-4 py-3 bg-red-950/40 border border-red-500/30">
                                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                                  <p className="text-xs text-red-400">{formError}</p>
                                </div>
                              )}
                              <div className="flex items-start gap-3 px-4 py-3 bg-white/[0.02] border border-white/[0.05]">
                                <Shield size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-gray-400 leading-relaxed">{t.inventory.rental.disclaimer}</p>
                              </div>
                            </div>
                            <button type="submit" disabled={submitStatus === 'submitting'}
                              className="w-full bg-tj-gold text-black font-bold py-4 text-xs uppercase tracking-[0.3em] hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-5 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
                              {submitStatus === 'submitting' ? <Loader2 className="animate-spin" size={16} /> : <>{t.inventory.rental.submitButton} <Key size={16} /></>}
                            </button>
                          </form>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Mobile Floating Action Buttons */}
                  {modalTab !== 'purchase' && modalTab !== 'rent' && (
                    <div className="md:hidden absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black via-black/95 to-transparent z-40">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModalTab('purchase')}
                          className="flex-1 py-4 min-h-[48px] text-[9px] font-bold uppercase tracking-[0.2em] bg-white/[0.06] text-white border border-white/10 active:scale-95 transition-transform"
                        >
                          {t.inventory.modal.tabs.purchase}
                        </button>
                        <button
                          onClick={() => setModalTab('rent')}
                          className="flex-1 py-4 min-h-[48px] text-[9px] font-bold uppercase tracking-[0.2em] bg-tj-gold text-black active:scale-95 transition-transform"
                        >
                          {t.common.bookNow}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Desktop Bottom CTA */}
                  <div className="hidden md:flex items-center justify-center gap-3 border-t border-white/[0.06] p-3.5 bg-black/40 shrink-0">
                    <Phone size={14} className="text-tj-gold" />
                    <a href="tel:+18324009760" className="text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-tj-gold transition-colors font-bold">
                      (832) 400-9760
                    </a>
                    <span className="text-gray-700">|</span>
                    <Mic size={12} className="text-tj-gold animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{t.inventory.modal.aiAgent}</span>
                  </div>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Full-Screen Swipeable Image Gallery (from detail modal) */}
      <ImageGallery
        images={modalImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Full-Screen Image Gallery (direct from inventory card) */}
      <ImageGallery
        images={cardGalleryImages}
        initialIndex={cardGalleryIndex}
        isOpen={cardGalleryOpen}
        onClose={() => setCardGalleryOpen(false)}
      />
    </div>
    </>
  );
};

export default Inventory;
