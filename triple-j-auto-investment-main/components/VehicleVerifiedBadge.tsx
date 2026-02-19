import React from 'react';
import { SovereignCrest } from './SovereignCrest';
import { useLanguage } from '../context/LanguageContext';

interface VehicleVerifiedBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'lg';
}

export const VehicleVerifiedBadge: React.FC<VehicleVerifiedBadgeProps> = ({
  isVerified,
  size = 'sm',
}) => {
  const { t } = useLanguage();

  if (!isVerified) return null;

  const isLarge = size === 'lg';

  return (
    <div
      className={`inline-flex items-center border border-tj-gold/40 bg-tj-gold/[0.05] backdrop-blur-sm ${
        isLarge ? 'gap-3 px-4 py-2.5 rounded-lg' : 'gap-1.5 px-2.5 py-1 rounded-md'
      }`}
    >
      <SovereignCrest className={isLarge ? 'w-6 h-6' : 'w-4 h-4'} />
      <div className={isLarge ? 'flex flex-col' : ''}>
        <span
          className={`text-tj-gold uppercase font-semibold ${
            isLarge
              ? 'text-[10px] tracking-[0.2em]'
              : 'text-[7px] tracking-[0.15em]'
          }`}
        >
          {t.vehicleDetail.verifiedBadge}
        </span>
        {isLarge && (
          <span className="text-[8px] text-gray-400 leading-tight mt-0.5">
            {t.vehicleDetail.verifiedTooltip}
          </span>
        )}
      </div>
    </div>
  );
};
