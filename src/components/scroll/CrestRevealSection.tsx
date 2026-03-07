"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const TOTAL_FRAMES = 121;
const BATCH_SIZE = 20;

interface Phase {
  start: number;
  end: number;
}

const PHASES: Phase[] = [
  { start: 0.50, end: 0.82 },
  { start: 0.85, end: 1.0 },
];

const lerp = (current: number, target: number, factor: number) =>
  current + (target - current) * factor;

interface CrestRevealSectionProps {
  onProgress?: (loaded: number, total: number) => void;
}

export default function CrestRevealSection({
  onProgress,
}: CrestRevealSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [phaseOpacities, setPhaseOpacities] = useState<number[]>(
    new Array(PHASES.length).fill(0)
  );

  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const loadFrames = useCallback(async () => {
    const isMobile = window.innerWidth < 768;
    const step = isMobile ? 2 : 1;
    const frameCount = Math.ceil(TOTAL_FRAMES / step);
    const images: (HTMLImageElement | null)[] = new Array(frameCount).fill(null);

    for (let batch = 0; batch < frameCount; batch += BATCH_SIZE) {
      const promises: Promise<void>[] = [];
      const end = Math.min(batch + BATCH_SIZE, frameCount);
      for (let k = batch; k < end; k++) {
        promises.push(
          new Promise<void>((resolve) => {
            const img = new Image();
            const num = (k * step + 1).toString().padStart(4, "0");
            img.src = `/crest-frames/frame-${num}.webp`;
            img.onload = () => {
              images[k] = img;
              resolve();
            };
            img.onerror = () => resolve();
          })
        );
      }
      await Promise.all(promises);
      onProgressRef.current?.(
        Math.min(batch + BATCH_SIZE, frameCount),
        frameCount
      );
    }

    return { images, frameCount };
  }, []);

  useEffect(() => {
    let targetFrame = 0;
    let smoothFrame = 0;
    let drawnFrame = -1;
    let rafId: number | null = null;
    let rawProgress = 0;
    let images: (HTMLImageElement | null)[] = [];
    let effectiveFrames = TOTAL_FRAMES;
    let isVisible = true;
    const isMobile = window.innerWidth < 768;
    const canvasScale = isMobile ? 0.5 : 1;

    loadFrames().then((result) => {
      images = result.images;
      effectiveFrames = result.frameCount;
      setLoaded(true);
    });

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      if (scrollDistance <= 0) return;

      rawProgress = Math.max(0, Math.min(1, -rect.top / scrollDistance));
      targetFrame = Math.min(
        Math.floor(rawProgress * (effectiveFrames - 1)),
        effectiveFrames - 1
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    const tick = () => {
      if (!isVisible) {
        rafId = null;
        return;
      }

      smoothFrame = lerp(smoothFrame, targetFrame, 0.12);
      const displayFrame = Math.round(smoothFrame);

      if (displayFrame !== drawnFrame && canvasRef.current) {
        const img = images[displayFrame];
        if (img) {
          const ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            const cw = Math.round(img.naturalWidth * canvasScale);
            const ch = Math.round(img.naturalHeight * canvasScale);
            if (canvasRef.current.width !== cw) canvasRef.current.width = cw;
            if (canvasRef.current.height !== ch) canvasRef.current.height = ch;
            ctx.clearRect(0, 0, cw, ch);
            ctx.drawImage(img, 0, 0, cw, ch);
            drawnFrame = displayFrame;
          }
        }
      }

      // More dramatic scale for the crest finale
      if (canvasRef.current) {
        const scale = 1 + rawProgress * 0.08;
        canvasRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }

      // Smooth phase opacities
      setPhaseOpacities((prev) => {
        let changed = false;
        const next = prev.map((o, i) => {
          const p = PHASES[i];
          const fadeRange = 0.04;
          let target: number;
          if (rawProgress < p.start || rawProgress > p.end) {
            target = 0;
          } else if (rawProgress < p.start + fadeRange) {
            target = (rawProgress - p.start) / fadeRange;
          } else if (rawProgress > p.end - fadeRange) {
            target = (p.end - rawProgress) / fadeRange;
          } else {
            target = 1;
          }
          const smoothed = Math.max(0, Math.min(1, lerp(o, target, 0.08)));
          if (Math.abs(smoothed - o) > 0.001) changed = true;
          return smoothed;
        });
        return changed ? next : prev;
      });

      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && rafId === null) {
          rafId = requestAnimationFrame(tick);
        }
      },
      { rootMargin: "50px" }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    tick();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [loadFrames]);

  return (
    <section
      ref={containerRef}
      className="relative h-[250vh]"
      style={{ backgroundColor: "#000" }}
    >
      <div
        className={`sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center transition-opacity duration-1000 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <canvas
          ref={canvasRef}
          className="absolute top-1/2 left-1/2 pointer-events-none"
          style={{
            transform: "translate(-50%, -50%) scale(1)",
            willChange: "transform",
            width: "var(--canvas-crest-size)",
            height: "var(--canvas-crest-size)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 85%, transparent)",
            maskImage:
              "radial-gradient(ellipse at center, black 85%, transparent)",
          }}
        />

        {/* Tagline — appears after crest is fully revealed */}
        {(() => {
          const opacity = phaseOpacities[0];
          if (opacity < 0.01) return null;
          return (
            <div
              className="absolute z-10 bottom-20 left-4 right-4 md:bottom-[12%] md:left-1/2 md:-translate-x-1/2 flex flex-col items-center text-center"
              style={{
                opacity,
                transform: `translateY(${(1 - opacity) * 10}px)`,
              }}
            >
              <h3 className="font-serif text-lg md:text-2xl lg:text-3xl text-tj-cream/80 leading-[1.2] font-light tracking-wide">
                Houston&rsquo;s Premier Dealership
              </h3>
            </div>
          );
        })()}

        {/* Contact */}
        {(() => {
          const opacity = phaseOpacities[1];
          if (opacity < 0.01) return null;
          return (
            <div
              className="absolute z-10 bottom-14 left-4 right-4 md:bottom-[8%] md:left-1/2 md:-translate-x-1/2 flex flex-col items-center text-center"
              style={{
                opacity,
                transform: `translateY(${(1 - opacity) * 8}px)`,
              }}
            >
              <a
                href="tel:+18324009760"
                className="font-serif text-xl md:text-2xl text-tj-gold hover:text-tj-gold-light transition-colors py-2"
              >
                (832) 400-9760
              </a>
              <address className="not-italic mt-2 text-white/30 text-[11px] tracking-wide">
                8774 Almeda Genoa Rd, Houston, TX 77075
              </address>
              <p className="mt-1 text-white/20 text-[10px] tracking-widest uppercase">
                Dealer License P171632
              </p>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
