import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BalanceCard from '../components/BalanceCard';
import TransferModal from '../components/modals/TransferModal';
import spotApi from '../api/spotApi';
import { fetchMe } from '../../../api/authApi';

/**
 * 잔고 조회 페이지
 */
const SpotBalancePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customerBalance, setCustomerBalance] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [depositAccounts, setDepositAccounts] = useState([]);
  const [selectedAccountNo, setSelectedAccountNo] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState('toTrading');

  const navItems = [
    { path: '/spot', label: '메인' },
    { path: '/spot/trade', label: '매수/매도' },
    { path: '/spot/balance', label: '잔고현황' },
    { path: '/spot/wallets', label: '통장관리' },
    { path: '/spot/history', label: '거래내역' },
    { path: '/spot/transfer', label: '이체관리' },
    { path: '/spot/SpotPriceHistory', label: '시세이력' }
  ];

  const getCustomerNo = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser?.customerNo || parsedUser?.c_no || parsedUser?.customer_no;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const fetchCustomerBalance = useCallback(async (accountNo = null) => {
    try {
      const customerNo = getCustomerNo();
      if (!customerNo) return;
      
      // localStorage에서 선택된 계좌 번호 가져오기
      const storedAccountNo = accountNo || (() => {
        const stored = localStorage.getItem(`spot_selected_account_${customerNo}`);
        return stored ? parseInt(stored, 10) : null;
      })();
      
      const balance = await spotApi.fetchCustomerBalance(customerNo, storedAccountNo);
      setCustomerBalance(balance);
    } catch (error) {
      console.error('잔고 조회 실패:', error);
    }
  }, []);

  const loadDepositAccounts = async () => {
    try {
      const customerNo = getCustomerNo();
      if (!customerNo) return;
      
      const accounts = await spotApi.fetchDepositAccounts(customerNo);
      setDepositAccounts(accounts);
      
      // 계좌 목록만 로드하고, 선택은 BalanceCard에서 처리
      // 초기 선택된 계좌 번호만 설정 (잔고 조회는 하지 않음)
      if (accounts.length > 0 && !selectedAccountNo) {
        const storedAccountNo = localStorage.getItem(`spot_selected_account_${customerNo}`);
        const accountNo = storedAccountNo ? parseInt(storedAccountNo, 10) : accounts[0].aNo;
        
        // 저장된 계좌가 유효한지 확인
        const isValidAccount = accounts.some(acc => acc.aNo === accountNo);
        if (isValidAccount) {
          setSelectedAccountNo(accountNo);
        } else {
          setSelectedAccountNo(accounts[0].aNo);
        }
      }
    } catch (error) {
      console.error('입출금 계좌 목록 조회 실패:', error);
    }
  };

  const handleAccountChange = useCallback((accountNo) => {
    // 계좌 변경 시에만 잔고 조회 (사용자가 직접 선택한 경우)
    if (selectedAccountNo !== accountNo) {
      setSelectedAccountNo(accountNo);
      fetchCustomerBalance(accountNo);
    }
  }, [selectedAccountNo, fetchCustomerBalance]);

  const loadWalletsFromDB = async (customerNo) => {
    try {
      const token = localStorage.getItem('access');
      const response = await fetch(`/api/spot/wallets/${customerNo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        let dbWallets = [];
        
        if (Array.isArray(responseData)) {
          dbWallets = responseData;
        } else if (responseData && typeof responseData === 'object') {
          if (responseData.wallets && Array.isArray(responseData.wallets)) {
            dbWallets = responseData.wallets;
          } else if (responseData.data && Array.isArray(responseData.data)) {
            dbWallets = responseData.data;
          }
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
        
        setWallets(formattedWallets);
      }
    } catch (error) {
      console.error('월렛 데이터 로드 실패:', error);
    }
  };

  const refreshAllBalances = async () => {
    try {
      await fetchCustomerBalance();
      const customerNo = getCustomerNo();
      if (customerNo) {
        await loadWalletsFromDB(customerNo);
      }
    } catch (error) {
      console.error('잔고현황 새로고침 실패:', error);
    }
  };

  const transferToTradingAccount = async (amount, walletName) => {
    try {
      const customerNo = getCustomerNo();
      if (!customerNo) throw new Error('고객번호를 찾을 수 없습니다.');
      
      await spotApi.transferToTradingAccount(customerNo, amount, walletName);
      await fetchCustomerBalance();
      await loadWalletsFromDB(customerNo);
      
      setTimeout(async () => {
        await loadWalletsFromDB(customerNo);
      }, 1000);
      
      console.log('=== 계좌 → 현물통장 이체 완료 ===');
    } catch (error) {
      console.error('=== 이체 실패 ===');
      throw error;
    }
  };

  const transferFromTradingAccount = async (amount, walletName) => {
    try {
      const customerNo = getCustomerNo();
      if (!customerNo) throw new Error('고객번호를 찾을 수 없습니다.');
      
      await spotApi.transferFromTradingAccount(customerNo, amount, walletName);
      await fetchCustomerBalance();
      await loadWalletsFromDB(customerNo);
      
      console.log('=== 현물통장 → 계좌 이체 완료 ===');
    } catch (error) {
      console.error('=== 이체 실패 ===');
      throw error;
    }
  };

  const openTransferModal = (type) => {
    setTransferType(type);
    setShowTransferModal(true);
  };

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { getAccessToken } = await import('../../../api/axios');
        const token = getAccessToken();
        
        if (token) {
          // /api/me 엔드포인트를 사용하여 로그인 사용자 정보 조회 (관리자 모드도 지원)
          const meData = await fetchMe();
          
          // MeDto는 { customerNo, c_user_id, roles } 구조
          localStorage.setItem('user', JSON.stringify(meData));
          
          const customerNo = meData.customerNo;
          
          if (customerNo) {
            await Promise.all([
              loadDepositAccounts(),
              loadWalletsFromDB(customerNo)
            ]);
            // 계좌 목록 로드 후 잔고 조회
            await fetchCustomerBalance();
          }
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };

    loadUserInfo();
    
    const interval = setInterval(() => {
      refreshAllBalances();
    }, 20000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* 네비게이션 탭 */}
        <div className="mb-6 bg-white rounded-lg shadow-sm overflow-x-auto">
          <div className="flex border-b border-gray-200">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  location.pathname === item.path
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            잔고 현황
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            현물 거래 통장 잔고를 확인하세요
          </p>
        </div>
        
        <BalanceCard
          customerBalance={customerBalance}
          fetchCustomerBalance={fetchCustomerBalance}
          onTransferToTrading={() => openTransferModal('toTrading')}
          onTransferFromTrading={() => openTransferModal('fromTrading')}
          wallets={wallets}
          onRefreshAllBalances={refreshAllBalances}
          depositAccounts={depositAccounts}
          customerNo={getCustomerNo()}
          onAccountChange={handleAccountChange}
        />
        
        {/* 이체 모달 */}
        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          transferType={transferType}
          customerBalance={customerBalance}
          transferToTradingAccount={transferToTradingAccount}
          transferFromTradingAccount={transferFromTradingAccount}
          wallets={wallets}
          onRefreshBalances={refreshAllBalances}
        />
      </div>
    </div>
  );
};

export default SpotBalancePage;

