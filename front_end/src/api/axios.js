// front_end/src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE || "http://localhost:8081",
  withCredentials: true,
});

function isAuthPath(url = "") {
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url;
    return path.startsWith("/api/auth/");
  } catch {
    return false;
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  const path = config.url?.startsWith("http") ? new URL(config.url).pathname : (config.url || "");
  const isAuth = path.startsWith("/api/auth/") || path.endsWith("/signup") || path.endsWith("/login");
  if (token && !isAuth) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  return config;
});

export default api;
