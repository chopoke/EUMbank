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
  return api.put("/api/mypage", profile);
};