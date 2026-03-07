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
      const timer = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-tj-black transition-opacity duration-[800ms] ${
        loaded ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="animate-pulse">
        <Image
          src="/GoldTripleJLogo.png"
          alt="Triple J Auto Investment"
          width={120}
          height={120}
          priority
          className="w-24 h-24 md:w-32 md:h-32 object-contain"
        />
      </div>
      <p className="mt-6 font-accent text-lg text-tj-gold tracking-widest tabular-nums">
        {Math.min(progress, 100)}%
      </p>
    </div>
  );
}
