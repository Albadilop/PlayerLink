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
  changeUserEmail: (user_id: number, newEmail: string) => Promise<ApiResponse<unknown>>;
  deleteAccount: (userId: number) => Promise<ApiResponse<unknown>>;
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
    // Si es un error de red, proporcionar un mensaje más útil
    if (response.status === 0) {
      return new Error(
        "No se pudo conectar con el servidor. Verifica que el backend esté corriendo."
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

            // Si ya se reintentó y sigue fallando, usar el caché si está disponible
            if (getUserInfoCache && getUserInfoCache.data) {
              console.warn("Rate limit persistente. Usando datos en caché.");
              return getUserInfoCache.data;
            }

            return new Error(
              "Demasiadas solicitudes. Por favor, espera unos segundos e intenta de nuevo."
            );
          }

          // Manejo especial para error 401 (Unauthorized) - token inválido o expirado
          if (response.status === 401) {
            localStorage.removeItem("token");
            return new Error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
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

  changeUserEmail: async (user_id: number, newEmail: string): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.put(`/api/users_email/${user_id}`, { email: newEmail }, true);
    return {
      ok: response.ok,
      data: response.data,
      error: response.ok ? null : response.error || "Unknown error",
    };
  },

  deleteAccount: async (userId: number): Promise<ApiResponse<unknown>> => {
    const response = await apiClient.delete(`/api/users/${userId}`, true);
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
