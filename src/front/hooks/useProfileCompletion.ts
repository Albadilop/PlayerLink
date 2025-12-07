import { useMemo } from "react";
import useGlobalReducer from "./useGlobalReducer";
import { isProfileComplete, type ProfileValidationResult } from "../utils/profileValidation";

export interface UseProfileCompletionReturn {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
  validationResult: ProfileValidationResult;
}

/**
 * Hook to check profile completion status
 * Automatically updates when the profile changes
 */
export const useProfileCompletion = (): UseProfileCompletionReturn => {
  const { store } = useGlobalReducer();

  const validationResult = useMemo(() => {
    return isProfileComplete(store.user?.profile || null);
  }, [store.user?.profile]);

  return {
    isComplete: validationResult.isComplete,
    missingFields: validationResult.missingFields,
    completionPercentage: validationResult.completionPercentage,
    validationResult,
  };
};
