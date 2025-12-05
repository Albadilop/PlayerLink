import { normalizeUrl } from '../utils/urlHelper';
import type { UpdatePasswordRequest, UpdatePasswordResponse, CheckMailRequest, CheckMailResponse, UserInfoResponse } from '../types/api';

const url = import.meta.env.VITE_BACKEND_URL;

interface EmailServices {
  updatePassword: (password: string, token: string) => Promise<UpdatePasswordResponse | false>;
  sendResetEmail: (email: string) => Promise<CheckMailResponse | false>;
  checkAuth: (token: string) => Promise<UserInfoResponse | false>;
}

export const emailServices: EmailServices = {
  updatePassword: async (password: string, token: string): Promise<UpdatePasswordResponse | false> => {
    console.log("🔐 updatePassword called with:");
    console.log("👉 password:", password);
    console.log("👉 token:", token);
    try {
      const resp = await fetch(normalizeUrl(url, "/api/password_update"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      if (resp.status !== 200) return false;
      const data = await resp.json() as UpdatePasswordResponse;
      console.log(data);
      return data;
    } catch (error) {
      console.log("Error loading message from backend", error);
      return false;
    }
  },

  sendResetEmail: async (email: string): Promise<CheckMailResponse | false> => {
    try {
      const resp = await fetch(normalizeUrl(url, "/api/check_mail"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      if (resp.status !== 200) return false;
      const data = await resp.json() as CheckMailResponse;
      console.log(data);
      return data;
    } catch (error) {
      console.log("Error loading message from backend", error);
      return false;
    }
  },

  checkAuth: async (token: string): Promise<UserInfoResponse | false> => {
    try {
      const resp = await fetch(normalizeUrl(url, "/api/token"), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        method: "GET",
      });
      if (resp.status !== 200) return false;
      const data = await resp.json() as UserInfoResponse;
      console.log(data);
      return data;
    } catch (error) {
      console.log("Error loading message from backend", error);
      return false;
    }
  },
};


