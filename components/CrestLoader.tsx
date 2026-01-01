import React from 'react';

interface CrestLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const CrestLoader: React.FC<CrestLoaderProps> = ({
  size = 'lg',
  text
}) => {
  const sizeMap = {
    sm: { container: 80, crest: 48, ring: 35, innerRing: 28, stroke: 2 },
    md: { container: 120, crest: 68, ring: 52, innerRing: 42, stroke: 2 },
    lg: { container: 160, crest: 88, ring: 72, innerRing: 58, stroke: 2.5 }
  };

  const { container, crest, ring, innerRing, stroke } = sizeMap[size];
  const center = container / 2;

  return (
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
        zIndex: 9999
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
          background: 'radial-gradient(circle at center, rgba(212,175,55,0.12) 0%, transparent 55%)',
          animation: 'crestBgPulse 2.5s ease-in-out infinite'
        }}
      />

      {/* Loader container */}
      <div style={{ position: 'relative', width: container, height: container }}>

        {/* Outer rotating gold ring */}
        <svg
          width={container}
          height={container}
          viewBox={`0 0 ${container} ${container}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            animation: 'crestLoaderSpin 2.5s linear infinite'
          }}
        >
          <defs>
            <linearGradient id="crestLoaderGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C5A059" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#C5A059" />
            </linearGradient>
          </defs>
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={ring}
            fill="none"
            stroke="rgba(212,175,55,0.08)"
            strokeWidth="1"
          />
          {/* Animated arc */}
          <circle
            cx={center}
            cy={center}
            r={ring}
            fill="none"
            stroke="url(#crestLoaderGold)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${ring * 1} ${ring * 5}`}
            style={{ filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.7))' }}
          />
        </svg>

        {/* Inner counter-rotating ring */}
        <svg
          width={container}
          height={container}
          viewBox={`0 0 ${container} ${container}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            animation: 'crestLoaderSpinReverse 3.5s linear infinite'
          }}
        >
          <circle
            cx={center}
            cy={center}
            r={innerRing}
            fill="none"
            stroke="rgba(212,175,55,0.15)"
            strokeWidth="1"
            strokeDasharray={`${innerRing * 0.3} ${innerRing * 0.7}`}
          />
        </svg>

        {/* Crest image - centered with float animation */}
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
            animation: 'crestLogoFloat 3s ease-in-out infinite'
          }}
        >
          <img
            src="/GoldTripleJLogo.png"
            alt="Triple J"
            style={{
              width: crest,
              height: crest,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 18px rgba(212,175,55,0.5))'
            }}
          />
        </div>
      </div>

      {/* Loading text */}
      {text && (
        <p
          style={{
            marginTop: 32,
            fontSize: 10,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            animation: 'crestTextPulse 2s ease-in-out infinite'
          }}
        >
          {text}
        </p>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes crestLoaderSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes crestLoaderSpinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes crestBgPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes crestLogoFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.02); }
        }
        @keyframes crestTextPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default CrestLoader;
