import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { AppError } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';

interface ErrorModalProps {
  error: AppError | null;
  onClose: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryCountdown?: number;
  retryAttempt?: number;
  maxAttempts?: number;
  showAdminDetails?: boolean;  // Show technical details to admins
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  error,
  onClose,
  onRetry,
  isRetrying = false,
  retryCountdown = 0,
  retryAttempt = 0,
  maxAttempts = 3,
  showAdminDetails = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  useScrollLock(!!error);

  // Reset copied state when error changes
  useEffect(() => {
    setCopied(false);
  }, [error?.code]);

  const handleCopyDetails = () => {
    if (!error) return;
    const details = `Error: ${error.code}\nMessage: ${error.message}\nDetails: ${error.details || 'N/A'}\nTime: ${error.timestamp.toISOString()}`;
    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isRetrying) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Error</h2>
                  <p className="text-xs text-zinc-500 font-mono">{error.code}</p>
                </div>
              </div>
              {!isRetrying && (
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* User-friendly message */}
              <p className="text-white">{error.message}</p>

              {/* Retry countdown */}
              {isRetrying && retryCountdown > 0 && (
                <div className="flex items-center gap-2 p-3 bg-tj-gold/10 border border-tj-gold/20 rounded-lg">
                  <RefreshCw className="w-4 h-4 text-tj-gold animate-spin" />
                  <span className="text-tj-gold text-sm">
                    Retrying in {retryCountdown}... (Attempt {retryAttempt}/{maxAttempts})
                  </span>
                </div>
              )}

              {/* Admin details (collapsed by default) */}
              {showAdminDetails && error.details && (
                <details className="group">
                  <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-400">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg">
                    <code className="text-xs text-zinc-400 break-all">
                      {error.details}
                    </code>
                    <p className="mt-2 text-xs text-zinc-600">
                      {error.timestamp.toLocaleString()}
                    </p>
                  </div>
                </details>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-900/50">
              <button
                onClick={handleCopyDetails}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Details</span>
                  </>
                )}
              </button>

              <div className="flex gap-2">
                {!isRetrying && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                )}
                {onRetry && error.retryable && !isRetrying && (
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-tj-gold text-black font-medium rounded-lg hover:bg-tj-gold/90 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ErrorModal;
