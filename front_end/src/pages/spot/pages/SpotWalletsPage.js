import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WalletManager from '../components/WalletManager';
import spotApi from '../api/spotApi';
import TradingHistoryModal from '../components/modals/TradingHistoryModal';
import { fetchMe } from '../../../api/authApi';

/**
 * 월렛 관리 전용 페이지
 */
const SpotWalletsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerBalance, setCustomerBalance] = useState(null);
  const [wallets, setWallets] = useState([]);
  const walletManagerRef = useRef(null);
  const [showTradingHistoryModal, setShowTradingHistoryModal] = useState(false);

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

  const fetchCustomerBalance = async () => {
    try {
      const customerNo = getCustomerNo();
      if (!customerNo) return;
      
      const balance = await spotApi.fetchCustomerBalance(customerNo);
      setCustomerBalance(balance);
    } catch (error) {
      console.error('잔고 조회 실패:', error);
    }
  };

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

  const handleWalletsChange = (updatedWallets) => {
    setWallets(updatedWallets);
  };

  const handleWalletSelect = (wallet) => {
    console.log('월렛 선택됨:', wallet);
  };

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('access');
      const user = localStorage.getItem('user');
      setIsLoggedIn(!!(token && user));
    };

    const loadUserInfo = async () => {
      try {
        const { getAccessToken } = await import('../../../api/axios');
        const token = getAccessToken();
        
        if (token) {
          // /api/me 엔드포인트를 사용하여 로그인 사용자 정보 조회 (관리자 모드도 지원)
          const meData = await fetchMe();
          
          // MeDto는 { customerNo, c_user_id, roles } 구조
          localStorage.setItem('user', JSON.stringify(meData));
          setIsLoggedIn(true);
          
          const customerNo = meData.customerNo;
          
          if (customerNo) {
            await Promise.all([
              fetchCustomerBalance(),
              loadWalletsFromDB(customerNo)
            ]);
          }
        } else {
          setIsLoggedIn(false);
          setWallets([]);
          setCustomerBalance(null);
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        setIsLoggedIn(false);
        setWallets([]);
        setCustomerBalance(null);
      }
    };

    checkLoginStatus();
    loadUserInfo();
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
            현물 통장 관리
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            금/은 현물 거래 통장을 관리하세요
          </p>
        </div>
        
        <WalletManager
          ref={walletManagerRef}
          isLoggedIn={isLoggedIn}
          customerBalance={customerBalance}
          onWalletsChange={handleWalletsChange}
          onWalletSelect={handleWalletSelect}
          onShowTradingHistory={() => setShowTradingHistoryModal(true)}
        />
        
        {/* 거래내역 모달 */}
        <TradingHistoryModal
          isOpen={showTradingHistoryModal}
          onClose={() => setShowTradingHistoryModal(false)}
          customerNo={getCustomerNo()}
          wallets={wallets}
        />
      </div>
    </div>
  );
};

export default SpotWalletsPage;
