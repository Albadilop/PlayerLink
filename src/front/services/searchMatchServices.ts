import { normalizeUrl } from '../utils/urlHelper';
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

const url = import.meta.env.VITE_BACKEND_URL;

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
    try {
      const resp = await fetch(normalizeUrl(url, "/api/private"), {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      if (!resp.ok) throw Error("Something went wrong getting user information");
      const data = await resp.json() as UserInfoResponse;
      console.log(data);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.log(error);
      return error as Error;
    }
  },

  getAllProfiles: async (): Promise<ProfilesResponse | Error> => {
    try {
      const resp = await fetch(normalizeUrl(url, "/api/profiles"));
      if (!resp.ok) throw Error("Failed to get all profiles");
      const data = await resp.json() as ProfilesResponse;
      return data;
    } catch (error) {
      console.log(error);
      return error as Error;
    }
  },

  getOneProfile: async (user_id: number): Promise<ProfileResponse | Error> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/profiles/${user_id}`));
      if (!resp.ok) throw Error(`Failed to get profile from ${user_id}`);
      const data = await resp.json() as ProfileResponse;
      return data;
    } catch (error) {
      console.log(error);
      return error as Error;
    }
  },

  getUserMatchesInfo: async (user_id: number): Promise<MatchesResponse | Error> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/matches/user/${user_id}`), {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      if (!resp.ok) throw Error(`Failed to get matches from user ${user_id}`);
      const data = await resp.json() as MatchesResponse;
      return data;
    } catch (error) {
      console.log(error);
      return error as Error;
    }
  },

  getStarsByUser: async (userId: number): Promise<number> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/reviews_received/${userId}`));
      if (!resp.ok) throw new Error(`Failed to get stars from user ${userId}`);
      const data = await resp.json() as ReviewsResponse;
      const reviews = data.reviews_received;

      if (!Array.isArray(reviews) || reviews.length === 0) return 0;

      const totalStars = reviews.reduce((sum, r) => sum + (r.stars || 0), 0);
      const average = totalStars / reviews.length;

      return average;
    } catch (error) {
      console.log(error);
      return 0;
    }
  },

  addLikeSent: async (liker_id: number, liked_id: number): Promise<LikeResponse | Error> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/likes/${liker_id}/${liked_id}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      if (!resp.ok) throw new Error("Failed to send a like");
      return await resp.json() as LikeResponse;
    } catch (error) {
      console.error(error);
      return error as Error;
    }
  },

  addDislikeSent: async (rejector_id: number, rejected_id: number): Promise<RejectResponse | Error> => {
    try {
      const resp = await fetch(
        normalizeUrl(url, `/api/rejects/${rejector_id}/${rejected_id}`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({ rejector_id, rejected_id }),
        }
      );
      if (!resp.ok) throw new Error("Failed to send a dislike");
      return await resp.json() as RejectResponse;
    } catch (error) {
      console.error(error);
      return error as Error;
    }
  },

  getLikesReceived: async (userId: number): Promise<unknown> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/likes_received/${userId}`), {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      if (!resp.ok) throw new Error("Failed to get likes received");
      const data = await resp.json();
      return data;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  getDislikesReceived: async (userId: number): Promise<unknown> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/rejects_received/${userId}`), {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      if (!resp.ok) throw new Error("Failed to get dislikes received");
      const data = await resp.json();
      return data;
    } catch (error) {
      console.error(error);
      return error;
    }
  },

  getFilteredProfiles: async (userId: number): Promise<ProfilesToExploreResponse> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/profiles/profiles_to_explore/${userId}`), {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      if (!resp.ok) throw new Error(`Failed to get profiles to explore: ${resp.status}`);
      const data = await resp.json() as ProfilesToExploreResponse;
      return data;
    } catch (error) {
      console.error("Error in getFilteredProfiles:", error);
      throw error;
    }
  },
};

export default searchMatchServices;


