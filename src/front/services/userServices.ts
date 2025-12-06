import { normalizeUrl } from '../utils/urlHelper';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  UserInfoResponse,
  UpdateProfileRequest,
  ChangeEmailRequest,
  ChangePasswordRequest,
  ApiResponse
} from '../types/api';

const url = import.meta.env.VITE_BACKEND_URL;

interface UserServices {
  register: (formData: RegisterRequest) => Promise<RegisterResponse | Error>;
  login: (formData: LoginRequest) => Promise<LoginResponse | Error>;
  getUserInfo: (retryCount?: number) => Promise<UserInfoResponse | Error>;
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

const userServices: UserServices = {
  register: async (formData: RegisterRequest): Promise<RegisterResponse | Error> => {
    try {
      const resp = await fetch(normalizeUrl(url, "/api/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      if (!resp.ok) throw Error("Something went wrong");
      const data = await resp.json() as RegisterResponse;
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
      return error as Error;
    }
  },

  login: async (formData: LoginRequest): Promise<LoginResponse | Error> => {
    try {
      const resp = await fetch(normalizeUrl(url, "/api/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        const errorMessage = errorData?.msg || errorData?.message || "Something went wrong";
        throw new Error(errorMessage);
      }
      
      const data = await resp.json() as LoginResponse;
      console.log(data);
      return data;
    } catch (error) {
      console.error("Login error:", error);
      // Si es un error de red, proporcionar un mensaje más útil
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        return new Error("No se pudo conectar con el servidor. Verifica que el backend esté corriendo.");
      }
      return error as Error;
    }
  },

  getUserInfo: async (retryCount: number = 0): Promise<UserInfoResponse | Error> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return new Error("No token found. Please log in again.");
      }

      const resp = await fetch(normalizeUrl(url, "/api/private"), {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (!resp.ok) {
        // Manejo especial para error 429 (Too Many Requests)
        if (resp.status === 429) {
          const retryAfter = resp.headers.get("Retry-After");
          // Esperar más tiempo: mínimo 5 segundos para dar tiempo al rate limiter
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(5000 * (retryCount + 1), 30000);
          
          // Si es el primer intento y el error es 429, esperar y reintentar una vez
          if (retryCount === 0) {
            console.warn(`Rate limit reached. Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            // Llamar recursivamente a getUserInfo con retryCount = 1
            return await userServices.getUserInfo(1);
          }
          
          return new Error("Demasiadas solicitudes. Por favor, espera unos segundos e intenta de nuevo.");
        }

        // Manejo especial para error 401 (Unauthorized) - token inválido o expirado
        if (resp.status === 401) {
          localStorage.removeItem('token');
          return new Error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        }

        const errorData = await resp.json().catch(() => ({}));
        const errorMessage = errorData?.error || errorData?.msg || errorData?.message || `HTTP ${resp.status}: ${resp.statusText}`;
        console.error("getUserInfo error:", resp.status, errorMessage, errorData);
        throw new Error(errorMessage);
      }

      const data = await resp.json();
      
      // El backend devuelve {success: 'true', user: {...}}
      // Asegurarse de que el formato sea correcto
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        return { user: data.user } as UserInfoResponse;
      } else {
        throw new Error("Invalid response format: user not found");
      }
    } catch (error) {
      console.error("getUserInfo error:", error);
      return error as Error;
    }
  },

  getUserInfoById: async (user_id: number): Promise<UserInfoResponse | Error> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/users/${user_id}`));
      if (!resp.ok) throw Error("Something went wrong");
      const data = await resp.json() as UserInfoResponse;
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
      return error as Error;
    }
  },

  changeUserPhoto: async (user_id: number, photo: { photo: string }): Promise<unknown> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/profiles/photo/${user_id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(photo),
      });
      if (!resp.ok) throw Error("Something went wrong");
      const data = await resp.json();
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },

  changeUserEmail: async (user_id: number, newEmail: string): Promise<ApiResponse<unknown>> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/users_email/${user_id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newEmail }),
      });

      const data = await resp.json();

      return {
        ok: resp.ok,
        data,
        error: resp.ok ? null : (data?.error as string) || "Unknown error",
      };
    } catch (error) {
      console.error("Error en changeUserEmail:", error);
      return {
        ok: false,
        data: null,
        error: (error as Error).message || "Network error",
      };
    }
  },

  deleteAccount: async (userId: number): Promise<ApiResponse<unknown>> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/users/${userId}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await resp.json();

      return {
        ok: resp.ok,
        data,
        error: resp.ok ? null : (data?.error as string) || "Unknown error",
      };
    } catch (error) {
      console.error("Error en deleteAccount:", error);
      return {
        ok: false,
        data: null,
        error: (error as Error).message || "Network error",
      };
    }
  },

  changeUserPassword: async (
    user_id: number,
    newPassword: string,
    actualPassword: string
  ): Promise<ApiResponse<unknown>> => {
    try {
      const resp = await fetch(normalizeUrl(url, `/api/users_password/${user_id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword, actualPassword }),
      });

      const data = await resp.json();

      return {
        ok: resp.ok,
        data,
        error: resp.ok ? null : (data?.error as string) || "Unknown error",
      };
    } catch (error) {
      console.error("Error en changeUserPassword:", error);
      return {
        ok: false,
        data: null,
        error: (error as Error).message || "Error de red",
      };
    }
  },
};

export default userServices;


