import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/Store';
import { useLanguage } from '../context/LanguageContext';
import { VehicleStatus } from '../types';
import { generateVehicleSlug } from '../utils/vehicleSlug';

interface RecentlyViewedRowProps {
  vehicleIds: string[];
}

export const RecentlyViewedRow: React.FC<RecentlyViewedRowProps> = ({ vehicleIds }) => {
  const { vehicles } = useStore();
  const { t, lang } = useLanguage();

  // Find matching vehicles, preserve order from vehicleIds (most recent first)
  const matchedVehicles = vehicleIds
    .map(id => vehicles.find(v => v.id === id))
    .filter(Boolean) as typeof vehicles;

  if (matchedVehicles.length === 0) return null;

  const heading = lang === 'es'
    ? ((t as any).inventory?.recentlyViewed || 'Visto Recientemente')
    : ((t as any).inventory?.recentlyViewed || 'You Recently Viewed');

  const soldLabel = lang === 'es' ? 'Vendido' : 'Sold';

  return (
    <section>
      <h2 className="font-display text-lg tracking-[0.2em] uppercase text-white mb-4">
        {heading}
      </h2>
      <div
        className="flex gap-4 overflow-x-auto pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`.recently-viewed-scroll::-webkit-scrollbar { display: none; }`}</style>
        {matchedVehicles.map(vehicle => {
          const isSold = vehicle.status === VehicleStatus.SOLD;
          const slug = vehicle.slug || generateVehicleSlug(vehicle.year, vehicle.make, vehicle.model, vehicle.id);
          const images = [vehicle.imageUrl, ...(vehicle.gallery || [])].filter(Boolean);

          return (
            <Link
              key={vehicle.id}
              to={`/vehicles/${slug}`}
              className="w-48 sm:w-56 flex-shrink-0 group relative block"
            >
              {/* Image */}
              <div className="relative aspect-video overflow-hidden rounded bg-gray-900">
                {images.length > 0 ? (
                  <img
                    src={images[0]}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    loading="lazy"
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      isSold ? 'grayscale opacity-40' : 'group-hover:scale-105'
                    }`}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <span className="text-gray-600 text-xs">No photo</span>
                  </div>
                )}

                {/* Sold overlay */}
                {isSold && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-white/80 text-xs font-bold uppercase tracking-[0.2em]">
                      {soldLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* Vehicle info */}
              <div className="mt-2">
                <p className="text-sm font-bold text-white truncate group-hover:text-tj-gold transition-colors">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                <p className="text-sm text-tj-gold">
                  {vehicle.price > 0 ? `$${vehicle.price.toLocaleString()}` : 'Inquire'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
