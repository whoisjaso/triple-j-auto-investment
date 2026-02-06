import React from 'react';

interface VehicleIconProps {
  type?: string; // 'sedan', 'suv', 'truck', or BodyClass string
  className?: string;
}

// Map body class names to icon types
function mapBodyTypeToIcon(bodyType?: string): 'sedan' | 'suv' | 'truck' {
  if (!bodyType) return 'sedan';
  const lower = bodyType.toLowerCase();
  if (lower.includes('suv') || lower.includes('sport utility') || lower.includes('crossover')) return 'suv';
  if (lower.includes('truck') || lower.includes('pickup')) return 'truck';
  return 'sedan';
}

export const VehicleIcon: React.FC<VehicleIconProps> = ({ type, className = '' }) => {
  const iconType = mapBodyTypeToIcon(type);

  // Consistent viewBox for all icons - sized for side profile
  const viewBox = "0 0 100 40";
  const baseClass = `${className}`;

  const icons = {
    // Sedan - 4-door silhouette with curved roofline
    sedan: (
      <svg viewBox={viewBox} className={baseClass} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <path
          d="M8 28 L8 24 Q8 22 10 21 L18 19 Q22 15 32 13 L48 13 Q58 13 62 15 L76 18 Q82 19 86 21 Q92 23 92 26 L92 28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Windows */}
        <path
          d="M25 19 Q28 15 35 14 L48 14 Q55 14 58 15 L68 18"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Window divider */}
        <line x1="48" y1="14" x2="48" y2="19" stroke="currentColor" strokeWidth="1.5" />
        {/* Front wheel */}
        <circle cx="24" cy="28" r="7" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="28" r="3" stroke="currentColor" strokeWidth="1" />
        {/* Rear wheel */}
        <circle cx="76" cy="28" r="7" stroke="currentColor" strokeWidth="2" />
        <circle cx="76" cy="28" r="3" stroke="currentColor" strokeWidth="1" />
        {/* Headlight */}
        <path d="M8 23 L10 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Taillight */}
        <path d="M90 23 L92 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),

    // SUV - higher profile, boxier shape
    suv: (
      <svg viewBox={viewBox} className={baseClass} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body - taller profile */}
        <path
          d="M8 28 L8 20 Q8 18 10 17 L18 16 Q22 10 30 9 L70 9 Q78 9 82 12 L88 16 Q92 17 92 20 L92 28"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Windows */}
        <path
          d="M24 16 Q26 11 32 10 L68 10 Q74 10 78 12 L84 15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Window dividers */}
        <line x1="42" y1="10" x2="42" y2="16" stroke="currentColor" strokeWidth="1.5" />
        <line x1="58" y1="10" x2="58" y2="16" stroke="currentColor" strokeWidth="1.5" />
        {/* Front wheel */}
        <circle cx="24" cy="28" r="7" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="28" r="3" stroke="currentColor" strokeWidth="1" />
        {/* Rear wheel */}
        <circle cx="76" cy="28" r="7" stroke="currentColor" strokeWidth="2" />
        <circle cx="76" cy="28" r="3" stroke="currentColor" strokeWidth="1" />
        {/* Roof rack */}
        <line x1="30" y1="9" x2="70" y2="9" stroke="currentColor" strokeWidth="1" />
        {/* Headlight */}
        <path d="M8 20 L10 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Taillight */}
        <path d="M90 20 L92 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),

    // Truck - pickup with bed
    truck: (
      <svg viewBox={viewBox} className={baseClass} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Cab */}
        <path
          d="M8 28 L8 20 Q8 18 10 17 L18 16 Q22 10 30 9 L48 9 Q52 9 54 12 L54 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Cab window */}
        <path
          d="M24 16 Q26 11 32 10 L46 10 Q50 10 52 12 L52 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Bed */}
        <path
          d="M54 20 L54 22 L92 22 L92 20 Q92 18 90 17 L58 17 Q56 17 54 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Bed bottom */}
        <line x1="54" y1="28" x2="92" y2="28" stroke="currentColor" strokeWidth="2" />
        {/* Bed rails */}
        <line x1="58" y1="17" x2="58" y2="22" stroke="currentColor" strokeWidth="1.5" />
        <line x1="88" y1="17" x2="88" y2="22" stroke="currentColor" strokeWidth="1.5" />
        {/* Front wheel */}
        <circle cx="24" cy="28" r="7" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="28" r="3" stroke="currentColor" strokeWidth="1" />
        {/* Rear wheel */}
        <circle cx="76" cy="28" r="7" stroke="currentColor" strokeWidth="2" />
        <circle cx="76" cy="28" r="3" stroke="currentColor" strokeWidth="1" />
        {/* Headlight */}
        <path d="M8 20 L10 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Taillight */}
        <path d="M90 23 L92 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  };

  return icons[iconType];
};

export default VehicleIcon;
