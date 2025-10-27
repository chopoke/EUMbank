// src/config/appConfig.js
import axios from "axios";

// axios 인스턴스 생성
const apiConfig = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // 쿠키 전송 (Refresh Token용)
});

// ---- AccessToken: in-memory only ----
let accessToken = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

// 인증 경로 체크 함수
function isAuthPath(url = "") {
  try {
    const path = url.startsWith("http") ? new URL(url).pathname : url;
    return path.startsWith("/api/auth/");
  } catch {
    return false;
  }
}

/**
 * 요청 인터셉터
 * /api/auth/* 경로를 제외한 모든 요청에 토큰 자동 주입
 */
apiConfig.interceptors.request.use(
  (config) => {
    // 인증 경로가 아니고 토큰이 있으면 헤더에 추가
    if (!isAuthPath(config.url || "") && accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * 401 에러 발생 시 자동으로 토큰 갱신 시도
 */
apiConfig.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 && 재시도 안 함 && 인증 경로 아님
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthPath(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        // Refresh Token으로 새 Access Token 발급
        const { data } = await apiConfig.post('/api/auth/refresh');
        setAccessToken(data.accessToken);

        // 원래 요청에 새 토큰 적용 후 재시도
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiConfig(originalRequest);
      } catch (refreshError) {
        // Refresh 실패 → 로그아웃 처리
        setAccessToken(null);
        window.dispatchEvent(new Event("auth:changed"));
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiConfig;