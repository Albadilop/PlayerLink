// API request and response types

import { User, Profile, Game, Review, Match, Like, Reject, UserMatchInfo } from "./index";

// Request types
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  nick_name?: string;
  age?: number;
  gender?: string;
  location?: string;
  zodiac?: string;
  discord?: string;
  steam_id?: string;
  languages?: string;
  preferences?: string;
  bio?: string;
  photo?: string;
}

export interface CreateGameRequest {
  title: string;
  hours_played: number;
  image: string;
}

export interface UpdateGameRequest {
  hours_played: number;
}

export interface CreateReviewRequest {
  stars: number;
  comment: string;
}

export interface ChangeEmailRequest {
  email: string;
}

export interface ChangePasswordRequest {
  password: string;
  actualPassword: string;
}

export interface ChatRequest {
  text?: string;
  messages?: Array<{ sender: string; text: string }>;
  userInfo: string;
}

export interface CheckMailRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  password: string;
}

// Response types
export interface RegisterResponse {
  success: boolean;
  token: string;
  // El backend no devuelve el usuario en el registro, solo el token
  // El usuario se obtiene después llamando a getUserInfo()
}

export interface LoginResponse {
  success: string;
  token: string;
}

export interface UserInfoResponse {
  user: User;
}

export interface ProfileResponse {
  profile: Profile;
}

export interface ProfilesResponse {
  profiles: Profile[];
}

export interface GameResponse {
  game: Game;
}

export interface GamesResponse {
  games: Game[];
}

export interface ReviewResponse {
  review: Review;
}

export interface ReviewsResponse {
  reviews_received: Review[];
}

export interface MatchResponse {
  match: Match;
}

export interface MatchesResponse {
  matches: UserMatchInfo[];
}

export interface LikeResponse {
  like: Like;
  match?: Match;
}

export interface RejectResponse {
  reject: Reject;
}

export interface ChatResponse {
  reply: string;
}

export interface CheckMailResponse {
  success: boolean;
  message: string;
  token?: string;
}

export interface UpdatePasswordResponse {
  success: boolean;
  message: string;
}

export interface PostGameResponse {
  game: Game;
}

export interface UpdateGameResponse {
  game: Game;
}

export interface DeleteGameResponse {
  success: boolean;
  message: string;
}

export interface ProfilesToExploreResponse {
  profiles: Profile[];
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}
