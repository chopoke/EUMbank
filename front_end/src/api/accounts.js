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

export const testmypage = () =>
  api.get(`/api/mypage`, {});

// 주담대 리스트(가공본)
export const fetchMortgageProducts = ({ topFinGrpNo = "020000", pageNo = 1 } = {}) =>
  api.get("/api/loan/mortgage", { params: { topFinGrpNo, pageNo } });

// (원본 JSON 확인용)
export const fetchMortgageProductsRaw = ({ topFinGrpNo = "020000", pageNo = 1 } = {}) =>
  api.get("/api/loan/mortgage/raw", { params: { topFinGrpNo, pageNo } });

// 대출 상품 상세
export const fetchLoanProductDetail = (id) =>
  api.get(`/api/loan/mortgage/${id}`);


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
