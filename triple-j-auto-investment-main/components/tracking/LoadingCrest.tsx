import React from 'react';
import { motion } from 'framer-motion';

export const LoadingCrest: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <motion.img
      src="/GoldTripleJLogo.png"
      alt="Loading..."
      className="w-24 h-24"
      animate={{
        scale: [1, 1.05, 1],
        filter: [
          'drop-shadow(0 0 15px rgba(212,175,55,0.4))',
          'drop-shadow(0 0 25px rgba(212,175,55,0.7))',
          'drop-shadow(0 0 15px rgba(212,175,55,0.4))'
        ]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
    <p className="mt-4 text-gray-500 text-sm tracking-wide">
      Loading your registration...
    </p>
  </div>
);

export default LoadingCrest;
