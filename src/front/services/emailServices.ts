import apiClient from "./apiClient";
import type { UpdatePasswordResponse, UserInfoResponse } from "../types/api";

/** Resultado explícito para recuperar contraseña (el front ya no asume éxito al resolver la promesa). */
export type SendResetEmailResult = { ok: true } | { ok: false; error: string };

interface EmailServices {
  updatePassword: (password: string, token: string) => Promise<UpdatePasswordResponse | false>;
  sendResetEmail: (email: string) => Promise<SendResetEmailResult>;
  checkAuth: (token: string) => Promise<UserInfoResponse | false>;
}

export const emailServices: EmailServices = {
  updatePassword: async (
    password: string,
    token: string
  ): Promise<UpdatePasswordResponse | false> => {
    console.log("🔐 updatePassword called with:");
    console.log("👉 password:", password);
    console.log("👉 token:", token);
    // Store token temporarily for this request
    const originalToken = localStorage.getItem("token");
    localStorage.setItem("token", token);
    try {
      const response = await apiClient.put<UpdatePasswordResponse>(
        "/api/password_update",
        { password },
        true
      );
      if (response.ok && response.data) {
        console.log(response.data);
        return response.data;
      }
      return false;
    } catch (error) {
      console.log("Error loading message from backend", error);
      return false;
    } finally {
      // Restore original token
      if (originalToken) {
        localStorage.setItem("token", originalToken);
      } else {
        localStorage.removeItem("token");
      }
    }
  },

  sendResetEmail: async (email: string): Promise<SendResetEmailResult> => {
    const trimmed = email.trim();
    if (!trimmed) {
      return { ok: false, error: "Please enter your email address." };
    }
    const response = await apiClient.post<{ success?: boolean; msg?: string }>(
      "/api/check_mail",
      { email: trimmed },
      false
    );
    if (response.ok) {
      return { ok: true };
    }
    const err =
      response.error ||
      (response.data as { msg?: string } | null)?.msg ||
      "Could not send the reset email. Please try again later.";
    return { ok: false, error: err };
  },

  checkAuth: async (token: string): Promise<UserInfoResponse | false> => {
    // Store token temporarily for this request
    const originalToken = localStorage.getItem("token");
    localStorage.setItem("token", token);
    try {
      const response = await apiClient.get<UserInfoResponse>("/api/token", true);
      if (response.ok && response.data) {
        console.log(response.data);
        return response.data;
      }
      return false;
    } catch (error) {
      console.log("Error loading message from backend", error);
      return false;
    } finally {
      // Restore original token
      if (originalToken) {
        localStorage.setItem("token", originalToken);
      } else {
        localStorage.removeItem("token");
      }
    }
  },
};
