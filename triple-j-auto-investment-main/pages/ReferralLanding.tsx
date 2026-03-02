/**
 * ReferralLanding - Public warm-handoff page for referred friends
 * Route: /refer/:code
 *
 * Shows a warm intro with the referrer's first name above a simplified
 * inventory grid. If the referral code is invalid, skips the intro and
 * shows inventory only.
 *
 * Phase 19-03: Referral + Upgrade
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/Store';
import { SEO } from '../components/SEO';
import { getReferrerName, logReferralClick } from '../services/ownerPortalService';
import { VehicleStatus } from '../types';
import type { Vehicle } from '../types';

function getDeviceType(): string {
  if (/Mobi|Android/i.test(navigator.userAgent)) return 'mobile';
  return 'desktop';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

// Simplified vehicle card for referral landing (no filters, no saved vehicles)
const ReferralVehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  const { lang } = useLanguage();
  const images = [vehicle.imageUrl, ...(vehicle.gallery || [])].filter(Boolean);
  const headline =
    (lang === 'es' ? vehicle.identityHeadlineEs : vehicle.identityHeadline) ||
    `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <div className="p-6 md:p-8 bg-black/40 border border-tj-gold/10 rounded-lg overflow-hidden">
      {/* Vehicle Image */}
      {images.length > 0 ? (
        <div className="aspect-[4/3] mb-4 rounded overflow-hidden bg-black/20">
          <img
            src={images[0]}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] mb-4 rounded bg-tj-green/20 flex items-center justify-center">
          <span className="text-gray-600 text-xs uppercase tracking-widest">No Image</span>
        </div>
      )}

      {/* Vehicle Info */}
      <p className="text-[10px] uppercase tracking-[0.2em] text-tj-gold mb-1">
        {vehicle.year} {vehicle.make}
      </p>
      <p className="text-white font-medium mb-1">{vehicle.model}</p>
      {headline !== `${vehicle.year} ${vehicle.make} ${vehicle.model}` && (
        <p className="text-[11px] text-gray-400 mb-2 line-clamp-1">{headline}</p>
      )}
      <p className="text-tj-gold text-sm font-medium mb-4">{formatCurrency(vehicle.price)}</p>

      {/* View Details Link */}
      {vehicle.slug ? (
        <Link
          to={`/vehicles/${vehicle.slug}`}
          className="flex items-center justify-center w-full min-h-[44px] py-3 px-6 text-[10px] uppercase tracking-[0.3em] border border-tj-gold/30 text-tj-gold hover:border-tj-gold hover:bg-tj-gold/5 rounded transition-colors"
        >
          View Details
        </Link>
      ) : (
        <Link
          to="/inventory"
          className="flex items-center justify-center w-full min-h-[44px] py-3 px-6 text-[10px] uppercase tracking-[0.3em] border border-tj-gold/30 text-tj-gold hover:border-tj-gold rounded transition-colors"
        >
          View in Inventory
        </Link>
      )}
    </div>
  );
};

const ReferralLanding: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { t } = useLanguage();
  const tp = t.ownerPortal;
  const { vehicles } = useStore();

  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    // Log referral click (non-blocking -- fires and forgets)
    logReferralClick(code, getDeviceType());

    // Look up referrer name
    getReferrerName(code)
      .then((name) => {
        setReferrerName(name);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  // Filter to available vehicles only
  const availableVehicles = vehicles.filter(
    (v: Vehicle) => v.status === VehicleStatus.AVAILABLE
  );

  const seoTitle = referrerName
    ? `${referrerName}'s recommendation | Triple J Auto Investment`
    : `A Friend Recommends | Triple J Auto Investment`;

  return (
    <>
      <SEO
        title={seoTitle}
        description="Browse trusted pre-owned vehicles recommended by a friend."
        path={code ? `/refer/${code}` : '/refer'}
        noindex={false}
      />

      <div className="min-h-screen bg-gradient-to-b from-black via-tj-green to-black">
        {/* Warm Intro Section */}
        <div className="px-4 py-12 text-center max-w-6xl mx-auto">
          {loading ? (
            /* Loading skeleton -- don't block inventory */
            <div className="animate-pulse mb-8">
              <div className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-3">
                {tp.referralLandingIntro}
              </div>
              <div className="h-8 bg-white/5 rounded max-w-xs mx-auto mb-3" />
              <div className="h-4 bg-white/5 rounded max-w-sm mx-auto" />
            </div>
          ) : referrerName ? (
            /* Referrer found -- show warm intro */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8"
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-3">
                {tp.referralLandingIntro}
              </p>
              <h1 className="font-serif text-2xl md:text-3xl text-white mb-3">
                <span className="text-tj-gold">{referrerName}</span>{' '}
                {tp.referralLandingHeading}
              </h1>
              <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                {tp.referralLandingSubtext}
              </p>
            </motion.div>
          ) : (
            /* Invalid code or no code -- subtle intro only */
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-3">
                Triple J Auto Investment
              </p>
              <h1 className="font-serif text-2xl md:text-3xl text-white mb-3">
                Trusted Pre-Owned Vehicles for Houston Families
              </h1>
              <p className="text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
                {tp.referralLandingSubtext}
              </p>
            </div>
          )}

          {/* Subtle divider */}
          <div className="w-24 h-px bg-tj-gold/20 mx-auto mb-8" />
        </div>

        {/* Inventory Grid */}
        <div className="px-4 md:px-6 pb-16 max-w-6xl mx-auto">
          {availableVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableVehicles.map((vehicle: Vehicle) => (
                <ReferralVehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 text-sm mb-4">
                Our inventory is being updated. Check back soon!
              </p>
              <Link
                to="/contact"
                className="inline-block text-[10px] uppercase tracking-[0.3em] text-tj-gold hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReferralLanding;
