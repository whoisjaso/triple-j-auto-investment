import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface ProgressArcProps {
  progress: number; // 0-1 (e.g., 3/6 = 0.5)
  stageNumber: number; // 1-6
  totalStages: number; // 6
  onStageClick?: (stage: number) => void; // Mobile tap
}

export const ProgressArc: React.FC<ProgressArcProps> = ({
  progress,
  stageNumber,
  totalStages,
  onStageClick
}) => {
  const controls = useAnimation();
  const hasAnimated = useRef(false);

  // Animation duration per CONTEXT.md: 2.5-3 seconds
  const ANIMATION_DURATION = 2.5;

  // Circle properties
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const targetOffset = circumference * (1 - progress);

    if (hasAnimated.current) {
      // On resize/re-render: jump to final state (no replay)
      controls.set({ strokeDashoffset: targetOffset });
    } else {
      // First render: animate
      controls.start({
        strokeDashoffset: targetOffset,
        transition: { duration: ANIMATION_DURATION, ease: 'easeInOut' }
      });
      hasAnimated.current = true;
    }
  }, [progress, controls, circumference]);

  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          {/* Gold gradient for the progress arc */}
          <linearGradient id="arcGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C5A059" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>

          {/* Glow filter for current stage marker */}
          <filter id="stageGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc - faded gold (20% opacity per CONTEXT.md) */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(212, 175, 55, 0.2)"
          strokeWidth="12"
        />

        {/* Progress arc - filled gold */}
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#arcGold)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={controls}
          style={{
            transformOrigin: 'center',
            transform: 'rotate(-90deg)'
          }}
        />

        {/* Stage markers around the arc */}
        {Array.from({ length: totalStages }, (_, i) => {
          // Calculate position on the circle
          // Start from top (-90 degrees) and go clockwise
          const stageIndex = i;
          const angle = (stageIndex / totalStages) * 360 - 90;
          const radians = (angle * Math.PI) / 180;
          const x = 100 + radius * Math.cos(radians);
          const y = 100 + radius * Math.sin(radians);

          const isCurrent = i + 1 === stageNumber;
          const isComplete = i + 1 < stageNumber;

          return (
            <g key={i}>
              {/* Stage marker dot */}
              <circle
                cx={x}
                cy={y}
                r={isCurrent ? 10 : 8}
                fill={isComplete || isCurrent ? '#D4AF37' : 'rgba(212, 175, 55, 0.3)'}
                filter={isCurrent ? 'url(#stageGlow)' : undefined}
                className={isCurrent ? 'animate-pulse-glow' : ''}
                onClick={() => onStageClick?.(i + 1)}
                style={{ cursor: onStageClick ? 'pointer' : 'default' }}
              />
              {/* Stage number text */}
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isComplete || isCurrent ? '#000' : 'rgba(212, 175, 55, 0.6)'}
                fontSize="8"
                fontWeight="600"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {i + 1}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Logo center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img
          src="/GoldTripleJLogo.png"
          alt="Triple J"
          className="w-20 h-20 md:w-24 md:h-24 object-contain"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.4))'
          }}
        />
      </div>

      {/* Stage X of 6 text */}
      <p className="text-center text-white text-sm mt-2 font-medium tracking-wide">
        Stage {stageNumber} of {totalStages}
      </p>
    </div>
  );
};

export default ProgressArc;
