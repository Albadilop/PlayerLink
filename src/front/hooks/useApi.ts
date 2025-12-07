import { useState, useCallback } from 'react';
import { apiClient, ApiResponse } from '../services/apiClient';

export interface UseApiOptions {
  onSuccess?: (data: unknown) => void;
  onError?: (error: string) => void;
}

export interface UseApiReturn<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  execute: (...args: unknown[]) => Promise<ApiResponse<T> | null>;
  reset: () => void;
}

export function useApi<T = unknown>(
  apiCall: (...args: unknown[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: unknown[]): Promise<ApiResponse<T> | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiCall(...args);

        if (response.ok && response.data) {
          setData(response.data);
          onSuccess?.(response.data);
        } else {
          const errorMessage = response.error || 'An error occurred';
          setError(errorMessage);
          onError?.(errorMessage);
        }

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        onError?.(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiCall, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  };
}

