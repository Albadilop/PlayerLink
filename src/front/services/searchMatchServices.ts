import apiClient from './apiClient';
import type {
  UserInfoResponse,
  ProfilesResponse,
  ProfileResponse,
  MatchesResponse,
  ReviewsResponse,
  LikeResponse,
  RejectResponse,
  ProfilesToExploreResponse
} from '../types/api';

interface SearchMatchServices {
  getUserInfo: () => Promise<UserInfoResponse | Error>;
  getAllProfiles: () => Promise<ProfilesResponse | Error>;
  getOneProfile: (user_id: number) => Promise<ProfileResponse | Error>;
  getUserMatchesInfo: (user_id: number) => Promise<MatchesResponse | Error>;
  getStarsByUser: (userId: number) => Promise<number>;
  addLikeSent: (liker_id: number, liked_id: number) => Promise<LikeResponse | Error>;
  addDislikeSent: (rejector_id: number, rejected_id: number) => Promise<RejectResponse | Error>;
  getLikesReceived: (userId: number) => Promise<unknown>;
  getDislikesReceived: (userId: number) => Promise<unknown>;
  getFilteredProfiles: (userId: number) => Promise<ProfilesToExploreResponse>;
}

const searchMatchServices: SearchMatchServices = {
  getUserInfo: async (): Promise<UserInfoResponse | Error> => {
    const response = await apiClient.get<UserInfoResponse>("/api/private", true);
    if (response.ok && response.data) {
      const data = response.data as any;
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log(data);
        return data;
      }
    }
    return new Error(response.error || "Something went wrong getting user information");
  },

  getAllProfiles: async (): Promise<ProfilesResponse | Error> => {
    const response = await apiClient.get<ProfilesResponse>("/api/profiles", false);
    if (response.ok && response.data) {
      return response.data;
    }
    return new Error(response.error || "Failed to get all profiles");
  },

  getOneProfile: async (user_id: number): Promise<ProfileResponse | Error> => {
    const response = await apiClient.get<ProfileResponse>(`/api/profiles/${user_id}`, false);
    if (response.ok && response.data) {
      return response.data;
    }
    return new Error(response.error || `Failed to get profile from ${user_id}`);
  },

  getUserMatchesInfo: async (user_id: number): Promise<MatchesResponse | Error> => {
    const response = await apiClient.get<MatchesResponse>(`/api/matches/user/${user_id}`, true);
    if (response.ok && response.data) {
      return response.data;
    }
    return new Error(response.error || `Failed to get matches from user ${user_id}`);
  },

  getStarsByUser: async (userId: number): Promise<number> => {
    const response = await apiClient.get<ReviewsResponse>(`/api/reviews_received/${userId}`, false);
    if (response.ok && response.data) {
      const reviews = response.data.reviews_received;
      if (!Array.isArray(reviews) || reviews.length === 0) return 0;
      const totalStars = reviews.reduce((sum, r) => sum + (r.stars || 0), 0);
      return totalStars / reviews.length;
    }
    return 0;
  },

  addLikeSent: async (liker_id: number, liked_id: number): Promise<LikeResponse | Error> => {
    const response = await apiClient.post<LikeResponse>(`/api/likes/${liker_id}/${liked_id}`, {}, true);
    if (response.ok && response.data) {
      return response.data;
    }
    return new Error(response.error || "Failed to send a like");
  },

  addDislikeSent: async (rejector_id: number, rejected_id: number): Promise<RejectResponse | Error> => {
    const response = await apiClient.post<RejectResponse>(
      `/api/rejects/${rejector_id}/${rejected_id}`,
      { rejector_id, rejected_id },
      true
    );
    if (response.ok && response.data) {
      return response.data;
    }
    return new Error(response.error || "Failed to send a dislike");
  },

  getLikesReceived: async (userId: number): Promise<unknown> => {
    const response = await apiClient.get(`/api/likes_received/${userId}`, true);
    if (response.ok && response.data) {
      return response.data;
    }
    return new Error(response.error || "Failed to get likes received");
  },

  getDislikesReceived: async (userId: number): Promise<unknown> => {
    const response = await apiClient.get(`/api/rejects_received/${userId}`, true);
    if (response.ok && response.data) {
      return response.data;
    }
    return new Error(response.error || "Failed to get dislikes received");
  },

  getFilteredProfiles: async (userId: number): Promise<ProfilesToExploreResponse> => {
    const response = await apiClient.get<ProfilesToExploreResponse>(
      `/api/profiles/profiles_to_explore/${userId}`,
      true
    );
    if (response.ok && response.data) {
      return response.data;
    }
    throw new Error(response.error || `Failed to get profiles to explore: ${response.status}`);
  },
};

export default searchMatchServices;


