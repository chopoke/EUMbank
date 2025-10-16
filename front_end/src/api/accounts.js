import api from "../api/axios";



export const fetchAccounts = () =>
  api.get('/api/accounts'); 

export const fetchAccountDetail = (a_no) =>
  api.get(`/api/accounts/${a_no}`);

export const fetchAccountTransactions = (a_no, { type, from, to, page=0, size=20 } = {}) =>
  api.get(`/api/accounts/${a_no}/transfers`, {params: { type, from, to, page, size }});

export const testmypage = () =>
  api.get(`/api/mypage`, {});