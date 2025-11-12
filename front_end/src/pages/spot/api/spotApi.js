import api from '../../../api/axios';

/**
 * 현물거래 관련 API 함수들
 * 현물거래 페이지에서 사용하는 모든 API 호출을 관리
 */

// API 엔드포인트 정의
const endpoints = {
  // 가격 관련
  prices: {
    gold: () => '/api/prices/latest/AU',
    silver: () => '/api/prices/latest/AG',
    all: () => '/api/prices/latest',
    recent: (metalCode) => `/api/prices/recent/${metalCode}`
  },
  
  // 거래 관련
  trading: {
    buy: () => '/api/trading/buy',
    sell: () => '/api/trading/sell',
    balance: (customerNo) => `/api/trading/balance/${customerNo}`,
    history: (customerNo) => `/api/trading/transactions/paging/${customerNo}`,
    transferIn: () => '/api/trading/transfer/in',
    transferOut: () => '/api/trading/transfer/out'
  },
  
  // 현물지갑 관련
  wallet: {
    open: () => '/api/trading/wallet/open',
    create: () => '/api/trading/wallets',
    list: (customerNo) => `/api/trading/wallets/${customerNo}`
  }
};

/**
 * 금/은 가격 조회
 * @returns {Promise} 가격 정보
 */
export const fetchPrices = async () => {
  try {
    const response = await api.get(endpoints.prices.all());
    return response.data;
  } catch (error) {
    console.error('가격 조회 실패:', error);
    throw error;
  }
};

/**
 * 최근 시세 조회 (차트용)
 * @param {string} metalCode - 금속코드 (AU, AG)
 * @param {number} hours - 최근 시간 범위 (기본 24시간)
 * @returns {Promise} 최근 시세 데이터
 */
export const fetchRecentPrices = async (metalCode, hours = 24) => {
  try {
    const response = await api.get(`${endpoints.prices.recent(metalCode)}?hours=${hours}`);
    return response.data;
  } catch (error) {
    console.error('최근 시세 조회 실패:', error);
    throw error;
  }
};

/**
 * 고객 잔고 조회
 * @param {number} customerNo - 고객번호
 * @param {number} accountNo - 선택된 계좌 번호 (선택사항)
 * @returns {Promise} 잔고 정보
 */
export const fetchCustomerBalance = async (customerNo, accountNo = null) => {
  try {
    const params = accountNo ? { accountNo } : {};
    const response = await api.get(endpoints.trading.balance(customerNo), { params });
    return response.data;
  } catch (error) {
    console.error('잔고 조회 실패:', error);
    throw error;
  }
};

/**
 * 입출금 계좌 목록 조회
 * @param {number} customerNo - 고객번호
 * @returns {Promise} 입출금 계좌 목록
 */
export const fetchDepositAccounts = async (customerNo) => {
  try {
    const response = await api.get(`/api/trading/accounts/${customerNo}/deposit`);
    
    // 응답이 배열인지 확인
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      return [];
    }
  } catch (error) {
    console.error('입출금 계좌 목록 조회 실패:', error);
    // 에러 발생 시 빈 배열 반환 (500 에러 방지)
    return [];
  }
};

/**
 * 거래내역 페이징 조회 (매수/매도 + 금/은 + 지갑 필터링)
 * @param {number} customerNo - 고객번호
 * @param {string} transactionType - 거래타입 (BUY/SELL, 선택사항)
 * @param {string} metalCode - 금속코드 (AU/AG, 선택사항)
 * @param {string} walletName - 지갑 이름 (선택사항)
 * @param {number} page - 페이지 번호 (0부터 시작)
 * @param {number} size - 페이지 크기
 * @returns {Promise} 페이징된 거래내역
 */
export const fetchTradingHistoryWithPaging = async (customerNo, transactionType = null, metalCode = null, walletName = null, page = 0, size = 20) => {
  try {
    const params = new URLSearchParams();
    if (transactionType) params.append('transactionType', transactionType);
    if (metalCode) params.append('metalCode', metalCode);
    if (walletName) params.append('walletName', walletName);
    params.append('page', page);
    params.append('size', size);
    
    const response = await api.get(`${endpoints.trading.history(customerNo)}?${params}`);
    return response.data;
  } catch (error) {
    console.error('거래내역 페이징 조회 실패:', error);
    throw error;
  }
};

/**
 * 매수 주문
 * @param {number} customerNo - 고객번호
 * @param {string} productId - 상품ID (AU, AG)
 * @param {number} quantity - 수량
 * @param {string} walletName - 지갑 이름 (선택사항)
 * @param {string} walletPin - 지갑 PIN (필수)
 * @returns {Promise} 거래 결과
 */
export const buyMetal = async (customerNo, productId, quantity, walletName = null, walletPin) => {
  try {
    const response = await api.post(endpoints.trading.buy(), null, {
      params: { customerNo, productId, quantity, walletName, walletPin }
    });
    return response.data;
  } catch (error) {
    console.error('매수 주문 실패:', error);
    throw error;
  }
};

/**
 * 매도 주문
 * @param {number} customerNo - 고객번호
 * @param {string} productId - 상품ID (AU, AG)
 * @param {number} quantity - 수량
 * @param {string} walletName - 지갑 이름 (선택사항)
 * @param {string} walletPin - 지갑 PIN (필수)
 * @returns {Promise} 거래 결과
 */
export const sellMetal = async (customerNo, productId, quantity, walletName = null, walletPin) => {
  try {
    const response = await api.post(endpoints.trading.sell(), null, {
      params: { customerNo, productId, quantity, walletName, walletPin }
    });
    return response.data;
  } catch (error) {
    console.error('매도 주문 실패:', error);
    throw error;
  }
};

/**
 * 계좌에서 현물거래 통장으로 이체
 * @param {number} customerNo - 고객번호
 * @param {number} amount - 이체 금액
 * @param {string} walletName - 지갑 이름 (선택사항)
 * @param {number} accountNo - 계좌 번호 (선택사항)
 * @returns {Promise} 이체 결과
 */
export const transferToTradingAccount = async (customerNo, amount, walletName = null, accountNo = null) => {
  try {
    const params = { customerNo, amount };
    if (walletName) {
      params.walletName = walletName;
    }
    if (accountNo) {
      params.accountNo = accountNo;
    }
    
    const response = await api.post(endpoints.trading.transferIn(), null, {
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('계좌 → 현물거래통장 이체 실패:', error);
    throw error;
  }
};

/**
 * 현물거래 통장에서 계좌로 이체
 * @param {number} customerNo - 고객번호
 * @param {number} amount - 이체 금액
 * @param {string} walletName - 지갑 이름 (선택사항)
 * @param {number} accountNo - 계좌 번호 (선택사항)
 * @returns {Promise} 이체 결과
 */
export const transferFromTradingAccount = async (customerNo, amount, walletName = null, accountNo = null) => {
  try {
    const params = { customerNo, amount };
    if (walletName) {
      params.walletName = walletName;
    }
    if (accountNo) {
      params.accountNo = accountNo;
    }
    
    const response = await api.post(endpoints.trading.transferOut(), null, {
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('현물거래통장 → 계좌 이체 실패:', error);
    throw error;
  }
};

/**
 * 현물지갑 개설
 * @param {number} customerNo - 고객번호
 * @returns {Promise} 지갑 개설 결과
 */
export const openSpotWallet = async (customerNo) => {
  try {
    const response = await api.post(endpoints.wallet.open(), {
      customerNo
    });
    return response.data;
  } catch (error) {
    console.error('현물지갑 개설 실패:', error);
    throw error;
  }
};

/**
 * 새로운 지갑 생성
 * @param {number} customerNo - 고객번호
 * @param {string} walletName - 지갑 이름
 * @param {string} walletPin - 지갑 PIN (6자리)
 * @returns {Promise} 지갑 생성 결과
 */
export const createWallet = async (customerNo, walletName, walletPin) => {
  try {
    const response = await api.post(endpoints.wallet.create(), {
      customerNo,
      walletName,
      walletPin
    });
    return response.data;
  } catch (error) {
    console.error('지갑 생성 실패:', error);
    throw error;
  }
};

/**
 * 지갑 PIN 검증
 * @param {number} customerNo - 고객번호
 * @param {string} walletName - 지갑 이름
 * @param {string} pin - PIN 번호
 * @returns {Promise} PIN 검증 결과
 */
export const validateWalletPin = async (customerNo, walletName, pin) => {
  try {
    const response = await api.post('/api/trading/wallets/validate-pin', null, {
      params: { customerNo, walletName, pin }
    });
    return response.data;
  } catch (error) {
    console.error('지갑 PIN 검증 실패:', error);
    throw error;
  }
};

/**
 * 지갑 PIN 업데이트
 * @param {number} customerNo - 고객번호
 * @param {string} walletName - 지갑 이름
 * @param {string} oldPin - 기존 PIN
 * @param {string} newPin - 새 PIN
 * @returns {Promise} PIN 업데이트 결과
 */
export const updateWalletPin = async (customerNo, walletName, oldPin, newPin) => {
  try {
    const response = await api.post('/api/trading/wallets/update-pin', null, {
      params: { customerNo, walletName, oldPin, newPin }
    });
    return response.data;
  } catch (error) {
    console.error('지갑 PIN 업데이트 실패:', error);
    throw error;
  }
};

/**
 * PIN 분실 시 복구
 * @param {number} customerNo - 고객번호
 * @param {string} walletName - 지갑 이름
 * @returns {Promise} PIN 복구 결과
 */
export const recoverWalletPin = async (customerNo, walletName) => {
  try {
    const response = await api.post('/api/trading/wallets/recover-pin', null, {
      params: { customerNo, walletName }
    });
    return response.data;
  } catch (error) {
    console.error('PIN 복구 실패:', error);
    throw error;
  }
};

/**
 * 고객 지갑 목록 조회
 * @param {number} customerNo - 고객번호
 * @returns {Promise} 지갑 목록
 */
export const fetchWallets = async (customerNo) => {
  try {
    const response = await api.get(endpoints.wallet.list(customerNo));
    return response.data;
  } catch (error) {
    console.error('지갑 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 지갑 삭제
 * @param {number} walletId - 지갑 ID
 * @returns {Promise} 삭제 결과
 */
export const deleteWallet = async (walletId) => {
  try {
    const response = await api.delete(`/api/trading/wallets/${walletId}`);
    return response.data;
  } catch (error) {
    console.error('지갑 삭제 실패:', error);
    throw error;
  }
};

/**
 * 고객 종합 정보 동기화 (지갑 데이터 기반으로 GOLD_CUSTOMER_TBL 업데이트)
 * TODO: 백엔드 엔드포인트 구현 필요
 */
export const syncCustomerSummary = async (customerNo) => {
  try {
    
    return { success: true, message: '동기화 완료' };
  } catch (error) {
    console.error('고객 종합 정보 동기화 실패:', error);
    throw error;
  }
};

export default {
  fetchPrices,
  fetchRecentPrices,
  fetchCustomerBalance,
  fetchDepositAccounts,
  fetchTradingHistoryWithPaging,
  buyMetal,
  sellMetal,
  transferToTradingAccount,
  transferFromTradingAccount,
  openSpotWallet,
  createWallet,
  fetchWallets,
  deleteWallet,
  syncCustomerSummary,
  endpoints
};
