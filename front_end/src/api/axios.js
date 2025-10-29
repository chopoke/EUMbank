// front_end/src/api/axios.js
import axios from "axios";

const api = axios.create({
  // baseURL: "",
  baseURL: import.meta.env?.VITE_API_BASE || "http://localhost:8081",
  withCredentials: true, // 쿠키 전송 필수
});

// ---- AccessToken: in-memory only ----
let accessToken = null;
export function setAccessToken(token) { accessToken = token || null; }
export function getAccessToken() { return accessToken; }

function isAuthPath(url = "") {
  try {
    const p = url.startsWith("http") ? new URL(url).pathname : url;
    return p.startsWith("/api/auth/");
  } catch { return false; }
}

api.interceptors.request.use((config) => {
  if (!isAuthPath(config.url || "") && accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default api;