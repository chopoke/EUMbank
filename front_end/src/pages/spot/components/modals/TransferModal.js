import React, { useState, useEffect } from 'react';

/**
 * 이체 모달 컴포넌트
 * 계좌와 현물거래 통장 간의 이체를 처리하는 모달
 */
const TransferModal = ({ 
  isOpen, 
  onClose, 
  transferType, 
  customerBalance, 
  transferToTradingAccount, 
  transferFromTradingAccount,
  wallets = [], // 지갑 데이터를 props로 받음
  onRefreshBalances
}) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  
  const totalWalletBalance = wallets.reduce((sum, wallet) => sum + (Number(wallet.balance) || 0), 0);
  
  // 디버깅을 위한 로그
const debug = () => {};

debug('wallets', wallets);
debug('totalWalletBalance', totalWalletBalance);

  // 지갑 목록 (props로 받은 데이터만 사용) - 모든 지갑 포함
  const availableWallets = wallets.filter(w => w && w.name);

  // 금액 버튼 클릭 핸들러
  const handleAmountClick = (amountValue) => {
    const currentAmount = parseInt(amount.replace(/,/g, '')) || 0;
    const newAmount = currentAmount + amountValue;
    setAmount(newAmount.toLocaleString());
  };

  // 모달이 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setMessage('');
      setIsBalanceLoading(false);
      // 기본값 선택: 잔고가 있는 지갑을 우선 선택, 없으면 첫 번째 지갑 선택
      const walletWithBalance = availableWallets.find(w => (Number(w.balance) || 0) > 0);
      const firstWallet = availableWallets[0]?.name || '';
      setSelectedWallet(walletWithBalance?.name || firstWallet);
      setShowWalletSelector(false);
    }
  }, [isOpen]);

  // 모달이 열려있을 때 주기적으로 지갑 데이터 새로고침 (로딩 상태 관리, 스크롤 위치 유지)
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(async () => {
        // 잔고 새로고침 시 로딩 상태 표시
        if (onRefreshBalances) {
          // 스크롤 위치 저장
          const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
          
          setIsBalanceLoading(true);
          try {
            await onRefreshBalances();
            
            // 스크롤 위치 복원 (더 안정적인 방법)
            setTimeout(() => {
              window.scrollTo({
                top: scrollPosition,
                behavior: 'instant'
              });
            }, 100);
          } catch (error) {
            console.error('잔고 새로고침 실패:', error);
            
            // 에러가 발생해도 스크롤 위치는 복원
            requestAnimationFrame(() => {
              window.scrollTo(0, scrollPosition);
            });
          } finally {
            // 로딩 상태를 잠시 유지하여 깜빡임 방지
            setTimeout(() => {
              setIsBalanceLoading(false);
            }, 500);
          }
        }
        
        // 지갑 데이터가 변경되었을 수 있으므로 다시 계산
        const walletWithBalance = availableWallets.find(w => (Number(w.balance) || 0) > 0);
        const firstWallet = availableWallets[0]?.name || '';
        const newSelectedWallet = walletWithBalance?.name || firstWallet;
        
        // 현재 선택된 지갑이 없거나 잔고가 변경된 경우 업데이트
        if (!selectedWallet || (selectedWallet !== newSelectedWallet && walletWithBalance)) {
          setSelectedWallet(newSelectedWallet);
        }
      }, 10000); // 10초마다 체크 (빈도 줄임)
      
      return () => clearInterval(interval);
    }
  }, [isOpen, availableWallets, selectedWallet, onRefreshBalances]);

  // 이체 처리 함수
  const handleTransfer = async () => {
    debug('transfer start', { transferType, amount, selectedWallet });

    const amountValue = Math.floor(Number((amount || '').toString().replace(/,/g, '')));
    debug('normalized amount', amountValue);
    
    if (!amountValue || amountValue <= 0) {
      debug('amount validation failed');
      setMessage('올바른 금액을 입력해주세요.');
      return;
    }

    debug('amount validation passed');
    setLoading(true);
    setMessage('');

    try {
      if (transferType === 'toTrading') {
        debug('transfer to trading start');
        await transferToTradingAccount(amountValue, selectedWallet);
        debug('transfer to trading finished');
        setMessage(`${selectedWallet}으로 이체가 완료되었습니다.`);
      } else {
        debug('transfer from trading start');
        await transferFromTradingAccount(amountValue, selectedWallet);
        debug('transfer from trading finished');
        setMessage('계좌로 이체가 완료되었습니다.');
      }

      debug('transfer completed');

      // 이체 성공 후 로컬 지갑 금액 동기화 및 상세 메시지 생성
      try {
        const userStr = localStorage.getItem('user') || localStorage.getItem('loginUser') || localStorage.getItem('customer');
        const u = userStr ? JSON.parse(userStr) : {};
        const cno = u?.customerNo || u?.c_no || u?.customer_no || u?.cNo;
        let detailMsg = '';
        if (cno) {
          const key = `userWallets_${cno}`;
          const arr = JSON.parse(localStorage.getItem(key) || '[]');
          const idx = arr.findIndex(w => w && w.name === selectedWallet);
          if (idx >= 0) {
            const before = Number(arr[idx].balance || 0);
            if (transferType === 'toTrading') {
              arr[idx].balance = before + amountValue;
              detailMsg = `${selectedWallet}에 ₩${amountValue.toLocaleString()} 입금 완료 · 잔액 ₩${arr[idx].balance.toLocaleString()}`;
            } else {
              arr[idx].balance = Math.max(0, before - amountValue);
              detailMsg = `${selectedWallet}에서 ₩${amountValue.toLocaleString()} 출금 완료 · 잔액 ₩${arr[idx].balance.toLocaleString()}`;
            }
            localStorage.setItem(key, JSON.stringify(arr));
            window.dispatchEvent(new StorageEvent('storage', { key }));
          }
        }

        if (!detailMsg) {
          detailMsg = transferType === 'toTrading'
            ? `${selectedWallet}으로 ₩${amountValue.toLocaleString()} 이체가 완료되었습니다.`
            : `${selectedWallet}에서 ₩${amountValue.toLocaleString()} 이체가 완료되었습니다.`;
        }
        setMessage(detailMsg);
      } catch {
        setMessage(transferType === 'toTrading'
          ? `${selectedWallet}으로 ₩${amountValue.toLocaleString()} 이체가 완료되었습니다.`
          : `${selectedWallet}에서 ₩${amountValue.toLocaleString()} 이체가 완료되었습니다.`);
      }

      // 이체 성공 후 즉시 잔고 새로고침 (로딩 상태 관리, 스크롤 위치 유지)
      debug('refresh balances (immediate) start');
      if (onRefreshBalances) {
        // 스크롤 위치 저장
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        setIsBalanceLoading(true);
        try {
          await onRefreshBalances();
          debug('refresh balances (immediate) done');
          
          // 스크롤 위치 복원 (더 안정적인 방법)
          setTimeout(() => {
            window.scrollTo({
              top: scrollPosition,
              behavior: 'instant'
            });
          }, 100);
        } finally {
          setTimeout(() => {
            setIsBalanceLoading(false);
          }, 1000);
        }
      }

      // 추가 안전장치: 잠시 후 다시 한 번 새로고침
      setTimeout(async () => {
        debug('refresh balances (delayed) start');
        if (onRefreshBalances) {
          // 스크롤 위치 저장
          const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
          
          setIsBalanceLoading(true);
          try {
            await onRefreshBalances();
            
            // 스크롤 위치 복원 (더 안정적인 방법)
            setTimeout(() => {
              window.scrollTo({
                top: scrollPosition,
                behavior: 'instant'
              });
            }, 100);
          } finally {
            setTimeout(() => {
              setIsBalanceLoading(false);
            }, 500);
          }
        }
        debug('refresh balances (delayed) done');
      }, 2000);

      // 성공 후 잠시 대기 후 모달 닫기 (잔고 업데이트를 위해 더 긴 대기)
      setTimeout(() => {
        debug('modal close triggered');
        onClose();
      }, 3000);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || '이체 처리 중 오류가 발생했습니다.';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isToTrading = transferType === 'toTrading';
  const backendAccount = Math.floor(Number(customerBalance?.account || 0));
  const selectedWalletBalance = Math.floor(Number(availableWallets.find(w => w.name === selectedWallet)?.balance || 0));
  const maxAmount = Math.floor(Number(isToTrading ? backendAccount : selectedWalletBalance));
  const title = isToTrading ? '계좌 → 현물계좌' : '현물계좌 → 계좌';
  const sourceLabel = isToTrading ? '계좌' : '현물계좌';
  const targetLabel = isToTrading ? '현물계좌' : '계좌';

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* 잔고 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">현재 잔고</div>
              {isBalanceLoading && (
                <div className="flex items-center text-xs text-gray-500">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
                  업데이트 중...
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">계좌</div>
                <div className={`text-lg font-semibold text-blue-600 transition-opacity duration-300 ${
                  isBalanceLoading ? 'opacity-70' : 'opacity-100'
                }`}>
                  ₩{customerBalance?.account?.toLocaleString() || '0'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">현물계좌</div>
                <div className={`text-lg font-semibold text-green-600 transition-opacity duration-300 ${
                  isBalanceLoading ? 'opacity-70' : 'opacity-100'
                }`}>
                  ₩{totalWalletBalance.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  {wallets.length}개 현물계좌
                </div>
              </div>
            </div>
          </div>

          {/* 지갑 선택 (지갑 → 계좌일 때도 표시) - 지갑이 있을 때만 표시 */}
          {!isToTrading && availableWallets.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  출금 현물계좌
                </label>
                <button
                  onClick={() => setShowWalletSelector(!showWalletSelector)}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                >
                  변경
                </button>
              </div>
              
              {/* 현재 선택된 지갑 */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800">{selectedWallet}</div>
                <div className="text-xs text-blue-600">
                  ₩{(availableWallets.find(w => w.name === selectedWallet)?.balance || 0).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  선택된 계좌 잔고
                </div>
              </div>

              {/* 지갑 선택 드롭다운 */}
              {showWalletSelector && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="space-y-2">
                    {availableWallets.map(wallet => (
                      <button
                        key={wallet.id}
                        onClick={() => {
                          setSelectedWallet(wallet.name);
                          setShowWalletSelector(false);
                        }}
                        className={`w-full p-2 rounded text-left transition-colors ${
                          selectedWallet === wallet.name
                            ? 'bg-purple-100 border border-purple-300'
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-800">{wallet.name}</div>
                        <div className="text-xs text-gray-600">₩{(wallet.balance || 0).toLocaleString()}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 지갑 선택 (계좌 → 지갑일 때) */}
          {isToTrading && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  대상 지갑
                </label>
                <button
                  onClick={() => setShowWalletSelector(!showWalletSelector)}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600 transition-colors"
                >
                  변경
                </button>
              </div>
              
              {/* 현재 선택된 지갑 */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800">{selectedWallet}</div>
                <div className="text-xs text-blue-600">
                  ₩{(availableWallets.find(w => w.name === selectedWallet)?.balance || 0).toLocaleString()}
                </div>
              </div>

              {/* 지갑 선택 드롭다운 */}
              {showWalletSelector && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="space-y-2">
                    {availableWallets.length > 0 ? (
                      availableWallets.map(wallet => (
                        <button
                          key={wallet.id}
                          onClick={() => {
                            setSelectedWallet(wallet.name);
                            setShowWalletSelector(false);
                          }}
                          className={`w-full p-3 rounded text-left transition-colors ${
                            selectedWallet === wallet.name
                              ? 'bg-purple-100 border border-purple-300'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-800">{wallet.name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            금: {(wallet.goldBalance || 0).toFixed(4)}g | 은: {(wallet.silverBalance || 0).toFixed(4)}g
                          </div>
                          <div className="text-xs text-gray-600 mt-1">₩{(wallet.balance || 0).toLocaleString()}</div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">생성된 지갑이 없습니다.</p>
                        <p className="text-xs mt-1">현물계좌 관리에서 계좌를  먼저 개설해주세요.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 지갑이 없을 때 안내 메시지 */}
          {availableWallets.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-center text-yellow-800">
                <p className="text-sm font-medium mb-2">지갑이 없습니다</p>
                <p className="text-xs">현물계좌 관리에서 계좌를  먼저 개설해주세요.</p>
              </div>
            </div>
          )}

          {/* 이체 금액 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이체 금액
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  const n = Math.floor(Number(value || 0));
                  setAmount(n ? n.toLocaleString() : '');
                }}
                placeholder="이체할 금액을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-3 top-3 text-gray-500">
                원
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              최대 이체 가능 금액: ₩{maxAmount?.toLocaleString() || '0'}
            </div>
          </div>

          {/* 금액 버튼들 */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-3">빠른 금액 선택</div>
            <div className="grid grid-cols-3 gap-2">
              {[10000, 50000, 100000, 500000, 1000000, 0].map(amountValue => (
                <button
                  key={amountValue}
                  onClick={() => amountValue === 0 ? setAmount('') : handleAmountClick(amountValue)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    amountValue === 0
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {amountValue === 0 ? '초기화' : `+${amountValue.toLocaleString()}원`}
                </button>
              ))}
              <button
                onClick={() => setAmount((Number(maxAmount)||0).toLocaleString())}
                className="py-2 px-3 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 col-span-3"
              >
                전액
              </button>
            </div>
          </div>

          {/* 이체 정보 요약 */}
          {amount && parseInt(amount.replace(/,/g, '')) > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="text-sm font-medium text-blue-800 mb-2">이체 정보</div>
              <div className="text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>출금 계좌:</span>
                  <span>{isToTrading ? '계좌' : selectedWallet}</span>
                </div>
                <div className="flex justify-between">
                  <span>입금 계좌:</span>
                  <span>{isToTrading ? selectedWallet : '계좌'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>이체 금액:</span>
                  <span>₩{parseInt(amount.replace(/,/g, '')).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* 메시지 표시 */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('완료') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleTransfer}
              disabled={loading || !amount || Math.floor(Number(amount.replace(/,/g, ''))) <= 0 || Math.floor(Number(amount.replace(/,/g, ''))) > maxAmount || !selectedWallet}
              className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            >
              {loading ? '처리중...' : '이체하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
