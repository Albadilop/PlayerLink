import { normalizeUrl } from "../utils/urlHelper";
import { API_CONFIG } from "../constants";

// En dev, si el API es local (localhost / 127.0.0.1), usar URL vacía + proxy de Vite → /api → Flask (sin CORS).
const rawBackend = (import.meta.env.VITE_BACKEND_URL ?? "").replace(/\/+$/, "").trim();
const isLocalDevApi =
  import.meta.env.DEV &&
  rawBackend.length > 0 &&
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(rawBackend);
let BASE_URL = isLocalDevApi
  ? ""
  : rawBackend || (import.meta.env.DEV ? "" : API_CONFIG.DEFAULT_BACKEND_URL);
console.log(
  "🔧 API Client initialized with BASE_URL:",
  BASE_URL || "(same-origin /api via Vite proxy)"
);

export interface ApiClientConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  requiresAuth?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
  status: number;
}

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem("token");
  }

  private getDefaultHeaders(requiresAuth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status;
    let data: T | null = null;
    let error: string | null = null;

    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? (JSON.parse(text) as T) : null;
      }
    } catch {
      // Si no es JSON, intentar como texto
      try {
        const text = await response.text();
        error = text || "Failed to parse response";
      } catch {
        error = "Unknown error occurred";
      }
    }

    if (!response.ok) {
      error =
        (data as { error?: string; message?: string })?.error ||
        (data as { error?: string; message?: string })?.message ||
        `Request failed with status ${status}`;
    }

    return {
      ok: response.ok,
      data: response.ok ? data : null,
      error: response.ok ? null : error,
      status,
    };
  }

  private async retryRequest<T>(
    url: string,
    config: ApiClientConfig,
    attempt: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      console.log("🔄 Fetching:", { url, method: config.method || "GET", body: config.body });

      // Build headers
      const headers = {
        ...this.getDefaultHeaders(config.requiresAuth ?? false),
        ...config.headers,
      };

      const fetchOptions = {
        method: config.method || "GET",
        headers: headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        mode: "cors",
        // Front (p.ej. :5173) y API (:3001) son distintos orígenes: no cookies; el token va en Authorization.
        credentials: "omit",
        cache: "no-cache", // Always fetch fresh data
        redirect: "follow", // Follow redirects
      };

      // Log the full request for debugging
      console.log("🔍 Full fetch options:", {
        url,
        method: fetchOptions.method,
        headers: Object.fromEntries(Object.entries(headers)),
        hasBody: !!fetchOptions.body,
        mode: fetchOptions.mode,
        credentials: fetchOptions.credentials,
      });

      const response = await fetch(url, fetchOptions);
      console.log("📡 Response received:", { status: response.status, ok: response.ok });

      // Si es 429 (Too Many Requests) y hay intentos restantes, reintentar
      if (response.status === 429 && attempt < (config.retryCount || 0)) {
        const retryAfter = response.headers.get("Retry-After");
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : (config.retryDelay || 1000) * Math.pow(2, attempt);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryRequest(url, config, attempt + 1);
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error("❌ Fetch error:", error);

      // Proporcionar más información sobre el error
      if (error instanceof TypeError) {
        console.error("❌ Network error details:", {
          message: error.message,
          url: url,
          method: config.method || "GET",
        });
      }

      // Si es un error de red y hay intentos restantes, reintentar
      if (attempt < (config.retryCount || 0) && error instanceof TypeError) {
        const delay = (config.retryDelay || 1000) * Math.pow(2, attempt);
        console.log(`🔄 Retrying request in ${delay}ms (attempt ${attempt + 1})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryRequest(url, config, attempt + 1);
      }

      // Determinar el mensaje de error más específico
      let errorMessage = "Network error occurred";
      if (error instanceof TypeError) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage =
            "Could not connect to the server. Please verify that the backend is running and that CORS is configured correctly.";
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        ok: false,
        data: null,
        error: errorMessage,
        status: 0,
      };
    }
  }

  async request<T>(endpoint: string, config: ApiClientConfig = {}): Promise<ApiResponse<T>> {
    const url = normalizeUrl(BASE_URL, endpoint);
    console.log("🌐 API Request:", { BASE_URL, endpoint, finalUrl: url });
    return this.retryRequest<T>(url, config);
  }

  async get<T>(endpoint: string, requiresAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "GET",
      requiresAuth,
    });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body,
      requiresAuth,
    });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body,
      requiresAuth,
    });
  }

  async delete<T>(
    endpoint: string,
    requiresAuth: boolean = true,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      requiresAuth,
      body,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body,
      requiresAuth,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
