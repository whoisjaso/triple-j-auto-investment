import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 1,
  distance = 60,
  once = true,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    // Set initial state
    const initialState: Record<string, gsap.TweenVars> = {
      up: { y: distance, opacity: 0 },
      down: { y: -distance, opacity: 0 },
      left: { x: distance, opacity: 0 },
      right: { x: -distance, opacity: 0 },
      scale: { scale: 0.9, opacity: 0 },
    };

    gsap.set(element, initialState[direction]);

    // Create animation
    triggerRef.current = ScrollTrigger.create({
      trigger: element,
      start: 'top 85%',
      once: once,
      onEnter: () => {
        gsap.to(element, {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          duration: duration,
          delay: delay,
          ease: 'power3.out',
        });
      },
    });

    return () => {
      if (triggerRef.current) {
        triggerRef.current.kill();
      }
    };
  }, [direction, delay, duration, distance, once]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
};

export default ScrollReveal;
