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
  api.get(`/api/loan/products/${encodeURIComponent(code)}`);

// 견적요청
export const fetchLoanQuote = (code, req) =>
  api.post(`/api/loan/${encodeURIComponent(code)}/quote`, req);


/** 신청 생성: POST /api/loan/:code/applications
 */
export const createLoanApplication = (code, payload) =>
  api.post(`/api/loan/${encodeURIComponent(code)}/applications`, payload);

// 약관 동의 저장
export const createLoanConsents = (code, payload) =>
  api.post(`/api/loan/${encodeURIComponent(code)}/consents`, payload);

// 대출 서류 제출
export const uploadLoanDoc = (code, file) => {
  // 백엔드 준비 후 실제 구현:
  // const form = new FormData();
  // form.append("file", file);
  // return api.post(`/api/loan/${encodeURIComponent(code)}/attachments`, form, {
  //   headers: {"Content-Type": "multipart/form-data"}
  // });

  // 임시 스텁(프론트만 사용): 즉시 성공 형태 흉내
  return Promise.resolve({
    fileId: `TEMP-${Date.now()}`,
    url: URL.createObjectURL(file),
  });
};




export const updateProfile = (profile) => {
  return api.put("/api/mypage", profile);
};