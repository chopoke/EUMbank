// front_end/src/api/transferApi.js
import api from './axios';

export const transferApi = {
  // === 계좌 관련 ===
  getAccounts: () => api.get('/api/transfer/accounts'),
  getAccountBalance: (accountNo) => api.get(`/api/transfer/accounts/${accountNo}/balance`),
  
  // === 이체 관련 ===
  // 일반 이체 (TransferRequestDto)
  createTransfer: (data) => api.post('/api/transfer', data),
  
  // 예약 이체 (TransferOrderDto)
  createReserveTransfer: (data) => api.post('/api/transfer/reserve', data),
  
  // 다건 이체 (BulkTransferRequestDto)
  createBulkTransfer: (data) => api.post('/api/transfer/bulk', data),
  
  // === 이체 내역 ===
  getTransferHistory: (accountNo, params) => api.get(`/api/transfer/history/${accountNo}`, { params }),
  
  // === 예약 이체 관리 ===
  getReserveTransfers: (accountNo) => api.get(`/api/transfer/reserve/${accountNo}`),
  cancelReserveTransfer: (orderId) => api.delete(`/api/transfer/reserve/${orderId}`),
  
  // === 수취인 관련 ===
  // 예금주 조회 (GET /api/transfer/account-holder/{bankCode}/{accountNo})
  getAccountHolder: (bankCode, accountNo) => api.get(`/api/transfer/account-holder/${bankCode}/${accountNo}`),
  
  // 최근 수취인 조회 (GET /api/transfer/recipients/{accountNo})
  getRecentRecipients: (accountNo) => api.get(`/api/transfer/recipients/${accountNo}`),
  
  // 자주 쓰는 계좌 (GET /api/transfer/favorites)
  getFavoriteAccounts: () => api.get('/api/transfer/favorites'),
  
  // === 수수료 ===
  // 이체 수수료 계산 (POST /api/transfer/fee)
  getTransferFee: (data) => api.post('/api/transfer/fee', data),
  
  // === 은행 목록 ===
  getBanks: () => api.get('/api/transfer/banks')
};
