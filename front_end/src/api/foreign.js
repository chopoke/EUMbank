// 공용 axios 인스턴스를 사용해야 세션쿠키/토큰/인터셉터가 적용됩니다.
import api from "./axios";

const BASE = "/api/foreign/exchange";

export const calcExchange = (payload) =>
  api.post(`${BASE}/calculate`, payload, { validateStatus: () => true });

export const submitExchange = (payload) =>
  api.post(`${BASE}`, payload, { validateStatus: () => true });

// ★ 환전 내역 불러오기 (cNo가 있으면 항상 붙여서 호출)
export const fetchHistory = (cNo) => {
  const params = cNo ? { cNo } : {};
  return api.get(`${BASE}/history`, { params, validateStatus: () => true });
};
