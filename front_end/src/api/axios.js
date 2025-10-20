// front_end/src/api/axios.js
import axios from "axios";

/** ===== 환경변수 =====
 * Vite: import.meta.env.VITE_API_BASE, VITE_USE_CREDENTIALS
 * CRA : process.env.REACT_APP_API_URL, REACT_APP_USE_CREDENTIALS
 */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:8081";

const USE_CREDENTIALS = String(
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_USE_CREDENTIALS) ??
  process.env.REACT_APP_USE_CREDENTIALS ??
  "false"
).toLowerCase() === "true";

/** ===== Axios 단일 인스턴스 ===== */
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: USE_CREDENTIALS, // 프록시 미사용/쿠키-RT 쓰면 true
  timeout: 20000,
});

/** ===== 토큰 저장소 ===== */
const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";

let memAccess = null;
const tokenStore = {
  getAccess() {
    return memAccess || window.localStorage.getItem(ACCESS_KEY) || null;
  },
  setAccess(v) {
    memAccess = v || null;
    if (v) window.localStorage.setItem(ACCESS_KEY, v);
    else window.localStorage.removeItem(ACCESS_KEY);
  },
  getRefresh() {
    return window.localStorage.getItem(REFRESH_KEY) || null;
  },
  setRefresh(v) {
    if (v) window.localStorage.setItem(REFRESH_KEY, v);
    else window.localStorage.removeItem(REFRESH_KEY);
  },
  clear() {
    memAccess = null;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

/** ===== 유틸 ===== */
function pathOf(url = "") {
  try {
    return url?.startsWith("http") ? new URL(url).pathname : url || "";
  } catch {
    return "";
  }
}
function isAuthPath(url = "") {
  const p = pathOf(url);
  return (
    p.startsWith("/api/auth/") ||
    p.endsWith("/login") ||
    p.endsWith("/signup") ||
    p === "/jwt/refresh"
  );
}

/** ===== refresh 중복 방지 큐 ===== */
let isRefreshing = false;
let refreshQueue = []; // { resolve, reject }

/** ===== Request: AT 부착 (auth 경로 제외) ===== */
api.interceptors.request.use((config) => {
  const url = config.url || "";
  if (!isAuthPath(url)) {
    const at = tokenStore.getAccess();
    if (at) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${at}`;
    }
  }
  return config;
});

/** ===== Response: 401 처리(AT 자동 재발급) ===== */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;
    const resp = error?.response;

    if (!resp) return Promise.reject(error); // 네트워크 오류 등

    const status = resp.status;
    const url = original?.url || "";

    // 이미 재시도 했거나, auth 경로 요청이면 패스
    if (status !== 401 || original?._retry || isAuthPath(url)) {
      return Promise.reject(error);
    }

    // 재시도 플래그
    original._retry = true;

    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) {
      tokenStore.clear();
      window.location.replace("/login");
      return Promise.reject(error);
    }

    // 이미 refresh 중이면 큐에 합류
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (newAccess) => {
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${newAccess}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    // refresh 시작
    isRefreshing = true;
    try {
      // 인스턴스가 아닌 axios 기본 클라이언트로 호출하여 인터셉터 간섭 방지
      const r = await axios.post(
        `${API_BASE}/jwt/refresh`,
        null,
        {
          withCredentials: true,
          headers: { "X-Refresh-Token": refreshToken },
          timeout: 15000,
        }
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = r?.data || {};
      if (!newAccessToken) throw new Error("No accessToken in refresh response");

      // 토큰 갱신
      tokenStore.setAccess(newAccessToken);
      tokenStore.setRefresh(newRefreshToken || refreshToken);

      // 대기열 처리
      refreshQueue.forEach(({ resolve }) => resolve(newAccessToken));
      refreshQueue = [];

      // 현재 요청 재시도
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (e) {
      // 대기열 실패 알림
      refreshQueue.forEach(({ reject }) => reject(e));
      refreshQueue = [];

      tokenStore.clear();
      window.location.replace("/login");
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

/** ===== 선택: 로그인/로그아웃 도우미 =====
 * import api, { auth } from "./api/axios";
 * await auth.login({ id, pw });  // 예시
 */
export const auth = {
  setTokens({ accessToken, refreshToken }) {
    tokenStore.setAccess(accessToken);
    if (refreshToken !== undefined) tokenStore.setRefresh(refreshToken);
  },
  clear() {
    tokenStore.clear();
  },
};
