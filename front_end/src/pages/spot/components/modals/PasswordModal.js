import React, { useState, useRef, useEffect } from 'react';

/**
 * 비밀번호 입력 모달 컴포넌트
 * 거래 실행 전 6자리 비밀번호를 입력받는 모달
 */
const PasswordModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  tradingSide, 
  selectedProduct, 
  quantity, 
  tradingAmount,
  wallets = [],
  selectedWalletForTrading = null
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const [selectedWallet, setSelectedWallet] = useState('');
  
  // 모달이 열릴 때 월렛 데이터 확인 및 기본 선택
  useEffect(() => {
    if (isOpen) {
      console.log('PasswordModal - 모달 열림, 월렛 데이터 확인');
      console.log('PasswordModal - selectedWalletForTrading:', selectedWalletForTrading);

      if (selectedWalletForTrading && wallets && wallets.length > 0) {
        // TradingPanel에서 선택한 월렛이 있으면 해당 월렛을 우선 선택
        const preSelectedWallet = wallets.find(w => 
          w.name === selectedWalletForTrading || 
          w.gwWalletName === selectedWalletForTrading
        );
        
        if (preSelectedWallet) {
          console.log('PasswordModal - 미리 선택된 월렛 사용:', preSelectedWallet.name);
          setSelectedWallet(preSelectedWallet.name || '');
          return;
        }
      }
      
      if (wallets && wallets.length > 0) {
        // 첫 번째 월렛을 기본 선택
        const firstWallet = wallets[0];
        console.log('PasswordModal - 첫 번째 월렛 선택:', firstWallet?.name);
        setSelectedWallet(firstWallet?.name || '');
      } else {
        console.log('PasswordModal - 월렛이 없음');
        setSelectedWallet('');
      }
    }
  }, [isOpen, wallets, selectedWalletForTrading]);
  
  const isWalletCompatible = (walletName, product) => {
    if (!walletName) return true;
    const name = (walletName || '').toLowerCase();
    if (name.includes('은')) return product === 'silver';
    if (name.includes('silver')) return product === 'silver';
    if (name.includes('금')) return product === 'gold';
    if (name.includes('gold')) return product === 'gold';
    return true; // 일반 지갑은 모두 허용
  };

  // 모달이 열릴 때 포커스 및 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      
      // TradingPanel에서 선택한 월렛이 있으면 우선 사용
      if (selectedWalletForTrading && wallets && wallets.length > 0) {
        const preSelectedWallet = wallets.find(w => 
          w.name === selectedWalletForTrading || 
          w.gwWalletName === selectedWalletForTrading
        );
        if (preSelectedWallet) {
          setSelectedWallet(preSelectedWallet.name || '');
        } else {
          // 선택된 월렛을 찾을 수 없으면 첫 번째 월렛 사용
          const firstWallet = wallets && wallets.length > 0 ? wallets[0].name : '';
          setSelectedWallet(firstWallet);
        }
      } else {
        // 기본 선택 월렛(있다면 첫 번째)
        const firstWallet = wallets && wallets.length > 0 ? wallets[0].name : '';
        setSelectedWallet(firstWallet);
      }
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, selectedWalletForTrading, wallets]);

  // 비밀번호 입력 처리
  const handlePasswordChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
    if (value.length <= 6) {
      setPassword(value);
      setError('');
    }
  };

  // 고객번호 추출 유틸 (다양한 저장 포맷 대응)
  const resolveCustomerNo = () => {
    try {
      const storedUser = localStorage.getItem('user') || localStorage.getItem('loginUser') || localStorage.getItem('customer');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        return (
          u?.customerNo || u?.c_no || u?.customer_no || u?.cNo || u?.id || null
        );
      }
    } catch {}
    // 개별 키로 저장된 경우
    const direct = localStorage.getItem('customerNo') || localStorage.getItem('c_no') || localStorage.getItem('cNo');
    if (direct) return direct;
    return null;
  };


  const resolveWalletPin = (walletName) => {
    console.log('=== 월렛 PIN 조회 시작 ===');
    console.log('월렛 이름:', walletName);
    console.log('월렛 목록:', wallets);
    console.log('월렛 개수:', wallets?.length);
    
    if (!walletName || !wallets || wallets.length === 0) {
      console.log('월렛 이름이나 월렛 목록이 없음');
      return '';
    }
    
    const w = wallets.find(x => x.name === walletName);
    console.log('찾은 월렛:', w);
    
    const pin = w?.pin ? String(w.pin) : '';
    console.log('원본 PIN:', pin);
    
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    console.log('정리된 PIN:', cleanPin);
    console.log('=== 월렛 PIN 조회 완료 ===');
    
    return cleanPin;
  };

  const handleConfirm = async () => {
    console.log('=== 비밀번호 확인 시작 ===');
    console.log('입력된 비밀번호:', password);
    console.log('선택된 월렛:', selectedWallet);
    console.log('선택된 상품:', selectedProduct);
    
    if (password.replace(/\D/g, '').length !== 6) {
      console.log('비밀번호 길이 부족:', password.replace(/\D/g, '').length);
      setError('6자리 비밀번호를 입력해주세요.');
      return;
    }

    if (!isWalletCompatible(selectedWallet, selectedProduct)) {
      console.log('월렛 호환성 검사 실패');
      setError(selectedProduct === 'silver' ? '은 전용 지갑에서만 은 거래가 가능합니다.' : '금 전용 지갑에서만 금 거래가 가능합니다.');
      return;
    }

    console.log('월렛 호환성 검사 통과');
    setLoading(true);
    setError('');

    try {
      const entered = (password || '').toString().replace(/\D/g, '').slice(0, 6);
      console.log('정리된 입력 비밀번호:', entered);

      // 월렛 PIN 검증
      const walletPin = resolveWalletPin(selectedWallet);
      console.log('선택된 월렛:', selectedWallet);
      console.log('월렛 PIN:', walletPin);
      console.log('입력한 PIN:', entered);
      
      if (!walletPin || walletPin.length !== 6) {
        setError('선택한 월렛에 등록된 PIN이 없습니다. 월렛지갑 관리에서 PIN을 설정해주세요.');
        return;
      }

      if (entered === walletPin) {
        await onSubmit(selectedWallet, entered);
        onClose();
      } else {
        setError('비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      setError('비밀번호 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 엔터키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && password.length === 6) {
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  const metalLabel = selectedProduct === 'gold' ? '금(AU)' : '은(AG)';
  const qtyLabel = `${quantity.toFixed(3)}g`;
  const sideLabel = tradingSide === 'buy' ? '매수' : '매도';

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">거래 비밀번호 입력</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* 월렛 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">사용할 월렛 선택</label>
            {(() => {
              console.log('PasswordModal - 월렛 선택 렌더링');
              console.log('PasswordModal - wallets:', wallets);
              console.log('PasswordModal - wallets 타입:', typeof wallets);
              console.log('PasswordModal - wallets 길이:', wallets?.length);
              console.log('PasswordModal - wallets 상세:', wallets?.map(w => ({ name: w?.name, balance: w?.balance })));
              
              if (wallets && wallets.length > 0) {
                return (
                  <div className="grid grid-cols-1 gap-2">
                    {wallets.map(w => {
                      console.log('PasswordModal - 월렛 렌더링:', w);
                      return (
                        <label key={w.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${selectedWallet === w.name ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <div className="flex items-center gap-2">
                            <input type="radio" name="wallet" checked={selectedWallet === w.name} onChange={() => setSelectedWallet(w.name)} />
                            <div>
                              <span className="text-sm font-medium text-gray-800">{w.name}</span>
                              <div className="text-xs text-gray-500 mt-1">
                                금: {(w.goldBalance || 0).toFixed(2)}g | 은: {(w.silverBalance || 0).toFixed(2)}g
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">₩{(w.balance || 0).toLocaleString()}</div>
                        </label>
                      );
                    })}
                  </div>
                );
              } else {
                console.log('PasswordModal - 월렛이 없음, 메시지 표시');
                return (
                  <div className="text-center py-6">
                    <div className="text-lg font-medium text-gray-700 mb-2">월렛이 없습니다</div>
                    <div className="text-sm text-gray-500 mb-4">
                      거래를 위해서는 먼저 월렛을 개설해주세요.
                    </div>
                    <div className="text-xs text-gray-400">
                      통장 관리 페이지에서 월렛을 생성할 수 있습니다.
                    </div>
                  </div>
                );
              }
            })()}
          </div>
          {/* 거래 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm font-medium text-gray-700 mb-2">거래 정보</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>거래 유형:</span>
                <span className={`font-semibold ${
                  tradingSide === 'buy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {sideLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span>상품:</span>
                <span className="font-semibold">{metalLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>수량:</span>
                <span className="font-semibold">{qtyLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>거래 금액:</span>
                <span className="font-semibold">₩{tradingAmount?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              6자리 비밀번호
            </label>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={handlePasswordChange}
              onKeyPress={handleKeyPress}
              placeholder="비밀번호 6자리를 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
              maxLength={6}
            />
            <div className="mt-2 text-sm text-gray-500">
              거래 실행을 위해 비밀번호를 입력해주세요.
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
              {error}
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
              onClick={handleConfirm}
              disabled={loading || password.length !== 6 || !wallets.length || (wallets.length > 0 && !selectedWallet)}
              className={`flex-1 py-3 px-4 rounded-lg transition-colors ${
                tradingSide === 'buy'
                  ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
                  : 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
              } text-white`}
            >
              {loading ? '확인중...' : `${sideLabel} 실행`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
