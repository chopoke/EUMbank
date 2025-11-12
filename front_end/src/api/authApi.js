// src/api/authApi.js
import api, { setAccessToken } from "./axios";

let refreshing = null; // 동시에 한 번만(싱글턴)
let blockedNotified = false;

function isBlockedError(e) {
  const s = e?.response?.status;
  const c = e?.response?.data?.code;
  return s === 423 || c === "ACCOUNT_STATUS_BLOCKED";
}

function handleBlocked() {
  if (blockedNotified) return;
  blockedNotified = true;
  alert("계정 상태로 로그인할 수 없습니다. 관리자에게 문의하세요.");
  try { setAccessToken(null); } catch {}
  window.location.assign("/login");
}

// 로그인
export async function login(data) {
  try {
    const res = await api.post("/api/auth/login", data);
    setAccessToken(res.data.accessToken);
    window.dispatchEvent(new Event("auth:changed"));
    return res.data;
  } catch (e) {
    if (isBlockedError(e)) { handleBlocked(); return; }
    throw e;
  }
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
    .catch(e => {
      if (isBlockedError(e)) { handleBlocked(); return false; }
      return false;
    })
    .finally(() => { refreshing = null; });
  return refreshing;
}

// 프로필 조회
export async function fetchMe() {
  try {
    const { data } = await api.get("/api/me");
    return data;
  } catch (e) {
    if (isBlockedError(e)) { handleBlocked(); return; }
    throw e;
  }
}

// 로그아웃
export async function logout() {
  try {
    await api.post("/api/auth/logout");
  } catch (e) {
    // 무시 가능. 423일 경우에도 동일 처리.
    if (isBlockedError(e)) { handleBlocked(); return; }
  } finally {
    setAccessToken(null);
    window.dispatchEvent(new Event("auth:changed"));
  }
}

