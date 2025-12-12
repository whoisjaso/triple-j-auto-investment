
import React, { useState } from 'react';

export const SovereignCrest = ({ className = "w-32 h-32" }: { className?: string }) => {
  const [imgError, setImgError] = useState(false);

  // FALLBACK SVG: High-Fidelity Heraldic Shield if crest.png is missing
  if (imgError) {
    return (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="25%" stopColor="#F9DF74" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="75%" stopColor="#8a7329" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5"/>
          </filter>
        </defs>
        
        {/* Heraldic Shield Shape */}
        <path 
          d="M100 195 C100 195 170 160 170 80 V40 H30 V80 C30 160 100 195 100 195Z" 
          fill="#000805" 
          stroke="url(#goldGrad)" 
          strokeWidth="3"
          filter="url(#shadow)"
        />
        
        {/* Inner Border */}
        <path 
          d="M100 185 C100 185 160 155 160 85 V50 H40 V85 C40 155 100 185 100 185Z" 
          stroke="url(#goldGrad)" 
          strokeWidth="1"
          opacity="0.5"
        />

        {/* The Crown */}
        <path 
          d="M70 30 L80 10 L100 5 L120 10 L130 30 H70Z" 
          fill="url(#goldGrad)" 
        />
        <circle cx="80" cy="10" r="3" fill="#000" />
        <circle cx="120" cy="10" r="3" fill="#000" />
        <circle cx="100" cy="5" r="4" fill="#fff" />

        {/* Interlocking TJ Monogram */}
        <g transform="translate(100, 115) scale(0.9)">
            {/* T */}
            <path d="M-30 -30 H30 V-20 H0 V30 H-10 V-20 H-30 Z" fill="url(#goldGrad)" />
            {/* J */}
            <path d="M10 -30 H40 V-20 H20 V30 C20 45 0 45 -10 35 L-5 25 C0 30 10 30 10 25 V-30 Z" fill="url(#goldGrad)" />
        </g>

        {/* Laurel Wreath / Flourish */}
        <path d="M40 120 Q20 160 100 190 Q180 160 160 120" stroke="url(#goldGrad)" strokeWidth="1.5" fill="none" strokeDasharray="4 4" opacity="0.6" />
        
        {/* EST Date */}
        <text x="100" y="165" textAnchor="middle" fontSize="10" fill="url(#goldGrad)" fontFamily="serif" letterSpacing="0.2em" fontWeight="bold">EST. 2025</text>
      </svg>
    );
  }

  return (
    <img 
      src="/crest.png" 
      alt="Triple J Sovereign Crest" 
      className={`object-contain drop-shadow-[0_0_25px_rgba(212,175,55,0.3)] ${className}`}
      onError={(e) => {
        // Prevent infinite loop if fallback fails
        e.currentTarget.onerror = null;
        setImgError(true);
      }}
    />
  );
};
