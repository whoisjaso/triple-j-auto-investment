import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  children: React.ReactNode;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  children,
  duration = 3000
}) => {
  const [phase, setPhase] = useState<'splash' | 'fadeOut' | 'complete'>('splash');

  useEffect(() => {
    // Check if we should skip splash (already shown this session)
    const alreadyShown = sessionStorage.getItem('splashShown') === 'true';

    if (alreadyShown) {
      setPhase('complete');
      return;
    }

    // Phase 1: Show splash for duration
    const splashTimer = setTimeout(() => {
      setPhase('fadeOut');
    }, duration);

    // Phase 2: Fade out animation (800ms)
    const fadeTimer = setTimeout(() => {
      setPhase('complete');
      sessionStorage.setItem('splashShown', 'true');
    }, duration + 800);

    return () => {
      clearTimeout(splashTimer);
      clearTimeout(fadeTimer);
    };
  }, [duration]);

  const showSplash = phase === 'splash' || phase === 'fadeOut';
  const isFadingOut = phase === 'fadeOut';
  const isComplete = phase === 'complete';

  // Shield path for tracing animation - expanded for more spacing
  const container = 260;
  const center = 130;
  const pathScale = 1.45;
  const pathLength = 400;

  const shieldPath = `
    M ${center} ${center - 45 * pathScale}
    C ${center + 35 * pathScale} ${center - 45 * pathScale}
      ${center + 48 * pathScale} ${center - 35 * pathScale}
      ${center + 48 * pathScale} ${center - 15 * pathScale}
    L ${center + 48 * pathScale} ${center + 5 * pathScale}
    C ${center + 48 * pathScale} ${center + 25 * pathScale}
      ${center + 35 * pathScale} ${center + 42 * pathScale}
      ${center} ${center + 50 * pathScale}
    C ${center - 35 * pathScale} ${center + 42 * pathScale}
      ${center - 48 * pathScale} ${center + 25 * pathScale}
      ${center - 48 * pathScale} ${center + 5 * pathScale}
    L ${center - 48 * pathScale} ${center - 15 * pathScale}
    C ${center - 48 * pathScale} ${center - 35 * pathScale}
      ${center - 35 * pathScale} ${center - 45 * pathScale}
      ${center} ${center - 45 * pathScale}
    Z
  `;

  return (
    <>
      {/* Children - fade in when complete */}
      <div
        style={{
          opacity: isComplete ? 1 : 0,
          transform: isComplete ? 'scale(1)' : 'scale(1.02)',
          visibility: phase === 'complete' ? 'visible' : 'hidden',
          transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {children}
      </div>

      {/* Splash Screen Overlay - Crest with Tracing Animation Only */}
      {showSplash && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            zIndex: 999999,
            opacity: isFadingOut ? 0 : 1,
            transform: isFadingOut ? 'scale(1.1)' : 'scale(1)',
            transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {/* Radial gradient background - subtle pulse */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at center, rgba(212,175,55,0.1) 0%, transparent 55%)',
              animation: 'splashBgPulse 3s ease-in-out infinite'
            }}
          />

          {/* Loader container */}
          <div style={{ position: 'relative', width: container, height: container }}>

            {/* Tracing outline SVG */}
            <svg
              width={container}
              height={container}
              viewBox={`0 0 ${container} ${container}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              <defs>
                {/* Gold gradient for the tracing line */}
                <linearGradient id="splashTraceGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C5A059" />
                  <stop offset="25%" stopColor="#FFD700" />
                  <stop offset="50%" stopColor="#FFF8DC" />
                  <stop offset="75%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#C5A059" />
                </linearGradient>

                {/* Glow filter */}
                <filter id="splashGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Static faint outline */}
              <path
                d={shieldPath}
                fill="none"
                stroke="rgba(212,175,55,0.08)"
                strokeWidth="1"
              />

              {/* Animated tracing path */}
              <path
                d={shieldPath}
                fill="none"
                stroke="url(#splashTraceGold)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#splashGlow)"
                style={{
                  strokeDasharray: pathLength,
                  strokeDashoffset: pathLength,
                  animation: 'splashTrace 2.5s ease-in-out infinite'
                }}
              />

              {/* Secondary trace for fuller effect (delayed) */}
              <path
                d={shieldPath}
                fill="none"
                stroke="url(#splashTraceGold)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: pathLength,
                  strokeDashoffset: pathLength,
                  animation: 'splashTrace 2.5s ease-in-out infinite',
                  animationDelay: '0.6s',
                  opacity: 0.5
                }}
              />
            </svg>

            {/* Crest image - centered */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src="/GoldTripleJLogo.png"
                alt="Triple J Auto Investment"
                style={{
                  width: 110,
                  height: 110,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.5))',
                  animation: 'splashLogoGlow 3s ease-in-out infinite'
                }}
              />
            </div>
          </div>

          {/* Keyframe animations */}
          <style>{`
            @keyframes splashTrace {
              0% {
                stroke-dashoffset: ${pathLength};
              }
              50% {
                stroke-dashoffset: 0;
              }
              100% {
                stroke-dashoffset: -${pathLength};
              }
            }

            @keyframes splashBgPulse {
              0%, 100% {
                opacity: 0.5;
                transform: scale(1);
              }
              50% {
                opacity: 1;
                transform: scale(1.08);
              }
            }

            @keyframes splashLogoGlow {
              0%, 100% {
                filter: drop-shadow(0 0 15px rgba(212,175,55,0.5));
              }
              50% {
                filter: drop-shadow(0 0 25px rgba(212,175,55,0.8));
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default SplashScreen;
