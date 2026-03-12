"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface FrameLoaderProps {
  progress: number;
  loaded: boolean;
}

export default function FrameLoader({ progress, loaded }: FrameLoaderProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => setVisible(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!visible) return null;

  const pct = Math.min(progress, 100);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ease-out ${
        loaded ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Logo with subtle glow pulse */}
      <div
        className="relative transition-transform duration-700 ease-out"
        style={{
          transform: loaded ? "scale(1.1)" : "scale(1)",
        }}
      >
        <div
          className="absolute inset-0 rounded-full blur-3xl transition-opacity duration-1000"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
            opacity: pct > 20 ? 1 : 0,
          }}
        />
        <Image
          src="/GoldTripleJLogo.webp"
          alt="Triple J Auto Investment"
          width={120}
          height={120}
          priority
          className="relative w-20 h-20 md:w-28 md:h-28 object-contain"
        />
      </div>

      {/* Progress bar */}
      <div className="mt-10 w-40 md:w-48">
        <div className="h-px bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-tj-gold/60 to-tj-gold rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-3 text-center font-accent text-[10px] uppercase tracking-[0.35em] text-white/20 tabular-nums">
          {pct}%
        </p>
      </div>
    </div>
  );
}
