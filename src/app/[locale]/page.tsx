"use client";

import { useState, useEffect, useRef } from "react";
import MaybachSection from "@/components/scroll/MaybachSection";
import KeysSection from "@/components/scroll/KeysSection";
import CrestRevealSection from "@/components/scroll/CrestRevealSection";
import FrameLoader from "@/components/ui/FrameLoader";

export default function Home() {
  const [maybachProgress, setMaybachProgress] = useState(0);
  const [maybachLoaded, setMaybachLoaded] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleMaybachProgress = (loaded: number, total: number) => {
    setMaybachProgress(Math.round((loaded / total) * 100));
    if (loaded >= total) setMaybachLoaded(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(scrollTop / docHeight);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Loading screen -- blocks until Maybach frames ready */}
      <FrameLoader progress={maybachProgress} loaded={maybachLoaded} />

      {/* Scroll progress bar */}
      <div
        ref={progressBarRef}
        className="fixed top-0 left-0 h-[2px] bg-tj-gold z-[55] pointer-events-none"
        style={{ width: `${scrollProgress * 100}%` }}
      />

      {/* Noise/grain overlay for cinematic texture */}
      <div
        className="fixed inset-0 z-40 pointer-events-none opacity-[0.03] hidden md:block"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
        }}
      />

      <main>
        <MaybachSection onProgress={handleMaybachProgress} />
        <KeysSection />
        <CrestRevealSection />
      </main>
    </>
  );
}
