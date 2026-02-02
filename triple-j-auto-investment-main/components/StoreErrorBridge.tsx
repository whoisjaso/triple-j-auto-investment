import React, { useEffect } from 'react';
import { useStore } from '../context/Store';
import { useErrorContext } from './ErrorProvider';

/**
 * Bridge component that connects Store's lastError state to ErrorProvider.
 *
 * This solves the context-to-context communication problem:
 * - Store.tsx cannot use useErrorContext (it's a provider itself)
 * - ErrorProvider cannot use useStore (would create circular dependency)
 * - This bridge sits inside both providers and syncs the error state
 */
export const StoreErrorBridge: React.FC = () => {
  const { lastError, clearLastError } = useStore();
  const { showError } = useErrorContext();

  useEffect(() => {
    if (lastError) {
      showError(lastError);
      // Clear Store's lastError after passing to ErrorProvider
      // ErrorProvider now owns the error state for display
      clearLastError();
    }
  }, [lastError, showError, clearLastError]);

  // This component renders nothing - it's just a bridge
  return null;
};

export default StoreErrorBridge;
