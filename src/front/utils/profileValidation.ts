import type { Profile } from "../types";

export interface ProfileValidationResult {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

const REQUIRED_FIELDS = ["name", "nick_name", "age", "gender", "location", "games"];
const TOTAL_FIELDS = REQUIRED_FIELDS.length;

/**
 * Validates if a profile has all required fields completed
 *
 * Required fields:
 * - name (minimum 2 characters)
 * - nick_name (minimum 2 characters)
 * - age (must be >= 18)
 * - gender (minimum 2 characters)
 * - location (minimum 2 characters)
 * - At least 1 game in games array
 *
 * @param profile - The profile to validate
 * @returns Validation result with completion status and missing fields
 */
export function isProfileComplete(profile: Profile | null): ProfileValidationResult {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: REQUIRED_FIELDS,
      completionPercentage: 0,
    };
  }

  const missingFields: string[] = [];

  // Validate name
  if (!profile.name || profile.name.trim().length < 2) {
    missingFields.push("name");
  }

  // Validate nick_name
  if (!profile.nick_name || profile.nick_name.trim().length < 2) {
    missingFields.push("nick_name");
  }

  // Validate age
  if (!profile.age || profile.age < 18) {
    missingFields.push("age");
  }

  // Validate gender
  if (!profile.gender || profile.gender.trim().length < 2) {
    missingFields.push("gender");
  }

  // Validate location
  if (!profile.location || profile.location.trim().length < 2) {
    missingFields.push("location");
  }

  // Validate at least 1 game
  if (!profile.games || profile.games.length === 0) {
    missingFields.push("games");
  }

  const completedFields = TOTAL_FIELDS - missingFields.length;
  const completionPercentage = Math.round((completedFields / TOTAL_FIELDS) * 100);

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completionPercentage,
  };
}

/**
 * Get a user-friendly label for a field name
 */
export function getFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    name: "Nombre",
    nick_name: "Nickname",
    age: "Edad",
    gender: "Género",
    location: "Ubicación",
    games: "Juegos",
  };

  return labels[fieldName] || fieldName;
}
