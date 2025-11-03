import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { transferApi } from '../../api/transferApi';
import '../../resources/css/other.css';

// 전역 유틸리티 함수
const formatKRW = (n) => `₩${(n || 0).toLocaleString('ko-KR')}`;

// 이체 확인 모달 컴포넌트 - OTP 제거하고 계좌 비밀번호 입력으로 변경
function TransferConfirmModal({ isOpen, onClose, onConfirm, data }) {
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
      // 계좌 비밀번호를 포함한 데이터로 이체 실행
      await onConfirm({ ...data, password });
    } catch (error) {
      console.error('이체 실행 중 오류:', error.message || '알 수 없는 오류');
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
          <h1 id="dlg-title" className="text-lg font-semibold">이체 정보 확인</h1>
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
              <div className="text-lg font-semibold">{data.recipient?.bank} · {data.recipient?.account}</div>
              <div className="text-sm text-gray-500">예금주</div>
              <div className="font-medium">{data.recipient?.name}</div>
            </div>
            <div className="space-y-2">
              {data.isAutoTransfer ? (
                <>
                  <div className="text-sm text-gray-500">1회당 금액</div>
                  <div className="text-2xl font-bold font-mono">{formatKRW(data.amount)}</div>
                  <div className="text-sm text-gray-500">반복 횟수</div>
                  <div className="font-medium">{data.autoRepeatCount}회</div>
                  <div className="text-sm text-gray-500">총 금액</div>
                  <div className="text-xl font-bold font-mono text-blue-700">{formatKRW(data.amount * data.autoRepeatCount)}</div>
                  <div className="text-sm text-gray-500">시작 날짜</div>
                  <div className="font-medium">{data.autoStartYear}-{String(data.autoStartMonth).padStart(2, '0')}-{String(data.autoDayOfMonth).padStart(2, '0')}</div>
                  <div className="text-sm text-gray-500">메모</div>
                  <div className="font-medium">{data.memo || '-'}</div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500">금액</div>
                  <div className="text-2xl font-bold font-mono">{formatKRW(data.amount)}</div>
                  <div className="text-sm text-gray-500">수수료</div>
                  <div className="font-medium font-mono">{formatKRW(data.fee)}</div>
                  <div className="text-sm text-gray-500">메모</div>
                  <div className="font-medium">{data.memo || '-'}</div>
                </>
              )}
            </div>
          </div>

          {data.isAutoTransfer && (
            <div className="mt-4 rounded-xl border bg-blue-50 border-blue-200 p-4 text-sm text-blue-900">
              매월 {data.autoDayOfMonth}일에 자동으로 이체됩니다. 총 {data.autoRepeatCount}회 진행됩니다.
            </div>
          )}

          <div className="mt-6 space-y-4">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              이체 내역을 확인했으며, 전자금융거래 약관에 동의합니다.
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
            스미싱/피싱이 의심되면 즉시 고객센터로 연락하세요.
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onClose} disabled={isLoading} className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50 disabled:opacity-50">취소</button>
            <button onClick={handleConfirm} disabled={!isButtonEnabled || isLoading} className="rounded-full bg-blue-700 text-white px-5 py-2 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50">
              {isLoading ? '처리중...' : '이체 실행'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


// 계좌 이체 메인 페이지 컴포넌트 - API 연동으로 동적 데이터 처리
export default function TransferPage() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState('form'); 
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const [fee, setFee] = useState(0);
  const [activeTab, setActiveTab] = useState('fav');
  const [amount, setAmount] = useState('');
  const [formattedAmount, setFormattedAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [isReserved, setIsReserved] = useState(false);
  const [reserveDate, setReserveDate] = useState('');
  const [reserveTime, setReserveTime] = useState('');
  const [isAutoTransfer, setIsAutoTransfer] = useState(false);
  const [autoStartYear, setAutoStartYear] = useState(new Date().getFullYear());
  const [autoStartMonth, setAutoStartMonth] = useState(new Date().getMonth() + 1);
  const [autoDayOfMonth, setAutoDayOfMonth] = useState('');
  const [autoRepeatCount, setAutoRepeatCount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  
  // 신규 입력 탭 관련 state
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // 은행별 계좌번호 포맷 정의 (하이픈 위치)
  const bankAccountFormats = {
    'EUM': [3, 3, 6],    // 이음은행: 110-123-456789
    'KB': [3, 2, 4, 3],  // KB국민은행: 123-12-1234-123
    'SH': [3, 2, 6],     // 신한은행: 110-12-123456
    'WR': [4, 3, 6],     // 우리은행: 1002-123-123456
    'HN': [3, 6, 5],     // 하나은행: 123-123456-12345
    'NH': [3, 4, 4, 2],  // NH농협은행: 123-1234-1234-12
    'IBK': [3, 6, 2, 3], // IBK기업은행: 123-123456-12-123
    'SC': [3, 2, 6],     // SC제일은행: 123-12-123456
    'KAKAO': [4, 2, 7],  // 카카오뱅크: 3333-02-1234567
    'TOSS': [4, 4, 6],   // 토스뱅크: 1000-1234-123456
    'KBANK': [3, 3, 6]   // 케이뱅크: 100-123-123456
  };
  
  // 내 계좌 목록 (이체 가능한 다른 계좌들)
  const [myOtherAccounts, setMyOtherAccounts] = useState([]);

  // 계좌번호 자동 포맷팅 함수
  const formatAccountNumber = (value, bankCode) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, '');
    
    // 은행이 선택되지 않았거나 포맷이 없으면 숫자만 반환
    if (!bankCode || !bankAccountFormats[bankCode]) {
      return numbers;
    }

    const format = bankAccountFormats[bankCode];
    let formatted = '';
    let position = 0;

    for (let i = 0; i < format.length; i++) {
      const segmentLength = format[i];
      const segment = numbers.slice(position, position + segmentLength);
      
      if (segment) {
        formatted += (i > 0 ? '-' : '') + segment;
        position += segmentLength;
      } else {
        break;
      }
    }

    return formatted;
  };

  // 계좌번호 입력 핸들러
  const handleAccountNumberChange = (value) => {
    const formatted = formatAccountNumber(value, selectedBank);
    setNewAccountNumber(formatted);
  };

  // 은행 변경 핸들러 - 계좌번호 리포맷
  const handleBankChange = (bankCode) => {
    setSelectedBank(bankCode);
    // 기존에 입력된 계좌번호가 있으면 새 은행 포맷으로 재포맷
    if (newAccountNumber) {
      const formatted = formatAccountNumber(newAccountNumber, bankCode);
      setNewAccountNumber(formatted);
    }
    // 은행이 변경되면 예금주 정보도 초기화
    setAccountHolder('');
    setSelectedRecipient(null);
  };
  
  // 최근 이체 대상 (API에서 조회)
  const [recentRecipients, setRecentRecipients] = useState([]);
  
  

  // 컴포넌트 마운트 시 계좌 목록과 잔액 조회
  useEffect(() => {
    loadAccountsAndBalance();
    loadRecentRecipients();
    
    // 하드코딩된 은행 목록 즉시 설정
    const hardcodedBanks = [
      { code: 'EUM', name: '이음은행' },
      { code: '001', name: '국민은행' },
      { code: '002', name: '신한은행' },
      { code: '003', name: '우리은행' },
      { code: '004', name: '하나은행' },
      { code: '005', name: '농협은행' },
      { code: '006', name: '기업은행' },
      { code: '007', name: '새마을금고' },
      { code: '008', name: '신협' },
      { code: '009', name: '우체국' },
      { code: '010', name: '카카오뱅크' },
      { code: '011', name: '토스뱅크' },
      { code: '012', name: '케이뱅크' }
    ];
    setBanks(hardcodedBanks);
  }, []);


  const location = useLocation();

  // 컴포넌트가 마운트되거나 location이 변경될 때 실행
  useEffect(() => {
    // 1. 전달받은 state 객체 전체를 로그로 확인
    console.log('--- Location State 전체 로그 ---');
    console.log(location.state);

    // 2. 전달받은 특정 계좌번호 값만 추출하여 로그로 확인
    const passedAccountNumber = location.state?.fromAccountNumber; // 👈 fromAccountNumber 키로 접근

    if (passedAccountNumber) {
      console.log('✅ 전달받은 계좌번호 (fromAccountNumber):', passedAccountNumber);
    } else {
      console.log('⚠️ 전달받은 계좌번호(fromAccountNumber)가 없습니다. (직접 URL 접근 등)');
    }
  }, [location]);


  // 계좌 목록과 잔액을 로드하는 함수 - API 호출로 실제 데이터 조회
  const loadAccountsAndBalance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API를 통해 계좌 목록 조회
      const accountsResponse = await transferApi.getAccounts();
      
      if (accountsResponse.data && accountsResponse.data.success && accountsResponse.data.data) {
        const accounts = accountsResponse.data.data.accounts || [];
        setAccounts(accounts);
        
        // 내 계좌 목록 설정 (현재 선택된 계좌 제외)
        setMyOtherAccounts(accounts);
        
        // 2. 전달받은 특정 계좌번호 값만 추출하여 로그로 확인
        const passedAccountNumber = location.state?.fromAccountNumber; // 👈 fromAccountNumber 키로 접근

        if (passedAccountNumber) {
          console.log('✅ 전달받은 계좌번호 (fromAccountNumber):', passedAccountNumber);
        } else {
          console.log('⚠️ 전달받은 계좌번호(fromAccountNumber)가 없습니다. (직접 URL 접근 등)');
        }

        // 첫 번째 계좌를 기본 선택으로 설정
        if (accounts.length > 0) {
          const firstAccount = accounts.find((account) => account.accountNo === passedAccountNumber);
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
      
    } catch (error) {
      console.error('계좌 정보 로딩 실패:', error);

      // 백엔드에서 보내는 구체적인 에러 메시지 추출
      let errorMessage = '계좌 정보를 불러오는데 실패했습니다.';

      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error.message) {
        // JavaScript 에러 메시지 처리
        if (error.message.includes("Cannot read properties of undefined")) {
          errorMessage = '출금 계좌를 선택해주세요.';
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };



  // 최근 이체 대상 로드 (실제 이체 내역 기반)
  const loadRecentRecipients = async () => {
    try {
      console.log('=== loadRecentRecipients 시작 ===');
      console.log('selectedAccount:', selectedAccount);
      
      // 선택된 계좌가 있을 때만 조회
      if (selectedAccount && selectedAccount.aNo) {
        console.log('API 호출 시작 - 계좌번호:', selectedAccount.aNo);
        const response = await transferApi.getRecentRecipients(selectedAccount.aNo);
        console.log('API 응답 전체:', response);
        console.log('API 응답 data:', response.data);
        
        if (response.data && response.data.success && response.data.data) {
          console.log('최근 이체 데이터:', response.data.data);
          // 최근 3개만 표시
          const recentData = response.data.data.slice(0, 3);
          console.log('표시할 데이터 (3개):', recentData);
          setRecentRecipients(recentData);
        } else {
          console.log('최근 이체 데이터 없음 - 응답 구조:', {
            hasData: !!response.data,
            success: response.data?.success,
            hasDataArray: !!response.data?.data,
            dataLength: response.data?.data?.length
          });
          setRecentRecipients([]);
        }
      } else {
        console.log('선택된 계좌 없음 - selectedAccount:', selectedAccount);
        setRecentRecipients([]);
      }
      console.log('=== loadRecentRecipients 완료 ===');
    } catch (error) {
      console.error('최근 이체 대상 로딩 실패:', error);
      console.error('에러 상세:', error.message || '알 수 없는 오류');
      setRecentRecipients([]);
    }
  };

  // 수수료 조회 함수 - API 호출로 실제 수수료 조회
  const loadTransferFee = async () => {
    try {
      if (numericAmount > 0 && selectedRecipient && selectedAccount) {
        const feeResponse = await transferApi.getTransferFee({
          fromAccountNo: selectedAccount.aNo,                    // Integer (출금 계좌 번호)
          toAccount: selectedRecipient.account || "0000000000", // String (수취 계좌번호)
          amount: numericAmount,                                 // Integer (이체 금액)
          bankCode: selectedRecipient.bankCode || "EUM"         // String (은행 코드)
        });
        if (feeResponse.data && feeResponse.data.success) {
          setFee(feeResponse.data.data.fee || 0);
        } else {
          setFee(0); // 기본값으로 무료 설정
        }
      } else {
        setFee(0);
      }
    } catch (error) {
      console.error('수수료 조회 실패:', error);

      // 백엔드에서 보내는 구체적인 에러 메시지 추출
      let errorMessage = '수수료 조회에 실패했습니다.';

      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.warn(errorMessage);
      setFee(0); // 에러 시 무료로 설정
    }
  };

  // 금액이 변경될 때마다 수수료 조회
  useEffect(() => {
    if (amount && selectedRecipient) {
      loadTransferFee();
    }
  }, [amount, selectedRecipient]);

  // 선택된 계좌가 변경될 때마다 최근 이체 목록 새로고침
  useEffect(() => {
    if (selectedAccount && selectedAccount.aNo) {
      loadRecentRecipients(); // 최근 이체 내역 로드
    }
  }, [selectedAccount?.aNo]);

  // 신규 입력 - 은행 선택과 계좌번호 입력이 모두 완료되면 자동 조회
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedBank && newAccountNumber && newAccountNumber.length >= 10) {
        handleVerifyAccount();
      } else {
        setAccountHolder('');
        setSelectedRecipient(null);
      }
    }, 500); // 500ms 대기 후 자동 조회

    return () => clearTimeout(timeoutId);
  }, [selectedBank, newAccountNumber]);
  
  const numericAmount = useMemo(() => parseInt(String(amount).replace(/[^0-9]/g, ''), 10) || 0, [amount]);
  const remainingBalance = useMemo(() => {
    if (numericAmount === 0 || numericAmount > balance) {
      return formatKRW(balance - numericAmount);
    }
    return formatKRW(balance - (numericAmount + fee));
  }, [numericAmount, balance, fee]);

  // 금액 포맷팅 함수 (3자리마다 콤마)
  const formatAmount = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 금액 입력 처리 함수
  const handleAmountChange = (e) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    
    // 최대 1억원 제한
    if (parseInt(numericValue) > 100000000) {
      return;
    }
    
    setAmount(numericValue);
    setFormattedAmount(formatAmount(numericValue));
  };

  // 금액 추가 함수
  const handleAddAmount = (addValue) => {
    const currentAmount = parseInt(amount || '0');
    const newAmount = currentAmount + addValue;
    
    // 최대 1억원 제한
    if (newAmount > 100000000) {
      return;
    }
    
    const newAmountStr = String(newAmount);
    setAmount(newAmountStr);
    setFormattedAmount(formatAmount(newAmountStr));
  };
  

  // 내 계좌 선택 함수
  const handleSelectMyAccount = (account) => {
    if (account.aNo === selectedAccount?.aNo) {
      alert('같은 계좌로는 이체할 수 없습니다.');
      return;
    }
    
    setSelectedRecipient({
      name: '내 계좌',
      bank: '이음은행',
      account: account.accountNo,  // accountNo는 String 타입
      bankCode: 'EUM'  // 내 계좌는 이음은행 코드
    });
    setError(null);
    
    // 내 계좌 선택 시에도 최근 이체 목록 업데이트
    loadRecentRecipients();
  };

  // 예금주 조회 함수 (신규 입력) - 은행 + 계좌번호로 예금주명만 조회
  const handleVerifyAccount = async () => {
    if (!selectedBank || !newAccountNumber || newAccountNumber.length < 10) {
      setAccountHolder('');
      setSelectedRecipient(null);
      return;
    }

    try {
      setIsVerifying(true);
      
      // 실제 API 호출로 예금주 조회
      const response = await transferApi.getAccountHolder(selectedBank, newAccountNumber);
      
      if (response.data && response.data.success && response.data.data && response.data.data.accountHolder) {
        const holderData = response.data.data;
        setAccountHolder(holderData.accountHolder);
        setSelectedRecipient({
          name: holderData.accountHolder,
          bank: banks.find(b => b.code === selectedBank)?.name || selectedBank,
          account: newAccountNumber,
          bankCode: selectedBank
        });
        setError(null);
      } else {
        // 계좌가 존재하지 않거나 조회 실패
        setAccountHolder('');
        setSelectedRecipient(null);
        setError('존재하지 않는 계좌입니다. 은행과 계좌번호를 다시 확인해주세요.');
      }
      
    } catch (error) {
      console.error('예금주 조회 실패:', error.message || '알 수 없는 오류');
      setAccountHolder('');
      setSelectedRecipient(null);
      
      // 서버 오류인지 계좌 존재 여부 오류인지 구분
      if (error.response && error.response.status === 404) {
        setError('존재하지 않는 계좌입니다. 은행과 계좌번호를 다시 확인해주세요.');
      } else if (error.response && error.response.status === 400) {
        setError('계좌번호 형식이 올바르지 않습니다.');
      } else {
        setError('계좌 조회에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // 탭 변경 시 선택 초기화
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedRecipient(null);
    setAccountHolder('');
    setNewAccountNumber('');
    setSelectedBank('');
    setError(null);
  };
  
  // 다음 단계로 이동하는 함수
  const handleNextStep = () => {
    if (!selectedRecipient) {
        alert('받는 분을 선택해주세요.');
        return;
    }
    if (!selectedAccount) {
        alert('보내는 계좌를 선택해주세요.');
        return;
    }
    if (numericAmount === 0) {
        alert('이체할 금액을 입력해주세요.');
        return;
    }
    setIsModalOpen(true);
  };

  // 이체 실행 함수 - API 호출로 실제 이체 처리
  const handleConfirmTransfer = async (transferData) => {
    try {
      setIsLoading(true);
      setError(null);

      // 신규 입력 탭에서 계좌 존재 여부 재검증
      if (activeTab === 'new' && (!accountHolder || accountHolder.trim() === '')) {
        alert('존재하지 않는 계좌입니다. 은행과 계좌번호를 다시 확인해주세요.');
        setIsLoading(false);
        return;
      }

      // 예약이체 선택 시 검증
      if (isReserved) {
        if (!reserveDate || !reserveTime) {
          alert('예약 이체 날짜와 시간을 모두 선택해주세요.');
          setIsLoading(false);
          return;
        }
      }

      // 자동이체 선택 시 검증
      if (isAutoTransfer) {
        if (!autoStartYear || !autoStartMonth || !autoDayOfMonth || !autoRepeatCount) {
          alert('자동이체 설정을 모두 선택해주세요.');
          setIsLoading(false);
          return;
        }
      }

      // 기본 필수 항목 검증
      if (!selectedAccount) {
        alert('보내는 계좌를 선택해주세요.');
        setIsLoading(false);
        return;
      }
      if (!selectedRecipient) {
        alert('받는 분을 선택해주세요.');
        setIsLoading(false);
        return;
      }
      if (numericAmount <= 0) {
        alert('이체할 금액을 입력해주세요.');
        setIsLoading(false);
        return;
      }

      // 이체 요청 데이터 구성
      const requestData = {
        fromAccountNo: selectedAccount.aNo,
        fromAccountId: selectedAccount.accountNo,  // 계좌번호 (String)
        toBank: selectedRecipient.bank,
        toAccount: selectedRecipient.account,
        toName: selectedRecipient.name,
        amount: numericAmount,
        memo: memo,
        password: transferData.password
      };

      // 자동이체인 경우 (AutoTransferRequestDto 구조)
      if (isAutoTransfer) {
        const autoRequestData = {
          fromAccountNo: selectedAccount.aNo,
          bankCode: selectedRecipient.bankCode || 'EUM',
          destAccountNo: selectedRecipient.account,
          amount: numericAmount,
          startYear: autoStartYear,
          startMonth: autoStartMonth,
          dayOfMonth: parseInt(autoDayOfMonth),
          repeatCount: parseInt(autoRepeatCount),
          memo: memo || null,
          password: transferData.password
        };

        const autoResponse = await transferApi.createAutoTransfer(autoRequestData);

        if (autoResponse.data && autoResponse.data.success === true) {
          const completeData = {
            totalAmount: autoResponse.data.data.totalAmount,
            amount: numericAmount,
            startDate: autoResponse.data.data.startDate,
            endDate: autoResponse.data.data.endDate,
            repeatCount: autoResponse.data.data.registeredCount,
            fromAccountNo: selectedAccount.accountNo,
            fromAccountType: selectedAccount.accountType,
            fromAccountBalance: balance,
            toBank: selectedRecipient.bank,
            toAccount: selectedRecipient.account,
            toName: selectedRecipient.name,
            memo: memo || '',
            orderIds: autoResponse.data.data.orderIds
          };

          setIsModalOpen(false);
          navigate('/transfer/auto/complete', { state: { completeData } });
          return;
        } else {
          let errorMessage = autoResponse.data?.message || autoResponse.data?.error || '자동이체 등록에 실패했습니다.';
          const errorCode = autoResponse.data?.errorCode;
          
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
                errorMessage = autoResponse.data?.message || errorMessage;
            }
          }

          setError(errorMessage);
          alert(`자동이체 등록 실패: ${errorMessage}`);
          setIsModalOpen(false);
          return;
        }
      }

      // 예약 이체인 경우 (TransferOrderDto 구조)
      if (isReserved && reserveDate && reserveTime) {
        const requestData = {
          accountNo: selectedAccount.aNo,                    // Integer (출금 계좌 번호)
          bankCode: selectedRecipient.bankCode || 'EUM',    // String (수취 은행 코드)
          destAccountNo: selectedRecipient.account,          // String (수취 계좌번호)
          amount: numericAmount,                             // Integer (이체 금액)
          scheduleType: 'ONCE',                              // String (ONCE, RECURRING)
          scheduleExpr: '0 0 9 * * ?',                      // String (cron 표현식)
          startAt: `${reserveDate}T${reserveTime}:00`,       // String (시작 시간)
          endAt: `${reserveDate}T${reserveTime}:00`,         // String (종료 시간)
          memo: memo,                                        // String (메모)
          password: transferData.password                    // String (계좌 비밀번호 - 예약 이체 등록 시 검증용)
        };
        
        // 예약 이체 생성 API 호출
        const scheduleResponse = await transferApi.createReserveTransfer(requestData);

        if (scheduleResponse.data && scheduleResponse.data.success === true) {
          // 예약이체 완료 페이지로 이동
          const reserveData = {
            orderId: scheduleResponse.data.data.orderId,
            amount: numericAmount,
            toName: selectedRecipient.name,
            toBank: selectedRecipient.bank,
            toAccount: selectedRecipient.account,
            fromAccountType: selectedAccount.accountType,
            fromAccountNo: selectedAccount.accountNo,
            fromAccountBalance: balance,
            startAt: `${reserveDate}T${reserveTime}:00`,
            memo: memo
          };
          
          setIsModalOpen(false);
          navigate('/transfer/reserve/complete', { state: { reserveData } });
          return;
        } else {
          // 예약이체 실패 시 alert로 에러 메시지 표시하고 완료 페이지로 이동하지 않음
          let errorMessage = scheduleResponse.data?.message || scheduleResponse.data?.error || '예약 이체 등록에 실패했습니다.';
          const errorCode = scheduleResponse.data?.errorCode;
          
          // 에러 코드에 따른 사용자 친화적인 메시지 표시
          if (errorCode) {
            switch (errorCode) {
              case 'PASSWORD_MISMATCH':
                errorMessage = '계좌 비밀번호가 일치하지 않습니다.';
                break;
              case 'ACCOUNT_NOT_FOUND':
                errorMessage = '존재하지 않는 계좌입니다.';
                break;
              case 'INSUFFICIENT_BALANCE':
                errorMessage = '잔액이 부족합니다.';
                break;
              case 'ACCOUNT_SUSPENDED':
                errorMessage = '거래가 제한된 계좌입니다.';
                break;
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
              case 'CURRENCY_MISMATCH':
                errorMessage = '이체는 원화 계좌만 사용 가능합니다.';
                break;
            }
          }
          
          console.error('예약이체 실패 응답:', scheduleResponse.data);
          alert(`예약이체 실패: ${errorMessage}`);
          setIsModalOpen(false); // 모달 닫기
          return; // 함수 종료 (완료 페이지로 이동하지 않음)
        }
      }

      // 즉시 이체 실행
      const response = await transferApi.createTransfer(requestData);

      if (response.data && response.data.success === true) {
        // API 응답에서 새로운 잔액 사용
        const newBalance = response.data.data.afterBalance || (balance - numericAmount);
        setBalance(newBalance);
        
        // 계좌 목록도 업데이트
        const updatedAccounts = accounts.map(acc => 
          acc.aNo === selectedAccount.aNo 
            ? { ...acc, balance: newBalance }
            : acc
        );
        setAccounts(updatedAccounts);
        setSelectedAccount({ ...selectedAccount, balance: newBalance });
        
        // 이체 완료 정보 저장
        const transferData = {
          transferId: response.data.data.transferId,
          transferNo: response.data.data.transferNo,
          amount: numericAmount,
          recipient: selectedRecipient,
          timestamp: response.timestamp || new Date().toISOString(),
          fromAccount: selectedAccount,
          memo: memo,
          fee: fee,
          remainingBalance: response.data.data.afterBalance || (balance - numericAmount - fee)
        };
        
        setIsModalOpen(false);
        navigate('/transfer/complete', { state: { transferData } });
        
        // 최근 이체 목록 새로고침
        loadRecentRecipients();
      } else {
        // 이체 실패 시 alert로 에러 메시지 표시하고 완료 페이지로 이동하지 않음
        const errorMessage = response.data?.message || response.data?.error || '이체 처리에 실패했습니다.';
        console.error('이체 실패 응답:', response.data);
        alert(`이체 실패: ${errorMessage}`);
        setIsModalOpen(false); // 모달 닫기
        return; // 함수 종료 (완료 페이지로 이동하지 않음)
      }

    } catch (error) {
      console.error('이체 실행 실패:', error);

      // 백엔드에서 보내는 구체적인 에러 메시지 추출
      let errorMessage = '이체 처리 중 오류가 발생했습니다.';
      let errorCode = null;


      if (error.response && error.response.data) {
        // 백엔드 TransferGlobalExceptionHandler에서 보내는 에러 메시지 사용
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
        errorCode = error.response.data.errorCode;
      } else if (error.message) {
        // JavaScript 에러 메시지 처리
        if (error.message.includes("Cannot read properties of undefined")) {
          errorMessage = '출금 계좌를 선택해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // 실패 사유별 구분된 메시지 표시
      let userFriendlyMessage = errorMessage;

      if (errorCode) {
        switch (errorCode) {
          case 'ACCOUNT_NOT_FOUND':
            userFriendlyMessage = '존재하지 않는 계좌입니다.';
            break;
          case 'INSUFFICIENT_BALANCE':
            userFriendlyMessage = '잔액이 부족합니다.';
            break;
          case 'PASSWORD_MISMATCH':
            userFriendlyMessage = '계좌 비밀번호가 일치하지 않습니다.';
            break;
          case 'ACCOUNT_SUSPENDED':
            userFriendlyMessage = '거래가 제한된 계좌입니다.';
            break;
          case 'INVALID_AMOUNT':
            userFriendlyMessage = '이체 금액이 올바르지 않습니다.';
            break;
          case 'PER_TRANSFER_LIMIT_EXCEEDED':
            userFriendlyMessage = '1회 이체 한도를 초과했습니다.';
            break;
          case 'DAILY_LIMIT_EXCEEDED':
            userFriendlyMessage = '일일 이체 한도를 초과했습니다.';
            break;
          case 'MONTHLY_LIMIT_EXCEEDED':
            userFriendlyMessage = '월간 이체 한도를 초과했습니다.';
            break;
          case 'LIMIT_EXCEEDED':
            userFriendlyMessage = '이체 한도를 초과했습니다.';
            break;
          case 'SAME_ACCOUNT':
            userFriendlyMessage = '자기 계좌로는 이체할 수 없습니다.';
            break;
          case 'UNAUTHORIZED':
            userFriendlyMessage = '권한이 없습니다.';
            break;
          case 'INVALID_REQUEST':
            userFriendlyMessage = '잘못된 요청입니다.';
            break;
          case 'CURRENCY_MISMATCH':
            userFriendlyMessage = '이체는 원화 계좌만 사용 가능합니다.';
            break;
          default:
            userFriendlyMessage = errorMessage;
        }
      }

      setError(userFriendlyMessage);
      alert(`이체 실패: ${userFriendlyMessage}`);
      setIsModalOpen(false); // 모달 닫기
    } finally {
      setIsLoading(false);
    }
  };

  // 계좌 변경 시 잔액 업데이트 - API 호출로 실제 잔액 조회
  const handleAccountChange = async (account) => {
    try {
      setSelectedAccount(account);
      setError(null);
      
      // API를 통해 선택된 계좌의 현재 잔액 조회
      const balanceResponse = await transferApi.getAccountBalance(account.aNo);
      if (balanceResponse.data && balanceResponse.data.success) {
        setBalance(balanceResponse.data.data.balance);
      } else {
        setBalance(account.balance || 0); // API 실패 시 계좌 객체의 잔액 사용
      }
      
      // 내 계좌 목록 업데이트 (선택된 계좌 제외)
      setMyOtherAccounts(accounts.filter(acc => acc.aNo !== account.aNo));
      
      // 선택된 계좌의 최근 이체 내역 로드
      loadRecentRecipients();
    } catch (error) {
      console.error('잔액 조회 실패:', error);

      // 백엔드에서 보내는 구체적인 에러 메시지 추출
      let errorMessage = '잔액 조회에 실패했습니다.';

      if (error.response && error.response.data) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.warn(errorMessage);
      setBalance(account.balance || 0); // 에러 시 계좌 객체의 잔액 사용
    }
  };


  // 취소 버튼 핸들러 - 입력 초기화
  const handleCancel = () => {
    setAmount('');
    setFormattedAmount('');
    setMemo('');
    setSelectedRecipient(null);
    setIsReserved(false);
    setReserveDate('');
    setReserveTime('');
    setActiveTab('fav');
    setError(null);
  };



  // 최근 이체 대상 선택 핸들러
  const handleSelectRecentRecipient = (recipient) => {
    setSelectedRecipient(recipient);
    setActiveTab('fav');
    setError(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main id="main">
        <section className="mx-auto max-w-screen-xl px-6 py-[32px]">
          <div className="tranb flex items-center justify-between w-[1240px] h-[152px]">
            <h1 className="text-2xl font-semibold tracking-tight">계좌 이체</h1>
            <div className="flex items-center gap-3">
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
        </section>

        <section className="mx-auto max-w-screen-xl px-6 pb-12 grid lg:grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {step === 'form' && (
              <section id="step-form" className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">이체 정보 입력</h2>
                  <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-400"><path d="M12 8h.01M12 12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    이체 시 문자 알림
                  </span>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-800 mb-1">보내는 계좌</label>
                      <select 
                        value={selectedAccount?.aNo || ''} 
                        onChange={(e) => {
                          const account = accounts.find(acc => acc.aNo === parseInt(e.target.value));
                          if (account) handleAccountChange(account);
                        }}
                        className="w-full rounded-lg border-gray-300 bg-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        disabled={isLoading}
                      >
                        <option value="">계좌를 선택하세요</option>
                        {accounts.map(account => (
                          <option key={account.aNo} value={account.aNo}>
                            {account.accountType} · {account.accountNo}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">잔액 {formatKRW(balance)}</p>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-800 mb-1">내 잔액</label>
                      <div className="rounded-lg border px-3 py-2 text-sm bg-gray-200 h-[36px] flex items-center">
                        {isLoading ? '조회중...' : formatKRW(balance)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">수수료 제외 기준</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={() => handleTabChange('fav')} className={`rounded-full px-3 py-1 text-sm ${activeTab === 'fav' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>최근 이체</button>
                      <button onClick={() => handleTabChange('new')} className={`rounded-full px-3 py-1 text-sm ${activeTab === 'new' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>신규 입력</button>
                      <button onClick={() => handleTabChange('my')} className={`rounded-full px-3 py-1 text-sm ${activeTab === 'my' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>내 계좌</button>
                    </div>

                    {/* 최근 이체 탭 */}
                    {activeTab === 'fav' && (
                      <div id="tab-fav" className="min-h-[200px]">
                        {recentRecipients.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {recentRecipients.map((recipient, index) => (
                              <button 
                                key={index} 
                                onClick={() => handleSelectRecentRecipient(recipient)} 
                                className={`rounded-xl border p-4 text-left hover:shadow transition-all ${
                                  selectedRecipient?.account === recipient.account 
                                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600' 
                                    : 'bg-white hover:border-blue-300'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="text-sm font-medium text-gray-800">{recipient.name}</div>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{recipient.bank}</span>
                                </div>
                                <div className="text-xs text-gray-500 font-mono">{recipient.account}</div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-400">
                            <svg className="mx-auto mb-2" width="48" height="48" viewBox="0 0 24 24" fill="none">
                              <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <p>최근 이체 내역이 없습니다.</p>
                            <p className="text-xs mt-1">이체를 실행하면 여기에 표시됩니다.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 신규 입력 탭 */}
                    {activeTab === 'new' && (
                      <div id="tab-new" className="space-y-4 min-h-[200px]">
                        <div className="space-y-4">
                          <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-12 md:col-span-6">
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
                            <div className="col-span-12 md:col-span-6">
                              <label className="block text-sm font-medium text-gray-800 mb-1">계좌번호</label>
                              <input 
                                type="text" 
                                value={newAccountNumber}
                                onChange={(e) => handleAccountNumberChange(e.target.value)}
                                placeholder={selectedBank ? "숫자만 입력하세요" : "은행을 먼저 선택하세요"}
                                className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                disabled={!selectedBank}
                              />
                              {selectedBank && (
                                <p className="text-xs text-gray-500 mt-1">
                                  숫자만 입력하면 자동으로 포맷됩니다
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">은행과 계좌번호를 모두 입력하면 자동으로 예금주를 조회합니다.</p>
                          
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
                                  <div className="text-sm text-green-800">
                                    <div><strong>예금주:</strong> {accountHolder}</div>
                                  </div>
                                  <div className="text-xs text-green-700 mt-2">
                                    금액을 입력하고 이체를 진행하세요.
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {selectedBank && newAccountNumber && newAccountNumber.length >= 10 && !accountHolder && !isVerifying && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                              <div className="flex items-center gap-2 text-sm text-red-800">
                                <svg className="text-red-600" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                예금주를 찾을 수 없습니다. 은행과 계좌번호를 다시 확인해주세요.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 내 계좌 탭 */}
                    {activeTab === 'my' && (
                      <div id="tab-my" className="min-h-[200px]">
                        {myOtherAccounts.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {myOtherAccounts
                              .filter(acc => acc.aNo !== selectedAccount?.aNo)
                              .map(acc => (
                                <button 
                                  key={acc.aNo} 
                                  onClick={() => handleSelectMyAccount(acc)} 
                                  className={`rounded-xl border p-4 text-left hover:shadow transition-all ${
                                    selectedRecipient?.account === acc.accountNo 
                                      ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600' 
                                      : 'bg-white hover:border-blue-300'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="text-sm font-medium text-gray-800">{acc.accountType}</div>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">내 계좌</span>
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono mb-1">{acc.accountNo}</div>
                                  <div className="text-sm font-semibold text-gray-900">{formatKRW(acc.balance)}</div>
                                </button>
                              ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-400">
                            <p>이체 가능한 다른 계좌가 없습니다.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-800 mb-1">보낼 금액</label>
                      <div className="relative">
                        <input 
                          value={formattedAmount} 
                          onChange={handleAmountChange} 
                          inputMode="numeric" 
                          className="w-full rounded-lg border-gray-300 bg-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" 
                          placeholder="0" 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                          <button onClick={() => handleAddAmount(100000)} className="text-sm text-blue-600 hover:underline">+10만</button>
                          <button onClick={() => handleAddAmount(500000)} className="text-sm text-blue-600 hover:underline">+50만</button>
                          <button onClick={() => handleAddAmount(1000000)} className="text-sm text-blue-600 hover:underline">+100만</button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">수수료 <b>{formatKRW(fee)}</b> (즉시이체 기준)</p>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-800 mb-1">받는 분 메모</label>
                      <input value={memo} onChange={e => setMemo(e.target.value)} maxLength="10" className="w-full rounded-lg border-gray-300 bg-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="예: 점심값" />
                      <p className="text-xs text-gray-500 mt-1">통장표시 10자 내외</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* 토글 버튼들 */}
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          className="peer sr-only" 
                          checked={isReserved} 
                          onChange={e => {
                            setIsReserved(e.target.checked);
                            if (e.target.checked) setIsAutoTransfer(false);
                          }} 
                        />
                        <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-300 peer-checked:bg-blue-600 transition">
                          <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></span>
                        </span>
                        <span className="text-sm text-gray-700">예약 이체</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          className="peer sr-only" 
                          checked={isAutoTransfer} 
                          onChange={e => {
                            setIsAutoTransfer(e.target.checked);
                            if (e.target.checked) setIsReserved(false);
                          }} 
                        />
                        <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-300 peer-checked:bg-blue-600 transition">
                          <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></span>
                        </span>
                        <span className="text-sm text-gray-700">자동이체</span>
                      </label>
                      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-gray-700">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 8h.01M12 12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        이체 전 잘못된 계좌/금액 경고창 표시
                      </span>
                    </div>

                    {/* 예약 이체 입력 필드 */}
                    {isReserved && (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 4v2m10-2v2M4 10h16M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="font-medium">예약 이체 설정</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <input type="date" className="rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" value={reserveDate} onChange={e => setReserveDate(e.target.value)} />
                          <input type="time" className="rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" value={reserveTime} onChange={e => setReserveTime(e.target.value)} />
                          <span className="text-gray-500">에 이체됩니다</span>
                        </div>
                      </div>
                    )}

                    {/* 자동이체 입력 필드 */}
                    {isAutoTransfer && (
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          <span className="font-medium">자동이체 설정</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">시작 연도</label>
                            <select 
                              value={autoStartYear} 
                              onChange={e => setAutoStartYear(parseInt(e.target.value))}
                              className="w-full rounded-lg border-gray-300 bg-gray-100 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            >
                              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                                <option key={year} value={year}>{year}년</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">시작 월</label>
                            <select 
                              value={autoStartMonth} 
                              onChange={e => setAutoStartMonth(parseInt(e.target.value))}
                              className="w-full rounded-lg border-gray-300 bg-gray-100 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month}>{month}월</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">매월 지정일</label>
                            <select 
                              value={autoDayOfMonth} 
                              onChange={e => setAutoDayOfMonth(e.target.value ? parseInt(e.target.value) : '')}
                              className="w-full rounded-lg border-gray-300 bg-gray-100 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            >
                              <option value="">날짜 선택</option>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <option key={day} value={day}>{day}일</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">반복 횟수</label>
                            <select 
                              value={autoRepeatCount} 
                              onChange={e => setAutoRepeatCount(e.target.value ? parseInt(e.target.value) : '')}
                              className="w-full rounded-lg border-gray-300 bg-gray-100 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                            >
                              <option value="">횟수 선택</option>
                              {Array.from({ length: 24 }, (_, i) => i + 1).map(count => (
                                <option key={count} value={count}>{count}회</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col items-end justify-end gap-1">
                            {autoDayOfMonth && autoRepeatCount && amount && (
                              <>
                                <div className="text-xs font-medium text-gray-700">
                                  총 금액: {formatKRW((parseInt(amount.replace(/[^0-9]/g, '')) || 0) * parseInt(autoRepeatCount))}
                                </div>
                                <div className="text-xs text-gray-500">매월 {autoDayOfMonth}일마다 {autoRepeatCount}회 반복</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="rounded-xl border bg-gray-50 p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7h18v10H3V7Zm0 3h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      이체 후 예상 잔액
                    </div>
                    <div className="font-semibold font-mono">{remainingBalance}</div>
                  </div>

                  {/* 에러 메시지 표시 */}
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={handleCancel} 
                      className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button 
                      onClick={handleNextStep} 
                      disabled={numericAmount === 0 || !selectedRecipient || isLoading || !selectedAccount} 
                      className="rounded-full bg-blue-700 text-white px-5 py-2 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                    >
                      {isLoading ? '처리중...' : '다음'}
                    </button>
                  </div>
                </div>
              </section>
            )}

          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">이체 안내</h2>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>실시간 이체 가능 시간: 24시간 (시스템 점검 제외)</li>
                <li>예약 이체 수수료는 면제됩니다.</li>
                <li>이체 한도 변경은 마이페이지 &gt; 한도관리에서 가능합니다.</li>
              </ul>
            </section>
            <section className="rounded-2xl border bg-amber-50 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">보안 주의</h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 8h.01M12 12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
                스미싱/피싱이 의심되면 즉시 고객센터로 연락하세요. 계좌번호/OTP를 절대 제3자에게 공유하지 마세요.
              </div>
            </section>
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 이체 대상</h2>
              <div className="space-y-2 text-sm">
                {recentRecipients.length > 0 ? (
                  recentRecipients.map((recipient, index) => (
                    <button 
                      key={index}
                      onClick={() => handleSelectRecentRecipient(recipient)}
                      className="w-full rounded-lg border px-3 py-2 text-left hover:bg-gray-50 hover:border-blue-300 transition-colors"
                    >
                      {recipient.name} · {recipient.bank} · {recipient.account}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    최근 이체 내역이 없습니다.
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>
      
      <TransferConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmTransfer}
        data={{
          amount: numericAmount,
          fee,
          memo,
          recipient: selectedRecipient,
          fromAccountDisplay: selectedAccount ? `${selectedAccount.accountType} · ${selectedAccount.accountNumber}` : "계좌를 선택하세요",
          isAutoTransfer: isAutoTransfer,
          autoStartYear: autoStartYear,
          autoStartMonth: autoStartMonth,
          autoDayOfMonth: autoDayOfMonth ? parseInt(autoDayOfMonth) : '',
          autoRepeatCount: autoRepeatCount ? parseInt(autoRepeatCount) : ''
        }}
      />
    </div>
  );
}