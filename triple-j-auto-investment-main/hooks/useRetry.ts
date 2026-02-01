import { useState, useCallback, useRef } from 'react';
import { AppError, ErrorCodes } from '../types';

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  countdown: number;  // Seconds until next retry
  lastError: AppError | null;
  maxAttempts: number;
}

interface UseRetryOptions {
  maxAttempts?: number;      // Default 3
  baseDelay?: number;        // Default 1000ms
  onMaxAttemptsReached?: (error: AppError) => void;
}

/**
 * Auto-retry hook with visible countdown between attempts.
 * Per CONTEXT.md: "Auto-retry 2-3 times before showing error modal"
 *
 * Usage:
 * const { execute, state, reset } = useRetry({ maxAttempts: 3 });
 * const result = await execute(async () => fetchData());
 */
export function useRetry(options: UseRetryOptions = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    onMaxAttemptsReached
  } = options;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    countdown: 0,
    lastError: null,
    maxAttempts,
  });

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((seconds: number): Promise<void> => {
    return new Promise((resolve) => {
      setState(s => ({ ...s, countdown: seconds }));

      countdownIntervalRef.current = setInterval(() => {
        setState(s => {
          const newCountdown = s.countdown - 1;
          if (newCountdown <= 0) {
            clearCountdown();
            resolve();
            return { ...s, countdown: 0 };
          }
          return { ...s, countdown: newCountdown };
        });
      }, 1000);
    });
  }, [clearCountdown]);

  const createError = useCallback((error: unknown, code: string): AppError => {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      code,
      message: getErrorMessage(code),
      details: message,
      timestamp: new Date(),
      retryable: isRetryableError(code),
    };
  }, []);

  const execute = useCallback(async <T>(
    fn: (signal: AbortSignal) => Promise<T>,
    errorCode: string = ErrorCodes.DB_UNKNOWN
  ): Promise<{ data: T | null; error: AppError | null }> => {
    // Create new abort controller for this execution
    abortControllerRef.current = new AbortController();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setState(s => ({ ...s, isRetrying: attempt > 1, attempt }));

      try {
        const data = await fn(abortControllerRef.current.signal);
        // Success - reset state
        setState({
          isRetrying: false,
          attempt: 0,
          countdown: 0,
          lastError: null,
          maxAttempts,
        });
        return { data, error: null };
      } catch (error) {
        const appError = createError(error, errorCode);
        setState(s => ({ ...s, lastError: appError }));

        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          return { data: null, error: createError(error, ErrorCodes.NET_ABORTED) };
        }

        // If not retryable or last attempt, stop
        if (!appError.retryable || attempt === maxAttempts) {
          setState(s => ({ ...s, isRetrying: false }));
          onMaxAttemptsReached?.(appError);
          return { data: null, error: appError };
        }

        // Wait with countdown before retry
        const delaySeconds = Math.ceil(baseDelay * attempt / 1000);
        await startCountdown(delaySeconds);
      }
    }

    // Should not reach here, but TypeScript needs it
    return { data: null, error: state.lastError };
  }, [maxAttempts, baseDelay, createError, startCountdown, onMaxAttemptsReached, state.lastError]);

  const reset = useCallback(() => {
    clearCountdown();
    abortControllerRef.current?.abort();
    setState({
      isRetrying: false,
      attempt: 0,
      countdown: 0,
      lastError: null,
      maxAttempts,
    });
  }, [clearCountdown, maxAttempts]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    reset();
  }, [reset]);

  return { execute, state, reset, abort };
}

// Helper: Get user-friendly error message
function getErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    [ErrorCodes.RLS_BLOCKED]: 'Your changes could not be saved. Please try again.',
    [ErrorCodes.RLS_NO_SESSION]: 'Your session has expired. Please log in again.',
    [ErrorCodes.RLS_NOT_ADMIN]: 'You do not have permission for this action.',
    [ErrorCodes.NET_TIMEOUT]: 'The request took too long. Please check your connection.',
    [ErrorCodes.NET_FETCH_FAILED]: 'Could not connect to the server. Please try again.',
    [ErrorCodes.NET_ABORTED]: 'The request was cancelled.',
    [ErrorCodes.DB_DUPLICATE]: 'This record already exists.',
    [ErrorCodes.DB_CONSTRAINT]: 'Invalid data. Please check your input.',
    [ErrorCodes.DB_UNKNOWN]: 'An unexpected error occurred. Please try again.',
  };
  return messages[code] || messages[ErrorCodes.DB_UNKNOWN];
}

// Helper: Determine if error is worth retrying
function isRetryableError(code: string): boolean {
  const nonRetryable = [
    ErrorCodes.RLS_NOT_ADMIN,
    ErrorCodes.DB_DUPLICATE,
    ErrorCodes.DB_CONSTRAINT,
    ErrorCodes.NET_ABORTED,
  ];
  return !nonRetryable.includes(code as typeof nonRetryable[number]);
}

export default useRetry;
