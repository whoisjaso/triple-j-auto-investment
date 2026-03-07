/**
 * OwnerVehicleCard - Vehicle photo + purchase details card
 * Shows vehicle identity (year/make/model), masked VIN, purchase date, days owned.
 *
 * Phase 19-02: Owner Portal UI
 */

import React from 'react';
import { Car } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { Registration } from '../../types';

interface OwnerVehicleCardProps {
  registration: Registration;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function computeDaysOwned(purchaseDateStr: string): number {
  const purchaseDate = new Date(purchaseDateStr);
  const now = new Date();
  return Math.floor((now.getTime() - purchaseDate.getTime()) / 86400000);
}

function maskVin(vin: string): string {
  if (vin.length <= 6) return vin;
  return '***' + vin.slice(-6);
}

const OwnerVehicleCard: React.FC<OwnerVehicleCardProps> = ({ registration }) => {
  const { t } = useLanguage();
  const tp = t.ownerPortal;

  const daysOwned = computeDaysOwned(registration.purchaseDate);
  const vehicleLabel = `${registration.vehicleYear} ${registration.vehicleMake} ${registration.vehicleModel}`;

  return (
    <div className="p-6 md:p-8 bg-black/40 border border-tj-gold/10 rounded-lg">
      {/* Section label */}
      <p className="text-[10px] uppercase tracking-[0.3em] text-tj-gold mb-4">{tp.yourVehicle}</p>

      {/* Vehicle placeholder card with gradient */}
      <div className="w-full h-36 rounded-md bg-gradient-to-br from-tj-green/60 to-black/80 border border-tj-gold/10 flex flex-col items-center justify-center mb-5 relative overflow-hidden">
        <Car size={32} className="text-tj-gold/30 mb-2" />
        <p className="font-serif text-lg text-white text-center px-4 leading-snug">{vehicleLabel}</p>
      </div>

      {/* Details grid */}
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">VIN</dt>
          <dd className="font-mono text-white text-xs">{maskVin(registration.vin)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">{tp.purchased}</dt>
          <dd className="text-white text-xs">{formatDate(registration.purchaseDate)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">{tp.daysOwned}</dt>
          <dd className="text-tj-gold font-semibold">{daysOwned}</dd>
        </div>
        {registration.plateNumber && (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1">Plate</dt>
            <dd className="font-mono text-white text-xs">{registration.plateNumber}</dd>
          </div>
        )}
      </dl>
    </div>
  );
};

export default OwnerVehicleCard;
