import api from "../api/axios";
import axios from 'axios';


// 계좌목록
export const fetchAccounts = () =>
  api.get('/api/accounts');

// 계좌 상세
export const fetchAccountDetail = (a_no) =>
  api.get(`/api/accounts/${a_no}`);

// 계좌 이체내역목록
export const fetchAccountTransactions = (a_no, { type, from, to, page=0, size=20 } = {}) =>
  api.get(`/api/accounts/${a_no}/transfers`, {params: { type, from, to, page, size }});

// 계좌 이체내역에서 별명 변경
export const updateAccountAlias = (a_no, alias) => 
  api.post(`/api/accounts/${a_no}/alias`, {a_nickname:alias})

export const testmypage = () =>
  api.get(`/api/mypage`, {});

// 대출 상품 리스트
export const fetchLoanProducts = ({ type="MORTGAGE", page=0, size=20 } = {}) =>
  api.get("/api/loan/products", { params: { type, page, size } });
// 대출상품 상세
export const fetchLoanProductDetail = (code) =>
  api.get(`/api/loan/products/${code}`);



export const updateProfile = (profile) => {
  // 💡 1. localStorage에서 토큰을 가져오는 로직이 확실한가요?
  const token = localStorage.getItem('access');

  if (!token) {
    // 토큰이 없으면 요청을 보내지 않거나, 명확한 에러를 발생시켜야 합니다.
    throw new Error("No authentication token found. Please log in.");
  }

  return axios.put('/api/mypage', profile, {
    baseURL: 'http://localhost:8081',
    headers: {
      // 💡 2. "Bearer " 접두사 뒤에 토큰이 정확히 붙어있나요? (대소문자 및 공백 중요)
      Authorization: `Bearer ${token}`
    }

  });
};
