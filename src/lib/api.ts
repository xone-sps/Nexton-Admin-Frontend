import axios from "axios";
import Cookies from "js-cookie";
import { ADMIN_ACCESS_TOKEN_KEY, ADMIN_REFRESH_TOKEN_KEY } from "@/lib/constants";
import { AUTH_ENDPOINTS } from "@/lib/endpoints";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

let currentAccessToken: string | undefined;

export function getAdminAccessToken() {
  return currentAccessToken || Cookies.get(ADMIN_ACCESS_TOKEN_KEY);
}

export function getAdminRefreshToken() {
  return Cookies.get(ADMIN_REFRESH_TOKEN_KEY);
}

export function hasAdminAuthSession() {
  return Boolean(getAdminAccessToken() || getAdminRefreshToken());
}

export function setAdminAuthTokens(tokens: { access_token: string; refresh_token: string }) {
  currentAccessToken = tokens.access_token;
  Cookies.remove(ADMIN_ACCESS_TOKEN_KEY, { path: "/" });
  Cookies.set(ADMIN_ACCESS_TOKEN_KEY, tokens.access_token, { sameSite: "Lax", path: "/" });
  Cookies.set(ADMIN_REFRESH_TOKEN_KEY, tokens.refresh_token, { sameSite: "Lax", path: "/" });
}

export function clearAdminAuthTokens() {
  currentAccessToken = undefined;
  Cookies.remove(ADMIN_ACCESS_TOKEN_KEY, { path: "/" });
  Cookies.remove(ADMIN_REFRESH_TOKEN_KEY, { path: "/" });
}

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = getAdminAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh/redirect for the login and refresh endpoints themselves —
    // a 401 there is a real credential failure, not an expired session.
    const reqUrl: string = originalRequest?.url || "";
    const isAuthEndpoint = reqUrl.includes(AUTH_ENDPOINTS.LOGIN) || reqUrl.includes(AUTH_ENDPOINTS.REFRESH);

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const refreshToken = getAdminRefreshToken();
      if (!refreshToken) {
        clearAdminAuthTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE}/api/v1${AUTH_ENDPOINTS.REFRESH}`, {
          refresh_token: refreshToken,
        });
        const tokens = data.data;
        setAdminAuthTokens(tokens);
        originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
        return api(originalRequest);
      } catch {
        clearAdminAuthTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
