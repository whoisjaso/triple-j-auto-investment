import React, { useRef, useState, ReactNode } from 'react';
import { gsap } from 'gsap';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  href?: string;
  to?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  strength = 0.5,
  onClick,
  href,
  to,
}) => {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(buttonRef.current, {
      x: x * strength,
      y: y * strength,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current) return;

    setIsHovered(false);
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)',
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const baseClasses = `
    relative inline-flex items-center justify-center
    px-8 py-4
    font-montserrat text-xs font-medium uppercase tracking-[0.25em]
    transition-all duration-500
    overflow-hidden
    ${isHovered ? 'text-black' : 'text-white'}
    ${className}
  `;

  const content = (
    <>
      {/* Background fill animation */}
      <span
        className="absolute inset-0 bg-[#D4AF37] transform scale-x-0 origin-left transition-transform duration-500 ease-out"
        style={{
          transform: isHovered ? 'scaleX(1)' : 'scaleX(0)',
        }}
      />
      
      {/* Border */}
      <span className="absolute inset-0 border border-[#D4AF37] opacity-50" />
      
      {/* Corner accents */}
      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#D4AF37]" />
      <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#D4AF37]" />
      <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#D4AF37]" />
      <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#D4AF37]" />
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-3">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={baseClasses}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      className={baseClasses}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
    >
      {content}
    </button>
  );
};

export default MagneticButton;
