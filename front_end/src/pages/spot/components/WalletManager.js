import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWallets, createWallet, deleteWallet, updateWalletPin, recoverWalletPin } from '../api/spotApi';

/**
 * 월렛지갑 관리 컴포넌트
 * - 사용자별 여러 개의 현물계좌(월렛) 관리: 현물통장 개설/삭제, PIN 관리
 * - 현물통장 개설 모달: 현물통장 이름과 PIN 입력하여 개설
 * - 기술 스택: React (forwardRef, useImperativeHandle), Spring Boot + JPA + QueryDSL
 */
const WalletManager = forwardRef(({ isLoggedIn, customerBalance, onWalletsChange, onWalletSelect, onShowTradingHistory }, ref) => {
  const navigate = useNavigate();
  
  // === 상태 관리 ===
  const [wallets, setWallets] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletPin, setNewWalletPin] = useState('');
  const [newWalletPin2, setNewWalletPin2] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isDeletingWallet, setIsDeletingWallet] = useState(false);
  
  // PIN 변경 모달 상태
  const [showPinChangeModal, setShowPinChangeModal] = useState(false);
  const [selectedWalletForPinChange, setSelectedWalletForPinChange] = useState(null);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  // === 초기 데이터 로드 ===
  useEffect(() => {
    if (isLoggedIn) {
      loadWallets();
    } else {
      setWallets([]);
      setSelectedWallet(null);
    }
  }, [isLoggedIn]);

  // 컴포넌트 마운트 시 월렛 로드 (추가 안전장치)
  useEffect(() => {
    if (isLoggedIn && (!wallets || wallets.length === 0)) {
      setTimeout(() => {
        loadWallets();
      }, 1000);
      
      // 추가 재시도
      setTimeout(() => {
        if (!wallets || wallets.length === 0) {
          loadWallets();
        }
      }, 3000);
    }
  }, [isLoggedIn]);

  // 월렛 상태 변경 로깅
  useEffect(() => {
    if (onWalletsChange) {
      onWalletsChange(wallets);
    }
  }, [wallets, onWalletsChange]);

  // wallets가 업데이트될 때 선택된 지갑 정보도 동기화
  useEffect(() => {
    if (selectedWallet && wallets && wallets.length > 0) {
      // 업데이트된 wallets 배열에서 현재 선택된 월렛 찾기
      const updatedWallet = wallets.find(w => 
        w.id === selectedWallet.id || 
        w.name === selectedWallet.name ||
        (selectedWallet.gwWalletName && w.gwWalletName === selectedWallet.gwWalletName)
      );
      
      if (updatedWallet) {
        // 선택된 월렛 정보를 최신 데이터로 업데이트
        setSelectedWallet(updatedWallet);
      }
    }
  }, [wallets]);

  /**
   * 고객번호 추출
   */
  const getCustomerNo = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser?.customerNo || parsedUser?.c_no || parsedUser?.customer_no;
      } catch (e) {
        console.warn('사용자 정보 파싱 실패:', e);
      }
    }
    return null;
  };


  /**
   * 저장된 지갑 목록 로드 (DB에서 실시간 조회)
   */
  const loadWallets = async () => {
    const customerNo = getCustomerNo();
    console.log('현재 고객번호:', customerNo);
    
    if (!customerNo) {
      console.log('고객번호가 없어서 월렛을 빈 배열로 설정');
      setWallets([]);
      return;
    }

    try {
      // 새로운 API를 사용하여 월렛 데이터 조회
      console.log('월렛 조회 API 호출 시작: customerNo=', customerNo);
      const response = await fetchWallets(customerNo);
      console.log('API 응답 원본:', response);
      console.log('API 응답 타입:', typeof response);
      
      // 응답이 배열인지 확인하고 안전하게 처리
      let dbWallets = [];
      if (Array.isArray(response)) {
        dbWallets = response;
      } else if (response && typeof response === 'object') {
        // 응답이 객체인 경우 배열로 변환 시도
        if (response.data && Array.isArray(response.data)) {
          dbWallets = response.data;
        } else if (response.wallets && Array.isArray(response.wallets)) {
          dbWallets = response.wallets;
        } else {
          console.warn('예상치 못한 응답 형식:', response);
          dbWallets = [];
        }
      }
      
      console.log('처리된 월렛 데이터:', dbWallets);
      console.log('월렛 개수:', dbWallets.length);
      
      // DB에 월렛이 없으면 빈 배열로 설정하되, 기존 월렛 유지
      if (!dbWallets || dbWallets.length === 0) {
        console.log('DB에 월렛이 없음, 기존 월렛 유지');
        console.log('부모 컴포넌트에 빈 배열 전달하지 않음 (이체 후 월렛 사라짐 방지)');
        // setWallets([]); // 기존 월렛을 유지하기 위해 주석 처리
        // onWalletsChange([]); // 이체 후 월렛이 사라지는 문제 방지를 위해 주석 처리
        return;
      }
      
      // DB 데이터를 프론트엔드 형식으로 변환
      const formattedWallets = dbWallets.map(wallet => {
        console.log('월렛 변환 전:', wallet);
        
        // 안전한 데이터 변환 (백엔드 필드명 기준)
        const formatted = {
          id: wallet.gwNo || wallet.id || 0,
          name: wallet.walletName || wallet.gwWalletName || wallet.name || '이름없음',
          accountNo: wallet.accountNo || wallet.gwAccountNo || '',
          pin: wallet.pin || wallet.gwPin || '',
          balance: Number(wallet.cashBalance) || Number(wallet.gwCashBalance) || 0,
          cashBalance: Number(wallet.cashBalance) || Number(wallet.gwCashBalance) || 0,
          goldBalance: Number(wallet.goldBalance) || Number(wallet.gwGoldBalance) || 0,
          silverBalance: Number(wallet.silverBalance) || Number(wallet.gwSilverBalance) || 0,
          totalBalance: Number(wallet.totalBalance) || Number(wallet.gwTotalBalance) || 0,
          activeYn: wallet.activeYn || wallet.gwActiveYn || 'N',
          createdAt: wallet.createdAt || wallet.gwCreatedAt || new Date(),
          updatedAt: wallet.updatedAt || wallet.gwUpdatedAt || new Date()
        };
        
        console.log('월렛 변환 후:', formatted);
        console.log(`월렛 "${formatted.name}" PIN: ${formatted.pin}`);
        console.log(`월렛 "${formatted.name}" 잔고: ${formatted.balance}`);
        console.log(`월렛 "${formatted.name}" 계좌번호: ${formatted.accountNo}`);
        
        return formatted;
      });
      
      console.log('변환된 월렛 목록:', formattedWallets);
      console.log('변환된 월렛 개수:', formattedWallets.length);
      
      // 상태 업데이트를 더 안전하게 처리
      if (formattedWallets && formattedWallets.length > 0) {
        console.log('월렛 상태 업데이트 시작');
        setWallets(formattedWallets);
        onWalletsChange(formattedWallets);
        console.log('월렛 상태 업데이트 완료, 현재 wallets.length:', formattedWallets.length);
      } else {
        console.log('변환된 월렛이 없어서 기존 월렛 유지');
        console.log('부모 컴포넌트에 빈 배열 전달하지 않음 (월렛 사라짐 방지)');
        // setWallets([]); // 기존 월렛을 유지하기 위해 주석 처리
        // onWalletsChange([]); // 월렛이 사라지는 문제 방지를 위해 주석 처리
      }
    } catch (error) {
      console.error('월렛 조회 중 오류:', error);
      console.error('오류 상세:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      
      // 오류 시 빈 배열로 설정
      setWallets([]);
      onWalletsChange([]);
      
      // 사용자에게 오류 알림
      alert(`월렛 조회 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 로그인 상태 변경 시 월렛 로드
  useEffect(() => {
    if (isLoggedIn) {
      loadWallets();
    }
  }, [isLoggedIn]);


  /**
   * 새 지갑 생성 (DB에 즉시 반영)
   */
  const createWalletHandler = async () => {
    if (!newWalletName.trim()) {
      alert('지갑 이름을 입력해주세요.');
      return;
    }

    if (!newWalletPin.trim()) {
      alert('PIN 번호를 입력해주세요.');
      return;
    }

    if (newWalletPin.length !== 6) {
      alert('PIN 번호는 6자리여야 합니다.');
      return;
    }

    if (newWalletPin !== newWalletPin2) {
      alert('PIN 번호가 일치하지 않습니다.');
      return;
    }

    const customerNo = getCustomerNo();
    console.log('월렛 생성 시 고객번호:', customerNo);
    if (!customerNo) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsCreatingWallet(true);
    try {
      // 사용자가 입력한 PIN을 사용
      const requestData = { customerNo, walletName: newWalletName.trim(), walletPin: newWalletPin };
      console.log('월렛 생성 요청 데이터:', requestData);
      console.log('요청 데이터 타입:', {
        customerNo: typeof customerNo,
        walletName: typeof requestData.walletName,
        walletPin: typeof newWalletPin
      });
      
      const result = await createWallet(customerNo, newWalletName.trim(), newWalletPin);
      console.log('월렛 생성 응답:', result);
      
      // DB 생성 성공 후 로컬 상태 업데이트
      const newWallet = {
        id: result.gwNo,
        name: result.gwWalletName,
        accountNo: result.gwAccountNo || '',
        balance: Number(result.gwCashBalance) || 0,
        cashBalance: Number(result.gwCashBalance) || 0,
        goldBalance: Number(result.gwGoldBalance) || 0,
        silverBalance: Number(result.gwSilverBalance) || 0,
        totalBalance: Number(result.gwTotalBalance) || 0,
        pin: result.gwPin,
        activeYn: result.gwActiveYn,
        createdAt: result.gwCreatedAt,
        updatedAt: result.gwUpdatedAt
      };

      console.log('생성된 월렛 객체:', newWallet);

      const updatedWallets = [...wallets, newWallet];
      console.log('업데이트된 월렛 목록:', updatedWallets);
      
      // 즉시 로컬 상태 업데이트
      setWallets(updatedWallets);
      if (onWalletsChange) { 
        onWalletsChange(updatedWallets);
        console.log('부모 컴포넌트에 월렛 변경사항 전달 완료');
      }
      
      // 성공 메시지 (간단한 메시지만 표시)
      alert(`현물통장 "${newWalletName}"이 성공적으로 개설되었습니다.`);
      
      // 폼 초기화 및 모달 닫기
      setNewWalletName('');
      setNewWalletPin('');
      setNewWalletPin2('');
      setShowCreateModal(false);
      
      // 즉시 DB에서 최신 데이터 다시 로드
      console.log('월렛 생성 후 즉시 데이터 새로고침');
      loadWallets();
      
      alert('통장이 성공적으로 개설되었습니다.');
    } catch (error) {
      console.error('❌ 통장 개설 오류:', error);
      console.error('오류 상세:', {
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // API 오류 응답에서 상세 메시지 추출
      let errorMessage = '통장 개설 중 오류가 발생했습니다.';
      
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 서버 오류인 경우 추가 정보 제공
      if (error.response?.status >= 500) {
        errorMessage += '\n\n서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      alert(`월렛지갑 개설 실패: ${errorMessage}`);
    } finally {
      setIsCreatingWallet(false);
    }
  };

  /**
   * PIN 복구 처리
   */
  const recoverPinHandler = async (wallet) => {
    if (!window.confirm(`"${wallet.name}" 월렛의 PIN을 복구하시겠습니까?\n\n⚠️ 주의: 기존 PIN은 무효화되고 새로운 PIN이 생성됩니다.`)) {
      return;
    }

    const customerNo = getCustomerNo();
    if (!customerNo) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await recoverWalletPin(customerNo, wallet.name);
      
      if (result.success) {
        alert(`PIN이 복구되었습니다.\n새로운 PIN: ${result.newPin}\n\n새로운 PIN을 안전한 곳에 보관해주세요.`);
        
        // 월렛 목록 새로고침
        loadWallets();
      } else {
        alert(`PIN 복구 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('PIN 복구 중 오류:', error);
      alert(`PIN 복구 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  /**
   * PIN 변경 모달 열기
   */
  const openPinChangeModal = (wallet) => {
    setSelectedWalletForPinChange(wallet);
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setShowPinChangeModal(true);
  };

  /**
   * PIN 변경 처리
   */
  const changePinHandler = async () => {
    if (!selectedWalletForPinChange) {
      alert('월렛을 선택해주세요.');
      return;
    }

    if (oldPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6) {
      alert('PIN은 6자리 숫자여야 합니다.');
      return;
    }

    if (newPin !== confirmPin) {
      alert('새 PIN과 확인 PIN이 일치하지 않습니다.');
      return;
    }

    if (oldPin === newPin) {
      alert('새 PIN은 기존 PIN과 달라야 합니다.');
      return;
    }

    const customerNo = getCustomerNo();
    if (!customerNo) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsChangingPin(true);
    try {
      const result = await updateWalletPin(customerNo, selectedWalletForPinChange.name, oldPin, newPin);
      
      if (result.success) {
        alert('PIN이 성공적으로 변경되었습니다.');
        setShowPinChangeModal(false);
        setSelectedWalletForPinChange(null);
        setOldPin('');
        setNewPin('');
        setConfirmPin('');
        
        // 월렛 목록 새로고침
        loadWallets();
      } else {
        alert(`PIN 변경 실패: ${result.message}`);
      }
    } catch (error) {
      console.error('PIN 변경 중 오류:', error);
      alert(`PIN 변경 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsChangingPin(false);
    }
  };

  /**
   * 지갑 삭제 (DB에 즉시 반영)
   */
  const deleteWalletHandler = async (walletId) => {
    const customerNo = getCustomerNo();
    if (!customerNo) {
      alert('로그인이 필요합니다.');
      return;
    }

    const wallet = wallets.find(w => w.id === walletId);
    
    if (wallet?.cashBalance > 0 || wallet?.goldBalance > 0 || wallet?.silverBalance > 0) {
      alert('통장에 잔고가 남아 있는 경우, 통장을 삭제할 수 없습니다.\n먼저 잔고를 계좌로 이체해 주세요.');
      return;
    }

    if (!window.confirm(`"${wallet?.name}" 통장을 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeletingWallet(true);
    try {
      // API를 통한 월렛 삭제
      const result = await deleteWallet(walletId);
      
      if (result.success) {
        // 삭제 성공 후 월렛 목록 다시 로드
        await loadWallets();
        
        // 부모 컴포넌트에 변경사항 알림
        if (onWalletsChange) {
          onWalletsChange(wallets.filter(w => w.id !== walletId));
        }
        
        alert('통장이 성공적으로 삭제되었습니다.');
      } else {
        alert(`통장 삭제 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('통장 삭제 오류:', error);
      alert('통장 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeletingWallet(false);
    }
  };

  /**
   * 지갑 선택
   */
  const selectWallet = (wallet) => {
    setSelectedWallet(wallet);
    // 부모 컴포넌트에 월렛 선택 알림
    if (onWalletSelect) {
      onWalletSelect(wallet);
    }
  };

  /**
   * 거래 후 월렛 잔고 새로고침 (외부에서 호출 가능)
   */
  const refreshWallets = async () => {
    console.log('=== 외부에서 월렛 새로고침 요청 ===');
    console.log('현재 월렛 개수:', wallets.length);
    console.log('현재 월렛들:', wallets.map(w => ({ name: w.name, balance: w.balance })));
    
    try {
      // 여러 번 시도하여 확실한 새로고침
      for (let i = 1; i <= 3; i++) {
        console.log(`월렛 새로고침 시도 ${i}/3`);
        await loadWallets();
        
        // 잠시 대기 후 상태 확인
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (wallets.length > 0) {
          console.log(`월렛 새로고침 성공 (시도 ${i}/3)`);
          // 부모 컴포넌트에 변경사항 알림
          if (onWalletsChange) {
            onWalletsChange(wallets);
            console.log('부모 컴포넌트에 월렛 변경사항 전달');
          }
          break;
        } else {
          console.log(`월렛 새로고침 실패 (시도 ${i}/3), 재시도...`);
        }
      }
      
      console.log('=== 월렛 새로고침 완료 ===');
      
      // 새로고침 후 상태 확인을 위해 잠시 대기
      setTimeout(() => {
        console.log('새로고침 후 월렛 개수:', wallets.length);
        console.log('새로고침 후 월렛들:', wallets.map(w => ({ name: w.name, balance: w.balance })));
      }, 100);
    } catch (error) {
      console.error('=== 월렛 새로고침 실패 ===');
      console.error('에러:', error);
    }
  };

  // 부모 컴포넌트에서 호출할 수 있도록 함수 노출
  useImperativeHandle(ref, () => ({
    refreshWallets
  }));

  const formatAmount = (val) => {
    const num = Number(val || 0);
    return Math.round(num).toLocaleString('ko-KR');
  };

  // 로그인하지 않은 경우 렌더링하지 않음
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">월렛지갑 관리</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base"
          >
            + 현물통장 개설
          </button>
          <button
            onClick={() => navigate('/spot/history')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base"
          >
            거래내역
          </button>
        </div>
      </div>

      {/* 지갑 상태 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-800">현물통장 상태 안내</h3>
              <p className="text-sm text-blue-600 mt-1">
                현재 {wallets.length}개의 통장을 보유하고 있습니다.
              </p>
            </div>
          </div>
          <div className="sm:ml-4 text-left sm:text-right">
            <div className="text-xs text-blue-700">총합</div>
            <div className="text-base font-semibold text-blue-900" title={`총합: ${wallets.reduce((total, wallet) => total + (Number(wallet.balance) || 0), 0)}`}>
              ₩{formatAmount(wallets.reduce((total, wallet) => total + (Number(wallet.balance) || 0), 0))}
            </div>
          </div>
        </div>
      </div>

      {/* 지갑 목록 */}
      {(!wallets || wallets.length === 0) ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">월렛지갑이 없습니다</h3>
          <p className="text-gray-500 mb-2">월렛지갑 관리에서 먼저 통장을 개설해주세요.</p>
          <p className="text-xs text-gray-400 mb-6">
          </p>
          <div className="space-x-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + 현물통장 개설하기
            </button>
            <button
              onClick={() => {
                console.log('월렛 새로고침 버튼 클릭');
                loadWallets();
              }}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet, index) => (
          <div
            key={`wallet-${wallet.id}-${index}`}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedWallet?.id === wallet.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => selectWallet(wallet)}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 truncate">{wallet.name}</h3>
            </div>
            
            {/* 현물계좌번호 표시 */}
            <div className="mb-2">
              <p className="text-xs text-gray-500">현물계좌</p>
              <p className="text-sm font-mono text-gray-700">
                {wallet.accountNo || wallet.gwAccountNo || '계좌번호 없음'}
              </p>
            </div>
            
            <div className="mb-3">
              <p className="text-sm text-gray-600">현물계좌 잔고</p>
              <p className={`text-lg sm:text-xl font-bold break-all ${
                wallet.balance === 0 ? 'text-red-600' : 'text-gray-800'
              }`} title={`현물계좌 잔고: ₩${formatAmount(wallet.balance)}`}>
                ₩{formatAmount(wallet.balance)}
                {wallet.balance === 0 && <span className="text-xs text-red-500 ml-1">(잔고 없음)</span>}
              </p>
            </div>

            {/* 금/은 보유량 표시 */}
            <div className="mb-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">금 보유량</span>
                <span className={`text-sm font-semibold ${
                  (wallet.goldBalance || 0) > 0 ? 'text-yellow-600' : 'text-gray-400'
                }`}>
                  {(wallet.goldBalance || 0).toFixed(2)}g
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">은 보유량</span>
                <span className={`text-sm font-semibold ${
                  (wallet.silverBalance || 0) > 0 ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {(wallet.silverBalance || 0).toFixed(2)}g
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {new Date(wallet.createdAt).toLocaleDateString('ko-KR')}
              </p>
              <div className="flex space-x-1">
              {/* PIN 변경, 복구 버튼들 - 주석처리 */}
              {/* <button
                onClick={(e) => {
                  e.stopPropagation();
                  openPinChangeModal(wallet);
                }}
                className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                PIN변경
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  recoverPinHandler(wallet);
                }}
                className="text-orange-500 hover:text-orange-700 text-xs px-2 py-1 rounded hover:bg-orange-50 transition-colors"
              >
                PIN복구
              </button> */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteWalletHandler(wallet.id);
                }}
                disabled={isDeletingWallet}
                className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingWallet ? '삭제중...' : '삭제'}
              </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* 선택된 지갑 정보 */}
      {selectedWallet && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">선택된 지갑: {selectedWallet.name}</h3>
          {selectedWallet.accountNo && (
            <div className="mb-3 bg-white rounded-lg p-3">
              <span className="text-gray-600 block text-sm">현물계좌번호</span>
              <span className="text-base font-mono text-gray-800">{selectedWallet.accountNo}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3">
              <span className="text-gray-600 block">현금 잔고</span>
              <span className="text-lg font-semibold text-gray-800">₩{formatAmount(selectedWallet.balance)}</span>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="text-gray-600 block">금 보유량</span>
              <span className="text-lg font-semibold text-yellow-600">
                {(selectedWallet.goldBalance || 0).toFixed(2)}g
              </span>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="text-gray-600 block">은 보유량</span>
              <span className="text-lg font-semibold text-gray-600">
                {(selectedWallet.silverBalance || 0).toFixed(2)}g
              </span>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="text-gray-600 block">생성일</span>
              <span className="text-sm text-gray-500">
                {new Date(selectedWallet.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PIN 변경 모달 - 주석처리 */}
      {/* {showPinChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">현물통장 PIN 변경</h3>
            <p className="text-sm text-gray-600 mb-4">
              현물통장: <strong>{selectedWalletForPinChange?.name}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 PIN
                </label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="현재 PIN 6자리"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 PIN
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="새 PIN 6자리"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 PIN 확인
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="새 PIN 6자리 재입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPinChangeModal(false);
                  setSelectedWalletForPinChange(null);
                  setOldPin('');
                  setNewPin('');
                  setConfirmPin('');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={changePinHandler}
                disabled={isChangingPin || oldPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPin ? '변경중...' : 'PIN 변경'}
              </button>
            </div>
          </div>
        </div>
      )} */}

      {/* 지갑 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">새 현물통장 개설</h3>
            <p className="text-sm text-gray-600 mb-4">현물통장 이름과 PIN 번호를 입력하여 새로운 현물통장을 개설하세요.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                현물통장 이름
              </label>
              <input
                type="text"
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                placeholder="현물통장 이름을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={20}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN 번호 (6자리)
              </label>
              <input
                type="password"
                value={newWalletPin}
                onChange={(e) => setNewWalletPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="PIN 번호 6자리를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN 번호 확인
              </label>
              <input
                type="password"
                value={newWalletPin2}
                onChange={(e) => setNewWalletPin2(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="PIN 번호를 다시 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWalletName('');
                  setNewWalletPin('');
                  setNewWalletPin2('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={createWalletHandler}
                disabled={isCreatingWallet}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingWallet ? '현물통장 개설중...' : '현물통장 개설'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default WalletManager;

