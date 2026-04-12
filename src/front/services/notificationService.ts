import settingsServices, { type NotificationPreferences } from "./settingsServices";

export interface NotificationSettings {
  email_match_notifications: boolean;
  email_like_notifications: boolean;
  email_review_notifications: boolean;
  email_weekly_summary: boolean;
  app_sound_notifications: boolean;
  app_push_notifications: boolean;
}

function preferencesToSettings(prefs: NotificationPreferences): NotificationSettings {
  return {
    email_match_notifications: prefs.email_match_notifications ?? true,
    email_like_notifications: prefs.email_like_notifications ?? true,
    email_review_notifications: prefs.email_review_notifications ?? true,
    email_weekly_summary: prefs.email_weekly_summary ?? false,
    app_sound_notifications: prefs.app_sound_notifications ?? true,
    app_push_notifications: prefs.app_push_notifications ?? true,
  };
}

class NotificationService {
  private settings: NotificationSettings | null = null;

  /** Mantiene en memoria las preferencias de notificación (p. ej. tras cargar o guardar Ajustes). */
  syncFromPreferences(prefs: NotificationPreferences): void {
    this.settings = preferencesToSettings(prefs);
  }

  async loadSettings(userId: number): Promise<void> {
    try {
      const userSettings = await settingsServices.getUserSettings(userId);
      if (!(userSettings instanceof Error) && userSettings.notifications) {
        this.settings = preferencesToSettings(userSettings.notifications);
      }
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  }

  shouldSendEmailNotification(type: "match" | "like" | "review" | "weekly_summary"): boolean {
    if (!this.settings) return true; // Default to true if settings not loaded

    switch (type) {
      case "match":
        return this.settings.email_match_notifications ?? true;
      case "like":
        return this.settings.email_like_notifications ?? true;
      case "review":
        return this.settings.email_review_notifications ?? true;
      case "weekly_summary":
        return this.settings.email_weekly_summary ?? false;
      default:
        return true;
    }
  }

  shouldPlaySound(): boolean {
    return this.settings?.app_sound_notifications ?? true;
  }

  shouldShowPushNotification(): boolean {
    return this.settings?.app_push_notifications ?? true;
  }

  updateSettings(settings: NotificationSettings): void {
    this.settings = settings;
  }
}

export const notificationService = new NotificationService();
