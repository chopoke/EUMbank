// front_end/src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://eumbank.co.kr",
  withCredentials: true,
});

// ---- AccessToken: in-memory + localStorage 복구 ----
let accessToken = null;

// ⬇ 새로고침해도 살도록 복구
try {
  const saved = localStorage.getItem("access_token");
  if (saved) accessToken = saved;
} catch { /* ignore */ }

export function setAccessToken(token) {
  accessToken = token || null;
  try {
    if (token) localStorage.setItem("access_token", token);
    else localStorage.removeItem("access_token");
  } catch { /* ignore */ }
}
export function getAccessToken() { return accessToken; }

function isAuthPath(url = "") {
  try {
    const p = url.startsWith("http") ? new URL(url).pathname : url;
    return p.startsWith("/api/auth/");
  } catch { return false; }
}

// Authorization 헤더만 주입
api.interceptors.request.use((config) => {
  if (!isAuthPath(config.url || "") && accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export default api;
