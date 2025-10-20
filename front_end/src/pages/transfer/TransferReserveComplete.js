import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TransferReserveComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const reserveData = location.state?.reserveData;

  const formatKRW = (n) => `₩${(n || 0).toLocaleString('ko-KR')}`;
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'short'
    });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleNewTransfer = () => {
    navigate('/transfer');
  };

  if (!reserveData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">예약 이체 정보를 찾을 수 없습니다</h1>
          <button 
            onClick={handleGoHome}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-screen-xl px-6 py-8">
        {/* 성공 아이콘 및 제목 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">예약 이체가 등록되었습니다</h1>
          <p className="text-gray-600">예약된 시간에 자동으로 이체가 실행됩니다</p>
        </div>

        {/* 예약 정보 카드 */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">예약 이체 정보</h2>
          
          <div className="space-y-4">
            {/* 이체 금액 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">이체 금액</span>
              <span className="text-2xl font-bold text-gray-900">{formatKRW(reserveData.amount)}</span>
            </div>

            {/* 수취인 정보 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">수취인</span>
              <div className="text-right">
                <div className="font-medium text-gray-900">{reserveData.toName}</div>
                <div className="text-sm text-gray-500">{reserveData.toBank} · {reserveData.toAccount}</div>
              </div>
            </div>

            {/* 예약 시간 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">예약 시간</span>
              <span className="font-medium text-gray-900">{formatDateTime(reserveData.startAt)}</span>
            </div>

            {/* 출금 계좌 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">출금 계좌</span>
              <div className="text-right">
                <div className="font-medium text-gray-900">{reserveData.fromAccountType} · {reserveData.fromAccountNo}</div>
                <div className="text-sm text-gray-500">잔액 {formatKRW(reserveData.fromAccountBalance)}</div>
              </div>
            </div>

            {/* 메모 */}
            {reserveData.memo && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">메모</span>
                <span className="font-medium text-gray-900">{reserveData.memo}</span>
              </div>
            )}

            {/* 예약 번호 */}
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">예약 번호</span>
              <span className="font-mono text-sm text-gray-500">{reserveData.orderId}</span>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="max-w-2xl mx-auto bg-blue-50 rounded-xl p-4 mb-8">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">예약 이체 안내</p>
              <ul className="space-y-1 text-blue-700">
                <li>• 예약된 시간에 자동으로 이체가 실행됩니다</li>
                <li>• 출금 계좌 잔액이 부족할 경우 이체가 실패할 수 있습니다</li>
                <li>• 예약 이체는 계좌 관리 메뉴에서 확인 및 취소할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGoHome}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            홈으로 가기
          </button>
          <button
            onClick={handleNewTransfer}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            새 이체하기
          </button>
        </div>
      </main>
    </div>
  );
}
