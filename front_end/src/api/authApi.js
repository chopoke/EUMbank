// src/api/authApi.js
import api, { setAccessToken } from "./axios";

let refreshing = null; // 동시에 한 번만(싱글턴)

// 로그인
export async function login(data) {
  const res = await api.post("/api/auth/login", data);
  setAccessToken(res.data.accessToken);
  window.dispatchEvent(new Event("auth:changed"));
  return res.data;
}

// 새로고침 시 1회만 호출
export async function refreshOnce() {
  if (refreshing) return refreshing; // 이미 돌고 있으면 같은 Promise 재사용
  refreshing = api.post("/api/auth/refresh")
    .then(res => {
      setAccessToken(res.data.accessToken);
      window.dispatchEvent(new Event("auth:changed"));
      return true;
    })
    .catch(() => false)
    .finally(() => { refreshing = null; });
  return refreshing;
}

// 프로필 조회
export async function fetchMe() {
  const { data } = await api.get("/api/me");
  return data;
}

// 로그아웃
export async function logout() {
  await api.post("/api/auth/logout");
  setAccessToken(null);
  window.dispatchEvent(new Event("auth:changed"));
}

