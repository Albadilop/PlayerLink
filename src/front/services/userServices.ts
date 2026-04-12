import apiClient from "./apiClient";
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  UserInfoResponse,
  ApiResponse,
} from "../types/api";

interface UserServices {
  register: (formData: RegisterRequest) => Promise<RegisterResponse | Error>;
  login: (formData: LoginRequest) => Promise<LoginResponse | Error>;
  getUserInfo: (retryCount?: number, forceRefresh?: boolean) => Promise<UserInfoResponse | Error>;
  getUserInfoById: (user_id: number) => Promise<UserInfoResponse | Error>;
  changeUserPhoto: (user_id: number, photo: { photo: string }) => Promise<unknown>;
  uploadUserPhoto: (user_id: number, file: File) => Promise<{ photo: string }>;
  requestUserEmailChange: (
    user_id: number,
    payload: { email: string; currentPassword: string }
  ) => Promise<ApiResponse<{ pending_email?: string; msg?: string }>>;
  confirmEmailChange: (token: string) => Promise<ApiResponse<{ email?: string; msg?: string }>>;
  deleteAccount: (userId: number, currentPassword: string) => Promise<ApiResponse<unknown>>;
  changeUserPassword: (
    user_id: number,
    newPassword: string,
    actualPassword: string
  ) => Promise<ApiResponse<unknown>>;
}

// Cache para evitar múltiples llamadas simultáneas a getUserInfo
let getUserInfoPromise: Promise<UserInfoResponse | Error> | null = null;
let getUserInfoCache: { data: UserInfoResponse | null; timestamp: number } | null = null;
const CACHE_DURATION = 10000; // 10 segundos de caché

const userServices: UserServices = {
  register: async (formData: RegisterRequest): Promise<RegisterResponse | Error> => {
    const response = await apiClient.post<RegisterResponse>("/api/register", formData, false);
    if (response.ok && response.data) {
      console.log(response.data);
      return response.data;
    }
    return new Error(response.error || "Something went wrong");
  },

  login: async (formData: LoginRequest): Promise<LoginResponse | Error> => {
    const response = await apiClient.post<LoginResponse>("/api/login", formData, false);
    if (response.ok && response.data) {
      console.log(response.data);
      return response.data;
    }
    // If it's a network error, provide a more useful message
    if (response.status === 0) {
      return new Error(
        "Could not connect to the server. Please verify that the backend is running."
      );
    }
    return new Error(response.error || "Something went wrong");
  },

  getUserInfo: async (
    retryCount: number = 0,
    forceRefresh: boolean = false
  ): Promise<UserInfoResponse | Error> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return new Error("No token found. Please log in again.");
      }

      // Si hay una llamada en progreso y no es un retry, devolver la misma promesa
      if (getUserInfoPromise && retryCount === 0 && !forceRefresh) {
        return await getUserInfoPromise;
      }

      // Verificar caché si no es un retry y no se fuerza refresh
      if (retryCount === 0 && !forceRefresh && getUserInfoCache) {
        const now = Date.now();
        if (now - getUserInfoCache.timestamp < CACHE_DURATION && getUserInfoCache.data) {
          return getUserInfoCache.data;
        }
      }

      // Crear la promesa de la llamada
      const fetchPromise = (async (): Promise<UserInfoResponse | Error> => {
        const response = await apiClient.get<UserInfoResponse>("/api/private", true);

        if (!response.ok) {
          // Manejo especial para error 429 (Too Many Requests)
          if (response.status === 429) {
            // Si es el primer intento y el error es 429, esperar y reintentar una vez
            if (retryCount === 0) {
              console.warn("Rate limit reached. Waiting 3 seconds before retry...");
              // Limpiar la promesa para permitir el retry
              getUserInfoPromise = null;

              // Esperar antes de reintentar (3 segundos para dar tiempo al rate limiter)
              await new Promise((resolve) => setTimeout(resolve, 3000));

              // Llamar recursivamente a getUserInfo con retryCount = 1
              return await userServices.getUserInfo(1, forceRefresh);
            }

            // If retry failed, use cache if available
            if (getUserInfoCache && getUserInfoCache.data) {
              console.warn("Persistent rate limit. Using cached data.");
              return getUserInfoCache.data;
            }

            return new Error("Too many requests. Please wait a few seconds and try again.");
          }

          // Special handling for 401 error (Unauthorized) - invalid or expired token
          if (response.status === 401) {
            localStorage.removeItem("token");
            return new Error("Your session has expired. Please log in again.");
          }

          const errorMessage = response.error || `HTTP ${response.status}`;
          console.error("getUserInfo error:", response.status, errorMessage);
          throw new Error(errorMessage);
        }

        if (response.data) {
          // El backend devuelve {success: 'true', user: {...}}
          const data = response.data as any;
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            const result = { user: data.user } as UserInfoResponse;
            // Guardar en caché
            getUserInfoCache = { data: result, timestamp: Date.now() };
            return result;
          } else {
            throw new Error("Invalid response format: user not found");
          }
        } else {
          throw new Error("No data received");
        }
      })();

      // Si no es un retry, guardar la promesa para evitar llamadas duplicadas
      if (retryCount === 0) {
        getUserInfoPromise = fetchPromise;
        try {
          const result = await fetchPromise;
          getUserInfoPromise = null;
          // Si el resultado es exitoso, guardar en caché
          if (!(result instanceof Error)) {
            getUserInfoCache = { data: result, timestamp: Date.now() };
          }
          return result;
        } catch (error) {
          getUserInfoPromise = null;
          throw error;
        }
      } else {
        // Si es un retry, ejecutar directamente y guardar en caché si es exitoso
        const result = await fetchPromise;
        if (!(result instanceof Error)) {
          getUserInfoCache = { data: result, timestamp: Date.now() };
        }
        return result;
      }
    } catch (error) {
      console.error("getUserInfo error:", error);
      getUserInfoPromise = null;
      return error as Error;
    }
  },

  getUserInfoById: async (user_id: number): Promise<UserInfoResponse | Error> => {
    const response = await apiClient.get<UserInfoResponse>(`/api/users/${user_id}`, false);
    if (response.ok && response.data) {
      console.log(response.data);
      return response.data;
    }
    return new Error(response.error || "Something went wrong");
  },

  changeUserPhoto: async (user_id: number, photo: { photo: string }): Promise<unknown> => {
    const response = await apiClient.put(`/api/profiles/photo/${user_id}`, photo, true);
    if (response.ok && response.data) {
      return response.data;
    }
    throw new Error(response.error || "Something went wrong");
  },

  uploadUserPhoto: async (user_id: number, file: File): Promise<{ photo: string }> => {
    const formData = new FormData();
    formData.append("photo", file);

    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
    const url = `${BASE_URL.replace(/\/+$/, "")}/api/profiles/photo/upload/${user_id}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return { photo: data.photo };
  },

  requestUserEmailChange: async (
    user_id: number,
    payload: { email: string; currentPassword: string }
  ): Promise<ApiResponse<{ pending_email?: string; msg?: string }>> => {
    const response = await apiClient.put(`/api/users_email/${user_id}`, payload, true);
    return {
      ok: response.ok,
      data: response.data as { pending_email?: string; msg?: string } | null,
      error: response.ok ? null : response.error || "Unknown error",
    };
  },

  confirmEmailChange: async (
    token: string
  ): Promise<ApiResponse<{ email?: string; msg?: string }>> => {
    const response = await apiClient.post<{ email?: string; msg?: string; success?: boolean }>(
      "/api/users_email/confirm",
      { token },
      false
    );
    return {
      ok: response.ok,
      data: response.data,
      error: response.ok ? null : response.error || "Unknown error",
    };
  },

  deleteAccount: async (userId: number, currentPassword: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.delete(`/api/users/${userId}`, true, {
      currentPassword,
    });
    return {
      ok: response.ok,
      data: response.data,
      error: response.ok ? null : response.error || "Unknown error",
    };
  },

  changeUserPassword: async (
    user_id: number,
    newPassword: string,
    actualPassword: string
  ): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.put(
      `/api/users_password/${user_id}`,
      { password: newPassword, actualPassword },
      true
    );
    return {
      ok: response.ok,
      data: response.data,
      error: response.ok ? null : response.error || "Unknown error",
    };
  },
};

export default userServices;
