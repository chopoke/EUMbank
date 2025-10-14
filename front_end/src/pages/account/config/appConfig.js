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
    // 로컬 스토리지에서 access token을 가져옵니다.
    const token = localStorage.getItem("access");

    console.log(token);

    // 토큰이 존재하면 Authorization 헤더에 담아줍니다.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 수정된 config 객체를 반환해야 요청이 계속 진행됩니다.
    return config;
  },
  (error) => {
    // 요청 설정 중 에러가 발생하면 여기서 처리할 수 있습니다.
    return Promise.reject(error);
  }
);

export default apiConfig;