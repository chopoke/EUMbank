import axios from "axios";


const api = axios.create({ baseURL: 'http://localhost:8081' });

export const fetchAccounts = (c_no) =>
  api.get('/api/accounts', { params: { c_no } }); 

export const fetchAccountDetail = (a_no) =>
  api.get(`/api/accounts/${a_no}`);

export const fetchAccountTransactions = (a_no, { type, from, to, page=0, size=20 } = {}) =>
  api.get(`/api/accounts/${a_no}/transfers`, {params: { type, from, to, page, size }});

