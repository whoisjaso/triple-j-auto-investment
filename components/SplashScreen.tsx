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

      {/* Splash Screen Overlay */}
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
          {/* Radial gradient background - pulsing */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at center, rgba(212,175,55,0.15) 0%, transparent 60%)',
              animation: 'splashPulse 2s ease-in-out infinite'
            }}
          />

          {/* Decorative corner accents */}
          <div style={{ position: 'absolute', top: 40, left: 40, width: 30, height: 30, borderLeft: '2px solid rgba(212,175,55,0.3)', borderTop: '2px solid rgba(212,175,55,0.3)' }} />
          <div style={{ position: 'absolute', top: 40, right: 40, width: 30, height: 30, borderRight: '2px solid rgba(212,175,55,0.3)', borderTop: '2px solid rgba(212,175,55,0.3)' }} />
          <div style={{ position: 'absolute', bottom: 40, left: 40, width: 30, height: 30, borderLeft: '2px solid rgba(212,175,55,0.3)', borderBottom: '2px solid rgba(212,175,55,0.3)' }} />
          <div style={{ position: 'absolute', bottom: 40, right: 40, width: 30, height: 30, borderRight: '2px solid rgba(212,175,55,0.3)', borderBottom: '2px solid rgba(212,175,55,0.3)' }} />

          {/* Loader container */}
          <div style={{ position: 'relative', width: 200, height: 200 }}>

            {/* Outer rotating ring */}
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                animation: 'splashSpin 2.5s linear infinite'
              }}
            >
              <defs>
                <linearGradient id="splashGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C5A059" />
                  <stop offset="50%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#C5A059" />
                </linearGradient>
              </defs>
              {/* Background ring */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="rgba(212,175,55,0.1)"
                strokeWidth="1"
              />
              {/* Animated arc */}
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="url(#splashGoldGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="120 450"
                style={{ filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.8))' }}
              />
            </svg>

            {/* Inner counter-rotating ring */}
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                animation: 'splashSpinReverse 3s linear infinite'
              }}
            >
              <circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke="rgba(212,175,55,0.2)"
                strokeWidth="1"
                strokeDasharray="40 100"
              />
            </svg>

            {/* Crest image - centered with subtle pulse */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'splashLogoFloat 3s ease-in-out infinite'
              }}
            >
              <img
                src="/GoldTripleJLogo.png"
                alt="Triple J"
                style={{
                  width: 100,
                  height: 100,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 0 25px rgba(212,175,55,0.6))'
                }}
              />
            </div>
          </div>

          {/* Brand text below loader */}
          <div
            style={{
              marginTop: 40,
              textAlign: 'center',
              animation: 'splashFadeIn 1s ease-out 0.3s both'
            }}
          >
            <p
              style={{
                color: '#fff',
                fontFamily: '"Playfair Display", serif',
                fontSize: 18,
                letterSpacing: '0.3em',
                marginBottom: 8
              }}
            >
              TRIPLE J
            </p>
            <p
              style={{
                color: 'rgba(212,175,55,0.8)',
                fontSize: 9,
                letterSpacing: '0.4em',
                textTransform: 'uppercase'
              }}
            >
              Auto Investment
            </p>
          </div>

          {/* Keyframe animations */}
          <style>{`
            @keyframes splashSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes splashSpinReverse {
              from { transform: rotate(360deg); }
              to { transform: rotate(0deg); }
            }
            @keyframes splashPulse {
              0%, 100% { opacity: 0.6; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.05); }
            }
            @keyframes splashLogoFloat {
              0%, 100% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-5px) scale(1.02); }
            }
            @keyframes splashFadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default SplashScreen;
