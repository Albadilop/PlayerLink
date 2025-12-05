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
  getUserInfo: () => Promise<UserInfoResponse | Error>;
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
      if (!resp.ok) throw Error("Something went wrong");
      const data = await resp.json() as LoginResponse;
      console.log(data);
      return data;
    } catch (error) {
      console.log(error);
      return error as Error;
    }
  },

  getUserInfo: async (): Promise<UserInfoResponse | Error> => {
    try {
      const resp = await fetch(normalizeUrl(url, "/api/private"), {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });
      if (!resp.ok) throw Error("Something went wrong");
      const data = await resp.json() as UserInfoResponse;
      console.log(data);
      localStorage.setItem("user", JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.log(error);
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


