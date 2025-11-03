import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { transferApi } from '../../api/transferApi';

// 전역 유틸리티 함수
const formatKRW = (n) => `₩${(n || 0).toLocaleString('ko-KR')}`;

// 자동이체 확인 모달 컴포넌트
function AutoTransferConfirmModal({ isOpen, onClose, onConfirm, data }) {
  const [agree, setAgree] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAgree(false);
      setPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isButtonEnabled = agree && password.length >= 4;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm({ ...data, password });
    } catch (error) {
      console.error('자동이체 등록 중 오류:', error.message || '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <section 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="dlg-title"
        className="w-full max-w-2xl rounded-2xl border bg-white shadow-xl"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <h1 id="dlg-title" className="text-lg font-semibold">자동이체 정보 확인</h1>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-gray-700">
            계좌 비밀번호 필요
          </span>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-500">보내는 계좌</div>
              <div className="text-lg font-semibold">{data.fromAccountDisplay}</div>
              <div className="text-sm text-gray-500 mt-4">받는 분</div>
              <div className="text-lg font-semibold">{data.bankName} · {data.destAccountNo}</div>
              <div className="text-sm text-gray-500">예금주</div>
              <div className="font-medium">{data.accountHolder || '-'}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">1회당 금액</div>
              <div className="text-2xl font-bold font-mono">{formatKRW(data.amount)}</div>
              <div className="text-sm text-gray-500">총 금액</div>
              <div className="text-xl font-bold font-mono">{formatKRW(data.totalAmount)}</div>
              <div className="text-sm text-gray-500">반복 횟수</div>
              <div className="font-medium">{data.repeatCount}회</div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">시작 날짜</div>
                <div className="font-medium text-gray-900">{data.startDate}</div>
              </div>
              <div>
                <div className="text-gray-500">종료 날짜</div>
                <div className="font-medium text-gray-900">{data.endDate}</div>
              </div>
            </div>
            {data.memo && (
              <div className="text-sm">
                <div className="text-gray-500">메모</div>
                <div className="font-medium">{data.memo}</div>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              자동이체 내역을 확인했으며, 전자금융거래 약관에 동의합니다.
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">계좌 비밀번호</span>
              <input 
                type="password" 
                className="rounded border px-2 py-1 text-sm w-36" 
                placeholder="4-6자리" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                maxLength="6"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-amber-50 border-amber-200 p-4 text-sm text-amber-900">
            매월 지정일에 자동으로 이체됩니다. 등록된 예약이체는 계좌 관리 메뉴에서 확인 및 취소할 수 있습니다.
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onClose} disabled={isLoading} className="rounded-full border px-5 py-2 text-sm hover:bg-gray-100 disabled:opacity-50">취소</button>
            <button onClick={handleConfirm} disabled={!isButtonEnabled || isLoading} className="rounded-full bg-blue-700 text-white px-5 py-2 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50">
              {isLoading ? '처리중...' : '등록하기'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function AutoTransferPage() {
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 신규 입력 관련 state
  const [banks] = useState([
    { code: 'EUM', name: '이음은행' },
    { code: 'KB', name: 'KB국민은행' },
    { code: 'SH', name: '신한은행' },
    { code: 'WR', name: '우리은행' },
    { code: 'HN', name: '하나은행' },
    { code: 'NH', name: 'NH농협은행' },
    { code: 'IBK', name: 'IBK기업은행' },
    { code: 'SC', name: 'SC제일은행' },
    { code: 'KAKAO', name: '카카오뱅크' },
    { code: 'TOSS', name: '토스뱅크' },
    { code: 'KBANK', name: '케이뱅크' }
  ]);
  const [selectedBank, setSelectedBank] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // 자동이체 설정 관련 state
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  const [startMonth, setStartMonth] = useState(new Date().getMonth() + 1);
  const [dayOfMonth, setDayOfMonth] = useState(25);
  const [amount, setAmount] = useState('');
  const [formattedAmount, setFormattedAmount] = useState('');
  const [repeatCount, setRepeatCount] = useState(12);
  const [memo, setMemo] = useState('');
  
  // 모달 관련 state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 은행별 계좌번호 포맷 정의
  const bankAccountFormats = {
    'EUM': [3, 3, 6],
    'KB': [3, 2, 4, 3],
    'SH': [3, 2, 6],
    'WR': [4, 3, 6],
    'HN': [3, 6, 5],
    'NH': [3, 4, 4, 2],
    'IBK': [3, 6, 2, 3],
    'SC': [3, 2, 6],
    'KAKAO': [4, 2, 7],
    'TOSS': [4, 4, 6],
    'KBANK': [3, 3, 6]
  };

  // 계좌번호 자동 포맷팅 함수
  const formatAccountNumber = (value, bankCode) => {
    const numbers = value.replace(/[^0-9]/g, '');
    if (!bankCode || !bankAccountFormats[bankCode]) return numbers;
    const format = bankAccountFormats[bankCode];
    let formatted = '', position = 0;
    for (const segmentLength of format) {
      const segment = numbers.slice(position, position + segmentLength);
      if (segment) {
        formatted += (formatted ? '-' : '') + segment;
        position += segmentLength;
      }
    }
    return formatted;
  };

  // 계좌 목록 및 잔액 조회
  useEffect(() => {
    loadAccountsAndBalance();
  }, []);

  const loadAccountsAndBalance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API를 통해 계좌 목록 조회
      const accountsResponse = await transferApi.getAccounts();
      
      if (accountsResponse.data && accountsResponse.data.success && accountsResponse.data.data) {
        const accounts = accountsResponse.data.data.accounts || [];
        setAccounts(accounts);
        
        if (accounts.length > 0) {
          const firstAccount = accounts[0];
          setSelectedAccount(firstAccount);
          
          // 선택된 계좌의 잔액 조회
          const balanceResponse = await transferApi.getAccountBalance(firstAccount.aNo);
          if (balanceResponse.data && balanceResponse.data.success) {
            setBalance(balanceResponse.data.data.balance);
          } else {
            setBalance(firstAccount.balance || 0);
          }
        }
      } else {
        throw new Error(accountsResponse.data?.message || '계좌 목록을 불러올 수 없습니다.');
      }
      
    } catch (err) {
      console.error('계좌 정보 로딩 실패:', err);
      
      // 백엔드에서 보내는 구체적인 에러 메시지 추출
      let errorMessage = '계좌 정보를 불러오는데 실패했습니다.';
      
      if (err.message?.includes("Cannot read properties of undefined")) {
        errorMessage = "출금 계좌를 선택해주세요.";
      } else if (err.response && err.response.data) {
        errorMessage = err.response.data.error || err.response.data.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 계좌 선택 변경
  const handleAccountChange = async (account) => {
    setSelectedAccount(account);
    try {
      const balanceResponse = await transferApi.getAccountBalance(account.aNo);
      if (balanceResponse.data && balanceResponse.data.success) {
        setBalance(balanceResponse.data.data.balance);
      } else {
        setBalance(account.balance || 0);
      }
    } catch (err) {
      console.error('잔액 조회 실패:', err);
      setBalance(account.balance || 0);
    }
  };

  // 은행 변경 핸들러
  const handleBankChange = (bankCode) => {
    setSelectedBank(bankCode);
    if (newAccountNumber) {
      setNewAccountNumber(formatAccountNumber(newAccountNumber.replace(/[^0-9]/g, ''), bankCode));
    }
  };

  // 계좌번호 변경 핸들러
  const handleAccountNumberChange = (value) => {
    const numbers = value.replace(/[^0-9]/g, '');
    const formatted = formatAccountNumber(numbers, selectedBank);
    setNewAccountNumber(formatted);
  };

  // 예금주 조회
  const handleVerifyAccount = async () => {
    if (!selectedBank || !newAccountNumber || newAccountNumber.replace(/[^0-9]/g, '').length < 10) {
      return;
    }

    setIsVerifying(true);
    setAccountHolder('');
    
    try {
      const accountNumberOnly = newAccountNumber.replace(/[^0-9]/g, '');
      const response = await transferApi.getAccountHolder(selectedBank, accountNumberOnly);
      
      if (response.data && response.data.accountHolder) {
        setAccountHolder(response.data.accountHolder);
      } else {
        setAccountHolder('');
      }
    } catch (err) {
      console.error('예금주 조회 실패:', err);
      setAccountHolder('');
    } finally {
      setIsVerifying(false);
    }
  };

  // 은행 선택과 계좌번호 입력이 모두 완료되면 자동 조회
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedBank && newAccountNumber && newAccountNumber.replace(/[^0-9]/g, '').length >= 10) {
        handleVerifyAccount();
      } else {
        setAccountHolder('');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [selectedBank, newAccountNumber]);

  // 금액 포맷팅 함수
  const formatAmountInput = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 금액 입력 처리
  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    
    // 최대 1억원 제한
    if (parseInt(numericValue) > 100000000) {
      return;
    }
    
    setAmount(numericValue);
    setFormattedAmount(formatAmountInput(numericValue));
  };

  // 확인 모달 열기
  const handleOpenModal = () => {
    if (!selectedAccount) {
      alert('출금 계좌를 선택해주세요.');
      return;
    }
    if (!selectedBank || !newAccountNumber || !accountHolder) {
      alert('수취 계좌 정보를 모두 입력하고 예금주를 확인해주세요.');
      return;
    }
    if (!amount || parseInt(amount) <= 0) {
      alert('이체 금액을 입력해주세요.');
      return;
    }
    if (repeatCount < 1 || repeatCount > 24) {
      alert('반복 횟수는 1~24회 사이여야 합니다.');
      return;
    }

    setIsModalOpen(true);
  };

  // 자동이체 등록 확인
  const handleConfirmAutoTransfer = async (modalData) => {
    try {
      setIsLoading(true);
      setError(null);

      const requestData = {
        fromAccountNo: selectedAccount.aNo,
        bankCode: selectedBank,
        destAccountNo: newAccountNumber.replace(/[^0-9]/g, ''),
        amount: parseInt(amount),
        startYear: startYear,
        startMonth: startMonth,
        dayOfMonth: dayOfMonth,
        repeatCount: repeatCount,
        memo: memo || null,
        password: modalData.password
      };

      const response = await transferApi.createAutoTransfer(requestData);

      if (response.data && response.data.success === true) {
        // 완료 페이지로 이동 (백엔드 응답 데이터 사용)
        const completeData = {
          totalAmount: response.data.data.totalAmount,
          amount: parseInt(amount),
          startDate: response.data.data.startDate,
          endDate: response.data.data.endDate,
          repeatCount: response.data.data.registeredCount,
          fromAccountNo: selectedAccount.accountNo,
          fromAccountType: selectedAccount.accountType,
          fromAccountBalance: balance,
          toBank: banks.find(b => b.code === selectedBank)?.name || selectedBank,
          toAccount: newAccountNumber,
          toName: accountHolder,
          memo: memo || '',
          orderIds: response.data.data.orderIds
        };

        navigate('/transfer/auto/complete', { state: { completeData } });
      } else {
        // 에러 처리
        let errorMessage = response.data?.message || response.data?.error || '자동이체 등록에 실패했습니다.';
        const errorCode = response.data?.errorCode;
        
        if (errorCode) {
          switch (errorCode) {
            case 'PASSWORD_MISMATCH':
              errorMessage = '계좌 비밀번호가 일치하지 않습니다.';
              break;
            case 'INSUFFICIENT_BALANCE':
              errorMessage = '잔액이 부족합니다.';
              break;
            case 'ACCOUNT_NOT_FOUND':
              errorMessage = '계좌를 찾을 수 없습니다.';
              break;
            case 'ACCOUNT_STATUS_ERROR':
              errorMessage = '계좌가 이체 불가능한 상태입니다.';
              break;
            case 'CURRENCY_MISMATCH':
              errorMessage = '이체는 원화 계좌만 사용 가능합니다.';
              break;
            case 'LIMIT_EXCEEDED':
            case 'PER_TRANSFER_LIMIT_EXCEEDED':
              errorMessage = '1회 이체 한도를 초과했습니다.';
              break;
            case 'DAILY_LIMIT_EXCEEDED':
              errorMessage = '일일 이체 한도를 초과했습니다.';
              break;
            case 'MONTHLY_LIMIT_EXCEEDED':
              errorMessage = '월간 이체 한도를 초과했습니다.';
              break;
            case 'UNAUTHORIZED':
              errorMessage = '권한이 없습니다.';
              break;
            default:
              errorMessage = response.data?.message || errorMessage;
          }
        }

        setError(errorMessage);
        alert(`자동이체 등록 실패: ${errorMessage}`);
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('자동이체 등록 실패:', err);
      
      let errorMessage = '자동이체 등록 중 오류가 발생했습니다.';
      if (err.response?.data?.errorCode) {
        const errorCode = err.response.data.errorCode;
        switch (errorCode) {
          case 'PASSWORD_MISMATCH':
            errorMessage = '계좌 비밀번호가 일치하지 않습니다.';
            break;
          case 'CURRENCY_MISMATCH':
            errorMessage = '이체는 원화 계좌만 사용 가능합니다.';
            break;
          default:
            errorMessage = err.response.data.error || err.response.data.message || errorMessage;
        }
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      alert(`자동이체 등록 실패: ${errorMessage}`);
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 총 금액 계산
  const totalAmount = useMemo(() => {
    const numAmount = parseInt(amount) || 0;
    return numAmount * repeatCount;
  }, [amount, repeatCount]);

  // 시작/종료 날짜 계산
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(startYear, startMonth - 1, dayOfMonth);
    const end = new Date(startYear, startMonth - 1 + repeatCount, dayOfMonth);
    
    // 월말 처리
    const endYear = end.getFullYear();
    const endMonth = end.getMonth() + 1;
    const endDay = Math.min(dayOfMonth, new Date(endYear, endMonth, 0).getDate());
    const finalEnd = new Date(endYear, endMonth - 1, endDay);
    
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    return {
      startDate: formatDate(start),
      endDate: formatDate(finalEnd)
    };
  }, [startYear, startMonth, dayOfMonth, repeatCount]);

  // 연도 목록 생성 (현재 연도 기준 ±5년)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <main className="mx-auto max-w-screen-xl px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">자동이체</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/transfer')}
              className="inline-flex items-center gap-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              단건이체
            </button>
            <button 
              onClick={() => navigate('/transfer/bulk')}
              className="inline-flex items-center gap-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
              다건이체
            </button>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-gray-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              이체 전 보안 점검
            </span>
          </div>
        </div>
        <p className="text-gray-500 mb-6">매월 지정일에 자동으로 이체됩니다.</p>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
          {/* 출금 계좌 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">보내는 계좌</label>
            <select
              value={selectedAccount?.aNo || ''}
              onChange={(e) => {
                const account = accounts.find(acc => acc.aNo === parseInt(e.target.value));
                if (account) handleAccountChange(account);
              }}
              className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={isLoading}
            >
              <option value="">계좌를 선택하세요</option>
              {accounts.map(acc => (
                <option key={acc.aNo} value={acc.aNo}>
                  {acc.accountType} · {acc.accountNo} (잔액: {formatKRW(acc.balance)})
                </option>
              ))}
            </select>
            {selectedAccount && (
              <p className="text-xs text-gray-500 mt-1">
                잔액: {formatKRW(balance)}
              </p>
            )}
          </div>

          {/* 수취 계좌 입력 */}
          <div className="space-y-4 border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">받는 계좌</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">은행 선택</label>
                <select
                  value={selectedBank}
                  onChange={(e) => handleBankChange(e.target.value)}
                  className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">은행을 선택하세요</option>
                  {banks.map(bank => (
                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">계좌번호</label>
                <input
                  type="text"
                  value={newAccountNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  placeholder={selectedBank ? "숫자만 입력하세요" : "은행을 먼저 선택하세요"}
                  className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={!selectedBank}
                />
              </div>
            </div>

            {isVerifying && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
                </svg>
                예금주 조회 중...
              </div>
            )}

            {accountHolder && !isVerifying && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-start gap-3">
                  <svg className="text-green-600 mt-0.5" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-900 mb-1">예금주 조회 완료</div>
                    <div className="text-sm text-green-800">예금주: {accountHolder}</div>
                  </div>
                </div>
              </div>
            )}

            {selectedBank && newAccountNumber && newAccountNumber.replace(/[^0-9]/g, '').length >= 10 && !accountHolder && !isVerifying && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <div className="flex items-center gap-2 text-sm text-red-800">
                  <svg className="text-red-600" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  존재하지 않는 계좌입니다.
                </div>
              </div>
            )}
          </div>

          {/* 자동이체 설정 */}
          <div className="space-y-4 border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">자동이체 설정</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">시작 연도</label>
                <select
                  value={startYear}
                  onChange={(e) => setStartYear(parseInt(e.target.value))}
                  className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">시작 월</label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(parseInt(e.target.value))}
                  className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {months.map(month => (
                    <option key={month} value={month}>{month}월</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">매월 지정일</label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}일</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">반복 횟수</label>
                <select
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(parseInt(e.target.value))}
                  className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(count => (
                    <option key={count} value={count}>{count}회</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">1회당 금액</label>
              <input
                type="text"
                value={formattedAmount}
                onChange={handleAmountChange}
                inputMode="numeric"
                className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">메모 (선택)</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength="10"
                className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="통장 표시용"
              />
              <p className="text-xs text-gray-500 mt-1">통장표시 10자 내외</p>
            </div>
          </div>


          {/* 등록 버튼 */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={() => navigate('/transfer')}
              className="rounded-full border px-6 py-2 text-sm hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={handleOpenModal}
              disabled={isLoading || !selectedAccount || !accountHolder || !amount}
              className="rounded-full bg-blue-700 text-white px-6 py-2 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            >
              자동이체 등록
            </button>
          </div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <section className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">자동이체 요약</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">1회당 금액</span>
                    <span className="font-semibold">{formatKRW(parseInt(amount) || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">반복 횟수</span>
                    <span className="font-semibold">{repeatCount}회</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">총 이체 금액</span>
                    <span className="font-semibold">{formatKRW(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">시작 날짜</span>
                    <span className="font-medium">{startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">종료 날짜</span>
                    <span className="font-medium">{endDate}</span>
                  </div>
                </div>
                <hr className="my-4" />
                {selectedAccount && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">현재 잔액</span>
                      <span className="font-semibold">{formatKRW(balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">이체 후 예상 잔액</span>
                      <span className="font-semibold text-blue-700">{formatKRW(balance - totalAmount)}</span>
                    </div>
                  </div>
                )}
              </section>
              <section className="rounded-2xl border bg-amber-50 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">보안 주의</h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 8h.01M12 12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  스미싱/피싱이 의심되면 즉시 고객센터로 연락하세요. 계좌번호/OTP를 절대 제3자에게 공유하지 마세요.
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>

      {/* 확인 모달 */}
      <AutoTransferConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAutoTransfer}
        data={{
          fromAccountDisplay: selectedAccount ? `${selectedAccount.accountType} · ${selectedAccount.accountNo}` : '',
          bankName: banks.find(b => b.code === selectedBank)?.name || '',
          destAccountNo: newAccountNumber,
          accountHolder: accountHolder,
          amount: parseInt(amount) || 0,
          totalAmount: totalAmount,
          repeatCount: repeatCount,
          startDate: startDate,
          endDate: endDate,
          memo: memo
        }}
      />
    </div>
  );
}

