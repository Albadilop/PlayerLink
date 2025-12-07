import apiClient from './apiClient';
import type { UpdatePasswordRequest, UpdatePasswordResponse, CheckMailRequest, CheckMailResponse, UserInfoResponse } from '../types/api';

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
    // Store token temporarily for this request
    const originalToken = localStorage.getItem('token');
    localStorage.setItem('token', token);
    try {
      const response = await apiClient.put<UpdatePasswordResponse>("/api/password_update", { password }, true);
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
        localStorage.setItem('token', originalToken);
      } else {
        localStorage.removeItem('token');
      }
    }
  },

  sendResetEmail: async (email: string): Promise<CheckMailResponse | false> => {
    const response = await apiClient.post<CheckMailResponse>("/api/check_mail", { email }, false);
    if (response.ok && response.data) {
      console.log(response.data);
      return response.data;
    }
    return false;
  },

  checkAuth: async (token: string): Promise<UserInfoResponse | false> => {
    // Store token temporarily for this request
    const originalToken = localStorage.getItem('token');
    localStorage.setItem('token', token);
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
        localStorage.setItem('token', originalToken);
      } else {
        localStorage.removeItem('token');
      }
    }
  },
};


