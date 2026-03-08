"use client";

import { useRef, useEffect, useState, useCallback } from "react";

const TOTAL_FRAMES = 121;
const BATCH_SIZE = 20;

interface Phase {
  start: number;
  end: number;
  side: "left" | "right" | "center";
  label: string;
  heading: string;
  heading2?: string;
  body?: string;
  cta?: { text: string; href: string };
}

const PHASES: Phase[] = [
  {
    start: 0.05,
    end: 0.28,
    side: "right",
    label: "THE STANDARD",
    heading: "Uncompromising",
    heading2: "Excellence",
  },
  {
    start: 0.32,
    end: 0.55,
    side: "left",
    label: "THE CRAFT",
    heading: "Every Detail",
    heading2: "Perfected",
  },
  {
    start: 0.60,
    end: 0.92,
    side: "center",
    label: "THE COLLECTION",
    heading: "Your Journey Begins",
    cta: { text: "Explore Inventory", href: "/inventory" },
  },
];

const lerp = (current: number, target: number, factor: number) =>
  current + (target - current) * factor;

interface MaybachSectionProps {
  onProgress?: (loaded: number, total: number) => void;
}

export default function MaybachSection({ onProgress }: MaybachSectionProps) {
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
    const images: (HTMLImageElement | null)[] = new Array(frameCount).fill(null);

    for (let batch = 0; batch < frameCount; batch += BATCH_SIZE) {
      const promises: Promise<void>[] = [];
      const end = Math.min(batch + BATCH_SIZE, frameCount);
      for (let k = batch; k < end; k++) {
        promises.push(
          new Promise<void>((resolve) => {
            const img = new Image();
            const num = (k * step + 1).toString().padStart(4, "0");
            img.src = `/maybach-frames/frame-${num}.webp`;
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
    let ctx: CanvasRenderingContext2D | null = null;
    let canvasSized = false;
    const isMobile = window.innerWidth < 768;
    const canvasScale = isMobile ? 0.5 : 1;
    const opacities = new Array(PHASES.length).fill(0);

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

      smoothFrame = lerp(smoothFrame, targetFrame, 0.18);
      const displayFrame = Math.round(smoothFrame);

      if (displayFrame !== drawnFrame && canvasRef.current) {
        const img = images[displayFrame];
        if (img) {
          if (!ctx) ctx = canvasRef.current.getContext("2d");
          if (ctx) {
            if (!canvasSized) {
              const cw = Math.round(img.naturalWidth * canvasScale);
              const ch = Math.round(img.naturalHeight * canvasScale);
              canvasRef.current.width = cw;
              canvasRef.current.height = ch;
              canvasSized = true;
            }
            ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
            drawnFrame = displayFrame;
          }
        }
      }

      // GPU-composited scale
      if (canvasRef.current) {
        const scale = 1 + rawProgress * 0.06;
        canvasRef.current.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`;
      }

      // Direct DOM opacity updates — no React state
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
        opacities[i] = Math.max(0, Math.min(1, lerp(opacities[i], target, 0.1)));

        const el = overlayRefs.current[i];
        if (el) {
          if (opacities[i] < 0.01) {
            el.style.visibility = "hidden";
          } else {
            el.style.visibility = "visible";
            el.style.opacity = String(opacities[i]);
            el.style.transform = `translateY(${(1 - opacities[i]) * 12}px)`;
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
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [loadFrames]);

  return (
    <section
      ref={containerRef}
      className="relative h-[300vh]"
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
            transform: "translate3d(-50%, -50%, 0) scale(1)",
            willChange: "transform",
            width: "var(--canvas-maybach-w)",
            height: "var(--canvas-maybach-h)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 85%, transparent)",
            maskImage:
              "radial-gradient(ellipse at center, black 85%, transparent)",
          }}
        />

        {/* Phase overlays — always rendered, visibility toggled via refs */}
        {PHASES.map((phase, i) => {
          const positionClasses =
            phase.side === "right"
              ? "bottom-20 left-4 right-4 md:bottom-auto md:left-auto md:top-1/2 md:-translate-y-1/2 md:right-12 lg:right-20 md:text-right md:items-end"
              : phase.side === "left"
              ? "bottom-20 left-4 right-4 md:bottom-auto md:right-auto md:top-1/2 md:-translate-y-1/2 md:left-12 lg:left-20 md:text-left md:items-start"
              : "bottom-12 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-[10%]";

          return (
            <div
              key={i}
              ref={(el) => { overlayRefs.current[i] = el; }}
              className={`absolute z-10 max-w-full md:max-w-[340px] flex flex-col items-center text-center ${positionClasses}`}
              style={{ visibility: "hidden", opacity: 0 }}
            >
              <span className="font-accent text-[10px] md:text-[9px] uppercase tracking-[0.4em] text-tj-gold mb-2 md:mb-4">
                {phase.label}
              </span>
              <h3 className="font-serif text-2xl md:text-4xl lg:text-5xl text-tj-cream leading-[1.1] font-light">
                {phase.heading}
                {phase.heading2 && (
                  <>
                    <br />
                    {phase.heading2}
                  </>
                )}
              </h3>
              {phase.body && (
                <p className="mt-3 text-white/50 text-xs md:text-sm leading-relaxed max-w-[260px]">
                  {phase.body}
                </p>
              )}
              {phase.cta && (
                <div className="mt-5 md:mt-8">
                  <a
                    href={phase.cta.href}
                    className="border-b border-tj-gold/30 hover:border-tj-gold pb-2 text-[11px] md:text-[10px] uppercase tracking-[0.3em] text-tj-cream transition-colors flex items-center gap-4 group min-h-[44px]"
                  >
                    {phase.cta.text}{" "}
                    <span className="group-hover:translate-x-2 transition-transform duration-500">
                      &rarr;
                    </span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
