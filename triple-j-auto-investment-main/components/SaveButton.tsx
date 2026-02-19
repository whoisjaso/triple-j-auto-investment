import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useSavedVehicles } from '../hooks/useSavedVehicles';

interface SaveButtonProps {
  vehicleId: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { button: 'w-8 h-8 min-w-[44px] min-h-[44px]', icon: 14 },
  md: { button: 'w-10 h-10 min-w-[44px] min-h-[44px]', icon: 18 },
  lg: { button: 'w-12 h-12 min-w-[44px] min-h-[44px]', icon: 22 },
};

export const SaveButton: React.FC<SaveButtonProps> = ({ vehicleId, size = 'md', className = '' }) => {
  const { isSaved, toggleSave } = useSavedVehicles();
  const [animKey, setAnimKey] = useState(0);
  const saved = isSaved(vehicleId);
  const s = SIZES[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!saved) setAnimKey(prev => prev + 1);
    toggleSave(vehicleId);
  };

  return (
    <motion.button
      key={animKey}
      onClick={handleClick}
      whileTap={{ scale: 0.85 }}
      animate={saved && animKey > 0 ? { scale: [1, 1.3, 1] } : undefined}
      transition={{ duration: 0.3 }}
      className={`${s.button} flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm focus:ring-2 focus:ring-red-500/50 focus:outline-none transition-colors ${className}`}
      aria-label={saved ? 'Remove from Saved' : 'Save'}
    >
      <Heart
        size={s.icon}
        className={saved ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-400 transition-colors'}
      />
    </motion.button>
  );
};
