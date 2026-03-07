import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useGSAPAnimations = () => {
  useEffect(() => {
    // Small delay to ensure DOM is rendered
    const ctx = gsap.context(() => {
      // Fade up
      gsap.utils.toArray<HTMLElement>('[data-animate="fade-up"]').forEach(el => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          y: 50,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power2.inOut',
        });
      });

      // Image reveal (clip-path)
      gsap.utils.toArray<HTMLElement>('[data-animate="reveal"]').forEach(el => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
          clipPath: 'inset(12% 12% 12% 12%)',
          duration: 1.2,
          ease: 'power4.out',
        });
      });

      // Horizontal rule grow
      gsap.utils.toArray<HTMLElement>('[data-animate="rule"]').forEach(el => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 85%' },
          width: 0,
          duration: 0.8,
          ease: 'power2.inOut',
        });
      });

      // Stagger children
      gsap.utils.toArray<HTMLElement>('[data-animate="stagger"]').forEach(container => {
        gsap.from(container.children, {
          scrollTrigger: { trigger: container, start: 'top 80%' },
          y: 40,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 0.6,
          ease: 'power2.inOut',
        });
      });
    });

    return () => ctx.revert();
  }, []);
};
