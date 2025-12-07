import { useCallback } from 'react';

export const useAuth = () => {
  const getToken = useCallback((): string | null => {
    return localStorage.getItem('token');
  }, []);

  const setToken = useCallback((token: string): void => {
    localStorage.setItem('token', token);
  }, []);

  const removeToken = useCallback((): void => {
    localStorage.removeItem('token');
  }, []);

  const isAuthenticated = useCallback((): boolean => {
    return !!getToken();
  }, [getToken]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = getToken();
    if (!token) {
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`,
    };
  }, [getToken]);

  return {
    getToken,
    setToken,
    removeToken,
    isAuthenticated,
    getAuthHeaders,
  };
};

