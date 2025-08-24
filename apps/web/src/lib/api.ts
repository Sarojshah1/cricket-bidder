import axios, { AxiosError } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5001/api";

const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 15000,
});

// Attach token if present
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function extractApiError(err: unknown): string {
  const ax = err as AxiosError<any>;
  const fallback = "Something went wrong";
  if (ax?.response?.data) {
    const d = ax.response.data as any;
    return (
      d?.error?.message || d?.message || d?.error || ax.message || fallback
    );
  }
  return ax?.message || fallback;
}

export default api;
