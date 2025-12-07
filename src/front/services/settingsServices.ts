import apiClient from "./apiClient";
import type { ApiResponse } from "../types/api";

export interface MatchingPreferences {
  min_age_preference?: number | null;
  max_age_preference?: number | null;
  gender_preference?: string | null;
  language_preference?: string | null;
  gaming_preference?: string | null;
  min_hours_played?: number | null;
  only_common_games?: boolean;
  discovery_enabled?: boolean;
}

export interface PrivacySettings {
  profile_visible?: boolean;
  show_age?: boolean;
  show_location?: boolean;
  show_hours_played?: boolean;
  show_steam_id?: boolean;
  show_discord?: boolean;
  searchable?: boolean;
}

export interface NotificationPreferences {
  email_match_notifications?: boolean;
  email_like_notifications?: boolean;
  email_review_notifications?: boolean;
  email_weekly_summary?: boolean;
  app_sound_notifications?: boolean;
  app_push_notifications?: boolean;
}

export interface GamingPreferences {
  steam_sync_enabled?: boolean;
  steam_sync_frequency?: string; // 'manual' | 'daily' | 'weekly'
  show_steam_library?: boolean;
}

export interface SocialPreferences {
  chat_from_matches_only?: boolean;
  read_receipts_enabled?: boolean;
}

export interface UserSettings {
  id: number;
  user_id: number;
  matching: MatchingPreferences;
  privacy: PrivacySettings;
  notifications: NotificationPreferences;
  gaming: GamingPreferences;
  social: SocialPreferences;
}

export interface BlockedUser {
  id: number;
  blocker_id: number;
  blocked_id: number;
  reason?: string | null;
  created_at?: string;
  blocked_user?: {
    id: number;
    nick_name?: string;
    photo?: string;
  };
}

interface SettingsServices {
  getUserSettings: (userId: number) => Promise<UserSettings | Error>;
  updateUserSettings: (
    userId: number,
    settings: Partial<{
      matching: Partial<MatchingPreferences>;
      privacy: Partial<PrivacySettings>;
      notifications: Partial<NotificationPreferences>;
      gaming: Partial<GamingPreferences>;
      social: Partial<SocialPreferences>;
    }>
  ) => Promise<ApiResponse<UserSettings>>;
  getBlockedUsers: (userId: number) => Promise<{ blocked_users: BlockedUser[] } | Error>;
  blockUser: (
    userId: number,
    blockedId: number,
    reason?: string
  ) => Promise<ApiResponse<BlockedUser>>;
  unblockUser: (userId: number, blockedId: number) => Promise<ApiResponse<unknown>>;
  exportUserData: (userId: number) => Promise<unknown>;
}

const settingsServices: SettingsServices = {
  getUserSettings: async (userId: number): Promise<UserSettings | Error> => {
    const response = await apiClient.get<UserSettings>(`/api/settings/user/${userId}`, true);
    if (response.ok && response.data) {
      return response.data;
    }
    return new Error(response.error || "Failed to get user settings");
  },

  updateUserSettings: async (
    userId: number,
    settings: Partial<{
      matching: Partial<MatchingPreferences>;
      privacy: Partial<PrivacySettings>;
      notifications: Partial<NotificationPreferences>;
      gaming: Partial<GamingPreferences>;
      social: Partial<SocialPreferences>;
    }>
  ): Promise<ApiResponse<UserSettings>> => {
    const response = await apiClient.put<UserSettings>(
      `/api/settings/user/${userId}`,
      settings,
      true
    );
    return {
      ok: response.ok,
      data: response.data || undefined,
      error: response.ok ? null : response.error || "Unknown error",
    };
  },

  getBlockedUsers: async (userId: number): Promise<{ blocked_users: BlockedUser[] } | Error> => {
    const response = await apiClient.get<{ blocked_users: BlockedUser[] }>(
      `/api/settings/user/${userId}/blocked`,
      true
    );
    if (response.ok && response.data) {
      return response.data;
    }
    return new Error(response.error || "Failed to get blocked users");
  },

  blockUser: async (
    userId: number,
    blockedId: number,
    reason?: string
  ): Promise<ApiResponse<BlockedUser>> => {
    const response = await apiClient.post<BlockedUser>(
      `/api/settings/user/${userId}/block`,
      { blocked_id: blockedId, reason },
      true
    );
    return {
      ok: response.ok,
      data: response.data || undefined,
      error: response.ok ? null : response.error || "Unknown error",
    };
  },

  unblockUser: async (userId: number, blockedId: number): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.delete(
      `/api/settings/user/${userId}/block/${blockedId}`,
      true
    );
    return {
      ok: response.ok,
      data: response.data || undefined,
      error: response.ok ? null : response.error || "Unknown error",
    };
  },

  exportUserData: async (userId: number): Promise<unknown> => {
    const response = await apiClient.get(`/api/settings/user/${userId}/export`, true);
    if (response.ok && response.data) {
      // Create a download link
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `playerlink-data-${userId}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return response.data;
    }
    throw new Error(response.error || "Failed to export user data");
  },
};

export default settingsServices;
