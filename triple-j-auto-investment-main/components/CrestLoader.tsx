import React from 'react';

interface CrestLoaderProps {
  size?: 'sm' | 'md' | 'lg';
}

export const CrestLoader: React.FC<CrestLoaderProps> = ({
  size = 'lg'
}) => {
  // Expanded container sizes for more space between crest and outline
  const sizeMap = {
    sm: { container: 130, crest: 60, pathScale: 0.78 },
    md: { container: 180, crest: 84, pathScale: 1.08 },
    lg: { container: 240, crest: 108, pathScale: 1.44 }
  };

  const { container, crest, pathScale } = sizeMap[size];
  const center = container / 2;

  // Shield/Crest silhouette path - centered at origin, scaled
  // This traces the outline of a classic heraldic shield shape
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

  // Calculate approximate path length for animation
  const pathLength = 400;

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
      {/* Radial gradient background - subtle pulse */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at center, rgba(212,175,55,0.08) 0%, transparent 50%)',
          animation: 'crestBgPulse 3s ease-in-out infinite'
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
            <linearGradient id="crestTraceGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C5A059" />
              <stop offset="25%" stopColor="#FFD700" />
              <stop offset="50%" stopColor="#FFF8DC" />
              <stop offset="75%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#C5A059" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="crestGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
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
            stroke="rgba(212,175,55,0.1)"
            strokeWidth="1"
          />

          {/* Animated tracing path */}
          <path
            d={shieldPath}
            fill="none"
            stroke="url(#crestTraceGold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#crestGlow)"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength,
              animation: 'crestTrace 2.5s ease-in-out infinite'
            }}
          />

          {/* Secondary trace for fuller effect (delayed) */}
          <path
            d={shieldPath}
            fill="none"
            stroke="url(#crestTraceGold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength,
              animation: 'crestTrace 2.5s ease-in-out infinite',
              animationDelay: '0.5s',
              opacity: 0.6
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
              width: crest,
              height: crest,
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 12px rgba(212,175,55,0.4))',
              animation: 'crestLogoGlow 3s ease-in-out infinite'
            }}
          />
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes crestTrace {
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

        @keyframes crestBgPulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }

        @keyframes crestLogoGlow {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(212,175,55,0.4));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(212,175,55,0.7));
          }
        }
      `}</style>
    </div>
  );
};

export default CrestLoader;
