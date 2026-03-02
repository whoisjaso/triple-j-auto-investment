/**
 * OwnerUpgradeSection - Ready to Upgrade?
 *
 * Shows trade-in estimate and matching inventory for owners who have
 * had their vehicle for 12+ months. Owners with < 12 months see a
 * "not yet" message instead.
 *
 * Phase 19-03: Referral + Upgrade
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { getUpgradeMatches } from '../../services/ownerPortalService';
import { estimateMarketValue } from '../../services/marketEstimateService';
import type { Registration, Vehicle } from '../../types';

interface OwnerUpgradeSectionProps {
  registration: Registration;
}

// Purchase price fallback (same as OwnerValueTracker)
const PURCHASE_PRICE_FALLBACK = 5000;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function computeMonthsOwned(purchaseDateStr: string): number {
  const now = new Date();
  const purchaseDate = new Date(purchaseDateStr);
  return (
    (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
    (now.getMonth() - purchaseDate.getMonth())
  );
}

const OwnerUpgradeSection: React.FC<OwnerUpgradeSectionProps> = ({ registration }) => {
  const { t } = useLanguage();
  const tp = t.ownerPortal;

  const [matches, setMatches] = useState<Vehicle[]>([]);

  const monthsOwned = computeMonthsOwned(registration.purchaseDate);
  const purchasePrice = PURCHASE_PRICE_FALLBACK;
  const mileageAtPurchase = registration.mileage ?? 80000;
  const estimatedCurrentMileage = mileageAtPurchase + monthsOwned * 1000;
  const tradeInEstimate = estimateMarketValue(
    purchasePrice,
    registration.vehicleYear,
    estimatedCurrentMileage
  );

  useEffect(() => {
    if (monthsOwned >= 12) {
      getUpgradeMatches(purchasePrice).then(setMatches);
    }
  }, [monthsOwned, purchasePrice]);

  return (
    <div className="p-6 md:p-8 bg-black/40 border border-tj-gold/10 rounded-lg">
      {/* Section Title */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={14} className="text-tj-gold flex-shrink-0" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold">
          {tp.upgradeTitle}
        </p>
      </div>

      {monthsOwned < 12 ? (
        /* Not yet eligible */
        <p className="text-sm text-gray-400 leading-relaxed">
          {tp.upgradeNotYet}
        </p>
      ) : (
        /* Full upgrade section */
        <>
          {/* Trade-In Estimate */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">
              {tp.tradeInEstimate}
            </p>
            <p className="font-serif text-2xl text-tj-gold">
              {formatCurrency(tradeInEstimate)}
            </p>
          </div>

          {/* Matching Inventory */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">
              {tp.upgradeMatches}
            </p>

            {matches.length > 0 ? (
              <div className="space-y-3">
                {matches.slice(0, 3).map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-3 bg-black/20 border border-tj-gold/5 rounded"
                  >
                    <div>
                      <p className="text-sm text-white">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-[11px] text-tj-gold">
                        {formatCurrency(vehicle.price)}
                      </p>
                    </div>
                    {vehicle.slug ? (
                      <Link
                        to={`/vehicles/${vehicle.slug}`}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-tj-gold transition-colors"
                      >
                        View <ArrowRight size={10} />
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">
                Check back soon -- new inventory arriving weekly.
              </p>
            )}
          </div>

          {/* CTA */}
          <Link
            to="/contact"
            className="flex items-center justify-center gap-2 w-full min-h-[44px] py-4 px-8 text-xs tracking-[0.3em] uppercase bg-tj-gold text-black hover:bg-tj-gold/90 rounded transition-colors"
          >
            {tp.talkToUs}
          </Link>
        </>
      )}
    </div>
  );
};

export default OwnerUpgradeSection;
