import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { transferApi } from '../../api/transferApi';

// 요청하신 '단건 이체' 페이지의 모달을 그대로 가져와 적용했습니다.
function BulkTransferConfirmModal({ isOpen, onClose, onConfirm, data }) {
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
  const won = (n) => `₩${Number(n || 0).toLocaleString('ko-KR')}`;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm({ password });
    } catch (error) {
      console.error('다건이체 실행 중 오류:', error);
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
          <h1 id="dlg-title" className="text-lg font-semibold">다건이체 정보 확인</h1>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-gray-700">
            계좌 비밀번호 필요
          </span>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-500">보내는 계좌</div>
              <div className="text-lg font-semibold">{data.fromAccountDisplay}</div>
              <div className="text-sm text-gray-500 mt-4">총 이체 건수</div>
              <div className="text-lg font-semibold">{data.count} 건</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">총 이체 금액</div>
              <div className="text-2xl font-bold font-mono">{won(data.totalAmount)}</div>
              <div className="text-sm text-gray-500">수수료</div>
              <div className="font-medium font-mono">{won(data.fee)}</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
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
            다건이체는 순차적으로 처리되며, 일부 실패 시 성공한 건만 처리됩니다.
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

// 메인 페이지 컴포넌트
export default function BulkTransferPage() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks] = useState([
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
  ]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [globalMemo, setGlobalMemo] = useState("");
  const [rows, setRows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const won = (n) => `₩${Number(n || 0).toLocaleString('ko-KR')}`;
  const randId = () => Math.random().toString(36).slice(2, 9);
  
  const bankAccountFormats = {
    'EUM': [3, 3, 6], 'KB': [3, 2, 4, 3], 'SH': [3, 2, 6], 'WR': [4, 3, 6],
    'HN': [3, 6, 5], 'NH': [3, 4, 4, 2], 'IBK': [3, 6, 2, 3], 'SC': [3, 2, 6],
    'KAKAO': [4, 2, 7], 'TOSS': [4, 4, 6], 'KBANK': [3, 3, 6]
  };
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
      } else break;
    }
    return formatted;
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setError(null); setIsLoading(true);
        const [accRes, bankRes] = await Promise.all([transferApi.getAccounts(), transferApi.getBanks()]);
        
        // 계좌 목록 처리 - 새로운 API 응답 구조에 맞춰 수정
        if (accRes.data && accRes.data.success && accRes.data.data && accRes.data.data.accounts) {
          const accounts = accRes.data.data.accounts;
          if (accounts.length > 0) {
            setAccounts(accounts);
            setSelectedAccount(accounts[0]);
          } else {
            throw new Error("보유 계좌가 없습니다.");
          }
        } else {
          throw new Error("계좌 조회 실패: " + (accRes.data?.message || "알 수 없는 오류"));
        }

        // 은행 목록 처리 - API 성공 시 업데이트 (하드코딩된 목록은 이미 초기화됨)
        // 백엔드 응답 구조: { success: true, data: { banks: [...] } }
        if (bankRes.data && bankRes.data.success && bankRes.data.data) {
          let banksData = null;
          
          // 응답 구조 확인: data.banks 또는 data가 배열인 경우
          if (bankRes.data.data.banks && Array.isArray(bankRes.data.data.banks)) {
            banksData = bankRes.data.data.banks;
          } else if (Array.isArray(bankRes.data.data)) {
            banksData = bankRes.data.data;
          }
          
          if (banksData && Array.isArray(banksData) && banksData.length > 0) {
            // EUM이 포함되어 있는지 확인
            const hasEUM = banksData.some(b => b.code === 'EUM');
            if (!hasEUM) {
              console.warn('API 응답에 EUM이 없음. 초기값 유지 또는 EUM 추가');
              // EUM을 첫 번째로 추가
              banksData = [{ code: 'EUM', name: '이음은행' }, ...banksData];
            }
            setBanks(banksData);
          } else {
            console.warn('은행 데이터가 배열이 아니거나 비어있음. 초기값 유지');
          }
        } else {
          console.warn('은행 목록 API 응답 실패 또는 형식 오류. 초기값 유지');
        }
        
        setRows([makeRow()]);
      } catch (err) {
        console.error('초기 데이터 로딩 실패:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const makeRow = () => ({ id: randId(), bankCode: '', account: '', holder: '', amount: '', formattedAmount: '', memo: '', isVerifying: false, debounceTimer: null });
  const addRow = () => setRows(prev => [...prev, makeRow()]);
  const removeRow = (id) => setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : [makeRow()]);
  const setRow = (id, patch) => setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  
  // 금액 포맷팅 함수 (3자리마다 콤마)
  const formatAmount = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 금액 입력 처리 함수
  const handleAmountChange = (rowId, inputValue) => {
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    
    // 최대 1억원 제한
    if (parseInt(numericValue) > 100000000) {
      return;
    }
    
    setRow(rowId, { 
      amount: numericValue,
      formattedAmount: formatAmount(numericValue)
    });
  };
  const clearAll = () => setRows([makeRow()]);
  
  const handleAccountChange = (account) => {
    setSelectedAccount(account);
  };

  const handleBankChangeForRow = (rowId, bankCode) => {
    const bank = banks.find(b => b.code === bankCode);
    const currentRow = rows.find(r => r.id === rowId);
    if(currentRow?.debounceTimer) clearTimeout(currentRow.debounceTimer);
    setRow(rowId, { bankCode, bankName: bank?.name || '', holder: '', account: '', debounceTimer: null });
  };
  
  const handleAccountNumberChangeForRow = (rowId, value, bankCode) => {
    const formatted = formatAccountNumber(value, bankCode);
    setRow(rowId, { account: formatted });
    const currentRow = rows.find(r => r.id === rowId);
    if(currentRow?.debounceTimer) clearTimeout(currentRow.debounceTimer);

    const newTimer = setTimeout(async () => {
      if (bankCode && formatted.replace(/-/g, '').length >= 10) {
        setRow(rowId, { isVerifying: true });
        try {
          const res = await transferApi.getAccountHolder(bankCode, formatted);
          if (res.data && res.data.success && res.data.data && res.data.data.accountHolder) {
            setRow(rowId, { holder: res.data.data.accountHolder });
          } else {
            setRow(rowId, { holder: '존재하지 않는 계좌' });
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            setRow(rowId, { holder: '존재하지 않는 계좌' });
          } else if (error.response && error.response.status === 400) {
            setRow(rowId, { holder: '계좌번호 형식 오류' });
          } else {
            setRow(rowId, { holder: '조회 실패' });
          }
        } finally { 
          setRow(rowId, { isVerifying: false }); 
        }
      }
    }, 800);
    setRow(rowId, { debounceTimer: newTimer });
  };

  const totals = useMemo(() => {
    let count = 0, totalAmount = 0, fee = 0, hasError = false;
    for (const r of rows) {
      const amount = parseInt(String(r.amount || '').replace(/[^0-9]/g, ''), 10) || 0;
      if (amount > 0 && r.bankCode && r.account && r.holder && r.holder !== '예금주 없음') {
        count++; totalAmount += amount;
      } else if (r.bankCode || r.account || r.amount) {
        hasError = true;
      }
    }
    return { count, totalAmount, fee, hasError };
  }, [rows]);

  const canProceed = totals.count > 0 && !totals.hasError;

  const handleConfirmTransfer = async ({ password }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // RecipientDto 구조에 맞춰 수취인 목록 생성
      const recipients = rows.filter(r => r.account && r.holder && parseInt(String(r.amount).replace(/,/g, '')) > 0)
        .map(r => ({
          bank: r.bankName,           // String (수취 은행명)
          account: r.account,         // String (수취 계좌번호)
          name: r.holder,             // String (수취인명)
          amount: parseInt(String(r.amount).replace(/,/g, '')), // Integer (이체 금액)
          memo: r.memo || globalMemo  // String (메모)
        }));

      // BulkTransferRequestDto 구조에 맞춰 요청 데이터 생성
      const requestData = {
        fromAccountNo: selectedAccount.aNo,  // Integer (출금 계좌 번호)
        password: password,                  // String (계좌 비밀번호)
        recipients: recipients               // List<RecipientDto> (수취인 목록)
      };

      const response = await transferApi.createBulkTransfer(requestData);

      if (response.data && response.data.success === true) {
        console.log('다건이체 응답 데이터:', response.data);
        navigate('/transfer/bulk/complete', { state: { bulkTransferResults: response.data.data } });
      } else {
        // 다건이체 실패 시 alert로 에러 메시지 표시하고 완료 페이지로 이동하지 않음
        const errorMessage = response.data?.message || response.data?.error || '다건이체에 실패했습니다.';
        console.error('다건이체 실패 응답:', response.data);
        alert(`다건이체 실패: ${errorMessage}`);
        setIsModalOpen(false); // 모달 닫기
        return; // 함수 종료 (완료 페이지로 이동하지 않음)
      }
    } catch (err) {
      console.error('다건이체 실행 실패:', err);
      
      // 백엔드에서 보내는 구체적인 에러 메시지 추출
      let errorMessage = '다건이체 처리 중 오류가 발생했습니다.';
      let errorCode = null;
      
      if (err.response && err.response.data) {
        errorMessage = err.response.data.error || err.response.data.message || errorMessage;
        errorCode = err.response.data.errorCode;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // 실패 사유별 구분된 메시지 표시
      let userFriendlyMessage = errorMessage;
      
      if (errorCode) {
        switch (errorCode) {
          case 'ACCOUNT_NOT_FOUND':
            userFriendlyMessage = '존재하지 않는 계좌가 포함되어 있습니다.';
            break;
          case 'INSUFFICIENT_BALANCE':
            userFriendlyMessage = '잔액이 부족합니다.';
            break;
          case 'PASSWORD_MISMATCH':
            userFriendlyMessage = '계좌 비밀번호가 일치하지 않습니다.';
            break;
          case 'ACCOUNT_SUSPENDED':
            userFriendlyMessage = '거래가 제한된 계좌가 포함되어 있습니다.';
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
            userFriendlyMessage = '이체는 원화 계좌만 사용 가능합니다. 외화 계좌가 포함되어 있습니다.';
            break;
          default:
            userFriendlyMessage = errorMessage;
        }
      }
      
      setError(userFriendlyMessage);
      alert(`다건이체 실패: ${userFriendlyMessage}`);
      setIsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <BulkTransferConfirmModal
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmTransfer}
          data={{
            fromAccountDisplay: selectedAccount ? `${selectedAccount.accountType} · ${selectedAccount.accountNo}`: '',
            count: totals.count, totalAmount: totals.totalAmount, fee: totals.fee
          }}
      />
      <main className="mx-auto max-w-screen-xl px-6 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">다건이체</h1>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/transfer')}
              className="inline-flex items-center gap-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              단건이체
            </button>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-gray-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              이체 전 보안 점검
            </span>
          </div>
        </div>
        <p className="text-gray-500 mb-6">여러 계좌에 한 번에 이체할 수 있습니다.</p>

        {error && <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 text-sm">{error}</div>}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-5">보내는 계좌 및 옵션</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">보내는 계좌</label>
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
                         {acc.accountType} · {acc.accountNo}
                       </option>
                     ))}
                   </select>
                  {selectedAccount && <p className="text-xs text-gray-500 mt-1">잔액 {won(selectedAccount.balance)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">일괄 메모(선택)</label>
                  <input value={globalMemo} onChange={e => setGlobalMemo(e.target.value)} placeholder="모든 항목에 동일 메모 적용"
                         className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
              </div>
              
              <hr className="my-6"/>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">이체 대상 목록 ({rows.length})</h2>
                <div className="flex gap-2">
                  <button onClick={addRow} className="rounded-full bg-blue-700 text-white px-5 py-2 text-sm hover:bg-blue-800">+ 행 추가</button>
                  <button onClick={clearAll} className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50">전체 삭제</button>
                </div>
              </div>
              
              <div className="space-y-3">
                {rows.map((row) => (
                  <div key={row.id} className="border-t pt-5">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
                        <button onClick={() => removeRow(row.id)} className="absolute -top-2 right-0 text-gray-400 hover:text-red-500">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                         </button>
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-1">은행</label>
                          <select value={row.bankCode} onChange={e => handleBankChangeForRow(row.id, e.target.value)} className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                            <option value="">은행 선택</option>
                            {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-1">계좌번호</label>
                          <input value={row.account} onChange={e => handleAccountNumberChangeForRow(row.id, e.target.value, row.bankCode)} placeholder="숫자만 입력" disabled={!row.bankCode}
                                 className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-1">예금주</label>
                          <input value={row.isVerifying ? '조회중...' : row.holder} disabled placeholder="자동 조회"
                                 className="w-full rounded-lg border-gray-300 px-3 py-2 text-sm bg-gray-200 cursor-not-allowed" />
                        </div>
                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-800 mb-1">금액(원)</label>
                          <input 
                            value={row.formattedAmount || ''} 
                            onChange={e => handleAmountChange(row.id, e.target.value)}
                            inputMode="numeric"
                            className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" 
                            placeholder="0"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-800 mb-1">메모</label>
                          <input value={row.memo} onChange={e => setRow(row.id, { memo: e.target.value })}
                                 className="w-full rounded-lg border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <section className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">이체 요약</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">총 이체 건수</span><span className="font-semibold">{totals.count} 건</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">총 이체 금액</span><span className="font-semibold">{won(totals.totalAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">예상 수수료</span><span className="font-semibold">{won(totals.fee)}</span></div>
                </div>
                <hr className="my-4" />
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-base"><span>총 출금될 금액</span><span className="text-blue-700">{won(totals.totalAmount + totals.fee)}</span></div>
                  {selectedAccount && <div className="flex justify-between text-xs text-gray-500"><span>이체 후 잔액</span><span>{won(selectedAccount.balance - totals.totalAmount - totals.fee)}</span></div>}
                </div>
                
                {totals.hasError && <div className="mt-4 p-3 text-xs text-center text-yellow-800 bg-amber-50 border border-amber-200 rounded-lg">입력이 완료되지 않은 항목이 있습니다.</div>}
                
                <button disabled={!canProceed} onClick={() => setIsModalOpen(true)}
                        className="w-full mt-6 py-2.5 text-base font-semibold text-white bg-blue-700 rounded-full shadow-sm hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed">
                  다음
                </button>
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
    </div>
  );
}