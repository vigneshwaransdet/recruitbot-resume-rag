import axios, { AxiosInstance } from 'axios';

/**
 * Shared Axios instance for all backend calls.
 *
 * The resume-rag-backend mounts every route under the /v1 prefix, so the
 * baseURL points at the server root and callers include the /v1 path. In
 * dev, Vite proxies /v1 -> http://localhost:3000 (see vite.config.ts), so a
 * relative baseURL also works; we keep the env-driven absolute URL for
 * production builds.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // ingestion runs a full pipeline (extract -> embed -> store)
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach a traceable request id.
apiClient.interceptors.request.use(
  (config) => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      config.headers['X-Request-ID'] = crypto.randomUUID();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
