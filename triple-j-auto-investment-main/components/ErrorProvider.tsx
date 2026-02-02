import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ErrorModal } from './ErrorModal';
import { useRetry } from '../hooks/useRetry';
import { AppError } from '../types';

interface ErrorContextType {
  showError: (error: AppError) => void;
  clearError: () => void;
  currentError: AppError | null;
  // Expose retry functionality for consumers
  retry: ReturnType<typeof useRetry>;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
  showAdminDetails?: boolean;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({
  children,
  showAdminDetails = false
}) => {
  const [currentError, setCurrentError] = useState<AppError | null>(null);

  const retry = useRetry({
    maxAttempts: 3,
    baseDelay: 1000,
    onMaxAttemptsReached: (error) => {
      setCurrentError(error);
    },
  });

  const showError = useCallback((error: AppError) => {
    setCurrentError(error);
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
    retry.reset();
  }, [retry]);

  const handleRetry = useCallback(() => {
    // Clear error and let the consumer re-trigger the operation
    setCurrentError(null);
  }, []);

  return (
    <ErrorContext.Provider value={{ showError, clearError, currentError, retry }}>
      {children}
      <ErrorModal
        error={currentError}
        onClose={clearError}
        onRetry={currentError?.retryable ? handleRetry : undefined}
        isRetrying={retry.state.isRetrying}
        retryCountdown={retry.state.countdown}
        retryAttempt={retry.state.attempt}
        maxAttempts={retry.state.maxAttempts}
        showAdminDetails={showAdminDetails}
      />
    </ErrorContext.Provider>
  );
};

export const useErrorContext = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within ErrorProvider');
  }
  return context;
};

export default ErrorProvider;
