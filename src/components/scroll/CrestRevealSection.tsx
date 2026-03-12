"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("home");
  const tFooter = useTranslations("footer");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [loaded, setLoaded] = useState(false);

  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  const loadFrames = useCallback(async () => {
    const isMobile = window.innerWidth < 768;
    const step = isMobile ? 2 : 1;
    const frameCount = Math.ceil(TOTAL_FRAMES / step);
    const bitmaps: (ImageBitmap | null)[] = new Array(frameCount).fill(null);

    for (let batch = 0; batch < frameCount; batch += BATCH_SIZE) {
      const promises: Promise<void>[] = [];
      const end = Math.min(batch + BATCH_SIZE, frameCount);
      for (let k = batch; k < end; k++) {
        promises.push(
          (async () => {
            try {
              const num = (k * step + 1).toString().padStart(4, "0");
              const resp = await fetch(`/crest-frames/frame-${num}.webp`);
              const blob = await resp.blob();
              bitmaps[k] = await createImageBitmap(blob);
            } catch {
              // skip failed frames
            }
          })()
        );
      }
      await Promise.all(promises);
      onProgressRef.current?.(
        Math.min(batch + BATCH_SIZE, frameCount),
        frameCount
      );
    }

    return { bitmaps, frameCount };
  }, []);

  useEffect(() => {
    let drawnFrame = -1;
    let rafId: number | null = null;
    let bitmaps: (ImageBitmap | null)[] = [];
    let effectiveFrames = TOTAL_FRAMES;
    let isVisible = true;
    let ctx: CanvasRenderingContext2D | null = null;
    let canvasSized = false;
    const isMobile = window.innerWidth < 768;
    const canvasScale = isMobile ? 0.5 : 1;
    const opacities = new Array(PHASES.length).fill(0);

    // Mobile: skip frame loading to prevent GPU memory crash (~1.5GB VRAM)
    if (isMobile) {
      onProgressRef.current?.(1, 1);
      setLoaded(true);
    } else {
      loadFrames().then((result) => {
        bitmaps = result.bitmaps;
        effectiveFrames = result.frameCount;
        setLoaded(true);
      });
    }

    const tick = () => {
      if (!isVisible) {
        rafId = null;
        return;
      }

      let rawProgress = 0;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollDistance = rect.height - window.innerHeight;
        if (scrollDistance > 0) {
          rawProgress = Math.max(0, Math.min(1, -rect.top / scrollDistance));
        }
      }

      // Canvas frame animation — desktop only
      if (!isMobile) {
        const displayFrame = Math.min(
          Math.round(rawProgress * (effectiveFrames - 1)),
          effectiveFrames - 1
        );

        if (displayFrame !== drawnFrame && canvasRef.current) {
          const bmp = bitmaps[displayFrame];
          if (bmp) {
            if (!ctx) ctx = canvasRef.current.getContext("2d", { alpha: false });
            if (ctx) {
              if (!canvasSized) {
                const cw = Math.round(bmp.width * canvasScale);
                const ch = Math.round(bmp.height * canvasScale);
                canvasRef.current.width = cw;
                canvasRef.current.height = ch;
                canvasSized = true;
              }
              ctx.drawImage(bmp, 0, 0, canvasRef.current.width, canvasRef.current.height);
              drawnFrame = displayFrame;
            }
          }
        }

        if (canvasRef.current) {
          const scale = 1 + rawProgress * 0.08;
          canvasRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`;
        }
      }

      // Direct DOM opacity updates — both mobile and desktop
      for (let i = 0; i < PHASES.length; i++) {
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
        opacities[i] = Math.max(0, Math.min(1, lerp(opacities[i], target, 0.14)));

        const el = overlayRefs.current[i];
        if (el) {
          if (opacities[i] < 0.01) {
            el.style.visibility = "hidden";
          } else {
            el.style.visibility = "visible";
            el.style.opacity = String(opacities[i]);
            el.style.transform = `translateY(${(1 - opacities[i]) * 10}px)`;
          }
        }
      }

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
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [loadFrames]);

  return (
    <section
      ref={containerRef}
      className="relative h-[130vh] md:h-[250vh]"
      style={{ backgroundColor: "#000" }}
    >
      <div
        className={`sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center transition-opacity duration-1000 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Static image for mobile — prevents GPU memory crash */}
        <img
          src="/crest-frames/frame-0001.webp"
          alt=""
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[65vw] h-auto object-contain md:hidden mobile-ken-burns"
          style={{
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 70%, transparent 100%)",
            maskImage:
              "radial-gradient(ellipse at center, black 70%, transparent 100%)",
          }}
        />

        {/* Canvas for desktop frame animation */}
        <canvas
          ref={canvasRef}
          className="absolute top-1/2 left-1/2 pointer-events-none hidden md:block"
          style={{
            transform: "translate3d(-50%, -50%, 0) scale(1)",
            willChange: "transform",
            width: "var(--canvas-crest-size)",
            height: "var(--canvas-crest-size)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 85%, transparent)",
            maskImage:
              "radial-gradient(ellipse at center, black 85%, transparent)",
          }}
        />

        {/* Tagline */}
        <div
          ref={(el) => { overlayRefs.current[0] = el; }}
          className="absolute z-10 bottom-20 left-4 right-4 md:bottom-[12%] md:left-1/2 md:-translate-x-1/2 flex flex-col items-center text-center"
          style={{ visibility: "hidden", opacity: 0 }}
        >
          <h3 className="font-serif text-lg md:text-2xl lg:text-3xl text-tj-cream/80 leading-[1.2] font-light tracking-wide">
            {t("crestTagline")}
          </h3>
        </div>

        {/* Contact */}
        <div
          ref={(el) => { overlayRefs.current[1] = el; }}
          className="absolute z-10 bottom-14 left-4 right-4 md:bottom-[8%] md:left-1/2 md:-translate-x-1/2 flex flex-col items-center text-center"
          style={{ visibility: "hidden", opacity: 0 }}
        >
          <a
            href="tel:+18324009760"
            className="font-serif text-xl md:text-2xl text-tj-gold hover:text-tj-gold-light transition-colors py-2"
          >
            (832) 400-9760
          </a>
          <address className="not-italic mt-2 text-white/30 text-[11px] tracking-wide">
            {tFooter("address")}, {tFooter("addressCity")}
          </address>
          <p className="mt-1 text-white/20 text-[10px] tracking-widest uppercase">
            {tFooter("dealerLicense")}
          </p>
        </div>
      </div>
    </section>
  );
}
