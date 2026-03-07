import React, { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { VehicleIcon } from './VehicleIcon';

interface ProgressRoadProps {
  progress: number; // 0-1
  vehicleType?: string; // 'sedan', 'suv', 'truck', or BodyClass string
}

// Start flag (green) SVG component
const StartFlag: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Pole */}
    <line x1="4" y1="2" x2="4" y2="30" stroke="#666" strokeWidth="2" strokeLinecap="round" />
    {/* Flag */}
    <path
      d="M4 2 L22 6 L22 14 L4 10 Z"
      fill="#22C55E"
      stroke="#16A34A"
      strokeWidth="1"
    />
    {/* Base */}
    <ellipse cx="4" cy="30" rx="3" ry="1.5" fill="#444" />
  </svg>
);

// Finish flag (checkered) SVG component
const FinishFlag: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 24 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Pole */}
    <line x1="4" y1="2" x2="4" y2="30" stroke="#666" strokeWidth="2" strokeLinecap="round" />
    {/* Flag background */}
    <rect x="4" y="2" width="18" height="12" fill="white" stroke="#333" strokeWidth="0.5" />
    {/* Checkered pattern */}
    <rect x="4" y="2" width="4.5" height="3" fill="#111" />
    <rect x="13" y="2" width="4.5" height="3" fill="#111" />
    <rect x="8.5" y="5" width="4.5" height="3" fill="#111" />
    <rect x="17.5" y="5" width="4.5" height="3" fill="#111" />
    <rect x="4" y="8" width="4.5" height="3" fill="#111" />
    <rect x="13" y="8" width="4.5" height="3" fill="#111" />
    <rect x="8.5" y="11" width="4.5" height="3" fill="#111" />
    <rect x="17.5" y="11" width="4.5" height="3" fill="#111" />
    {/* Base */}
    <ellipse cx="4" cy="30" rx="3" ry="1.5" fill="#444" />
  </svg>
);

export const ProgressRoad: React.FC<ProgressRoadProps> = ({ progress, vehicleType }) => {
  const carControls = useAnimation();
  const hasAnimated = useRef(false);
  const ANIMATION_DURATION = 2.5;

  useEffect(() => {
    // Calculate percentage position (0-100)
    const targetPosition = progress * 100;

    if (hasAnimated.current) {
      // On resize/re-render: jump to final state (no replay per CONTEXT.md)
      carControls.set({ x: `${targetPosition}%` });
    } else {
      // First render: animate car driving
      carControls.start({
        x: `${targetPosition}%`,
        transition: { duration: ANIMATION_DURATION, ease: 'easeInOut' }
      });
      hasAnimated.current = true;
    }
  }, [progress, carControls]);

  return (
    <div className="relative mt-8">
      {/* Desktop: horizontal road */}
      <div className="hidden md:block">
        <div className="relative h-24 px-8">
          {/* Road surface */}
          <div className="absolute inset-x-12 top-1/2 -translate-y-1/2 h-8 bg-gray-800 rounded-sm shadow-inner">
            {/* Road edge lines */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gray-600" />
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-600" />
            {/* Dashed center line */}
            <div
              className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #555 0px, #555 16px, transparent 16px, transparent 28px)'
              }}
            />
          </div>

          {/* Start flag (green) - left side */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <StartFlag className="w-8 h-12" />
          </div>

          {/* Finish flag (checkered) - right side */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <FinishFlag className="w-8 h-12" />
          </div>

          {/* Car container - positioned on road */}
          <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-8">
            <motion.div
              className="absolute text-tj-gold"
              initial={{ x: '0%' }}
              animate={carControls}
              style={{
                // Offset to center the car on the position
                marginLeft: '-24px',
                top: '-4px'
              }}
            >
              <VehicleIcon type={vehicleType} className="w-12 h-6" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile: vertical road */}
      <div className="block md:hidden">
        <div className="relative h-64 mx-auto w-24">
          {/* Road surface - vertical */}
          <div className="absolute inset-y-12 left-1/2 -translate-x-1/2 w-8 bg-gray-800 rounded-sm shadow-inner">
            {/* Road edge lines */}
            <div className="absolute inset-y-0 left-0 w-0.5 bg-gray-600" />
            <div className="absolute inset-y-0 right-0 w-0.5 bg-gray-600" />
            {/* Dashed center line - vertical */}
            <div
              className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-0.5"
              style={{
                backgroundImage: 'repeating-linear-gradient(180deg, #555 0px, #555 12px, transparent 12px, transparent 22px)'
              }}
            />
          </div>

          {/* Start flag (green) - top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
            <StartFlag className="w-8 h-12" />
          </div>

          {/* Finish flag (checkered) - bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10">
            <FinishFlag className="w-8 h-12" />
          </div>

          {/* Car container - positioned on vertical road */}
          <div className="absolute inset-y-12 left-1/2 -translate-x-1/2 w-8">
            <motion.div
              className="absolute text-tj-gold"
              initial={{ y: '0%' }}
              animate={{
                y: `${progress * 100}%`
              }}
              transition={{
                duration: hasAnimated.current ? 0 : ANIMATION_DURATION,
                ease: 'easeInOut'
              }}
              style={{
                // Offset to center the car on the position
                marginTop: '-12px',
                left: '-8px',
                // Rotate car 90 degrees to face downward
                transform: 'rotate(90deg)'
              }}
            >
              <VehicleIcon type={vehicleType} className="w-12 h-6" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressRoad;
