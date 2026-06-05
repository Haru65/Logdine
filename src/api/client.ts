import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';

const BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.BACKEND_API || 'http://localhost:5001';
const DEBUG = import.meta.env.VITE_API_DEBUG === 'true';

/**
 * Axios singleton. All app code talks to the backend through this.
 *
 * Responsibilities:
 *  - inject JWT from auth store
 *  - normalize error shape so callers can `.message` safely
 *  - auto-logout on 401 (token expired / invalid)
 *  - basic offline awareness — surface a friendly toast
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (DEBUG) console.debug('[API →]', config.method?.toUpperCase(), config.url);
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    if (DEBUG) console.debug('[API ←]', res.status, res.config.url);
    return res;
  },
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong. Please try again.';

    // 401 → token died. Clear auth & bounce to login (router will redirect).
    if (status === 401) {
      const { token, logout } = useAuthStore.getState();
      if (token) {
        logout();
        toast.error('Session expired. Please sign in again.');
      }
    } else if (status === 429) {
      toast.error('Too many requests. Slow down for a moment.');
    } else if (!error.response) {
      // No response → likely offline / network failure.
      toast.error('You appear to be offline. Your changes will sync when reconnected.');
    }

    return Promise.reject({
      success: false,
      message,
      status,
      code: (error.response?.data as { code?: string })?.code,
    });
  },
);

export default apiClient;

/** Helper to extract `.data` from the API envelope `{ success, data }`. */
export function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}
