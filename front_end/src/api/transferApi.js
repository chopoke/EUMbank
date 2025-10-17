// front_end/src/api/transferApi.js
import api from './axios';

export const transferApi = {
  // 계좌 관련
  getAccounts: () => api.get('/api/transfer/accounts'),
  getAccountBalance: (accountNo) => api.get(`/api/transfer/accounts/${accountNo}/balance`),
  
  // 이체 관련
  createTransfer: (data) => api.post('/api/transfer', data),
  createScheduledTransfer: (data) => api.post('/api/transfer/scheduled', data),
  createBulkTransfer: (data) => api.post('/api/transfer/bulk', data),
  
  // 이체 내역
  getTransferHistory: (params) => api.get('/api/transfer/history', { params }),
  
  // 은행/수취인 관련
  getBanks: () => api.get('/api/transfer/banks'),
  getAccountHolder: (bankCode, accountNo) => api.get(`/api/transfer/account-holder/${bankCode}/${accountNo}`),
  getRecentRecipients: (accountNo) => api.get(`/api/transfer/recipients/${accountNo}`),
  getFavoriteAccounts: () => api.get('/api/transfer/favorites'),
  
  // 수수료
  getTransferFee: (data) => api.post('/api/transfer/fee', data)
};
