import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  type?: 'chars' | 'words' | 'lines';
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'reveal';
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className = '',
  delay = 0,
  stagger = 0.02,
  type = 'chars',
  animation = 'fadeUp',
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.querySelectorAll('.anim-char');

    const animations: Record<string, gsap.TweenVars> = {
      fadeUp: {
        y: 100,
        opacity: 0,
      },
      fadeIn: {
        opacity: 0,
      },
      slideLeft: {
        x: -50,
        opacity: 0,
      },
      reveal: {
        y: '100%',
      },
    };

    gsap.set(elements, animations[animation]);

    gsap.to(elements, {
      y: 0,
      x: 0,
      opacity: 1,
      duration: 0.8,
      stagger: stagger,
      delay: delay,
      ease: 'power3.out',
    });
  }, [text, delay, stagger, animation]);

  const renderContent = () => {
    if (type === 'chars') {
      return text.split('').map((char, i) => (
        <span
          key={i}
          className="anim-char inline-block"
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ));
    }

    if (type === 'words') {
      return text.split(' ').map((word, i) => (
        <span key={i} className="anim-char inline-block mr-[0.25em]">
          {word}
        </span>
      ));
    }

    return text.split('\n').map((line, i) => (
      <span key={i} className="anim-char block">
        {line}
      </span>
    ));
  };

  return (
    <span ref={containerRef} className={className}>
      {renderContent()}
    </span>
  );
};

export default AnimatedText;
