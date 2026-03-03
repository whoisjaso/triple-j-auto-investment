import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface CustomCursorProps {
  isVisible?: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({ isVisible = true }) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  
  // Check if touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect touch device
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0
      );
    };
    checkTouch();

    if (isTouchDevice || !isVisible) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;

    if (!cursor || !follower) return;

    // Mouse position
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let followerX = 0;
    let followerY = 0;

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Smooth animation loop
    const animate = () => {
      // Cursor follows immediately with slight delay
      cursorX += (mouseX - cursorX) * 0.2;
      cursorY += (mouseY - cursorY) * 0.2;
      
      // Follower follows with more delay
      followerX += (mouseX - followerX) * 0.1;
      followerY += (mouseY - followerY) * 0.1;

      if (cursor) {
        cursor.style.transform = `translate(${cursorX - 10}px, ${cursorY - 10}px) scale(${isClicking ? 0.8 : 1})`;
      }
      
      if (follower) {
        follower.style.transform = `translate(${followerX - 20}px, ${followerY - 20}px) scale(${isHovering ? 1.5 : 1})`;
      }

      requestAnimationFrame(animate);
    };

    // Handle hover on interactive elements
    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Add hover listeners to interactive elements
    const interactiveElements = document.querySelectorAll(
      'a, button, [role="button"], input, textarea, select, [data-cursor-hover]'
    );
    
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    // Start animation
    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
      
      cancelAnimationFrame(animationId);
    };
  }, [isVisible, isHovering, isClicking, isTouchDevice]);

  // Don't render on touch devices
  if (isTouchDevice || !isVisible) return null;

  return (
    <>
      {/* Main cursor dot */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-5 h-5 pointer-events-none z-[99999] mix-blend-difference"
        style={{
          background: '#D4AF37',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.15s ease-out, width 0.2s, height 0.2s',
        }}
      />
      
      {/* Follower ring */}
      <div
        ref={followerRef}
        className="fixed top-0 left-0 w-10 h-10 pointer-events-none z-[99998]"
        style={{
          border: '1px solid rgba(212, 175, 55, 0.5)',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.3s ease-out, width 0.3s, height 0.3s, border-color 0.3s',
          backgroundColor: isHovering ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
        }}
      />
    </>
  );
};

export default CustomCursor;
