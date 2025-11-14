import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TransferModal from '../components/modals/TransferModal';
import spotApi from '../api/spotApi';

/**
 * 이체 관리 페이지
 */
const SpotTransferPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [customerBalance, setCustomerBalance] = useState(null);
  const [wallets, setWallets] = useState([]);
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

  const transferToTradingAccount = async (amount, walletName) => {
    try {
      const customerNo = getCustomerNo();
      if (!customerNo) throw new Error('고객번호를 찾을 수 없습니다.');
      
      await spotApi.transferToTradingAccount(customerNo, amount, walletName);
      await fetchCustomerBalance();
    } catch (error) {
      console.error('이체 실패:', error);
      throw error;
    }
  };

  const transferFromTradingAccount = async (amount, walletName) => {
    try {
      const customerNo = getCustomerNo();
      if (!customerNo) throw new Error('고객번호를 찾을 수 없습니다.');
      
      await spotApi.transferFromTradingAccount(customerNo, amount, walletName);
      await fetchCustomerBalance();
    } catch (error) {
      console.error('이체 실패:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchCustomerBalance();
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
            이체 관리
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            계좌와 현물 통장 간 이체를 관리하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={() => {
              setTransferType('toTrading');
              setShowTransferModal(true);
            }}
            className="p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <h2 className="text-xl font-semibold mb-2">현물 통장으로 이체</h2>
            <p className="text-sm">일반 계좌에서 현물 통장으로 이체합니다</p>
          </button>

          <button
            onClick={() => {
              setTransferType('fromTrading');
              setShowTransferModal(true);
            }}
            className="p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <h2 className="text-xl font-semibold mb-2">일반 계좌로 이체</h2>
            <p className="text-sm">현물 통장에서 일반 계좌로 이체합니다</p>
          </button>
        </div>

        <TransferModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          transferType={transferType}
          customerBalance={customerBalance}
          transferToTradingAccount={transferToTradingAccount}
          transferFromTradingAccount={transferFromTradingAccount}
          wallets={wallets}
          onRefreshBalances={fetchCustomerBalance}
        />
      </div>
    </div>
  );
};

export default SpotTransferPage;
