import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TradingPanel from '../components/TradingPanel';
import PriceDisplay from '../components/PriceDisplay';
import spotApi from '../api/spotApi';

/**
 * 매수/매도 페이지
 */
const SpotTradePage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/spot', label: '메인' },
    { path: '/spot/trade', label: '매수/매도' },
    { path: '/spot/balance', label: '잔고현황' },
    { path: '/spot/wallets', label: '통장관리' },
    { path: '/spot/history', label: '거래내역' },
    { path: '/spot/transfer', label: '이체관리' },
    { path: '/spot/SpotPriceHistory', label: '시세이력' }
  ];

  const [goldPrice, setGoldPrice] = useState({ buyPrice: 0, sellPrice: 0, basePrice: 0 });
  const [silverPrice, setSilverPrice] = useState({ buyPrice: 0, sellPrice: 0, basePrice: 0 });
  const [goldChange, setGoldChange] = useState(0);
  const [silverChange, setSilverChange] = useState(0);
  const [tradingSide, setTradingSide] = useState('buy');
  const [selectedProduct, setSelectedProduct] = useState('gold');
  const [tradingAmount, setTradingAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchPrices = async () => {
    try {
      const prices = await spotApi.fetchPrices();
      if (prices) {
        if (prices.AU) {
          setGoldPrice({
            buyPrice: prices.AU.buyPrice || 0,
            sellPrice: prices.AU.sellPrice || 0,
            basePrice: prices.AU.basePrice || 0
          });
          setGoldChange(prices.AU.fluctuationRate || 0);
        }
        
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
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const addAmount = (amount) => {
    setTradingAmount(prev => prev + amount);
  };

  const calculateQuantityFromAmount = (amount, product) => {
    if (!amount || amount <= 0) return 0;
    const currentPrice = product === 'gold' ? goldPrice : silverPrice;
    const pricePerGram = tradingSide === 'buy' ? currentPrice.buyPrice : currentPrice.sellPrice;
    return amount / pricePerGram;
  };

  const calculateAmountFromQuantity = (quantity, product) => {
    if (!quantity || quantity <= 0) return 0;
    const currentPrice = product === 'gold' ? goldPrice : silverPrice;
    const pricePerGram = tradingSide === 'buy' ? currentPrice.buyPrice : currentPrice.sellPrice;
    return quantity * pricePerGram;
  };

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
            현물 매수/매도
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            금/은 현물을 거래하세요
          </p>
        </div>

        <div className="mb-6">
          <PriceDisplay
            goldPrice={goldPrice}
            silverPrice={silverPrice}
            goldChange={goldChange}
            silverChange={silverChange}
          />
        </div>

        <TradingPanel
          tradingSide={tradingSide}
          setTradingSide={setTradingSide}
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          tradingAmount={tradingAmount}
          setTradingAmount={setTradingAmount}
          goldPrice={goldPrice}
          silverPrice={silverPrice}
          handleSubmit={() => alert('매수/매도 기능은 메인 현물 페이지에서 이용하세요')}
          loading={loading}
          message={message}
          addAmount={addAmount}
          calculateQuantityFromAmount={calculateQuantityFromAmount}
          calculateAmountFromQuantity={calculateAmountFromQuantity}
          customerBalance={null}
          selectedWalletForTrading={null}
          wallets={[]}
        />
      </div>
    </div>
  );
};

export default SpotTradePage;

