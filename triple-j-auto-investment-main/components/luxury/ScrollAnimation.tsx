import { useRef, useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const TOTAL_FRAMES = 151;
const BATCH_SIZE = 20;
const FRAME_W = 1440;
const FRAME_H = 1440;

interface Phase {
  start: number;
  end: number;
  side: 'left' | 'right';
  labelKey: 'label' | '01' | '02' | '03';
  headingKey: 'title' | 'item1Title' | 'item2Title' | 'item3Title';
  bodyKey: '' | 'item1Desc' | 'item2Desc' | 'item3Desc';
}

const PHASES: Phase[] = [
  {
    start: 0.05, end: 0.28, side: 'right',
    labelKey: 'label', headingKey: 'title', bodyKey: '',
  },
  {
    start: 0.32, end: 0.52, side: 'left',
    labelKey: '01', headingKey: 'item1Title', bodyKey: 'item1Desc',
  },
  {
    start: 0.54, end: 0.74, side: 'right',
    labelKey: '02', headingKey: 'item2Title', bodyKey: 'item2Desc',
  },
  {
    start: 0.76, end: 0.95, side: 'left',
    labelKey: '03', headingKey: 'item3Title', bodyKey: 'item3Desc',
  },
];

/** Lerp toward target at a given speed factor (0–1, lower = smoother) */
const lerp = (current: number, target: number, factor: number) =>
  current + (target - current) * factor;

export const ScrollAnimation = () => {
  const { t } = useLanguage();
  const lx = t.home.luxury.experience;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phaseOpacities, setPhaseOpacities] = useState<number[]>(new Array(PHASES.length).fill(0));

  useEffect(() => {
    let targetFrame = 0;
    let smoothFrame = 0;
    let drawnFrame = -1;
    let rafId: number;
    let rawProgress = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    // ── Preload frames in batches ──
    const loadFrames = async () => {
      for (let i = 0; i < TOTAL_FRAMES; i += BATCH_SIZE) {
        const batch: Promise<void>[] = [];
        for (let j = i; j < Math.min(i + BATCH_SIZE, TOTAL_FRAMES); j++) {
          batch.push(
            new Promise<void>((resolve) => {
              const img = new Image();
              const num = (j + 1).toString().padStart(4, '0');
              img.src = `/frames/frame-${num}.webp`;
              img.onload = () => { images[j] = img; resolve(); };
              img.onerror = () => { resolve(); };
            })
          );
        }
        await Promise.all(batch);
        setProgress(Math.min(100, Math.round(((i + BATCH_SIZE) / TOTAL_FRAMES) * 100)));
      }
      setLoaded(true);
    };

    loadFrames();

    // ── Passive scroll handler: calculate target only ──
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;
      if (scrollDistance <= 0) return;

      rawProgress = Math.max(0, Math.min(1, -rect.top / scrollDistance));
      targetFrame = Math.min(Math.floor(rawProgress * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // ── rAF render loop: lerp + draw ──
    const tick = () => {
      // Smooth interpolation toward target frame
      smoothFrame = lerp(smoothFrame, targetFrame, 0.12);
      const displayFrame = Math.round(smoothFrame);

      if (displayFrame !== drawnFrame && canvasRef.current) {
        const img = images[displayFrame];
        if (img) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            if (canvasRef.current.width !== FRAME_W) canvasRef.current.width = FRAME_W;
            if (canvasRef.current.height !== FRAME_H) canvasRef.current.height = FRAME_H;
            ctx.clearRect(0, 0, FRAME_W, FRAME_H);
            ctx.drawImage(img, 0, 0, FRAME_W, FRAME_H);
            drawnFrame = displayFrame;
          }
        }
      }

      // Smooth phase opacities (fade in/out gradually)
      setPhaseOpacities(prev => {
        let changed = false;
        const next = prev.map((o, i) => {
          const p = PHASES[i];
          const fadeIn = p.start;
          const fadeOut = p.end;
          const fadeRange = 0.04;

          let target: number;
          if (rawProgress < fadeIn || rawProgress > fadeOut) {
            target = 0;
          } else if (rawProgress < fadeIn + fadeRange) {
            target = (rawProgress - fadeIn) / fadeRange;
          } else if (rawProgress > fadeOut - fadeRange) {
            target = (fadeOut - rawProgress) / fadeRange;
          } else {
            target = 1;
          }

          const smoothed = lerp(o, target, 0.08);
          const clamped = Math.max(0, Math.min(1, smoothed));
          if (Math.abs(clamped - o) > 0.001) changed = true;
          return clamped;
        });
        return changed ? next : prev;
      });

      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-[300vh] md:h-[500vh] bg-[#F7F7F7] border-t border-tj-gold/15">
      {/* Loading overlay */}
      {!loaded && (
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center z-50 bg-[#F7F7F7]">
          <img
            src="/GoldTripleJLogo.png"
            alt="Triple J Auto Investment"
            className="w-14 h-14 mb-8 opacity-40 animate-pulse"
          />
          <div className="w-48 h-[2px] bg-[#0e1b16]/[0.06] overflow-hidden">
            <div
              className="h-full bg-tj-gold transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[#0e1b16]/30 text-[10px] uppercase tracking-[0.4em] mt-4 font-sans">
            {progress}%
          </p>
        </div>
      )}

      {/* Sticky viewport */}
      <div
        className={`sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-[#F7F7F7] transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Radial vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: 'radial-gradient(ellipse 70% 70% at center, transparent 40%, rgba(247,247,247,0.85) 100%)',
          }}
        />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute top-1/2 left-1/2 w-[85vw] h-[85vw] md:w-[60vh] md:h-[60vh] lg:w-[70vh] lg:h-[70vh] object-contain pointer-events-none"
          style={{
            transform: 'translate(-50%, -50%)',
            willChange: 'transform',
          }}
        />

        {/* Phase overlay cards */}
        {PHASES.map((phase, i) => {
          const opacity = phaseOpacities[i];
          const isRight = phase.side === 'right';
          const label = phase.labelKey === 'label' ? lx.label : phase.labelKey;
          const heading = (lx as Record<string, string>)[phase.headingKey] || phase.headingKey;
          const body = phase.bodyKey ? (lx as Record<string, string>)[phase.bodyKey] || '' : '';

          if (opacity < 0.01) return null;

          return (
            <div
              key={i}
              className={`absolute z-10 max-w-[280px] md:max-w-[340px] flex flex-col ${
                isRight
                  ? 'right-6 md:right-12 lg:right-20 text-right items-end'
                  : 'left-6 md:left-12 lg:left-20 text-left items-start'
              } bottom-20 md:bottom-auto md:top-1/2 md:-translate-y-1/2`}
              style={{
                opacity,
                transform: `translateY(${(1 - opacity) * 12}px) scale(${0.97 + opacity * 0.03})`,
                transition: 'none',
              }}
            >
              <div className="bg-white/60 backdrop-blur-2xl border border-tj-gold/[0.15] p-6 md:p-8 shadow-sm">
                <span className="text-tj-gold text-[9px] uppercase tracking-[0.4em] block mb-3 font-sans">
                  {label}
                </span>
                <h3 className="font-serif text-xl md:text-2xl lg:text-3xl text-[#0e1b16] leading-tight mb-3">
                  {heading}
                </h3>
                {body && (
                  <p className="text-[#0e1b16]/50 text-sm leading-relaxed font-sans">
                    {body}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScrollAnimation;
