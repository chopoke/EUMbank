import React, { useMemo, useState, useEffect, useRef } from 'react';

/**
 * 잔고 카드 컴포넌트
 * - 잔고 조회: 입출금 계좌, 현물계좌, 금/은 보유량 표시
 * - 계좌 간 이체: 계좌 ↔ 현물계좌 이체 기능
 * - 입출금 계좌 선택: 여러 입출금 계좌 중 선택 가능
 * - 성능 최적화: useMemo로 잔고 계산 최적화
 */
const BalanceCard = ({ 
  customerBalance, 
  fetchCustomerBalance,
  onTransferToTrading, 
  onTransferFromTrading,
  wallets = [],
  onRefreshAllBalances,
  depositAccounts = [],
  customerNo,
  onAccountChange
}) => {
  // localStorage에서 선택된 계좌 번호 불러오기
  const getStoredAccountNo = () => {
    if (customerNo) {
      const stored = localStorage.getItem(`spot_selected_account_${customerNo}`);
      return stored ? parseInt(stored, 10) : null;
    }
    return null;
  };

  const [selectedAccountNo, setSelectedAccountNo] = useState(getStoredAccountNo());
  const [showSelector, setShowSelector] = useState(false);
  const selectorRef = useRef(null);
  const selectorButtonRef = useRef(null);

  useEffect(() => {
    if (showSelector && depositAccounts.length === 0) {
      setShowSelector(false);
    }
  }, [showSelector, depositAccounts.length]);

  useEffect(() => {
    if (!showSelector) return;

    const handleClickOutside = (event) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target) &&
        selectorButtonRef.current &&
        !selectorButtonRef.current.contains(event.target)
      ) {
        setShowSelector(false);
      }
    };

    // 약간의 지연을 두어 버튼 클릭 이벤트가 먼저 처리되도록 함
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSelector]);

  // 계좌 목록이 변경되면 저장된 선택 값만 복원
  useEffect(() => {
    if (depositAccounts.length === 0) {
      if (selectedAccountNo !== null) {
        setSelectedAccountNo(null);
      }
      if (customerNo) {
        localStorage.removeItem(`spot_selected_account_${customerNo}`);
      }
      return;
    }

    const storedAccountNo = getStoredAccountNo();
    const hasStored = storedAccountNo && depositAccounts.some(acc => acc.aNo === storedAccountNo);

    if (hasStored && storedAccountNo !== selectedAccountNo) {
      setSelectedAccountNo(storedAccountNo);
    } else if (!hasStored && selectedAccountNo !== null) {
      setSelectedAccountNo(null);
      if (customerNo) {
        localStorage.removeItem(`spot_selected_account_${customerNo}`);
      }
    }
  }, [depositAccounts, selectedAccountNo, customerNo]);

  // 계좌 선택 변경 핸들러
  const handleAccountChange = (accountNo) => {
    const parsedAccountNo = typeof accountNo === 'number'
      ? accountNo
      : parseInt(accountNo, 10);

    if (Number.isNaN(parsedAccountNo)) {
      return;
    }

    setSelectedAccountNo(parsedAccountNo);
    
    // localStorage에 저장
    if (customerNo) {
      localStorage.setItem(`spot_selected_account_${customerNo}`, parsedAccountNo.toString());
    }
    
    // 부모 컴포넌트에 변경 알림
    if (onAccountChange) {
      onAccountChange(parsedAccountNo);
    }

    setShowSelector(false);
  };

  // 현물통장 잔고는 실제 현물통장들의 총합을 표시 (DB 데이터 기반)
  const walletDisplayBalance = useMemo(() => {
    return wallets.reduce((total, wallet) => {
      const balance = Number(wallet.balance) || 0;
      return total + balance;
    }, 0);
  }, [wallets]);

  // 선택된 계좌 정보
  const selectedAccount = useMemo(() => {
    return depositAccounts.find(acc => acc.aNo === selectedAccountNo);
  }, [depositAccounts, selectedAccountNo]);

  const hasDepositAccounts = depositAccounts.length > 0;

  return (
    <div className="relative bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">잔고 현황</h2>
        <div className="flex items-center gap-2 relative">
          <button
            type="button"
            ref={selectorButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowSelector((prev) => !prev);
            }}
            className="px-3 py-1.5 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          >
            입출금계좌 선택
          </button>

          {/* 입출금 계좌 선택 팝오버 */}
          {showSelector && (
            <div
              ref={selectorRef}
              className="absolute z-50 top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg w-72 max-w-full"
            >
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">입출금 계좌 선택</span>
                <button
                  type="button"
                  onClick={() => setShowSelector(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="계좌 선택 창 닫기"
                >
                  ×
                </button>
              </div>
              {hasDepositAccounts ? (
                <>
                  <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {depositAccounts.map((account) => {
                      const isActive = selectedAccountNo === account.aNo;
                      return (
                        <li key={account.aNo}>
                          <button
                            type="button"
                            onClick={() => handleAccountChange(account.aNo)}
                            className={`w-full text-left px-4 py-3 transition ${
                              isActive ? 'bg-blue-50 text-blue-600 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{account.nickname || account.accountNo}</span>
                              {isActive && <span className="text-xs font-medium">선택됨</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              잔액 ₩{Math.round(account.balance || 0).toLocaleString()}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="px-4 py-3 border-t border-gray-200 text-right">
                    <button
                      type="button"
                      onClick={() => setShowSelector(false)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none"
                    >
                      닫기
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4 py-6 text-center text-gray-500">
                  등록된 입출금 통장이 없습니다.
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowSelector(false)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
            {selectedAccount ? (selectedAccount.nickname || selectedAccount.accountNo) : '입출금 통장'}
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