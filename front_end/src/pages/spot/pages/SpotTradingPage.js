import React, { useState, useEffect, useRef } from 'react';


import PriceDisplay from '../components/PriceDisplay'; // 시세표시
import TradingPanel from '../components/TradingPanel'; //거래창
import WalletManager from '../components/WalletManager'; //지갑관리
import BalanceCard from '../components/BalanceCard'; // 잔고
// ===== 다이얼로그/모달 컴포넌트들 =====
import TransferModal from '../components/modals/TransferModal'; //이체
import PasswordModal from '../components/modals/PasswordModal'; // pin 확인
import TradingHistoryModal from '../components/modals/TradingHistoryModal'; //거래내역
// =====================================
import spotApi from '../api/spotApi';
import { getAccessToken } from '../../../api/axios';
import { fetchMe } from '../../../api/authApi';

/**
 * 현물거래 메인 페이지 컴포넌트
 * - 화면 구성: 현재 시세 섹션 (PriceDisplay), 현물거래 패널 (TradingPanel)
 * - 기술 스택: React + Recharts (프론트), Spring Boot + JPA+QueryDSL (백엔드)
 * - 성능 최적화: React.memo, useMemo, useCallback으로 리렌더링 최적화
 */
const SpotTradingPage = () => {
  // === 상태 관리 ===
  
  // 가격 관련 상태 - API에서 받은 가격 사용
  const [goldPrice, setGoldPrice] = useState({ buyPrice: 0, sellPrice: 0, basePrice: 0 });
  const [silverPrice, setSilverPrice] = useState({ buyPrice: 0, sellPrice: 0, basePrice: 0 });
  const [goldChange, setGoldChange] = useState(0);
  const [silverChange, setSilverChange] = useState(0);

  // 거래 관련 상태
  const [tradingSide, setTradingSide] = useState('buy'); // 'buy' 또는 'sell'
  const [selectedProduct, setSelectedProduct] = useState('gold'); // 'gold' 또는 'silver'
  const [tradingAmount, setTradingAmount] = useState(0); // 거래 금액 (원)

  // 고객 정보 및 잔고 상태
  const [customerBalance, setCustomerBalance] = useState(null);
  const [depositAccounts, setDepositAccounts] = useState([]);
  const [selectedAccountNo, setSelectedAccountNo] = useState(null);
  const [currentCustomerNo, setCurrentCustomerNo] = useState(null);

  // 지갑 관리 상태
  const [wallets, setWallets] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const walletManagerRef = useRef(null);

  // 현물통장 상태 변경 처리
  const handleWalletsChange = (updatedWallets) => {
    setWallets(updatedWallets);
  };

  // 지갑 선택 핸들러
  const handleWalletSelect = (wallet) => {
    setSelectedWalletForTrading(wallet.name || wallet.gwWalletName);
    // 지갑 변경 시 거래 금액 초기화
    setTradingAmount(0);
  };

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // ===== 다이얼로그/모달 상태 관리 =====
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState('toTrading'); // 'toTrading' 또는 'fromTrading'
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTradingHistoryModal, setShowTradingHistoryModal] = useState(false);
  const [selectedWalletForTrading, setSelectedWalletForTrading] = useState(null);
  const [selectedWalletPin, setSelectedWalletPin] = useState(null); // 거래에 사용할 지갑
  // =====================================

  // === 유틸리티 함수들 ===

  const TRADE_UNIT_WEIGHT = 3.75; // 시세 기준 단위(g)

  /**
   * 금액으로부터 수량 계산
   * @param {number} amount 거래 금액
   * @param {string} product 상품 ('gold' 또는 'silver')
   * @returns {number} 계산된 수량 (g)
   */
  const calculateQuantityFromAmount = (amount, product) => {
    if (!amount || amount <= 0) return 0;

    const currentPrice = product === 'gold' ? goldPrice : silverPrice;
    if (!currentPrice) return 0;

    const pricePerUnit = tradingSide === 'buy'
      ? (currentPrice.buyPrice ?? currentPrice.basePrice ?? 0)
      : (currentPrice.sellPrice ?? currentPrice.basePrice ?? 0);

    if (!pricePerUnit) return 0;

    return (amount / pricePerUnit) * TRADE_UNIT_WEIGHT;
  };

  /**
   * 수량으로부터 금액 계산
   * @param {number} quantity 수량 (g)
   * @param {string} product 상품 ('gold' 또는 'silver')
   * @returns {number} 계산된 금액 (원)
   */
  const calculateAmountFromQuantity = (quantity, product) => {
    if (!quantity || quantity <= 0) return 0;
    
    const currentPrice = product === 'gold' ? goldPrice : silverPrice;
    if (!currentPrice) return 0;

    const pricePerUnit = tradingSide === 'buy'
      ? (currentPrice.buyPrice ?? currentPrice.basePrice ?? 0)
      : (currentPrice.sellPrice ?? currentPrice.basePrice ?? 0);

    if (!pricePerUnit) return 0;

    return (quantity / TRADE_UNIT_WEIGHT) * pricePerUnit;
  };

  /**
   * 금액 단위 버튼 클릭 핸들러
   * @param {number} amount 추가할 금액
   */
  const addAmount = (amount) => {
    setTradingAmount(prev => prev + amount);
  };

  /**
   * 사용자 정보에서 고객번호 추출
   * @returns {number|null} 고객번호
   */
  const getCustomerNo = () => {
    const storedUser = localStorage.getItem('user');
    const storedCustomer = localStorage.getItem('customer');
    
    let customerNo = null;
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        customerNo = parsedUser?.customerNo || parsedUser?.c_no || parsedUser?.customer_no;
      } catch (e) {
        console.warn('사용자 정보 파싱 실패:', e);
      }
    }
    
    if (!customerNo && storedCustomer) {
      try {
        const parsedCustomer = JSON.parse(storedCustomer);
        customerNo = parsedCustomer?.customerNo || parsedCustomer?.c_no || parsedCustomer?.customer_no;
      } catch (e) {
        console.warn('고객 정보 파싱 실패:', e);
      }
    }
    
    if (!customerNo) {
      console.warn('사용자 정보를 찾을 수 없습니다. 로그인이 필요합니다.');
      return null;
    }
    
    return customerNo;
  };

  // === 공통 유틸리티 함수들 ===
  
  /**
   * API 에러 처리 공통 함수
   */
  const handleApiError = (error, operation) => {
    console.error(`${operation} 실패:`, error);
    setMessage(`${operation} 중 오류가 발생했습니다.`);
    setLoading(false);
  };
  
  /**
   * 성공 메시지 표시 공통 함수
   */
  const showSuccessMessage = (message) => {
    setMessage(message);
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  /**
   * 가격 정보 조회
   */
  /**
   * 가격 조회 (실제 API에서 매수가/매도가 구분해서 받아옴)
   */
  const fetchPrices = async () => {
    try {
      const prices = await spotApi.fetchPrices();
      if (prices) {
        // 금 가격 설정 (매수가/매도가 구분)
        if (prices.AU) {
          setGoldPrice({
            buyPrice: prices.AU.buyPrice || 0,
            sellPrice: prices.AU.sellPrice || 0,
            basePrice: prices.AU.basePrice || 0
          });
          setGoldChange(prices.AU.fluctuationRate || 0);
        }
        
        // 은 가격 설정 (매수가/매도가 구분)
        if (prices.AG) {
          setSilverPrice({
            buyPrice: prices.AG.buyPrice || 0,
            sellPrice: prices.AG.sellPrice || 0,
            basePrice: prices.AG.basePrice || 0
          });
          setSilverChange(prices.AG.fluctuationRate || 0);
        }
      }
    } catch (error) {
      console.error('시세 조회 실패:', error);
      handleApiError(error, '가격 조회');
    }
  };


  /**
   * 입출금 계좌 목록 조회
   */
  const loadDepositAccounts = async () => {
    try {
      const customerNo = getCustomerNo();
      if (!customerNo) {
        return;
      }
      
      const accounts = await spotApi.fetchDepositAccounts(customerNo);
      setDepositAccounts(Array.isArray(accounts) ? accounts : []);
    } catch (error) {
      console.error('입출금 계좌 목록 조회 실패:', error);
      setDepositAccounts([]);
    }
  };

  /**
   * 고객 잔고 조회
   */
  const fetchCustomerBalance = async (accountNo = null) => {
    try {
      const customerNo = getCustomerNo();
      
      if (!customerNo) {
        console.warn('고객번호가 없어서 잔고 조회 중단');
        return;
      }
      
      // accountNo가 없으면 localStorage에서 가져오기
      if (!accountNo) {
        const storedAccountNo = localStorage.getItem(`spot_selected_account_${customerNo}`);
        if (storedAccountNo) {
          accountNo = parseInt(storedAccountNo, 10);
        }
      }
      
      const balance = await spotApi.fetchCustomerBalance(customerNo, accountNo);
      setCustomerBalance(balance);
    } catch (error) {
      console.error('고객 잔고 조회 실패:', error);
      handleApiError(error, '고객 잔고 조회');
    }
  };

  /**
   * DB에서 지갑 데이터 새로고침
   */
  const loadWalletsFromDB = async (customerNo) => {
    try {
      const token = getAccessToken();
      if (!token) {
        console.warn('토큰이 없어서 지갑 조회 중단');
        return;
      }
      
      console.log('=== 지갑 데이터 새로고침 시작 ===');
      // spotApi를 사용하여 지갑 조회 (기본 URL: http://localhost:8081)
      const responseData = await spotApi.fetchWallets(customerNo);
      console.log('지갑 조회 응답:', responseData);
      
        
        // 응답 데이터에서 지갑 배열 추출
        let dbWallets = [];
        if (Array.isArray(responseData)) {
          dbWallets = responseData;
     
        } else if (responseData && typeof responseData === 'object') {
          if (responseData.wallets && Array.isArray(responseData.wallets)) {
            dbWallets = responseData.wallets;
          
          } else if (responseData.data && Array.isArray(responseData.data)) {
            dbWallets = responseData.data;
          
          } else {
            console.warn('예상치 못한 응답 형식:', responseData);
            dbWallets = [];
          }
        }
        
        console.log('추출된 지갑 데이터:', dbWallets);
        console.log('지갑 개수:', dbWallets.length);
        
        if (dbWallets.length === 0) {
        
          setWallets([]);
          return;
        }
        
        const formattedWallets = dbWallets.map(wallet => ({
          id: wallet.gwNo,
          name: wallet.gwWalletName,
          accountNo: wallet.accountNo || wallet.gwAccountNo || '',
          pin: wallet.gwPin,
          balance: Number(wallet.gwCashBalance) || 0,
          goldBalance: Number(wallet.gwGoldBalance) || 0,
          silverBalance: Number(wallet.gwSilverBalance) || 0,
          totalBalance: Number(wallet.gwTotalBalance) || 0,
          activeYn: wallet.gwActiveYn,
          createdAt: wallet.gwCreatedAt,
          updatedAt: wallet.gwUpdatedAt
        }));
        
        console.log('포맷된 지갑 데이터:', formattedWallets);
        setWallets(formattedWallets);
        console.log('=== 지갑 데이터 새로고침 완료 ===');
    } catch (error) {
      console.error('=== 지갑 데이터 새로고침 실패 ===');
      console.error('에러:', error);
      console.error('에러 메시지:', error.message);
     
      // console.log('오류 발생 - 기존 지갑 데이터 유지');
    }
  };

  // === 거래 처리 함수들 ===
  
  /**
   * 매수/매도 주문 처리
   */
  const handleSubmit = async (walletName, pin) => {
    setLoading(true);
    setMessage('');

    try {
      const customerNo = getCustomerNo();
      const productId = selectedProduct === 'gold' ? 'AU' : 'AG';
      const quantityDecimal = calculateQuantityFromAmount(tradingAmount, selectedProduct);

      if (!customerNo) {
        setMessage('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      // 거래 금액 검증
      if (!tradingAmount || tradingAmount <= 0) {
        setMessage('거래 금액을 입력해주세요.');
        setLoading(false);
        return;
      }

      // 수량 검증
      if (!quantityDecimal || quantityDecimal <= 0) {
        setMessage('거래 금액이 너무 작습니다. 최소 거래 금액을 확인해주세요.');
        setLoading(false);
        return;
      }

      // 지갑 선택 확인 - 파라미터 또는 상태에서 가져오기
      const finalWalletName = walletName || selectedWalletForTrading;
      const finalPin = pin || selectedWalletPin;
      
      if (!finalWalletName || !finalPin) {
        setMessage('지갑을 선택하고 PIN을 입력해주세요.');
        setLoading(false);
        return;
      }

      const endpoint = tradingSide === 'buy' ? spotApi.endpoints.trading.buy() : spotApi.endpoints.trading.sell();
      const params = { 
          customerNo: customerNo,
        productId: productId, 
        quantity: quantityDecimal 
      };
      const sideLabel = tradingSide === 'buy' ? '매수' : '매도';
      const metalLabel = selectedProduct === 'gold' ? '금(AU)' : '은(AG)';
      const qtyLabel = `${quantityDecimal.toFixed(3)} g`;
      
      if (!window.confirm(`${sideLabel} 주문을 제출하시겠습니까?\n상품: ${metalLabel}\n수량: ${qtyLabel}\n거래 금액: ₩${tradingAmount.toLocaleString()}`)) {
        setLoading(false);
        return;
      }

      const response = await spotApi[tradingSide === 'buy' ? 'buyMetal' : 'sellMetal'](customerNo, productId, quantityDecimal, finalWalletName, finalPin);
       console.log('=== API 응답 받음 ===');
    
      
      if (response) {
       
        setMessage(`${tradingSide === 'buy' ? '매수' : '매도'} 주문이 성공적으로 접수되었습니다.`);
        setTradingAmount(0);
        
     
        
        // 잔고 새로고침 (강력한 새로고침)
        try {
          console.log('=== 거래 후 잔고 새로고침 시작 ===');
          
          // 1단계: 고객 잔고 새로고침
          await fetchCustomerBalance();
          console.log('고객 잔고 새로고침 완료');
          
          // 2단계: 지갑 데이터 새로고침
          const customerNo = getCustomerNo();
          if (customerNo) {
            await loadWalletsFromDB(customerNo);
            console.log('지갑 데이터 새로고침 완료');
          }
          
          // 3단계: WalletManager 새로고침
          if (walletManagerRef.current?.refreshWallets) {
            await walletManagerRef.current.refreshWallets();
            console.log('WalletManager 새로고침 완료');
          }
          
          // 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 4단계: 추가 안전장치 - 한 번 더 새로고침
          await fetchCustomerBalance();
          if (customerNo) {
            await loadWalletsFromDB(customerNo);
          }
          if (walletManagerRef.current?.refreshWallets) {
            await walletManagerRef.current.refreshWallets();
          }
          
          console.log('=== 거래 후 잔고 새로고침 완료 ===');
          
        } catch (error) {
          console.error('잔고 새로고침 중 오류:', error);
        }
        
        // 추가 안전장치: 2초 후 한 번 더 새로고침
        setTimeout(async () => {
          console.log('=== 추가 안전장치 새로고침 ===');
          try {
            await fetchCustomerBalance();
            const customerNo = getCustomerNo();
            if (customerNo) {
              await loadWalletsFromDB(customerNo);
            }
            if (walletManagerRef.current?.refreshWallets) {
              await walletManagerRef.current.refreshWallets();
            }
            console.log('추가 안전장치 새로고침 완료');
          } catch (error) {
            console.error('추가 새로고침 중 오류:', error);
          }
        }, 2000);
        

      } else {
        setMessage('주문 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('주문 실패:', error.message);
      
      const errorMessage = error.response?.data?.error 
        ? `주문 실패: ${error.response.data.error}` 
        : error.message 
        ? `주문 실패: ${error.message}` 
        : '주문 처리 중 오류가 발생했습니다.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 거래 실행 (지갑 이름 포함)
   */
  const handleTradingWithWallet = async (walletName, pin) => {
    setShowPasswordModal(false);
    
    // handleSubmit에 직접 파라미터 전달
    await handleSubmit(walletName, pin);
  };

  /**
   * 계좌에서 현물거래 통장으로 이체
   */
  const transferToTradingAccount = async (amount, walletName) => {
    try {
      const customerNo = getCustomerNo();
      if (!customerNo) throw new Error('고객번호를 찾을 수 없습니다.');
      
      // 선택된 계좌 번호 가져오기 (localStorage에서)
      const storedAccountNo = selectedAccountNo || (() => {
        const stored = localStorage.getItem(`spot_selected_account_${customerNo}`);
        return stored ? parseInt(stored, 10) : null;
      })();
      
      await spotApi.transferToTradingAccount(customerNo, amount, walletName, storedAccountNo);
      
      // 이체 성공 후 즉시 잔고 새로고침 (선택된 계좌 번호로)
      await fetchCustomerBalance(storedAccountNo);
      
      // 지갑 새로고침
      await loadWalletsFromDB(customerNo);
      
      // WalletManager도 새로고침
      if (walletManagerRef.current?.refreshWallets) {
        await walletManagerRef.current.refreshWallets();
      }
      
      setMessage('현물통장으로 이체가 완료되었습니다.');
    } catch (error) {
      console.error('이체 실패:', error);
      throw error;
    }
  };

  /**
   * 현물거래 통장에서 계좌로 이체
   */
  const transferFromTradingAccount = async (amount, walletName) => {
    try {
      const customerNo = getCustomerNo();
      if (!customerNo) throw new Error('고객번호를 찾을 수 없습니다.');
      
      // 선택된 계좌 번호 가져오기 (localStorage에서)
      const storedAccountNo = selectedAccountNo || (() => {
        const stored = localStorage.getItem(`spot_selected_account_${customerNo}`);
        return stored ? parseInt(stored, 10) : null;
      })();
      
      await spotApi.transferFromTradingAccount(customerNo, amount, walletName, storedAccountNo);
      
      // 이체 성공 후 즉시 잔고 새로고침 (선택된 계좌 번호로)
      await fetchCustomerBalance(storedAccountNo);
      
      await loadWalletsFromDB(customerNo);
      
      // WalletManager도 새로고침
      if (walletManagerRef.current?.refreshWallets) {
        await walletManagerRef.current.refreshWallets();
      }
      
      setMessage('계좌로 이체가 완료되었습니다.');
    } catch (error) {
      console.error('이체 실패:', error);
      throw error;
    }
  };

  // === 이벤트 핸들러들 ===

  /**
   * 이체 모달 열기
   */
  const openTransferModal = (type) => {
    setTransferType(type);
    setShowTransferModal(true);
  };

  /**
   * 비밀번호 모달 열기 (지갑 데이터 새로고침 포함)
   */
  const openPasswordModal = async () => {
    // 거래 전 검증
    const customerNo = getCustomerNo();
    if (!customerNo) {
      setMessage('로그인이 필요합니다.');
      return;
    }

    if (!tradingAmount || tradingAmount <= 0) {
      setMessage('거래 금액을 입력해주세요.');
      return;
    }

    const quantityDecimal = calculateQuantityFromAmount(tradingAmount, selectedProduct);
    if (!quantityDecimal || quantityDecimal <= 0) {
      setMessage('거래 금액이 너무 작습니다. 최소 거래 금액을 확인해주세요.');
      return;
    }

    // 지갑 데이터 새로고침
    if (customerNo) {
      await loadWalletsFromDB(customerNo);
    }
    
    setShowPasswordModal(true);
  };

  // === 생명주기 ===

  /**
   * 컴포넌트 마운트 시 초기 데이터 로드
   */
  useEffect(() => {
    // 로그인 상태 체크
    const checkLoginStatus = () => {
      const token = localStorage.getItem('access');
      const user = localStorage.getItem('user');
      setIsLoggedIn(!!(token && user));
    };

    /**
     * 사용자 정보 로드
     * 로그인된 사용자의 Customer 정보를 가져와 localStorage에 저장하고,
     * customerNo를 추출하여 지갑 및 잔고 데이터를 로드합니다.
     * 
     * 참고: MeController의 /api/me 엔드포인트를 사용하여
     *       customerNo를 포함한 사용자 정보를 가져옵니다 (관리자 모드도 지원).
     */
    const loadUserInfo = async () => {
      try {
        // accessToken은 in-memory에만 저장되므로 getAccessToken() 함수 사용
        const token = getAccessToken();
        // console.log('SpotTradingPage - accessToken 존재 여부:', !!token);
        
        if (token) {
          // /api/me 엔드포인트를 사용하여 로그인 사용자 정보 조회 (관리자 모드도 지원)
          const meData = await fetchMe();
          // console.log('SpotTradingPage - 사용자 정보 로드:', meData);
          
          // MeDto는 { customerNo, c_user_id, roles } 구조
          // localStorage에 저장 (기존 코드와의 호환성을 위해)
          localStorage.setItem('user', JSON.stringify(meData));
          localStorage.setItem('customer', JSON.stringify(meData));
          setIsLoggedIn(true);
          
          // customerNo 추출
          const customerNo = meData.customerNo;
          // console.log('SpotTradingPage - 추출된 고객번호:', customerNo);
          // console.log('SpotTradingPage - 사용자 정보 로드 후 지갑 데이터 로드 시작');
          
          // 고객번호가 변경되었을 때 이전 계좌 선택 초기화
          if (customerNo && customerNo !== currentCustomerNo) {
            setSelectedAccountNo(null);
            setCurrentCustomerNo(customerNo);
          }
          
          if (customerNo) {
            await Promise.all([
              fetchCustomerBalance(),
              loadWalletsFromDB(customerNo),
              loadDepositAccounts()
            ]);
            // console.log('SpotTradingPage - 초기 데이터 로드 완료');
          } else {
            console.warn('SpotTradingPage - customerNo를 찾을 수 없음');
          }
        } else {
          setIsLoggedIn(false);
          // 토큰이 없을 때 기존 데이터 초기화
          setWallets([]);
          setCustomerBalance(null);
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        setIsLoggedIn(false);
        // 에러 발생 시 기존 데이터 초기화
        setWallets([]);
        setCustomerBalance(null);
      }
    };

    loadUserInfo();
    fetchPrices();

    // 가격 업데이트를 위한 주기적 호출
    const priceInterval = setInterval(fetchPrices, 30000); // 30초마다
    
    // 잔고 및 지갑 데이터 주기적 새로고침 (DB 변경사항 반영) - 스크롤 위치 유지
    const balanceInterval = setInterval(() => {
      if (isLoggedIn) {
        // 스크롤 위치 저장
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        // 선택된 계좌 번호로 잔고 조회
        const customerNo = getCustomerNo();
        const storedAccountNo = customerNo ? localStorage.getItem(`spot_selected_account_${customerNo}`) : null;
        const accountNo = storedAccountNo ? parseInt(storedAccountNo, 10) : null;
        fetchCustomerBalance(accountNo);
        
        // 지갑 데이터도 새로고침
        if (customerNo) {
          loadWalletsFromDB(customerNo);
          loadDepositAccounts();
        }
        
        // 스크롤 위치 복원 (다음 프레임에서 실행)
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);
        });
      }
    }, 20000); // 20초마다 (깜빡임 방지)
    
    return () => {
      clearInterval(priceInterval);
      clearInterval(balanceInterval);
    };
  }, [currentCustomerNo]);

  // === 렌더링 ===

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* 페이지 헤더 */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">현물거래</h1>
          <p className="text-sm sm:text-base text-gray-600">금/은 현물거래를 안전하고 편리하게 이용하세요</p>
        </div>
                
        {/* 현재 시세 섹션 - 시세 조회 기능: React + Recharts + Spring Boot + JPA+QueryDSL, 시세 전용 테이블 분리 관리, 가상시뮬레이션으로 실시간 변동률 표시 */}
        {/* 현재시세 */}
        <div className="mb-6 lg:mb-8">
          <PriceDisplay
            goldPrice={goldPrice}
            silverPrice={silverPrice}
            goldChange={goldChange}
            silverChange={silverChange}
          />
        </div>
                  
        {/* 현물거래 패널 - 거래 주문 기능: 매수/매도, 골드바/실버바 선택, 빠른 수량/금액 선택 */}
        {/* 현물거래 패널 */}
        <div className="mb-6 lg:mb-8">
          <TradingPanel
            tradingSide={tradingSide}
            setTradingSide={setTradingSide}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
            tradingAmount={tradingAmount}
            setTradingAmount={setTradingAmount}
            goldPrice={goldPrice}
            silverPrice={silverPrice}
            handleSubmit={openPasswordModal}
            loading={loading}
            message={message}
            addAmount={addAmount}
            calculateQuantityFromAmount={calculateQuantityFromAmount}
            calculateAmountFromQuantity={calculateAmountFromQuantity}
            customerBalance={customerBalance}
            selectedWalletForTrading={selectedWalletForTrading}
            wallets={wallets}
          />
        </div>

        {/* 현물통장 관리 - 로그인 시에만 표시 */}
        {isLoggedIn && (
          <>
            <div className="mb-6 lg:mb-8">
              <WalletManager
                ref={walletManagerRef}
                isLoggedIn={isLoggedIn}
                customerBalance={customerBalance}
                onWalletsChange={handleWalletsChange}
                onWalletSelect={handleWalletSelect}
                onShowTradingHistory={() => setShowTradingHistoryModal(true)}
              />
            </div>

            {/* 잔고현황 - 로그인 시에만 표시 */}
            <div className="mb-6 lg:mb-8">
              <BalanceCard
                customerBalance={customerBalance}
                fetchCustomerBalance={fetchCustomerBalance}
                onTransferToTrading={() => openTransferModal('toTrading')}
                onTransferFromTrading={() => openTransferModal('fromTrading')}
                wallets={wallets}
                depositAccounts={depositAccounts}
                customerNo={getCustomerNo()}
                onAccountChange={(accountNo) => {
                  setSelectedAccountNo(accountNo);
                  fetchCustomerBalance(accountNo);
                }}
              />
            </div>
          </>
        )}

        {/* 이체 모달 */}
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          transferType={transferType}
          customerBalance={customerBalance}
          transferToTradingAccount={transferToTradingAccount}
          transferFromTradingAccount={transferFromTradingAccount}
          wallets={wallets}
          onRefreshBalances={async () => {
            const customerNo = getCustomerNo();
            // 선택된 계좌 번호 가져오기 (localStorage에서)
            const storedAccountNo = selectedAccountNo || (() => {
              const stored = customerNo ? localStorage.getItem(`spot_selected_account_${customerNo}`) : null;
              return stored ? parseInt(stored, 10) : null;
            })();
            // 선택된 계좌 번호로 잔고 조회
            await fetchCustomerBalance(storedAccountNo);
            if (customerNo) {
              await Promise.all([
                loadWalletsFromDB(customerNo),
                loadDepositAccounts()
              ]);
            }
          }}
        />

        {/* 비밀번호 확인 모달 - 거래 실행 전 보안 확인 */}
        {(() => {
          
          return (
            <PasswordModal
              isOpen={showPasswordModal}
              onClose={() => setShowPasswordModal(false)}
              onSubmit={handleTradingWithWallet}
              tradingSide={tradingSide}
              selectedProduct={selectedProduct}
              quantity={calculateQuantityFromAmount(tradingAmount, selectedProduct)}
              tradingAmount={tradingAmount}
              wallets={wallets}
              selectedWalletForTrading={selectedWalletForTrading}
            />
          );
        })()}
        
        {/* 거래내역 모달 - 현물계좌별 거래 이력 조회 */}
        <TradingHistoryModal
          isOpen={showTradingHistoryModal}
          onClose={() => setShowTradingHistoryModal(false)}
          customerNo={getCustomerNo()}
          wallets={wallets}
        />
        {/* ===================================== */}
      </div>
    </div>
  );
};

export default SpotTradingPage;