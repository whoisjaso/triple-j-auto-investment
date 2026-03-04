import React from 'react';

interface CrestLoaderProps {
  /** 0–100 progress, omit for indeterminate pulse */
  progress?: number;
  /** sticky (inline scroll sections) or fixed (full-page overlay) */
  mode?: 'sticky' | 'fixed';
}

export const CrestLoader: React.FC<CrestLoaderProps> = ({
  progress,
  mode = 'fixed',
}) => {
  const positionClass = mode === 'fixed'
    ? 'fixed inset-0 z-[9999]'
    : 'sticky top-0 h-screen w-full z-50';

  return (
    <div className={`${positionClass} bg-[#F7F7F7] flex flex-col items-center justify-center`}>
      <img
        src="/GoldTripleJLogo.png"
        alt="Triple J Auto Investment"
        className="w-14 h-14 mb-8 opacity-40 animate-pulse"
      />
      <div className="w-48 h-[2px] bg-[#0e1b16]/[0.06] overflow-hidden">
        {progress != null ? (
          <div
            className="h-full bg-tj-gold transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        ) : (
          <div className="h-full w-1/3 bg-tj-gold/60 animate-[shimmer_1.5s_ease-in-out_infinite]" />
        )}
      </div>
      {progress != null && (
        <p className="text-[#0e1b16]/30 text-[10px] uppercase tracking-[0.4em] mt-4 font-sans">
          {progress}%
        </p>
      )}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default CrestLoader;
