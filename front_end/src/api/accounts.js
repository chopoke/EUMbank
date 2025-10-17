import api from "../api/axios";


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