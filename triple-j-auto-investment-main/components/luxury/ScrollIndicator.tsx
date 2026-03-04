import React from 'react';

export const ScrollIndicator = () => (
  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex flex-col items-center gap-[10px] z-10 pointer-events-none">
    <span className="hidden md:block font-sans text-[9px] tracking-[0.3em] uppercase text-[rgba(201,168,76,0.35)] font-light select-none">
      Scroll
    </span>
    <div className="scroll-indicator-line" />
    <style>{`
      .scroll-indicator-line {
        width: 1px;
        height: 48px;
        position: relative;
        overflow: hidden;
        background: rgba(201, 168, 76, 0.08);
      }
      .scroll-indicator-line::after {
        content: "";
        position: absolute;
        top: -100%;
        left: 0;
        width: 100%;
        height: 100%;
        background: #C9A84C;
        animation: scrollPulse 2.4s cubic-bezier(0.76, 0, 0.24, 1) infinite;
      }
      @keyframes scrollPulse {
        0%   { top: -100%; }
        45%  { top: 0%; }
        55%  { top: 0%; }
        100% { top: 100%; }
      }
      @media (max-width: 768px) {
        .scroll-indicator-line { height: 36px; }
      }
    `}</style>
  </div>
);

export default ScrollIndicator;
