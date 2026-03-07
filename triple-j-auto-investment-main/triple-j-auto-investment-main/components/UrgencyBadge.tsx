// Phase 16: Behavioral Intelligence - UrgencyBadge Component
//
// Renders color-coded urgency badges: Just Arrived (green), Popular (amber), Offer Received (red).
// All badges are strictly data-driven -- no hardcoded or admin-override badges.

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { UrgencyBadgeData } from '../services/urgencyService';

interface UrgencyBadgeProps {
  badges: UrgencyBadgeData[];
  className?: string;
}

const BADGE_STYLES: Record<UrgencyBadgeData['type'], string> = {
  just_arrived: 'bg-green-950/60 border-green-500/40 text-green-400',
  popular: 'bg-amber-950/60 border-amber-500/40 text-amber-400',
  offer_received: 'bg-red-950/60 border-red-500/40 text-red-400',
};

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ badges, className = '' }) => {
  const { lang } = useLanguage();

  if (!badges || badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge) => (
        <span
          key={badge.type}
          className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[8px] font-bold uppercase tracking-[0.15em] rounded-sm ${BADGE_STYLES[badge.type]}`}
        >
          {lang === 'es' ? badge.labelEs : badge.label}
        </span>
      ))}
    </div>
  );
};
