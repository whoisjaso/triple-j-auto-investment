import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component - scrolls to top on route changes
 * Handles scroll lock cleanup and ensures scroll works properly
 * Place inside Router but outside Routes to trigger on navigation
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Small delay to allow DOM to stabilize after route change
    const scrollTimer = setTimeout(() => {
      // Check if body is in a locked state and reset it
      const body = document.body;
      const html = document.documentElement;

      if (body.style.position === 'fixed') {
        // Get saved scroll position from top style
        const savedY = parseInt(body.style.top || '0', 10) * -1;

        // Reset body styles
        body.style.position = '';
        body.style.top = '';
        body.style.left = '';
        body.style.right = '';
        body.style.width = '';
        body.style.overflow = '';
        html.style.overflow = '';

        // Scroll to top (not to saved position since we're navigating to new page)
        window.scrollTo(0, 0);
      } else {
        // Normal scroll to top
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }, 50);

    return () => clearTimeout(scrollTimer);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
