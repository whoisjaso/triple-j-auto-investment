import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const TOTAL_FRAMES = 121;
const BATCH_SIZE = 20;

export const KeyScrollAnimation = () => {
  const { t } = useLanguage();
  const k = t.home.luxury.key;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [progressText, setProgressText] = useState('0');
  const [phase, setPhase] = useState(-1);

  useEffect(() => {
    let currentFrame = 0;
    let drawnFrame = -1;
    let animationFrameId: number;
    let images: HTMLImageElement[] = [];

    // Batched preload — all frames upfront before experience starts
    const loadFrames = async () => {
      images = new Array(TOTAL_FRAMES);
      for (let i = 0; i < TOTAL_FRAMES; i += BATCH_SIZE) {
        const batch = [];
        for (let j = i; j < Math.min(i + BATCH_SIZE, TOTAL_FRAMES); j++) {
          batch.push(
            new Promise<void>((resolve) => {
              const img = new Image();
              const frameNum = (j + 1).toString().padStart(4, '0');
              img.src = `/key-frames/frame-${frameNum}.webp`;
              img.onload = () => {
                images[j] = img;
                resolve();
              };
              img.onerror = () => {
                console.error(`Failed to load key frame ${frameNum}`);
                resolve();
              };
            })
          );
        }
        await Promise.all(batch);
        setProgressText(Math.min(100, Math.floor(((i + BATCH_SIZE) / TOTAL_FRAMES) * 100)).toString());
      }
      setLoaded(true);
    };

    loadFrames();

    // Scroll handler: ONLY calculates state — never draws
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollDistance = rect.height - window.innerHeight;

      let rawProgress = -rect.top / scrollDistance;
      rawProgress = Math.max(0, Math.min(1, rawProgress));

      currentFrame = Math.floor(rawProgress * (TOTAL_FRAMES - 1));

      // Text overlay phases — mapped to scroll ranges with gaps between
      if (rawProgress >= 0.05 && rawProgress < 0.35) setPhase(1);
      else if (rawProgress >= 0.40 && rawProgress < 0.70) setPhase(2);
      else if (rawProgress >= 0.75 && rawProgress <= 1.0) setPhase(3);
      else setPhase(-1);

      // Subtle cinematic push-in
      if (canvasRef.current) {
        const scale = 1 + rawProgress * 0.06;
        canvasRef.current.style.transform = `translate(-50%, -50%) scale(${scale})`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // rAF loop: ONLY draws when frame actually changed
    const tick = () => {
      if (currentFrame !== drawnFrame && images[currentFrame] && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const img = images[currentFrame];
          const canvas = canvasRef.current;

          if (canvas.width !== img.width || canvas.height !== img.height) {
            canvas.width = img.width;
            canvas.height = img.height;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Make near-white pixels transparent so the key floats on the page bg
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imageData.data;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2];
            if (r > 230 && g > 230 && b > 230) {
              d[i + 3] = 0;
            } else if (r > 210 && g > 210 && b > 210) {
              const avg = (r + g + b) / 3;
              d[i + 3] = Math.round(255 * (1 - (avg - 210) / 20));
            }
          }
          ctx.putImageData(imageData, 0, 0);

          drawnFrame = currentFrame;
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-[250vh] bg-[#F7F7F7]">
      {/* Loading state */}
      {!loaded && (
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center z-50 bg-[#F7F7F7]">
          <img src="/GoldTripleJLogo.png" alt="Triple J Auto Investment" className="w-12 h-12 mb-8 opacity-40 animate-pulse" />
          <p className="text-[#0e1b16] text-[9px] uppercase tracking-[0.4em] font-sans">
            {k.loading} {progressText}%
          </p>
        </div>
      )}

      {/* Sticky viewport — canvas + text overlays */}
      <div className={`sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center transition-opacity duration-[1500ms] ${loaded ? 'opacity-100' : 'opacity-0'}`}>

        <canvas
          ref={canvasRef}
          className="absolute top-1/2 left-1/2 w-[80vw] h-[50vh] md:h-[70vh] md:w-[50vw] lg:w-[45vw] object-contain pointer-events-none"
          style={{
            transform: 'translate(-50%, -50%) scale(1)',
            filter: 'drop-shadow(0 0 2px rgba(212,175,55,0.5)) drop-shadow(0 0 8px rgba(212,175,55,0.2)) drop-shadow(0 0 20px rgba(212,175,55,0.08))'
          }}
        />

        {/* Phase 1: Right side — "The Instrument" */}
        <div className={`absolute bottom-8 right-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:right-12 lg:right-20 max-w-[45%] md:max-w-[280px] lg:max-w-[320px] flex flex-col items-end text-right transition-all duration-1000 ease-out ${phase === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
          <span className="uppercase tracking-[0.3em] text-[9px] text-tj-gold mb-4">{k.phase1Label}</span>
          <h3 className="font-serif text-2xl md:text-4xl lg:text-5xl text-[#0e1b16] leading-[1.1] font-light">
            {k.phase1Text}<br />{k.phase1Text2}
          </h3>
        </div>

        {/* Phase 2: Left side — "The Ritual" */}
        <div className={`absolute bottom-8 left-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-12 lg:left-20 max-w-[45%] md:max-w-[280px] lg:max-w-[320px] flex flex-col items-start transition-all duration-1000 ease-out ${phase === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8 pointer-events-none'}`}>
          <span className="uppercase tracking-[0.3em] text-[9px] text-tj-gold mb-4">{k.phase2Label}</span>
          <h3 className="font-serif text-2xl md:text-4xl lg:text-5xl text-[#0e1b16] leading-[1.1] font-light">
            {k.phase2Text}<br />{k.phase2Text2}
          </h3>
        </div>

        {/* Phase 3: Center bottom — "The Acquisition" with CTA */}
        <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 md:bottom-[10%] max-w-[85%] md:max-w-[400px] flex flex-col items-center text-center transition-all duration-1000 ease-out ${phase === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
          <span className="uppercase tracking-[0.3em] text-[9px] text-tj-gold mb-4">{k.phase3Label}</span>
          <h3 className="font-serif text-2xl md:text-4xl lg:text-5xl text-[#0e1b16] leading-[1.1] font-light italic mb-8">
            {k.phase3Text}
          </h3>
          <div className={`transition-opacity duration-1000 delay-300 ${phase === 3 ? 'opacity-100' : 'opacity-0'}`}>
            <Link to="/inventory" className="border-b border-tj-gold/30 hover:border-tj-gold pb-2 text-[10px] uppercase tracking-[0.3em] text-[#0e1b16] transition-colors flex items-center gap-4 group">
              {k.phase3Cta} <span className="group-hover:translate-x-2 transition-transform duration-500">&rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
