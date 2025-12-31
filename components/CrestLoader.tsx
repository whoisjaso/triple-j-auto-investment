import React from 'react';
import { motion } from 'framer-motion';

interface CrestLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const CrestLoader: React.FC<CrestLoaderProps> = ({
  size = 'lg',
  showText = true
}) => {
  const sizeMap = {
    sm: { crest: 60, container: 80 },
    md: { crest: 100, container: 130 },
    lg: { crest: 150, container: 190 }
  };

  const { crest, container } = sizeMap[size];

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03)_0%,transparent_70%)]" />

      {/* Main loader container */}
      <div className="relative" style={{ width: container, height: container }}>

        {/* Animated gold ring - outer trace */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
        >
          {/* Background ring (subtle) */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="rgba(212,175,55,0.1)"
            strokeWidth="0.5"
          />

          {/* Animated tracing ring */}
          <motion.circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="url(#goldGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, rotate: 0 }}
            animate={{
              pathLength: [0, 0.4, 0],
              rotate: 360
            }}
            transition={{
              pathLength: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              },
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }
            }}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.8))'
            }}
          />

          {/* Second tracing ring (opposite direction) */}
          <motion.circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="url(#goldGradient2)"
            strokeWidth="0.8"
            strokeLinecap="round"
            initial={{ pathLength: 0, rotate: 180 }}
            animate={{
              pathLength: [0, 0.3, 0],
              rotate: -180
            }}
            transition={{
              pathLength: {
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              },
              rotate: {
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }
            }}
            style={{
              filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.6))'
            }}
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C5A059" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#C5A059" />
            </linearGradient>
            <linearGradient id="goldGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(197,160,89,0.3)" />
              <stop offset="50%" stopColor="rgba(255,215,0,0.6)" />
              <stop offset="100%" stopColor="rgba(197,160,89,0.3)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Pulsing glow behind crest */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.95, 1.02, 0.95]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div
            className="rounded-full bg-tj-gold/10 blur-xl"
            style={{ width: crest * 1.2, height: crest * 1.2 }}
          />
        </motion.div>

        {/* The Crest */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.img
            src="/GoldTripleJLogo.png"
            alt="Triple J Auto Investment"
            style={{ width: crest, height: crest }}
            className="object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            animate={{
              filter: [
                'drop-shadow(0 0 15px rgba(212,175,55,0.3))',
                'drop-shadow(0 0 25px rgba(212,175,55,0.5))',
                'drop-shadow(0 0 15px rgba(212,175,55,0.3))'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Sparkle particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-tj-gold rounded-full"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, Math.cos(i * 60 * Math.PI / 180) * (container / 2 + 10)],
              y: [0, Math.sin(i * 60 * Math.PI / 180) * (container / 2 + 10)],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      {showText && (
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.p
            className="text-tj-gold text-xs uppercase tracking-[0.4em] font-display"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading
          </motion.p>

          {/* Animated dots */}
          <div className="flex justify-center gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 bg-tj-gold/60 rounded-full"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CrestLoader;
