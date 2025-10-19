import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { transferApi } from '../../api/transferApi';

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
  const formatKRW = (n) => `₩${(n || 0).toLocaleString('ko-KR')}`;

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
              <div className="text-sm text-gray-500">금액</div>
              <div className="text-2xl font-bold font-mono">{formatKRW(data.amount)}</div>
              <div className="text-sm text-gray-500">수수료</div>
              <div className="font-medium font-mono">{formatKRW(data.fee)}</div>
              <div className="text-sm text-gray-500">메모</div>
              <div className="font-medium">{data.memo || '-'}</div>
            </div>
          </div>

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
  const [memo, setMemo] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [isReserved, setIsReserved] = useState(false);
  const [reserveDate, setReserveDate] = useState('');
  const [reserveTime, setReserveTime] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 자주 쓰는 계좌 목록 (API에서 조회)
  const [favoriteAccounts, setFavoriteAccounts] = useState([]);
  
  // 신규 입력 탭 관련 state
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // 내 계좌 목록 (이체 가능한 다른 계좌들)
  const [myOtherAccounts, setMyOtherAccounts] = useState([]);

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
  
  // 이체 완료 정보 저장
  const [completedTransfer, setCompletedTransfer] = useState(null);

  // 컴포넌트 마운트 시 계좌 목록과 잔액 조회
  useEffect(() => {
    loadAccountsAndBalance();
    loadFavoriteAccounts();
    loadBanks();
    loadRecentRecipients();
  }, []);

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
        
        // 첫 번째 계좌를 기본 선택으로 설정
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
      
    } catch (error) {
      console.error('계좌 정보 로딩 실패:', error.message || '알 수 없는 오류');
      setError('계좌 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 자주 쓰는 계좌 목록 로드 (별도 API)
  const loadFavoriteAccounts = async () => {
    try {
      const response = await transferApi.getFavoriteAccounts();
      if (response.data && response.data.success && response.data.data) {
        setFavoriteAccounts(response.data.data || []);
      }
    } catch (error) {
      console.error('자주 쓰는 계좌 로딩 실패:', error.message || '알 수 없는 오류');
      setFavoriteAccounts([]);
    }
  };

  // 은행 목록 로드
  const loadBanks = async () => {
    try {
      const response = await transferApi.getBanks();
      if (response.success && response.data) {
        setBanks(response.data);
      }
    } catch (error) {
      console.error('은행 목록 로딩 실패:', error.message || '알 수 없는 오류');
      // 에러 발생 시 빈 배열 유지
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
      console.error('수수료 조회 실패:', error.message || '알 수 없는 오류');
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
      loadFavoriteAccounts(); // 자주 쓰는 계좌 로드
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
  
  const formatKRW = (n) => `₩${(n || 0).toLocaleString('ko-KR')}`;
  const numericAmount = useMemo(() => parseInt(String(amount).replace(/[^0-9]/g, ''), 10) || 0, [amount]);
  const remainingBalance = useMemo(() => {
    if (numericAmount === 0 || numericAmount > balance) {
      return formatKRW(balance - numericAmount);
    }
    return formatKRW(balance - (numericAmount + fee));
  }, [numericAmount, balance, fee]);

  // 금액 추가 함수
  const handleAddAmount = (addValue) => setAmount(String(numericAmount + addValue));
  
  // 자주 쓰는 계좌 선택 함수
  const handleSelectFavorite = (account) => {
    setSelectedRecipient(account);
    setError(null);
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
      
      // 은행 + 계좌번호로 예금주명 조회
      const response = await transferApi.getAccountHolder(selectedBank, newAccountNumber);
      
      if (response.data && response.data.success) {
        const holderData = response.data.data;
        setAccountHolder(holderData.holderName);
        setSelectedRecipient({
          name: holderData.holderName,
          bank: banks.find(b => b.code === selectedBank)?.name || selectedBank,
          account: newAccountNumber,
          bankCode: selectedBank
        });
      } else {
        setAccountHolder('');
        setSelectedRecipient(null);
      }
    } catch (error) {
      console.error('예금주 조회 실패:', error.message || '알 수 없는 오류');
      setAccountHolder('');
      setSelectedRecipient(null);
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
          memo: memo                                         // String (메모)
        };
        
        // 예약 이체 생성 API 호출
        const scheduleResponse = await transferApi.createReserveTransfer(requestData);

        if (scheduleResponse.data && scheduleResponse.data.success) {
          alert(`예약 이체가 성공적으로 등록되었습니다.\n예약 시간: ${reserveDate} ${reserveTime}`);
          setIsModalOpen(false);
          // 폼 초기화
          setAmount('');
          setMemo('');
          setIsReserved(false);
          setReserveDate('');
          setReserveTime('');
          return;
        }
      }

      // 즉시 이체 실행
      const response = await transferApi.createTransfer(requestData);

      if (response.data && response.data.success) {
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
        setCompletedTransfer({
          transferId: response.data.data.transferId,
          transferNo: response.data.data.transferNo,
          amount: numericAmount,
          recipient: selectedRecipient,
          timestamp: response.timestamp || new Date().toISOString()
        });
        
        setIsModalOpen(false);
        setStep('done');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // 자주 쓰는 계좌 목록 새로고침
        loadFavoriteAccounts();
        loadRecentRecipients();
      } else {
        throw new Error(response.error || '이체 처리에 실패했습니다.');
      }

    } catch (error) {
      console.error('이체 실행 실패:', error.message || '알 수 없는 오류');
      setError(error.message || '이체 처리 중 오류가 발생했습니다.');
      alert(error.message || '이체 처리 중 오류가 발생했습니다.');
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
      loadRecentRecipientsForAccount(account.aNo);
    } catch (error) {
      console.error('잔액 조회 실패:', error.message || '알 수 없는 오류');
      setBalance(account.balance || 0); // 에러 시 계좌 객체의 잔액 사용
    }
  };

  // 특정 계좌의 최근 이체 대상 로드
  const loadRecentRecipientsForAccount = async (accountNo) => {
    try {
      const response = await transferApi.getRecentRecipients(accountNo);
      if (response.data && response.data.success && response.data.data) {
        setFavoriteAccounts(response.data.data.recipients || []);
      }
    } catch (error) {
      console.error('최근 이체 대상 로딩 실패:', error.message || '알 수 없는 오류');
      setFavoriteAccounts([]);
    }
  };

  // 취소 버튼 핸들러 - 입력 초기화
  const handleCancel = () => {
    setAmount('');
    setMemo('');
    setSelectedRecipient(null);
    setIsReserved(false);
    setReserveDate('');
    setReserveTime('');
    setActiveTab('fav');
    setError(null);
  };

  // 영수증 저장 핸들러
  const handleSaveReceipt = () => {
    if (!completedTransfer) return;
    
    const receiptData = `
=== 이체 영수증 ===
이체번호: ${completedTransfer.transferId}
받는 분: ${completedTransfer.recipient.name}
은행: ${completedTransfer.recipient.bank}
계좌: ${completedTransfer.recipient.account}
금액: ₩${completedTransfer.amount.toLocaleString('ko-KR')}
처리시각: ${new Date(completedTransfer.timestamp).toLocaleString('ko-KR')}
==================
`;
    
    // 텍스트 파일로 다운로드
    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `이체영수증_${completedTransfer.transferId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert('영수증이 저장되었습니다.');
  };

  // 같은 대상 재이체 핸들러
  const handleRetransfer = () => {
    if (!completedTransfer) return;
    
    setStep('form');
    setAmount('');
    setMemo('');
    setSelectedRecipient(completedTransfer.recipient);
    setActiveTab('fav');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 자주 쓰는 대상 등록 핸들러 (이미 자동으로 등록됨)
  const handleAddToFavorites = () => {
    alert('이체한 계좌는 자동으로 자주 쓰는 계좌에 등록됩니다.');
    loadFavoriteAccounts(); // 목록 새로고침
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
        <section className="mx-auto max-w-screen-xl px-6 py-6">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
            <ol className="flex items-center gap-2">
              <li className="hover:underline cursor-pointer">이체</li>
              <li aria-hidden>›</li>
              <li className="text-gray-900">계좌 이체</li>
            </ol>
          </nav>
          <div className="mt-2 flex items-center justify-between">
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

        <section className="mx-auto max-w-screen-xl px-6 pb-12 grid grid-cols-12 gap-6">
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
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                      <div className="rounded-lg border px-3 py-2 text-sm bg-gray-50 h-[54px] flex items-center">
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
                                <div className="text-xs text-gray-500 font-mono mb-1">{recipient.account}</div>
                                <div className="text-sm font-semibold text-gray-900">{formatKRW(recipient.amount)}</div>
                                {recipient.memo && (
                                  <div className="text-xs text-gray-500 mt-1">{recipient.memo}</div>
                                )}
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
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                        <input value={amount} onChange={e => setAmount(e.target.value)} inputMode="numeric" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="0" />
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
                      <input value={memo} onChange={e => setMemo(e.target.value)} maxLength="10" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="예: 점심값" />
                      <p className="text-xs text-gray-500 mt-1">통장표시 10자 내외</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="peer sr-only" checked={isReserved} onChange={e => setIsReserved(e.target.checked)} />
                      <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-300 peer-checked:bg-blue-600 transition">
                        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"></span>
                      </span>
                      <span className="text-sm text-gray-700">예약 이체</span>
                    </label>
                    {isReserved && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M7 4v2m10-2v2M4 10h16M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <input type="date" className="rounded border px-2 py-1" value={reserveDate} onChange={e => setReserveDate(e.target.value)} />
                        <input type="time" className="rounded border px-2 py-1" value={reserveTime} onChange={e => setReserveTime(e.target.value)} />
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-gray-700">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 8h.01M12 12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      이체 전 잘못된 계좌/금액 경고창 표시
                    </span>
                  </div>
                  
                  <div className="rounded-xl border bg-gray-50 p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 7h18v10H3V7Zm0 3h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      이체 후 예상 잔액
                    </div>
                    <div className="font-semibold">{remainingBalance}</div>
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

            {step === 'done' && (
              <section id="step-done" className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">이체 완료</h2>
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-gray-700">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    성공
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">받는 분</div>
                    <div className="text-lg font-semibold">{selectedRecipient.bank} · {selectedRecipient.account}</div>
                    <div className="text-sm text-gray-500">예금주</div>
                    <div className="font-medium">{selectedRecipient.name}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-500">금액</div>
                    <div className="text-2xl font-bold">{formatKRW(numericAmount)}</div>
                    <div className="text-sm text-gray-500">수수료</div>
                    <div className="font-medium">{formatKRW(fee)}</div>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span>이체번호: {completedTransfer?.transferId || 'N/A'}</span>
                  <span>처리시각: {completedTransfer ? new Date(completedTransfer.timestamp).toLocaleTimeString('ko-KR') : new Date().toLocaleTimeString('ko-KR')}</span>
                  <span>알림: SMS 발송</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button 
                    onClick={handleSaveReceipt}
                    className="rounded-full bg-blue-700 text-white px-5 py-2 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    영수증 저장
                  </button>
                  <button 
                    onClick={handleRetransfer}
                    className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50"
                  >
                    같은 대상 재이체
                  </button>
                  <button 
                    onClick={handleAddToFavorites}
                    className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50"
                  >
                    자주 쓰는 대상 등록
                  </button>
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
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
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
          fromAccountDisplay: selectedAccount ? `${selectedAccount.accountType} · ${selectedAccount.accountNumber}` : "계좌를 선택하세요"
        }}
      />
    </div>
  );
}