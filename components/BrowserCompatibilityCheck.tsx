import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Shield, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase/config';

interface BrowserCompatibilityCheckProps {
  onDismiss?: () => void;
}

const BrowserCompatibilityCheck: React.FC<BrowserCompatibilityCheckProps> = ({ onDismiss }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [browserType, setBrowserType] = useState<string>('');
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Wrap everything in try-catch to prevent breaking the app
    try {
      // Check if user has dismissed this before (localStorage)
      const dismissed = localStorage.getItem('browser-compat-dismissed');
      if (dismissed) {
        setIsDismissed(true);
        return;
      }

      // Detect browser type
      const userAgent = navigator.userAgent;
      let detectedBrowser = '';
      
      if (userAgent.includes('Brave') || (navigator as any).brave) {
        detectedBrowser = 'Brave';
      } else if (userAgent.includes('Firefox')) {
        detectedBrowser = 'Firefox';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        detectedBrowser = 'Safari';
      }
      
      setBrowserType(detectedBrowser);

    // Test Supabase connection after a short delay
    const testConnection = async () => {
      // Only test if we have a browser that might block
      if (!detectedBrowser) {
        return; // Don't test for generic browsers
      }

      try {
        // Try a simple query with a short timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const { error } = await supabase
          .from('vehicles')
          .select('id')
          .limit(1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        // If we get an error that suggests blocking (network error, CORS, etc.)
        if (error) {
          const errorMessage = error.message?.toLowerCase() || '';
          const isBlockingError = 
            errorMessage.includes('network') ||
            errorMessage.includes('fetch') ||
            errorMessage.includes('cors') ||
            errorMessage.includes('blocked') ||
            error.code === 'PGRST301' || // PostgREST connection error
            error.code === 'PGRST116';   // PostgREST timeout

          if (isBlockingError) {
            setShowWarning(true);
          }
        }
      } catch (err: any) {
        // Network errors, aborted requests, etc. suggest blocking
        if (
          err.name === 'AbortError' ||
          err.message?.includes('network') ||
          err.message?.includes('fetch') ||
          err.message?.includes('Failed to fetch')
        ) {
          setShowWarning(true);
        }
      }
    };

      // Wait a bit before testing to let the page load
      const timer = setTimeout(testConnection, 3000);
      return () => clearTimeout(timer);
    } catch (error) {
      // Silently fail - don't break the app if this component has issues
      console.warn('BrowserCompatibilityCheck error:', error);
      return () => {}; // Return empty cleanup function
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowWarning(false);
    localStorage.setItem('browser-compat-dismissed', 'true');
    if (onDismiss) onDismiss();
  };

  const getBrowserInstructions = () => {
    switch (browserType) {
      case 'Brave':
        return {
          title: 'Brave Browser Detected',
          steps: [
            'Click the Brave shield icon (🛡️) in your address bar',
            'Toggle "Shields" to "Down" for this site',
            'Or click "Advanced controls" → "Allow all trackers and ads"',
            'Refresh this page'
          ],
          icon: Shield
        };
      case 'Firefox':
        return {
          title: 'Firefox Privacy Settings',
          steps: [
            'Click the shield icon in your address bar',
            'Disable "Enhanced Tracking Protection" for this site',
            'Or go to Settings → Privacy & Security → Enhanced Tracking Protection',
            'Add this site to exceptions and refresh'
          ],
          icon: Shield
        };
      case 'Safari':
        return {
          title: 'Safari Privacy Settings',
          steps: [
            'Go to Safari → Settings → Privacy',
            'Disable "Prevent cross-site tracking" temporarily',
            'Or add this site to exceptions',
            'Refresh this page'
          ],
          icon: Shield
        };
      default:
        return {
          title: 'Browser Privacy Settings',
          steps: [
            'Your browser may be blocking database connections',
            'Check your privacy/security extensions',
            'Allow connections to *.supabase.co',
            'Refresh this page'
          ],
          icon: Globe
        };
    }
  };

  if (isDismissed || !showWarning) return null;

  const instructions = getBrowserInstructions();
  const Icon = instructions.icon;

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[10000] max-w-2xl w-full mx-4"
        >
          <div className="bg-black border-2 border-tj-gold/50 shadow-[0_0_30px_rgba(212,175,55,0.3)] p-6 relative">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-500 hover:text-tj-gold transition-colors"
              aria-label="Dismiss"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-yellow-900/20 p-3 border border-yellow-700/30">
                <AlertTriangle className="text-yellow-500" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-white mb-1 flex items-center gap-2">
                  <Icon size={20} className="text-tj-gold" />
                  {instructions.title}
                </h3>
                <p className="text-sm text-gray-400">
                  To view vehicles properly, please allow database connections for this site.
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-tj-dark/50 border border-white/10 p-4 mb-4">
              <p className="text-xs uppercase tracking-widest text-tj-gold mb-3">Quick Fix Steps:</p>
              <ol className="space-y-2">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
                    <span className="text-tj-gold font-bold mt-0.5">{index + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-tj-gold text-black font-bold py-3 px-6 text-sm uppercase tracking-widest hover:bg-white transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={handleDismiss}
                className="px-6 py-3 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/30 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrowserCompatibilityCheck;

