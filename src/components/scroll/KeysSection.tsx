"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const TOTAL_FRAMES = 121;
const BATCH_SIZE = 20;

interface Phase {
  start: number;
  end: number;
  side: "left" | "right" | "center";
  labelKey: string;
  headingKey: string;
  heading2Key?: string;
  ctaKey?: string;
  ctaHref?: string;
}

const PHASES: Phase[] = [
  {
    start: 0.05,
    end: 0.35,
    side: "right",
    labelKey: "keysPhase1",
    headingKey: "keysHeading1",
    heading2Key: "keysSub1",
  },
  {
    start: 0.40,
    end: 0.70,
    side: "left",
    labelKey: "keysPhase2",
    headingKey: "keysHeading2",
    heading2Key: "keysSub2",
  },
  {
    start: 0.75,
    end: 1.0,
    side: "center",
    labelKey: "keysPhase3",
    headingKey: "keysHeading3",
    ctaKey: "keysCta",
    ctaHref: "/inventory",
  },
];

const lerp = (current: number, target: number, factor: number) =>
  current + (target - current) * factor;

interface KeysSectionProps {
  onProgress?: (loaded: number, total: number) => void;
}

export default function KeysSection({ onProgress }: KeysSectionProps) {
  const t = useTranslations("home");
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
              const resp = await fetch(`/key-frames/frame-${num}.webp`);
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
          const scale = 1 + rawProgress * 0.04;
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
          src="/key-frames/frame-0001.webp"
          alt=""
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[82vw] h-auto object-contain md:hidden"
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
            width: "var(--canvas-keys-w)",
            height: "var(--canvas-keys-h)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 85%, transparent)",
            maskImage:
              "radial-gradient(ellipse at center, black 85%, transparent)",
          }}
        />

        {PHASES.map((phase, i) => {
          const positionClasses =
            phase.side === "right"
              ? "bottom-20 left-4 right-4 md:bottom-auto md:left-auto md:top-1/2 md:-translate-y-1/2 md:right-12 lg:right-20 md:text-right md:items-end"
              : phase.side === "left"
              ? "bottom-20 left-4 right-4 md:bottom-auto md:right-auto md:top-1/2 md:-translate-y-1/2 md:left-12 lg:left-20 md:text-left md:items-start"
              : "bottom-10 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:bottom-[3%]";

          return (
            <div
              key={i}
              ref={(el) => { overlayRefs.current[i] = el; }}
              className={`absolute z-10 max-w-full md:max-w-[340px] flex flex-col items-center text-center ${positionClasses}`}
              style={{ visibility: "hidden", opacity: 0 }}
            >
              <span className="font-accent text-[10px] md:text-[9px] uppercase tracking-[0.4em] text-tj-gold-light mb-2 md:mb-4">
                {t(phase.labelKey)}
              </span>
              <h3 className="font-serif text-2xl md:text-4xl lg:text-5xl text-tj-cream leading-[1.1] font-light">
                {t(phase.headingKey)}
                {phase.heading2Key && (
                  <>
                    <br />
                    {t(phase.heading2Key)}
                  </>
                )}
              </h3>
              {phase.ctaKey && phase.ctaHref && (
                <div className="mt-5 md:mt-8">
                  <Link
                    href={phase.ctaHref}
                    className="border-b border-tj-gold-light/30 hover:border-tj-gold-light pb-2 text-[11px] md:text-[10px] uppercase tracking-[0.3em] text-tj-cream transition-colors flex items-center gap-4 group min-h-[44px]"
                  >
                    {t(phase.ctaKey)}{" "}
                    <span className="group-hover:translate-x-2 transition-transform duration-500">
                      &rarr;
                    </span>
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
