import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import PriceHistoryModal from '../components/modals/PriceHistoryModal';

/**
 * 시세 이력 페이지
 */
const SpotPriceHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(true);
  const [selectedMetal, setSelectedMetal] = useState(searchParams.get('metal') || 'AU');
  
  const navItems = [
    { path: '/spot', label: '메인' },
    { path: '/spot/trade', label: '매수/매도' },
    { path: '/spot/balance', label: '잔고현황' },
    { path: '/spot/wallets', label: '통장관리' },
    { path: '/spot/history', label: '거래내역' },
    { path: '/spot/transfer', label: '이체관리' },
    { path: '/spot/SpotPriceHistory', label: '시세이력' }
  ];

  useEffect(() => {
    const metalParam = searchParams.get('metal');
    if (metalParam) {
      setSelectedMetal(metalParam);
    }
  }, [searchParams]);

  const handleClose = useCallback(() => {
    setShowModal(false);
    navigate('/spot');
  }, [navigate]);

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
            시세 이력
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            금/은 시세 이력을 조회하세요
          </p>
        </div>
        
        <PriceHistoryModal
          isOpen={showModal}
          onClose={handleClose}
          metalCode={selectedMetal}
          metalName={selectedMetal === 'AU' ? '금' : '은'}
        />
      </div>
    </div>
  );
};

export default SpotPriceHistoryPage;
