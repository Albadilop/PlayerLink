import { normalizeUrl } from '../utils/urlHelper';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export interface ApiClientConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
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
    return localStorage.getItem('token');
  }

  private getDefaultHeaders(requiresAuth: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status;
    let data: T | null = null;
    let error: string | null = null;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? (JSON.parse(text) as T) : null;
      }
    } catch (parseError) {
      // Si no es JSON, intentar como texto
      try {
        const text = await response.text();
        error = text || 'Failed to parse response';
      } catch {
        error = 'Unknown error occurred';
      }
    }

    if (!response.ok) {
      error = (data as { error?: string; message?: string })?.error || 
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
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: {
          ...this.getDefaultHeaders(config.requiresAuth ?? false),
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      // Si es 429 (Too Many Requests) y hay intentos restantes, reintentar
      if (response.status === 429 && attempt < (config.retryCount || 0)) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : (config.retryDelay || 1000) * Math.pow(2, attempt);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(url, config, attempt + 1);
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      // Si es un error de red y hay intentos restantes, reintentar
      if (attempt < (config.retryCount || 0) && error instanceof TypeError) {
        const delay = (config.retryDelay || 1000) * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(url, config, attempt + 1);
      }

      return {
        ok: false,
        data: null,
        error: error instanceof Error ? error.message : 'Network error occurred',
        status: 0,
      };
    }
  }

  async request<T>(
    endpoint: string,
    config: ApiClientConfig = {}
  ): Promise<ApiResponse<T>> {
    const url = normalizeUrl(BASE_URL, endpoint);
    return this.retryRequest<T>(url, config);
  }

  async get<T>(endpoint: string, requiresAuth: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      requiresAuth,
    });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
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
      method: 'PUT',
      body,
      requiresAuth,
    });
  }

  async delete<T>(endpoint: string, requiresAuth: boolean = true): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      requiresAuth,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    requiresAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body,
      requiresAuth,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

