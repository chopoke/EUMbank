import api from "../api/axios";

// 계좌목록
export const fetchAccounts = () =>
  api.get('/api/accounts');

// 계좌 상세
export const fetchAccountDetail = (a_no) =>
  api.get(`/api/accounts/${a_no}`);

// 계좌 이체내역목록
export const fetchAccountTransactions = (a_no, { type, from, to, page = 0, size = 20 } = {}) =>
  api.get(`/api/accounts/${a_no}/transfers`, { params: { type, from, to, page, size } });

// 예금계좌 상세
export const fetchDepositDetail = (d_no) =>
  api.get(`/api/accounts/deposit/${d_no}`);
// 예금 거래내역
export const fetchDepositTransactions = (d_no, { type, from, to, page = 0, size = 20 } = {}) =>
  api.get(`/api/accounts/deposit/${d_no}/transfers`, { params: { type, from, to, page, size } });

// 적금 상세
export const fetchInstallmentDetail = (i_no) =>
  api.get(`/api/accounts/installment/${i_no}`);
// 적금 거래내역
export const fetchInstallmentTransactions = (i_no, { type, from, to, page = 0, size = 20 } = {}) =>
  api.get(`/api/accounts/installment/${i_no}/transfers`, { params: { type, from, to, page, size } });

// 계좌 이체내역에서 별명 변경
export const updateAccountAlias = (a_no, alias) =>
  api.post(`/api/accounts/${a_no}/alias`, { a_nickname: alias })

export const testmypage = () =>
  api.get(`/api/mypage`, {});

// =================================   [ 대출 ]   ===========================
// 대출 상품 리스트
export const fetchLoanProducts = ({ type = "MORTGAGE", page = 0, size = 20 } = {}) =>
  api.get("/api/loan/products", { params: { type, page, size } });


// 대출상품 상세
export const fetchLoanProductDetail = (code) =>
  api.get(`/api/loan/products/${encodeURIComponent(code)}`);

// 견적요청
export const fetchLoanQuote = (code, req) =>
  api.post(`/api/loan/${encodeURIComponent(code)}/quote`, req);

// 신청서 사인할떄 사용자 정보 끌어오기
export async function fetchLoanSignInfo() {
  const { data } = await api.get("/api/loan/me/sign-info");
  return data;
}

// 대출 신청 전, pin검사
export const verifyLoanPin = (code, pin) =>
  api.post(`/api/loan/${encodeURIComponent(code)}/pin-verify`, { pin });

/** 신청 생성: POST /api/loan/:code/applications
 */
export const createLoanApplication = (code, payload) =>
  api.post(`/api/loan/${encodeURIComponent(code)}/applications`, payload);

// 약관 동의 저장
export const createLoanConsents = (code, payload) =>
  api.post(`/api/loan/${encodeURIComponent(code)}/consents`, payload);

// 대출 서류 제출
export const uploadLoanDoc = (code, file) => {
  return Promise.resolve({
    fileId: `TEMP-${Date.now()}`,
    url: URL.createObjectURL(file),
  });
};

// 대출서류 마이페이지 저장을 위함
export function uploadLoanAgreementPdf(blob, fileName = "loan-agreement.pdf") {
  const formData = new FormData();
  const file = new File([blob], fileName, { type: "application/pdf" });

  formData.append("file", file);
  formData.append("type", "대출신청서명"); 
  
  return api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

//  ========================== [  대출관리자단  ] ============================

export const adminListApplications = (params = {}) =>
api.get("/api/loan/admin/applications", { params });

export const adminGetApplicationDetail = (laId) =>
api.get(`/api/loan/admin/applications/${encodeURIComponent(laId)}`);

export const adminStartReview = (laId) =>
api.post(`/api/loan/admin/applications/${encodeURIComponent(laId)}/review/start`);

export const adminApprove = (laId, payload) =>
api.post(`/api/loan/admin/applications/${encodeURIComponent(laId)}/approve`, payload);

export const adminReject = (laId, payload) =>
api.post(`/api/loan/admin/applications/${encodeURIComponent(laId)}/reject`, payload);


// ================================ [ 대출 끝 ] ============================


export const updateProfile = (profile) => {
  return api.put("/api/mypage", profile);
};