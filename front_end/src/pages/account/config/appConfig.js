// src/config/appConfig.js
import axios from "axios";

// axios 인스턴스 생성
const apiConfig = axios.create({
  /**
   * API 기본 주소. process.env에서 가져옵니다.
   * 모든 요청 앞에 이 주소가 자동으로 붙습니다.
   */
  baseURL: process.env.REACT_APP_API_URL,
});

/**
 * 요청 인터셉터 (Request Interceptor)
 * 모든 API 요청이 서버로 전송되기 전에 가로채서 특정 작업을 수행합니다.
 * 이것이 바로 '토큰 자동 주입'의 핵심입니다.
 */
apiConfig.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiConfig;