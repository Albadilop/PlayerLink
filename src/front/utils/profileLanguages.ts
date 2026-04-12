/** Max languages selectable in profile (and matching prefs modal). */
export const MAX_PROFILE_LANGUAGES = 4;

export function clampProfileLanguages(languages: string[]): string[] {
  return languages.slice(0, MAX_PROFILE_LANGUAGES);
}
