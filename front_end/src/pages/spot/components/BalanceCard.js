import React, { useMemo } from 'react';

/**
 * 잔고 카드 컴포넌트
 * - 잔고 조회: 입출금 계좌, 현물계좌, 금/은 보유량 표시
 * - 계좌 간 이체: 계좌 ↔ 현물계좌 이체 기능
 * - 성능 최적화: useMemo로 잔고 계산 최적화
 */
const BalanceCard = ({ 
  customerBalance, 
  fetchCustomerBalance,
  onTransferToTrading, 
  onTransferFromTrading,
  wallets = [],
  onRefreshAllBalances
}) => {
  // 현물통장 잔고는 실제 현물통장들의 총합을 표시 (DB 데이터 기반)
  const walletDisplayBalance = useMemo(() => {
    return wallets.reduce((total, wallet) => {
      const balance = Number(wallet.balance) || 0;
      return total + balance;
    }, 0);
  }, [wallets]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">잔고 현황</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 계좌 잔고 */}
        <div className="bg-blue-50 rounded-lg p-4 min-h-[120px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">입출금 계좌</h3>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 break-all">
              ₩{Math.round(customerBalance?.account || 0).toLocaleString()}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            입출금 통장
          </div>
        </div>

        {/* 현물거래 통장 잔고 */}
        <div className="bg-green-50 rounded-lg p-4 min-h-[120px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">현물계좌</h3>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 break-all">
              ₩{Math.round(walletDisplayBalance).toLocaleString()}
              {walletDisplayBalance === 0 && <span className="text-xs text-red-500 ml-1">(잔고 없음)</span>}
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            현물거래용
          </div>
        </div>

        {/* 금 보유량 */}
        <div className="bg-yellow-50 rounded-lg p-4 min-h-[120px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">금 보유량</h3>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600 break-all">
              {(Math.max(0, customerBalance?.gold || 0)).toFixed(2)}g
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            금(AU)
          </div>
        </div>

        {/* 은 보유량 */}
        <div className="bg-gray-50 rounded-lg p-4 min-h-[120px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">은 보유량</h3>
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            </div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600 break-all">
              {(Math.max(0, customerBalance?.silver || 0)).toFixed(2)}g
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            은(AG)
          </div>
        </div>
      </div>

      {/* 이체 버튼들 */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={onTransferFromTrading}
          className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          현물계좌 → 계좌
        </button>
        <button
          onClick={onTransferToTrading}
          className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          계좌 → 현물계좌
        </button>
      </div>
    </div>
  );
};

export default BalanceCard;