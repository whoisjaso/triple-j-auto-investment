import React, { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LuxuryLogo3D } from './LuxuryLogo3D';

interface LuxurySplashScreenProps {
  children: ReactNode;
  duration?: number;
}

export const LuxurySplashScreen: React.FC<LuxurySplashScreenProps> = ({
  children,
  duration = 4000,
}) => {
  const [phase, setPhase] = useState<'intro' | 'hold' | 'exit' | 'complete'>('intro');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if already shown this session
    const alreadyShown = sessionStorage.getItem('luxurySplashShown') === 'true';
    
    if (alreadyShown) {
      setPhase('complete');
      return;
    }

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, duration / 100);

    // Phase transitions
    const holdTimer = setTimeout(() => {
      setPhase('hold');
    }, 500);

    const exitTimer = setTimeout(() => {
      setPhase('exit');
    }, duration - 800);

    const completeTimer = setTimeout(() => {
      setPhase('complete');
      sessionStorage.setItem('luxurySplashShown', 'true');
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [duration]);

  return (
    <>
      {/* Main content - fade in when complete */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: phase === 'complete' ? 1 : 0,
          scale: phase === 'complete' ? 1 : 0.98,
        }}
        transition={{ 
          duration: 0.8, 
          ease: [0.16, 1, 0.3, 1],
          delay: phase === 'complete' ? 0 : 0 
        }}
        style={{ visibility: phase === 'complete' ? 'visible' : 'hidden' }}
      >
        {children}
      </motion.div>

      {/* Splash Screen */}
      <AnimatePresence>
        {phase !== 'complete' && (
          <motion.div
            className="fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
            }}
          >
            {/* Background gradient */}
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.25) 0%, transparent 60%)',
                  'radial-gradient(circle at 50% 50%, rgba(212,175,55,0.15) 0%, transparent 50%)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* 3D Logo */}
            <motion.div
              className="relative w-64 h-64 md:w-80 md:h-80"
              initial={{ opacity: 0, scale: 0.8, rotateY: -180 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                rotateY: 0,
              }}
              transition={{ 
                duration: 1.2, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.2 
              }}
            >
              <LuxuryLogo3D scale={1.5} autoRotate={true} />
            </motion.div>

            {/* Brand text */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <h1 className="text-2xl md:text-3xl font-display text-white tracking-[0.3em]">
                TRIPLE J
              </h1>
              <p className="text-[10px] uppercase tracking-[0.5em] text-[#D4AF37] mt-2 font-montserrat">
                Auto Investment
              </p>
            </motion.div>

            {/* Progress bar */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48">
              <div className="h-px bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-[#D4AF37]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[8px] uppercase tracking-[0.3em] text-white/30 font-montserrat">
                <span>Loading</span>
                <span>{progress}%</span>
              </div>
            </div>

            {/* Decorative elements */}
            <motion.div
              className="absolute top-8 left-8 w-16 h-16 border-l border-t border-[#D4AF37]/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
            <motion.div
              className="absolute top-8 right-8 w-16 h-16 border-r border-t border-[#D4AF37]/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            />
            <motion.div
              className="absolute bottom-8 left-8 w-16 h-16 border-l border-b border-[#D4AF37]/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            />
            <motion.div
              className="absolute bottom-8 right-8 w-16 h-16 border-r border-b border-[#D4AF37]/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LuxurySplashScreen;
