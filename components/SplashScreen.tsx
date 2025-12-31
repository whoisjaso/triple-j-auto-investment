import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  children: React.ReactNode;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  children,
  duration = 2800
}) => {
  const [showSplash, setShowSplash] = useState(true);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Check if this is a fresh page load or navigation
    const hasSeenSplash = sessionStorage.getItem('splashShown');

    if (hasSeenSplash) {
      setShowSplash(false);
      return;
    }

    // Animation timeline
    const enterTimer = setTimeout(() => setAnimationPhase('hold'), 800);
    const exitTimer = setTimeout(() => setAnimationPhase('exit'), duration - 600);
    const hideTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem('splashShown', 'true');
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            {/* Radial gradient background */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              style={{
                background: 'radial-gradient(circle at center, rgba(212,175,55,0.08) 0%, transparent 60%)'
              }}
            />

            {/* Main container */}
            <div className="relative w-[220px] h-[220px]">

              {/* Animated outer ring */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                {/* Static subtle ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="rgba(212,175,55,0.1)"
                  strokeWidth="0.3"
                />

                {/* Animated tracing ring - primary */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="url(#splashGoldGradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, rotate: 0 }}
                  animate={{
                    pathLength: animationPhase === 'exit' ? [0.4, 1] : [0, 0.4, 0.1, 0.5],
                    rotate: animationPhase === 'exit' ? 360 : [0, 180, 360]
                  }}
                  transition={{
                    pathLength: {
                      duration: animationPhase === 'exit' ? 0.5 : 2.5,
                      repeat: animationPhase === 'exit' ? 0 : Infinity,
                      ease: animationPhase === 'exit' ? "easeOut" : "easeInOut"
                    },
                    rotate: {
                      duration: animationPhase === 'exit' ? 0.5 : 3,
                      repeat: animationPhase === 'exit' ? 0 : Infinity,
                      ease: "linear"
                    }
                  }}
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.9))'
                  }}
                />

                {/* Second ring - counter rotation */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="url(#splashGoldGradient2)"
                  strokeWidth="0.8"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, rotate: 180 }}
                  animate={{
                    pathLength: animationPhase === 'exit' ? [0.3, 1] : [0, 0.3, 0],
                    rotate: animationPhase === 'exit' ? -180 : [180, 0, -180]
                  }}
                  transition={{
                    pathLength: {
                      duration: animationPhase === 'exit' ? 0.5 : 2,
                      repeat: animationPhase === 'exit' ? 0 : Infinity,
                      ease: "easeInOut",
                      delay: 0.3
                    },
                    rotate: {
                      duration: animationPhase === 'exit' ? 0.5 : 4,
                      repeat: animationPhase === 'exit' ? 0 : Infinity,
                      ease: "linear"
                    }
                  }}
                  style={{
                    filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.6))'
                  }}
                />

                {/* Inner decorative ring */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(212,175,55,0.15)"
                  strokeWidth="0.3"
                  strokeDasharray="2 4"
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="splashGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C5A059" />
                    <stop offset="50%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#C5A059" />
                  </linearGradient>
                  <linearGradient id="splashGoldGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(197,160,89,0.4)" />
                    <stop offset="50%" stopColor="rgba(255,215,0,0.7)" />
                    <stop offset="100%" stopColor="rgba(197,160,89,0.4)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Pulsing glow */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [0.9, 1.05, 0.9]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-40 h-40 rounded-full bg-tj-gold/15 blur-2xl" />
              </motion.div>

              {/* The Crest */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  scale: animationPhase === 'exit' ? 1.1 : 1
                }}
                transition={{
                  opacity: { duration: 0.8, ease: "easeOut" },
                  scale: {
                    duration: animationPhase === 'exit' ? 0.4 : 0.8,
                    ease: "easeOut"
                  }
                }}
              >
                <motion.img
                  src="/GoldTripleJLogo.png"
                  alt="Triple J Auto Investment"
                  className="w-36 h-36 object-contain"
                  animate={{
                    filter: animationPhase === 'exit'
                      ? 'drop-shadow(0 0 40px rgba(212,175,55,0.8))'
                      : [
                          'drop-shadow(0 0 15px rgba(212,175,55,0.4))',
                          'drop-shadow(0 0 30px rgba(212,175,55,0.6))',
                          'drop-shadow(0 0 15px rgba(212,175,55,0.4))'
                        ]
                  }}
                  transition={{
                    duration: animationPhase === 'exit' ? 0.3 : 2,
                    repeat: animationPhase === 'exit' ? 0 : Infinity,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>

              {/* Sparkle particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-tj-gold rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    marginLeft: -2,
                    marginTop: -2
                  }}
                  animate={{
                    x: [0, Math.cos(i * 45 * Math.PI / 180) * 120],
                    y: [0, Math.sin(i * 45 * Math.PI / 180) * 120],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: i * 0.25,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>

            {/* Brand text */}
            <motion.div
              className="mt-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <h1 className="font-display text-2xl text-white tracking-[0.3em] mb-2">
                TRIPLE J
              </h1>
              <motion.p
                className="text-tj-gold text-[10px] uppercase tracking-[0.5em]"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Auto Investment
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content - always rendered but hidden during splash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </>
  );
};

export default SplashScreen;
