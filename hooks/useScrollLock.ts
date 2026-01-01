import { useEffect, useRef } from 'react';

// Global lock counter to handle nested modals
let lockCount = 0;
let savedScrollY = 0;

/**
 * Hook to lock/unlock body scroll when modals or overlays are open.
 * Handles nested modals correctly with a lock counter.
 * Preserves scroll position and restores it when all locks are released.
 */
export function useScrollLock(isLocked: boolean) {
  const wasLockedRef = useRef(false);

  useEffect(() => {
    if (isLocked && !wasLockedRef.current) {
      // First lock - save scroll position
      if (lockCount === 0) {
        savedScrollY = window.scrollY;
        const body = document.body;
        const html = document.documentElement;

        // Lock body scroll
        body.style.position = 'fixed';
        body.style.top = `-${savedScrollY}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';
        body.style.overflow = 'hidden';
        html.style.overflow = 'hidden';
      }
      lockCount++;
      wasLockedRef.current = true;
    } else if (!isLocked && wasLockedRef.current) {
      // Unlocking
      lockCount = Math.max(0, lockCount - 1);
      wasLockedRef.current = false;

      // Last unlock - restore scroll
      if (lockCount === 0) {
        const body = document.body;
        const html = document.documentElement;

        // Restore body scroll
        body.style.position = '';
        body.style.top = '';
        body.style.left = '';
        body.style.right = '';
        body.style.width = '';
        body.style.overflow = '';
        html.style.overflow = '';

        // Restore scroll position
        window.scrollTo(0, savedScrollY);
      }
    }

    // Cleanup on unmount
    return () => {
      if (wasLockedRef.current) {
        lockCount = Math.max(0, lockCount - 1);
        wasLockedRef.current = false;

        if (lockCount === 0) {
          const body = document.body;
          const html = document.documentElement;

          body.style.position = '';
          body.style.top = '';
          body.style.left = '';
          body.style.right = '';
          body.style.width = '';
          body.style.overflow = '';
          html.style.overflow = '';

          window.scrollTo(0, savedScrollY);
        }
      }
    };
  }, [isLocked]);
}

export default useScrollLock;
