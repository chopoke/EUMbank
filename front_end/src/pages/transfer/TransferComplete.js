import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TransferComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const [transferData, setTransferData] = useState(null);
  const [transactionInfo, setTransactionInfo] = useState({
    transactionId: '',
    timestamp: '',
    remainingBalance: 0
  });

  useEffect(() => {
    // location.state에서 이체 데이터 가져오기
    if (location.state?.transferData) {
      setTransferData(location.state.transferData);
      setTransactionInfo({
        transactionId: 'TRX-' + Date.now(),
        timestamp: new Date().toLocaleString('ko-KR'),
        remainingBalance: 17198450 // 임시값, 실제로는 계산 필요
      });
    } else {
      // 데이터가 없으면 이체 페이지로 리다이렉트
      navigate('/transfer');
    }
  }, [location.state, navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://neobank.example/transfer/${transactionInfo.transactionId}`);
      alert('공유 링크가 복사되었습니다.');
    } catch (e) {
      alert('복사 실패. 브라우저 권한을 확인하세요.');
    }
  };

  const handleReTransfer = () => {
    navigate('/transfer', { state: { prefilledData: transferData } });
  };

  const handleSaveToFavorites = () => {
    // 자주 쓰는 계좌 등록 로직
    alert('자주 쓰는 계좌로 등록되었습니다.');
  };

  const handleCreateSchedule = () => {
    // 예약 이체 생성 로직
    navigate('/transfer', { state: { createSchedule: true, prefilledData: transferData } });
  };

  if (!transferData) {
    return <div>로딩 중...</div>;
  }

  const amount = parseInt((transferData.amount || '0').replace(/[^0-9]/g, ''));
  const fee = 500;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      <main id="main">
        {/* Breadcrumb & Title */}
        <section className="mx-auto max-w-screen-xl px-6 py-6">
          <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
            <ol className="flex items-center gap-2">
              <li className="hover:underline cursor-pointer">이체</li>
              <li aria-hidden>›</li>
              <li className="text-gray-900">처리 완료</li>
            </ol>
          </nav>
          <div className="mt-2 flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">이체 완료</h1>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-gray-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              성공
            </span>
          </div>
        </section>

        <section className="mx-auto max-w-screen-xl px-6 pb-12 grid grid-cols-12 gap-6">
          {/* Left: Receipt & Next actions */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">영수증</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">이체번호</div>
                  <div className="font-medium">{transactionInfo.transactionId}</div>
                  <div className="text-sm text-gray-500 mt-4">처리시각</div>
                  <div className="font-medium">{transactionInfo.timestamp}</div>
                  <div className="text-sm text-gray-500 mt-4">보내는 계좌</div>
                  <div className="font-medium">입출금통장 · 110-123-456789</div>
                  <div className="text-sm text-gray-500 mt-4">받는 분</div>
                  <div className="font-medium">{transferData.toBank} · {transferData.toAccount}</div>
                  <div className="text-sm text-gray-500">예금주</div>
                  <div className="font-medium">{transferData.toName}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">보낸 금액</div>
                  <div className="text-2xl font-bold">₩{formatCurrency(amount)}</div>
                  <div className="text-sm text-gray-500">수수료</div>
                  <div className="font-medium">₩{formatCurrency(fee)}</div>
                  <div className="text-sm text-gray-500 mt-4">통장표시(메모)</div>
                  <div className="font-medium">{transferData.memo || '-'}</div>
                  <div className="text-sm text-gray-500 mt-4">이체 후 잔액</div>
                  <div className="font-medium">₩{formatCurrency(transactionInfo.remainingBalance)}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <span>알림: SMS 발송</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button 
                  onClick={handlePrint}
                  className="rounded-full bg-blue-700 text-white px-5 py-2 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  영수증 저장/인쇄
                </button>
                <button 
                  onClick={handleCopyLink}
                  className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50"
                >
                  공유 링크 복사
                </button>
                <button className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50">
                  PDF로 저장
                </button>
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">다음에 할 일</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <button 
                  onClick={handleReTransfer}
                  className="rounded-xl border bg-white p-4 text-left hover:shadow"
                >
                  <div className="font-medium">같은 대상 재이체</div>
                  <p className="mt-1 text-gray-600">반복 송금 시 편리</p>
                </button>
                <button 
                  onClick={handleSaveToFavorites}
                  className="rounded-xl border bg-white p-4 text-left hover:shadow"
                >
                  <div className="font-medium">자주 쓰는 대상 등록</div>
                  <p className="mt-1 text-gray-600">연락처/별칭 저장</p>
                </button>
                <button 
                  onClick={handleCreateSchedule}
                  className="rounded-xl border bg-white p-4 text-left hover:shadow"
                >
                  <div className="font-medium">예약 이체 만들기</div>
                  <p className="mt-1 text-gray-600">매월/매주 자동</p>
                </button>
              </div>
            </section>
          </div>

          {/* Right: side panel */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">주의 및 안내</h2>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>이체 후 취소는 불가하며, 오류 시 고객센터에 즉시 문의하세요.</li>
                <li>사기 의심 계좌 신고는 거래내역에서 가능합니다.</li>
                <li>영수증은 마이페이지 &gt; 거래내역에서 언제든 재발급할 수 있습니다.</li>
              </ul>
            </section>

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">고객지원</h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8h.01M12 12v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="text-sm text-gray-700">
                문의: 1588-0000 (연중무휴) · 챗봇 24시간
              </div>
            </section>
          </div>
        </section>
      </main>

    </div>
  );
}