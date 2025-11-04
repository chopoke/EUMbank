// src/api/products.js
import api from './axios';

export const fetchMyDeposits = async () => (await api.get('/api/mypage/deposits')).data;
export const fetchMySavings  = async () => (await api.get('/api/mypage/savings')).data;
export const fetchMyLoans    = async () => (await api.get('/api/mypage/loans')).data;
