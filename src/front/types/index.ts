// Base types for the application

export interface Game {
  id: number;
  profile_id: number;
  gameTitle: string;
  gameImage: string;
  gameHoursPlayed: number;
}

export interface Profile {
  id: number;
  user_id: number;
  gender: string | null;
  age: number | null;
  name: string | null;
  discord: string | null;
  preferences: string | null;
  zodiac: string | null;
  location: string | null;
  nick_name: string | null;
  bio: string | null;
  photo: string | null;
  language: string | null;
  steam: string | null;
  games: Game[];
}

export interface User {
  id: number;
  email: string;
  /** Correo nuevo pendiente de confirmación por enlace (GET /api/private). */
  pending_email?: string | null;
  /** UUID de Supabase Auth (auth.users), si está enlazado. */
  supabase_auth_id?: string | null;
  profile: Profile | null;
}

export interface Review {
  id: number;
  user_id: number;
  user_nickname: string;
  author_id: number;
  author_nickname: string;
  stars: number;
  comment: string | null;
  created_at?: string;
}

export interface Like {
  id: number;
  liker_id: number;
  liked_id: number;
}

export interface Reject {
  id: number;
  rejector_id: number;
  rejected_id: number;
}

export interface MatchUserData {
  nickname: string;
  games: Game[];
  gender: string;
  age: number;
}

// Tipo para el endpoint /api/matches (estructura completa del match)
export interface Match {
  match_id: number;
  user1: {
    user_id: number;
    user_data: MatchUserData | string;
  };
  user2: {
    user_id: number;
    user_data: MatchUserData | string;
  };
}

// Tipo para el endpoint /api/matches/user/:id (info del otro usuario en el match)
export interface UserMatchInfo {
  user_id: number;
  nickname: string;
  games: Game[];
  gender: string;
  age: number | string;
  location: string;
  match_id?: number;
  id?: number;
  photo?: string;
  created_at?: string;
}

export interface ReviewsReceived {
  reviews_received: Review[];
}

// Store types
export interface Store {
  user: User | null;
  userMatchesInfo: UserMatchInfo[] | null;
  itsMatchInfo: User | null;
  likesSent: Like[];
  dislikesSent: Reject[];
  starsByUser: number | null;
  searchMatchProfiles: Profile[];
  matchReviewsReceived: ReviewsReceived | null;
}

// Action types for reducer
export type ActionType =
  | "addMatch"
  | "getSearchMatchProfilesFiltered"
  | "saveLike"
  | "saveDislike"
  | "getSearchMatchProfiles"
  | "getStarsByUser"
  | "getItsMatchInfo"
  | "getAllMatchesInfo"
  | "logout"
  | "matchReviewsReceived"
  | "getUserInfo";

export interface Action {
  type: ActionType;
  payload?: unknown;
}
