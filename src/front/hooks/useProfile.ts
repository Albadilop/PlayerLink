import { useState, useCallback, useEffect } from 'react';
import useGlobalReducer from './useGlobalReducer.tsx';
import userServices from '../services/userServices';
import { selectPhoto, selectMedal } from '../utils/profileHelpers';

export interface UseProfileReturn {
  profile: {
    name: string;
    nick_name: string;
    age: number | null;
    gender: string | null;
    location: string | null;
    zodiac: string | null;
    discord: string | null;
    steam_id: string | null;
    language: string | null;
    preferences: string | null;
    bio: string | null;
    photo: string | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  getPhotoUrl: (photoKey?: string | null) => string;
  getMedalUrl: (hours: number | string) => string;
}

export const useProfile = (userId?: number): UseProfileReturn => {
  const { store } = useGlobalReducer();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = store.user?.profile || null;

  const refreshProfile = useCallback(async () => {
    if (!userId && !store.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const targetUserId = userId || store.user?.id;
      if (!targetUserId) {
        throw new Error('User ID is required');
      }

      await userServices.getUserInfo(0, true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId, store.user?.id]);

  const getPhotoUrl = useCallback((photoKey?: string | null): string => {
    return selectPhoto(photoKey || profile?.photo);
  }, [profile?.photo]);

  const getMedalUrl = useCallback((hours: number | string): string => {
    return selectMedal(hours);
  }, []);

  useEffect(() => {
    if (!profile && store.user?.id && !userId) {
      refreshProfile();
    }
  }, [profile, store.user?.id, userId, refreshProfile]);

  return {
    profile,
    isLoading,
    error,
    refreshProfile,
    getPhotoUrl,
    getMedalUrl,
  };
};

