/**
 * Application-wide constants
 */

// API Configuration
export const API_CONFIG = {
  DEFAULT_BACKEND_URL: "http://localhost:3001",
  DEFAULT_PORT: 3001,
} as const;

// Default Values
export const DEFAULT_VALUES = {
  PROFILE_PHOTO: "photo1",
  GENDER: "Undefined",
  GENDER_UNDEFINED: "undefinied",
  AGE: 0,
  EMPTY_STRING: "",
  UNDEFINED_STRING: "undefined",
} as const;

// Gender Options
export const GENDER_OPTIONS = ["Male", "Female", "Undefined"] as const;

/** Max lengths aligned with API / DB (`profiles.location`). */
export const PROFILE_FIELD_LIMITS = {
  LOCATION_MAX: 24,
} as const;

/** Aligned with API / DB (`reviews.comment`, String length). */
export const REVIEW_FIELD_LIMITS = {
  COMMENT_MAX: 100,
} as const;

// Timeouts (in milliseconds)
export const TIMEOUTS = {
  TOAST_DURATION: 3000,
  CAROUSEL_INTERVAL: 30000,
  ANIMATION_DELAY: 600,
} as const;

// Password Validation Rules
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  REQUIRES_UPPERCASE: true,
  REQUIRES_NUMBER: true,
  REQUIRES_SPECIAL_CHAR: true,
  SPECIAL_CHARS: "@$!%*?&.",
  VALIDATION_PATTERNS: {
    UPPERCASE: /[A-Z]/,
    NUMBER: /[0-9]/,
    SPECIAL: /[@$!%*?&.]/,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  LOGIN_FAILED: "Incorrect email or password",
  REGISTRATION_FAILED: "Registration failed. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  GENERIC_ERROR: "An error occurred. Please try again.",
  MISSING_DATA: "Please fill in all required fields",
  INVALID_EMAIL: "Please enter a valid email address",
  WEAK_PASSWORD: "Password does not meet requirements",
  UNAUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: "Resource not found",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_CHANGED: "Password changed successfully",
  ACCOUNT_DELETED: "Account deleted successfully",
  GAME_ADDED: "Game added successfully",
  REVIEW_CREATED: "Review created successfully",
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  PROFILE: "profile",
  LIKES_SENT: "likesSent",
  DISLIKES_SENT: "dislikesSent",
  SEARCH_MATCH_PROFILES: "searchMatchProfiles",
  USER_MATCHES_INFO: "userMatchesInfo",
  ITS_MATCH_INFO: "itsMatchInfo",
} as const;

// Route Paths
export const ROUTES = {
  HOME: "/",
  PRIVATE: "/private",
  PROFILE: "/private/profile",
  SEARCH_MATE: "/private/search-a-mate",
  YOUR_MATCHES: "/private/your-matches",
  MATCH_DETAILS: "/private/your-matches/matchDetails",
  FIND_GAMES: "/private/find-games",
  SETTINGS: "/private/settings",
  RESET: "/reset",
} as const;

// Photo Mapping
export const PHOTO_MAP: Record<string, string> = {
  "profile-pic-1.png": "photo1",
  "profile-pic-2.png": "photo2",
  "profile-pic-3.png": "photo3",
  "profile-pic-4.png": "photo4",
  "profile-pic-5.png": "photo5",
  "profile-pic-6.png": "photo6",
  "profile-pic-7.png": "photo7",
  "profile-pic-8.png": "photo8",
  "profile-pic-9.png": "photo9",
} as const;

// Review Constants
export const REVIEW_CONSTANTS = {
  MIN_STARS: 1,
  MAX_STARS: 5,
  MIN_COMMENT_LENGTH: 1,
} as const;

// API Endpoints (relative paths)
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/register",
    LOGIN: "/api/login",
    CHECK_MAIL: "/api/check_mail",
    PASSWORD_UPDATE: "/api/password_update",
    TOKEN: "/api/token",
  },
  USERS: {
    PRIVATE: "/api/private",
    BASE: "/api/users",
    EMAIL: "/api/users_email",
    PASSWORD: "/api/users_password",
  },
  PROFILES: {
    BASE: "/api/profiles",
    EXPLORE: "/api/profiles/profiles_to_explore",
    PHOTO: "/api/profiles/photo",
  },
  GAMES: {
    BASE: "/api/games",
    BY_PROFILE: "/api/games_by_profile",
    HOURS: "/api/games/hours",
  },
  REVIEWS: {
    BASE: "/api/reviews",
    AUTHORED: "/api/reviews_authored",
    RECEIVED: "/api/reviews_received",
  },
  MATCHES: {
    BASE: "/api/matches",
    BY_USER: "/api/matches/user",
  },
  LIKES: {
    BASE: "/api/likes",
    SENT: "/api/likes_sent",
    RECEIVED: "/api/likes_received",
  },
  REJECTS: {
    BASE: "/api/rejects",
    SENT: "/api/rejects_sent",
    RECEIVED: "/api/rejects_received",
  },
  CHAT: "/api/chat",
} as const;
