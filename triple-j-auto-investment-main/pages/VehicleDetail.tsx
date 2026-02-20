import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/Store';
import { SEO } from '../components/SEO';
import { ImageGallery } from '../components/ImageGallery';
import { VehicleVerifiedBadge } from '../components/VehicleVerifiedBadge';
import { VehiclePriceBlock } from '../components/VehiclePriceBlock';
import { VehicleStorySection } from '../components/VehicleStorySection';
import { VehicleJsonLd } from '../components/VehicleJsonLd';
import { SaveButton } from '../components/SaveButton';
import { PaymentCalculator } from '../components/PaymentCalculator';
import { PhoneCaptureForm } from '../components/PhoneCaptureForm';
import { ScheduleVisitForm } from '../components/ScheduleVisitForm';
import { AskQuestionForm } from '../components/AskQuestionForm';
import { ReserveVehicleSection } from '../components/ReserveVehicleSection';
import { useUrgencyBadges } from '../hooks/useUrgencyBadges';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { parseVehicleSlug, generateVehicleSlug } from '../utils/vehicleSlug';
import { supabase } from '../supabase/config';
import { Vehicle, VehicleStatus } from '../types';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { trackEvent } from '../services/trackingService';
import { getRecommendations } from '../services/recommendationService';
import {
  ArrowLeft,
  Phone,
  Calendar,
  Car,
  Gauge,
  Hash,
  Clock,
  Share2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Bell,
  FileText,
} from 'lucide-react';

// Transform snake_case Supabase row to camelCase Vehicle (matches vehicles.ts loadVehicles)
const transformVehicle = (v: any): Vehicle => ({
  id: v.id,
  vin: v.vin,
  make: v.make,
  model: v.model,
  year: v.year,
  price: v.price,
  cost: v.cost || 0,
  costTowing: v.cost_towing || 0,
  costMechanical: v.cost_mechanical || 0,
  costCosmetic: v.cost_cosmetic || 0,
  costOther: v.cost_other || 0,
  soldPrice: v.sold_price || undefined,
  soldDate: v.sold_date || undefined,
  mileage: v.mileage,
  status: v.status as VehicleStatus,
  description: v.description || '',
  imageUrl: v.image_url || '',
  gallery: v.gallery || [],
  diagnostics: v.diagnostics || [],
  registrationStatus: v.registration_status as any,
  registrationDueDate: v.registration_due_date || undefined,
  dateAdded: v.date_added,
  listingType: v.listing_type || undefined,
  dailyRate: v.daily_rate != null ? parseFloat(v.daily_rate) : undefined,
  weeklyRate: v.weekly_rate != null ? parseFloat(v.weekly_rate) : undefined,
  minRentalDays: v.min_rental_days || undefined,
  maxRentalDays: v.max_rental_days || undefined,
  slug: v.slug || undefined,
  identityHeadline: v.identity_headline || undefined,
  identityHeadlineEs: v.identity_headline_es || undefined,
  vehicleStory: v.vehicle_story || undefined,
  vehicleStoryEs: v.vehicle_story_es || undefined,
  isVerified: v.is_verified || false,
  marketEstimate: v.market_estimate != null ? parseFloat(v.market_estimate) : undefined,
});

const VehicleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLanguage();
  const { vehicles } = useStore();
  const { addViewed, vehicleIds: recentIds } = useRecentlyViewed();
  const { getBadges } = useUrgencyBadges();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // All images for gallery
  const images = useMemo(() => {
    if (!vehicle) return [];
    return [vehicle.imageUrl, ...(vehicle.gallery || [])].filter(Boolean);
  }, [vehicle]);

  // Hero image index for the inline carousel
  const [heroIndex, setHeroIndex] = useState(0);

  // Two-phase data fetch: store first, then Supabase fallback
  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    const { shortId } = parseVehicleSlug(slug);

    // Phase 1: Check in-memory store
    const storeMatch = vehicles.find((v) => {
      // Match by slug
      const vSlug = v.slug || generateVehicleSlug(v.year, v.make, v.model, v.id);
      if (vSlug === slug) return true;
      // Match by short ID prefix
      if (v.id.startsWith(shortId)) return true;
      return false;
    });

    if (storeMatch) {
      setVehicle(storeMatch);
      setIsLoading(false);
      return;
    }

    // Phase 2: If store is still loading or vehicle not in store, query Supabase
    const fetchFromSupabase = async () => {
      try {
        // Try by slug column
        const { data: slugData, error: slugError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!slugError && slugData) {
          setVehicle(transformVehicle(slugData));
          setIsLoading(false);
          return;
        }

        // Fallback: try by short ID prefix
        const { data: idData, error: idError } = await supabase
          .from('vehicles')
          .select('*')
          .ilike('id', `${shortId}%`)
          .single();

        if (!idError && idData) {
          setVehicle(transformVehicle(idData));
          setIsLoading(false);
          return;
        }

        // Not found
        setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFromSupabase();
  }, [slug, vehicles]);

  // Phase 16: Track vehicle view + dwell, add to recently viewed
  const dwellStartRef = useRef<number>(0);
  useEffect(() => {
    if (!vehicle) return;

    // Record in recently viewed
    addViewed(vehicle.id);

    // Track vehicle_view event
    trackEvent({
      event_type: 'vehicle_view',
      vehicle_id: vehicle.id,
      page_path: window.location.pathname,
    });

    // Capture dwell start time
    dwellStartRef.current = Date.now();

    return () => {
      // Track dwell time on unmount (only if >= 3 seconds)
      const dwellSeconds = Math.round((Date.now() - dwellStartRef.current) / 1000);
      if (dwellSeconds >= 3) {
        trackEvent({
          event_type: 'dwell',
          vehicle_id: vehicle.id,
          page_path: window.location.pathname,
          metadata: { dwell_seconds: dwellSeconds },
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle?.id]);

  // Phase 16: Fire-once form_open tracking
  const trackedFormsRef = useRef<Set<string>>(new Set());
  const trackFormOpen = useCallback((formType: string) => {
    if (trackedFormsRef.current.has(formType)) return;
    trackedFormsRef.current.add(formType);
    trackEvent({
      event_type: 'form_open',
      vehicle_id: vehicle?.id,
      page_path: window.location.pathname,
      metadata: { form_type: formType },
    });
  }, [vehicle?.id]);

  // Phase 16: Compute "You Might Also Like" recommendations
  const recommendations = useMemo(() => {
    if (!vehicle) return [];
    const viewedVehicles = recentIds
      .map(id => vehicles.find(v => v.id === id))
      .filter(Boolean) as Vehicle[];
    return getRecommendations(viewedVehicles, vehicles, 4);
  }, [vehicle, recentIds, vehicles]);

  // Days since listed
  const daysListed = useMemo(() => {
    if (!vehicle?.dateAdded) return null;
    const added = new Date(vehicle.dateAdded);
    const now = new Date();
    return Math.floor((now.getTime() - added.getTime()) / (1000 * 60 * 60 * 24));
  }, [vehicle?.dateAdded]);

  const listedText = useMemo(() => {
    if (daysListed === null) return null;
    if (daysListed === 0) return t.vehicleDetail.listedToday;
    if (daysListed === 1) return t.vehicleDetail.listedYesterday;
    return t.vehicleDetail.listedDaysAgo.replace('{days}', String(daysListed));
  }, [daysListed, t]);

  // Share URL copy
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      setCopied(false);
    }
  };

  // Hero carousel navigation
  const nextHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroIndex((prev) => (prev + 1) % images.length);
  };

  const prevHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  // Identity headline (bilingual)
  const headline = useMemo(() => {
    if (!vehicle) return '';
    if (lang === 'es') {
      return vehicle.identityHeadlineEs || vehicle.identityHeadline || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    }
    return vehicle.identityHeadline || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  }, [vehicle, lang]);

  // SEO description
  const seoDescription = useMemo(() => {
    if (!vehicle) return '';
    const desc = vehicle.identityHeadline || vehicle.description || '';
    return t.vehicleDetail.seoDescription
      .replace('{year}', String(vehicle.year))
      .replace('{make}', vehicle.make)
      .replace('{model}', vehicle.model)
      .replace('{mileage}', vehicle.mileage.toLocaleString())
      .replace('{price}', vehicle.price > 0 ? vehicle.price.toLocaleString() : 'Call');
  }, [vehicle, t]);

  // Masked VIN (show last 6 chars)
  const maskedVin = useMemo(() => {
    if (!vehicle) return '';
    const vin = vehicle.vin;
    if (vin.length <= 6) return vin;
    return '*'.repeat(vin.length - 6) + vin.slice(-6);
  }, [vehicle]);

  // Spec items for the grid
  const specItems = useMemo(() => {
    if (!vehicle) return [];
    return [
      { icon: Calendar, label: t.vehicleDetail.specYear, value: String(vehicle.year) },
      { icon: Car, label: t.vehicleDetail.specMake, value: vehicle.make },
      { icon: Car, label: t.vehicleDetail.specModel, value: vehicle.model },
      { icon: Gauge, label: t.vehicleDetail.specMileage, value: `${vehicle.mileage.toLocaleString()} mi` },
      { icon: Hash, label: t.vehicleDetail.specVin, value: maskedVin },
      { icon: Car, label: t.vehicleDetail.specStatus, value: vehicle.status },
    ];
  }, [vehicle, t, maskedVin]);

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-tj-gold mx-auto mb-4" size={32} />
          <p className="text-gray-400 text-sm uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  // --- NOT FOUND STATE ---
  if (notFound || !vehicle) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Car className="mx-auto text-gray-600 mb-6" size={64} />
          <h1 className="font-display text-3xl text-white mb-4 tracking-wider">
            Vehicle Not Found
          </h1>
          <p className="text-gray-400 mb-8">
            The vehicle you are looking for may have been sold or is no longer available.
          </p>
          <Link
            to="/inventory"
            className="inline-flex items-center gap-2 py-4 px-8 text-xs font-bold uppercase tracking-[0.3em] bg-tj-gold text-black hover:bg-white transition-colors"
          >
            <ArrowLeft size={14} />
            {t.vehicleDetail.backToInventory}
          </Link>
        </div>
      </div>
    );
  }

  const vehicleSlug = vehicle.slug || generateVehicleSlug(vehicle.year, vehicle.make, vehicle.model, vehicle.id);

  // --- MAIN PAGE ---
  return (
    <>
      <SEO
        title={`${vehicle.year} ${vehicle.make} ${vehicle.model} | Triple J Auto Investment`}
        description={seoDescription}
        path={`/vehicles/${vehicleSlug}`}
      />
      <VehicleJsonLd vehicle={vehicle} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-black min-h-screen px-4 md:px-6 pb-20"
      >
        <div className="max-w-5xl mx-auto">

          {/* ========================================== */}
          {/* SECTION 1: Back Navigation + Share          */}
          {/* ========================================== */}
          <div className="pt-8 pb-6 flex items-center justify-between">
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-tj-gold transition-colors text-[10px] uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-tj-gold/50 rounded py-2 pr-2"
            >
              <ArrowLeft size={14} />
              {t.vehicleDetail.backToInventory}
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-tj-gold transition-colors text-[10px] uppercase tracking-[0.2em] py-2 pl-2 focus:outline-none focus:ring-2 focus:ring-tj-gold/50 rounded"
              aria-label={t.vehicleDetail.share}
            >
              <Share2 size={14} />
              {copied ? 'Copied!' : t.vehicleDetail.share}
            </button>
          </div>

          {/* ========================================== */}
          {/* SECTION 2: Hero Image Gallery               */}
          {/* ========================================== */}
          <section className="relative">
            {images.length > 0 ? (
              <>
                {/* Main Hero Image */}
                <div
                  className="relative aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-gray-900 cursor-pointer group"
                  onClick={() => { setGalleryIndex(heroIndex); setGalleryOpen(true); }}
                >
                  <motion.img
                    key={heroIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    src={images[heroIndex]}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - photo ${heroIndex + 1} of ${images.length}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Save Button */}
                  <div className="absolute top-4 left-4 z-10">
                    <SaveButton vehicleId={vehicle.id} size="lg" />
                  </div>

                  {/* Image count badge */}
                  {images.length > 1 && (
                    <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-[10px] font-mono text-white/80 tracking-wider pointer-events-none">
                      {t.vehicleDetail.photoCount
                        .replace('{current}', String(heroIndex + 1))
                        .replace('{total}', String(images.length))}
                    </div>
                  )}

                  {/* Carousel arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevHero}
                        className="absolute left-0 top-0 bottom-0 z-10 w-14 flex items-center justify-center bg-gradient-to-r from-black/40 to-transparent text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-tj-gold/50"
                        aria-label="Previous image"
                      >
                        <ChevronLeft size={28} strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={nextHero}
                        className="absolute right-0 top-0 bottom-0 z-10 w-14 flex items-center justify-center bg-gradient-to-l from-black/40 to-transparent text-white/60 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-tj-gold/50"
                        aria-label="Next image"
                      >
                        <ChevronRight size={28} strokeWidth={1.5} />
                      </button>
                    </>
                  )}

                  {/* Bottom gradient */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                </div>

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-none pb-1">
                    {images.slice(0, 6).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setHeroIndex(idx)}
                        className={`flex-shrink-0 w-20 h-14 overflow-hidden transition-all border-2 ${
                          idx === heroIndex
                            ? 'border-tj-gold opacity-100'
                            : 'border-transparent opacity-40 hover:opacity-80'
                        } focus:outline-none focus:ring-2 focus:ring-tj-gold/50`}
                        aria-label={`View photo ${idx + 1}`}
                      >
                        <img
                          src={img}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                    {images.length > 6 && (
                      <button
                        onClick={() => { setGalleryIndex(6); setGalleryOpen(true); }}
                        className="flex-shrink-0 w-20 h-14 bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-gray-400 text-[10px] uppercase tracking-wider hover:text-white hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-tj-gold/50"
                      >
                        +{images.length - 6}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* No images placeholder */
              <div className="aspect-[4/3] md:aspect-[16/9] bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <Car className="mx-auto text-gray-600 mb-3" size={48} />
                  <p className="text-gray-500 text-sm">{t.vehicleDetail.noPhotos}</p>
                </div>
              </div>
            )}
          </section>

          {/* ========================================== */}
          {/* SECTION 3: Identity Headline + Vehicle Info */}
          {/* ========================================== */}
          <section className="py-8 border-t border-white/[0.04]">
            <h1 className="font-display text-2xl md:text-3xl text-white leading-tight">
              {headline}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </span>
              <span className="text-gray-600">|</span>
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gray-400">
                <Gauge size={12} />
                {vehicle.mileage.toLocaleString()} mi
              </span>
              <span className="text-gray-600">|</span>
              <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${
                vehicle.status === VehicleStatus.AVAILABLE ? 'text-tj-gold' : 'text-gray-400'
              }`}>
                {vehicle.status}
              </span>
            </div>
          </section>

          {/* ========================================== */}
          {/* SECTION 4: Badges (Verified + Urgency)     */}
          {/* ========================================== */}
          {(() => {
            const badges = getBadges(vehicle);
            if (!vehicle.isVerified && badges.length === 0) return null;
            return (
              <section className="py-8 border-t border-white/[0.04]">
                <div className="flex flex-wrap items-center gap-3">
                  {vehicle.isVerified && <VehicleVerifiedBadge isVerified={true} size="lg" />}
                  {badges.length > 0 && <UrgencyBadge badges={badges} />}
                </div>
              </section>
            );
          })()}

          {/* ========================================== */}
          {/* SECTION 5: Price Transparency Block         */}
          {/* ========================================== */}
          <section className="py-8 border-t border-white/[0.04]">
            <VehiclePriceBlock
              price={vehicle.price}
              year={vehicle.year}
              mileage={vehicle.mileage}
              marketEstimate={vehicle.marketEstimate}
            />
          </section>

          {/* ========================================== */}
          {/* SECTION 5.5: Payment Calculator (Level 0)   */}
          {/* ========================================== */}
          <div className="py-6">
            <PaymentCalculator
              price={vehicle.price}
              onFirstInteraction={() => {
                trackEvent({
                  event_type: 'calculator_use',
                  vehicle_id: vehicle.id,
                  page_path: window.location.pathname,
                });
              }}
            />
          </div>

          {/* ========================================== */}
          {/* SECTION 6: Vehicle Story                    */}
          {/* ========================================== */}
          <VehicleStorySection vehicle={vehicle} />

          {/* ========================================== */}
          {/* SECTION 7: Vehicle Specs                    */}
          {/* ========================================== */}
          <section className="py-8 border-t border-white/[0.04]">
            <h3 className="font-display text-lg tracking-[0.2em] uppercase text-white mb-6">
              {t.vehicleDetail.specsHeading}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specItems.map((spec, i) => (
                <div
                  key={i}
                  className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <spec.icon size={14} className="text-tj-gold" />
                    <span className="text-[9px] uppercase tracking-[0.2em] text-gray-400">
                      {spec.label}
                    </span>
                  </div>
                  <span className="text-white text-sm font-mono truncate block">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================== */}
          {/* SECTION 8: Social Proof Micro-Layer         */}
          {/* ========================================== */}
          {listedText && (
            <section className="py-6 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-gray-500" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                  {listedText}
                </span>
              </div>
            </section>
          )}

          {/* ========================================== */}
          {/* SECTION 9: Engagement Spectrum               */}
          {/* ========================================== */}
          <section className="py-8 border-t border-white/[0.04]">
            {/* Level 1: Phone-only actions */}
            <div className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" onClickCapture={() => trackFormOpen('level_1')}>
                <PhoneCaptureForm
                  actionType="price_alert"
                  vehicleId={vehicle.id}
                  vehicleVin={vehicle.vin}
                  label={t.engagement?.getPriceAlert || 'Get Price Alert'}
                  description={t.engagement?.priceAlertDesc || 'Get notified if the price drops'}
                  icon={<Bell size={18} />}
                />
                <PhoneCaptureForm
                  actionType="similar_vehicles"
                  vehicleId={vehicle.id}
                  vehicleVin={vehicle.vin}
                  label={t.engagement?.similarVehicles || 'Similar Vehicles'}
                  description={t.engagement?.similarDesc || "We'll text you matches"}
                  icon={<Car size={18} />}
                />
                <PhoneCaptureForm
                  actionType="vehicle_report"
                  vehicleId={vehicle.id}
                  vehicleVin={vehicle.vin}
                  label={t.engagement?.vehicleReport || 'Vehicle Report'}
                  description={t.engagement?.reportDesc || 'Get a detailed history report'}
                  icon={<FileText size={18} />}
                />
              </div>
            </div>

            {/* Level 2: Name + Phone actions */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3" onClickCapture={() => trackFormOpen('level_2')}>
              <ScheduleVisitForm
                vehicleId={vehicle.id}
                vehicleVin={vehicle.vin}
                vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              />
              <AskQuestionForm
                vehicleId={vehicle.id}
                vehicleVin={vehicle.vin}
              />
            </div>

            {/* Level 3: Reserve */}
            <div className="mb-6" onClickCapture={() => trackFormOpen('level_3')}>
              <ReserveVehicleSection
                vehicleId={vehicle.id}
                vehicleVin={vehicle.vin}
                vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              />
            </div>

            {/* Direct contact -- always available */}
            <div className="pt-4 border-t border-white/[0.04] text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3">
                {t.engagement?.orCallDirectly || 'Or call us directly'}
              </p>
              <a
                href="tel:+18324009760"
                className="inline-flex items-center gap-2 py-3 px-6 border border-tj-gold/30 text-tj-gold hover:bg-tj-gold/10 text-xs tracking-[0.2em] uppercase transition-all min-h-[44px]"
              >
                <Phone size={14} />
                {t.engagement?.callUs || 'Call Us'}: (832) 400-9760
              </a>
            </div>
          </section>

          {/* ========================================== */}
          {/* SECTION 10: You Might Also Like            */}
          {/* ========================================== */}
          {recommendations.length > 0 && (
            <section className="py-8 border-t border-white/[0.04]">
              <h3 className="font-display text-lg tracking-[0.2em] uppercase text-white mb-6">
                {(t as any).vehicleDetail?.recommendations || (lang === 'es' ? 'Tambien Te Puede Gustar' : 'You Might Also Like')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendations.map(rec => {
                  const recSlug = rec.slug || generateVehicleSlug(rec.year, rec.make, rec.model, rec.id);
                  const recImages = [rec.imageUrl, ...(rec.gallery || [])].filter(Boolean);
                  return (
                    <Link
                      key={rec.id}
                      to={`/vehicles/${recSlug}`}
                      className="group block"
                    >
                      <div className="relative aspect-video overflow-hidden rounded bg-gray-900">
                        {recImages.length > 0 ? (
                          <img
                            src={recImages[0]}
                            alt={`${rec.year} ${rec.make} ${rec.model}`}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <Car className="text-gray-600" size={24} />
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-bold text-white truncate group-hover:text-tj-gold transition-colors">
                          {rec.year} {rec.make} {rec.model}
                        </p>
                        <p className="text-sm text-tj-gold">
                          {rec.price > 0 ? `$${rec.price.toLocaleString()}` : 'Inquire'}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Back to inventory link */}
          <div className="py-8 text-center">
            <Link
              to="/inventory"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-tj-gold transition-colors text-[10px] uppercase tracking-[0.2em]"
            >
              <ArrowLeft size={14} />
              {t.vehicleDetail.backToInventory}
            </Link>
          </div>

        </div>
      </motion.div>

      {/* Full-screen image gallery lightbox */}
      <ImageGallery
        images={images}
        initialIndex={galleryIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </>
  );
};

export default VehicleDetail;
