import React, { useCallback, useState, useEffect, useMemo } from 'react';

/**
 * 현물거래 패널 컴포넌트
 * - 거래 주문 기능: 매수/매도, 골드바/실버바 선택, 빠른 수량/금액 선택
 * - 성능 최적화: React.memo, useMemo, useCallback으로 리렌더링 최적화
 */
const TradingPanel = ({ 
  tradingSide, 
  setTradingSide, 
  selectedProduct, 
  setSelectedProduct, 
  tradingAmount,
  setTradingAmount,
  goldPrice,
  silverPrice,
  handleSubmit,
  loading,
  message,
  addAmount,
  calculateQuantityFromAmount,
  calculateAmountFromQuantity,
  customerBalance,
  selectedWalletForTrading,
  wallets
}) => {
  
  // === 로컬 입력 상태: 수량(g) ===
  const [quantityInput, setQuantityInput] = useState(0);

  // 금액이 바뀔 때 수량 입력값 동기화
  useEffect(() => {
    const q = calculateQuantityFromAmount(tradingAmount || 0, selectedProduct);
    setQuantityInput(Number.isFinite(q) ? Number(q) : 0);
  }, [tradingAmount, selectedProduct, calculateQuantityFromAmount]);

  // === 상품명 표시 함수 ===
  
  /**
   * 상품 ID를 한글명으로 변환
   */
  const getProductDisplayName = useCallback((productId) => {
    const productNames = {
      'AU': '골드바',
      'AG': '실버바'
    };
    return productNames[productId] || productId;
  }, []);
  
  /**
   * 수량에 따른 상품 크기 표시
   */
  const getProductSizeDisplay = useCallback((productId, quantity) => {
    if (!quantity || quantity <= 0) return '';
    
    const size = quantity.toFixed(0);
    return `${size}g`;
  }, []);
  
  /**
   * 전체 상품명 표시 (예: "골드바 10g")
   */
  const getFullProductDisplay = useCallback((productId, quantity) => {
    const productName = getProductDisplayName(productId);
    const sizeDisplay = getProductSizeDisplay(productId, quantity);
    return sizeDisplay ? `${productName} ${sizeDisplay}` : productName;
  }, [getProductDisplayName, getProductSizeDisplay]);
  
  // === 시세 계산 함수들 ===
  
  /**
   * 현재 거래 금액으로부터 수량 계산 (메모이제이션)
   */
  const getCalculatedQuantity = useCallback(() => {
    if (!tradingAmount || tradingAmount <= 0) {
      return 0;
    }
    
    return calculateQuantityFromAmount(tradingAmount, selectedProduct);
  }, [tradingAmount, selectedProduct, calculateQuantityFromAmount]);

  /**
   * 현재 보유량 조회 (선택된 지갑 기준) - 메모이제이션
   */
  const getCurrentHoldings = useCallback(() => {
    // 선택된 지갑이 있으면 해당 지갑의 보유량 반환
    if (selectedWalletForTrading && wallets && wallets.length > 0) {
      const selectedWallet = wallets.find(wallet => 
        wallet.name === selectedWalletForTrading || 
        wallet.gwWalletName === selectedWalletForTrading
      );
      
      if (selectedWallet) {
        const holdings = selectedProduct === 'gold' 
          ? (selectedWallet.goldBalance || 0)
          : (selectedWallet.silverBalance || 0);
        return Math.max(0, holdings || 0);
      }
    }
    
    // 선택된 지갑이 없으면 전체 고객 보유량 반환
    if (!customerBalance) return 0;
    const holdings = selectedProduct === 'gold' ? customerBalance.gold : customerBalance.silver;
    return Math.max(0, holdings || 0);
  }, [selectedWalletForTrading, wallets, selectedProduct, customerBalance]);

  /**
   * 매도 시 보유량 차감 후 잔여량 계산
   */
  const getRemainingHoldings = useCallback(() => {
    if (tradingSide === 'buy') return getCurrentHoldings();
    return Math.max(0, getCurrentHoldings() - getCalculatedQuantity());
  }, [tradingSide, getCurrentHoldings, getCalculatedQuantity]);

  /**
   * 전량 매도 금액 계산
   */
  const calculateFullSellAmount = useCallback(() => {
    const currentHoldings = getCurrentHoldings();
    // 수량 기반으로 금액 계산 (프리미엄 포함)
    return calculateAmountFromQuantity(currentHoldings, selectedProduct);
  }, [getCurrentHoldings, calculateAmountFromQuantity, selectedProduct]);

  /**
   * 빠른 수량 선택 안내용 1g 기준 가격 표시
   */
  const UNIT_WEIGHT = 3.75;

  const perUnitPriceLabel = useMemo(() => {
    const amount = calculateAmountFromQuantity(UNIT_WEIGHT, selectedProduct);
    const rounded = Math.round(amount || 0).toLocaleString();
    return selectedProduct === 'gold'
      ? `순금 ${UNIT_WEIGHT}g당 ₩${rounded}`
      : `은 ${UNIT_WEIGHT}g당 ₩${rounded}`;
  }, [calculateAmountFromQuantity, selectedProduct]);

  /**
   * 전량 매도 버튼 클릭 핸들러
   */
  const handleFullSell = useCallback(() => {
    if (tradingSide === 'sell' && getCurrentHoldings() > 0) {
      const currentHoldings = getCurrentHoldings();
      // 전량 매도 시 현재 보유량을 수량으로 직접 설정
      const fullSellAmount = calculateAmountFromQuantity(currentHoldings, selectedProduct);
      setTradingAmount(Math.floor(fullSellAmount)); // 소수점 제거 (원화 기준)
    }
  }, [tradingSide, getCurrentHoldings, calculateAmountFromQuantity, selectedProduct, setTradingAmount]);

  /**
   * 예상 체결가 계산 (금액 기반)
   */
  const calculatePrice = useCallback(() => {
    return tradingAmount; // 입력한 금액이 체결가
  }, [tradingAmount]);

  /**
   * 수수료율 계산 (수량 기반, 백엔드와 동일 로직)
   * - 100g 이상: 0.5%
   * - 10g 이상 100g 미만: 0.7%
   * - 10g 미만: 1%
   */
  const calculateFeeRate = useCallback((quantity) => {
    if (quantity >= 100) {
      return 0.005; // 0.5%
    } else if (quantity >= 10) {
      return 0.007; // 0.7%
    } else {
      return 0.01; // 1%
    }
  }, []);

  /**
   * 수수료율 텍스트 반환
   */
  const getFeeRateText = useCallback((quantity) => {
    if (quantity >= 100) {
      return '0.5%';
    } else if (quantity >= 10) {
      return '0.7%';
    } else {
      return '1%';
    }
  }, []);

  /**
   * 실제 거래 금액 계산 (수량 기반, 백엔드와 동일)
   * 백엔드는 totalPrice = currentPrice.getPBuyPrice().multiply(quantity)로 계산
   * 반올림하지 않고 정밀한 값 유지 (최종 합계에서만 반올림)
   * 
   * 중요: 백엔드로 전달되는 정확한 quantity를 기준으로 계산
   * 프론트엔드에서 quantity = tradingAmount / buyPrice로 계산하고,
   * 백엔드는 이 quantity를 받아서 실시간 가격으로 totalPrice를 계산합니다.
   * 
   * 백엔드와 정확히 일치시키기 위해, 백엔드로 전달되는 quantity를 정확히 계산합니다.
   */
  const calculateActualTotalPrice = useCallback(() => {
    // 백엔드로 전달되는 정확한 quantity 계산 (tradingAmount / buyPrice)
    const quantity = getCalculatedQuantity();
    if (quantity <= 0) return 0;
    const currentPrice = selectedProduct === 'gold' ? goldPrice : silverPrice;
    const pricePerGram = tradingSide === 'buy' ? currentPrice.buyPrice : currentPrice.sellPrice;
    
    // 백엔드와 동일하게: totalPrice = buyPrice * quantity
    // 정밀도 유지를 위해 부동소수점 연산 사용
    return pricePerGram * quantity; // 반올림하지 않음
  }, [getCalculatedQuantity, selectedProduct, goldPrice, silverPrice, tradingSide]);

  /**
   * 수수료 계산 (수량 기반, 백엔드와 동일)
   * 백엔드는 feeAmount = totalPrice.multiply(feeRate)로 계산
   * 반올림하지 않고 정밀한 값 유지
   */
  const calculateFee = useCallback(() => {
    const quantity = getCalculatedQuantity();
    if (quantity <= 0) return 0;
    const feeRate = calculateFeeRate(quantity);
    const totalPrice = calculateActualTotalPrice();
    return totalPrice * feeRate; // 반올림하지 않음
  }, [getCalculatedQuantity, calculateFeeRate, calculateActualTotalPrice]);

  /**
   * 세금 계산 (VAT 10%, 백엔드와 동일)
   * 백엔드는 taxAmount = totalPrice.multiply(TAX_RATE)로 계산
   * 반올림하지 않고 정밀한 값 유지
   */
  const calculateTax = useCallback(() => {
    const totalPrice = calculateActualTotalPrice();
    return totalPrice * 0.1; // 반올림하지 않음
  }, [calculateActualTotalPrice]);

  /**
   * 총액 계산 (체결가 + 수수료 + 세금, 백엔드와 동일)
   * 백엔드는 finalAmount = totalPrice.add(feeAmount).add(taxAmount).setScale(0, RoundingMode.HALF_UP)
   * 최종 합계만 반올림 (각 단계를 반올림하면 누적 오차 발생)
   */
  const calculateTotal = useCallback(() => {
    const totalPrice = calculateActualTotalPrice();
    const feeAmount = calculateFee();
    const taxAmount = calculateTax();
    const total = totalPrice + feeAmount + taxAmount;
    return Math.round(total); // 최종 합계만 반올림
  }, [calculateActualTotalPrice, calculateFee, calculateTax]);

  /**
   * 매도 시 예상 체결가 계산 (프리미엄 없음)
   */
  const calculateSellPrice = useCallback(() => {
    const quantity = getCalculatedQuantity();
    const currentPrice = selectedProduct === 'gold' ? goldPrice : silverPrice;
    const basePrice = currentPrice?.sellPrice || currentPrice?.basePrice || currentPrice || 0;
    return Math.round(basePrice * quantity);
  }, [getCalculatedQuantity, selectedProduct, goldPrice, silverPrice]);

  /**
   * 매도 시 총액 계산
   */
  const calculateSellTotal = useCallback(() => {
    const sellPrice = calculateSellPrice();
    const quantity = getCalculatedQuantity();
    if (quantity <= 0) return 0;
    const feeRate = calculateFeeRate(quantity);
    const fee = Math.round(sellPrice * feeRate);
    const tax = Math.round(sellPrice * 0.1);
    return sellPrice - fee - tax; // 매도 시 수수료와 세금 차감
  }, [calculateSellPrice, getCalculatedQuantity, calculateFeeRate]);
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* 거래 패널 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">현물거래</h2>
        <div className="flex space-x-2">
          {/* 매수/매도 버튼 */}
          <button
            onClick={() => setTradingSide('buy')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
              tradingSide === 'buy'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            매수
          </button>
          <button
            onClick={() => setTradingSide('sell')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
              tradingSide === 'sell'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            매도
          </button>
        </div>
      </div>

      {/* 매수/매도: 골드바/실버바 선택 가능 */}
      {/* 상품 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">상품 선택</label>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <button
            onClick={() => setSelectedProduct('gold')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
              selectedProduct === 'gold'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            골드바
          </button>
          <button
            onClick={() => setSelectedProduct('silver')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base ${
              selectedProduct === 'silver'
                ? 'bg-gray-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            실버바
          </button>
        </div>
      </div>

      {/* 거래 금액 입력 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">거래 금액</label>
        <div className="flex items-center space-x-4">
          {/* 금액 감소 버튼 */}
          <button
            onClick={() => setTradingAmount(prev => Math.max(0, prev - 10000))}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            -
          </button>
          
          {/* 금액 입력 필드 + 단위(원) */}
          <div className="relative flex-1">
            <input
              type="text"
              value={tradingAmount.toLocaleString()}
              onChange={(e) => {
                const value = e.target.value.replace(/,/g, '');
                const numValue = parseInt(value) || 0;
                setTradingAmount(numValue);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold pr-8"
              min="0"
              step="10000"
            />
            <span className="absolute inset-y-0 right-2 flex items-center text-gray-500 font-medium">원</span>
          </div>
          
          {/* 금액 증가 버튼 */}
          <button
            onClick={() => setTradingAmount(prev => prev + 10000)}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            +
          </button>
        </div>
        
        {/* 금액입력: 10만원, 50만원, 100만원, 500만원, 1000만원 빠른 선택 */}
        {/* 금액 단위 버튼들 */}
        <div className="mt-3">
          <div className="text-sm font-medium text-gray-700 mb-2">빠른 금액 선택</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[100000, 500000, 1000000, 5000000, 10000000, 0].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  console.log('빠른 금액 버튼 클릭됨:', amount);
                  if (amount === 0) {
                    console.log('초기화 버튼 클릭');
                    setTradingAmount(0);
                  } else {
                    console.log('addAmount 함수 호출:', amount);
                    addAmount(amount);
                  }
                }}
                className={`py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  amount === 0
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {amount === 0 ? '초기화' : `${amount.toLocaleString()}원`}
              </button>
            ))}
          </div>
        </div>
        
        {/* 선택된 지갑 보유량 표시 */}
        {selectedWalletForTrading && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-800 font-medium mb-2">
              선택된 지갑: {selectedWalletForTrading}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <span className="text-blue-600 block">금 보유량</span>
                <span className="text-yellow-600 font-semibold">
                  {(() => {
                    const selectedWallet = wallets?.find(wallet => 
                      wallet.name === selectedWalletForTrading || 
                      wallet.gwWalletName === selectedWalletForTrading
                    );
                    return selectedWallet ? Number(selectedWallet.goldBalance || 0).toFixed(3) : '0.000';
                  })()}g
                </span>
              </div>
              <div className="text-center">
                <span className="text-blue-600 block">은 보유량</span>
                <span className="text-gray-600 font-semibold">
                  {(() => {
                    const selectedWallet = wallets?.find(wallet => 
                      wallet.name === selectedWalletForTrading || 
                      wallet.gwWalletName === selectedWalletForTrading
                    );
                    return selectedWallet ? Number(selectedWallet.silverBalance || 0).toFixed(3) : '0.000';
                  })()}g
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 수량선택: 3.75g, 18.75g, 37.5g, 50g, 100g, 1000g 빠른 선택 */}
      {/* 빠른 수량 선택 */}
      {/* 거래 수량 입력 (g) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">거래 수량</label>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              const nextQ = Math.max(0, Number(quantityInput || 0) - 1);
              setQuantityInput(nextQ);
              const nextAmount = calculateAmountFromQuantity(nextQ, selectedProduct);
              setTradingAmount(Math.round(nextAmount));
            }}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            -
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              value={Math.round(Number(quantityInput || 0) * 1000) / 1000}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d.]/g, '');
                const val = parseFloat(raw);
                const safe = Number.isFinite(val) ? Math.max(0, val) : 0;
                setQuantityInput(safe);
                const amount = calculateAmountFromQuantity(safe, selectedProduct);
                setTradingAmount(Math.round(amount));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-semibold pr-8"
              inputMode="decimal"
            />
            <span className="absolute inset-y-0 right-2 flex items-center text-gray-500 font-medium">g</span>
          </div>
          <button
            onClick={() => {
              const nextQ = Number(quantityInput || 0) + 1;
              setQuantityInput(nextQ);
              const nextAmount = calculateAmountFromQuantity(nextQ, selectedProduct);
              setTradingAmount(Math.round(nextAmount));
            }}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">빠른 수량 선택</label>
        <div className="text-xs text-gray-500 mb-2">
          {perUnitPriceLabel}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[3.75, 18.75, 37.5, 50, 100, 1000].map((quantity) => (
            <button
              key={quantity}
              onClick={() => {
                const addAmount = calculateAmountFromQuantity(quantity, selectedProduct);
                setTradingAmount(prev => Math.round(prev + addAmount));
              }}
              className="py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              +{quantity}g
            </button>
          ))}
        </div>
      </div>

      {/* 보유량 정보 표시 */}
      <div className="mb-6 bg-yellow-50 rounded-lg p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
          <div>
            <span className="text-xs sm:text-sm text-gray-600">현재 보유량</span>
            <p className="text-lg sm:text-xl font-bold text-yellow-600">
              {Math.round(getCurrentHoldings() * 1000) / 1000}g
            </p>
            {/* 선택된 지갑 정보 표시 */}
            {selectedWalletForTrading && (
              <p className="text-xs text-blue-600 mt-1">
                지갑: {selectedWalletForTrading}
              </p>
            )}
          </div>
          <div>
            <span className="text-xs sm:text-sm text-gray-600">
              {tradingSide === 'buy' ? '매수 후 보유량' : '매도 후 잔여량'}
            </span>
            <p className="text-lg sm:text-xl font-bold text-yellow-600">
              {tradingSide === 'buy' 
                ? Math.round((getCurrentHoldings() + getCalculatedQuantity()) * 1000) / 1000
                : Math.round(getRemainingHoldings() * 1000) / 1000
              }g
            </p>
          </div>
          <div>
            <span className="text-xs sm:text-sm text-gray-600">전량 매도 금액</span>
            <p className="text-base sm:text-lg font-bold text-red-600">
              ₩{Math.floor(calculateFullSellAmount()).toLocaleString()}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {selectedProduct === 'gold' ? '금' : '은'} 보유량 기준
          {selectedWalletForTrading ? ` (${selectedWalletForTrading} 지갑)` : ' (전체)'}
        </p>
        
        {/* 전량 매도 버튼 또는 보유량 없음 안내 */}
        {tradingSide === 'sell' && (
          <div className="mt-3 text-center">
            {getCurrentHoldings() > 0 ? (
              <button
                onClick={handleFullSell}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
              >
                전량 매도 ({getCurrentHoldings().toFixed(3)}g)
              </button>
            ) : (
              <div className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg font-semibold">
                보유량 없음 - 매수 후 매도 가능
              </div>
            )}
          </div>
        )}
      </div>

      {/* 계산된 정보 표시 */}
      <div className="mb-6 bg-blue-50 rounded-lg p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-center">
          <div>
            <span className="text-xs sm:text-sm text-gray-600">거래 금액</span>
            <p className="text-lg sm:text-xl font-bold text-blue-600">
              ₩{tradingAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-xs sm:text-sm text-gray-600">예상 수량</span>
            <p className="text-lg sm:text-xl font-bold text-blue-600">
              {Math.round(getCalculatedQuantity() * 1000) / 1000}g
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {selectedProduct === 'gold' ? '금' : '은'} 기준 계산 (프리미엄 포함)
        </p>
      </div>

      {/* 거래 정보 표시 - 3x3 그리드로 균등 배치 */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-6">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {/* 첫 번째 행 */}
          <div>
            <span className="text-xs sm:text-sm text-gray-600">현재가</span>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              ₩{(() => {
                const currentPrice = selectedProduct === 'gold' ? goldPrice : silverPrice;
                const basePrice = currentPrice?.basePrice || currentPrice || 0;
                return Math.round(basePrice).toLocaleString();
              })()}
            </p>
          </div>
          <div>
            <span className="text-xs sm:text-sm text-gray-600">
              {tradingSide === 'buy' ? '거래 금액' : '예상 매도가'}
            </span>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              ₩{tradingSide === 'buy' ? Math.round(calculateActualTotalPrice()).toLocaleString() : Math.round(calculateSellPrice()).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-xs sm:text-sm text-gray-600">세금 (VAT 10%)</span>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              ₩{tradingSide === 'buy' ? Math.round(calculateTax()).toLocaleString() : Math.round(calculateSellPrice() * 0.1).toLocaleString()}
            </p>
          </div>
          
          {/* 두 번째 행 */}
          <div>
            <span className="text-xs sm:text-sm text-gray-600">예상 수량</span>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              {Math.round(getCalculatedQuantity() * 1000) / 1000}g
            </p>
          </div>
          <div>
            <span className="text-xs sm:text-sm text-gray-600">
              수수료 ({getFeeRateText(getCalculatedQuantity())})
            </span>
            <p className="text-base sm:text-lg font-semibold text-gray-800">
              ₩{tradingSide === 'buy' ? Math.round(calculateFee()).toLocaleString() : (() => {
                const sellPrice = calculateSellPrice();
                const quantity = getCalculatedQuantity();
                if (quantity <= 0) return 0;
                const feeRate = calculateFeeRate(quantity);
                return Math.round(sellPrice * feeRate).toLocaleString();
              })()}
            </p>
          </div>
          <div>
            <span className="text-xs sm:text-sm text-gray-600">총 {tradingSide === 'buy' ? '결제' : '수취'} 금액</span>
            <p className="text-base sm:text-lg font-bold text-blue-600">
              ₩{tradingSide === 'buy' ? Math.round(calculateTotal()).toLocaleString() : Math.round(calculateSellTotal()).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 주문 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={loading || (tradingSide === 'sell' && getCalculatedQuantity() > getCurrentHoldings())}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
          tradingSide === 'buy'
            ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
            : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300'
        }`}
      >
        {loading ? '처리중...' : 
         (tradingSide === 'sell' && getCalculatedQuantity() > getCurrentHoldings()) 
           ? '보유량 부족' 
           : `${tradingSide === 'buy' ? '매수' : '매도'} 주문`}
      </button>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg ${
          message.includes('성공') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
};

// 성능 최적화: React.memo로 컴포넌트 메모이제이션
export default React.memo(TradingPanel);