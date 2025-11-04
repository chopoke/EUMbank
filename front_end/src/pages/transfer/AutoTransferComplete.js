import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AutoTransferComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const completeData = location.state?.completeData;

  const formatKRW = (n) => `₩${(n || 0).toLocaleString('ko-KR')}`;

  const handleGoHome = () => {
    navigate('/');
  };

  const handleNewTransfer = () => {
    navigate('/transfer');
  };

  if (!completeData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">자동이체 정보를 찾을 수 없습니다</h1>
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto px-6 py-8 max-w-2xl">
        {/* 성공 아이콘 및 제목 */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">자동이체가 등록되었습니다</h1>
          <p className="text-gray-600">매월 지정일에 자동으로 이체가 실행됩니다</p>
        </div>

        {/* 자동이체 정보 카드 */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">자동이체 정보</h2>
          
          <div className="space-y-4">
            {/* 1회당 금액 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">1회당 금액</span>
              <span className="text-xl font-bold text-gray-900">{formatKRW(completeData.amount)}</span>
            </div>

            {/* 총 금액 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">총 금액</span>
              <span className="text-2xl font-bold text-gray-900">{formatKRW(completeData.totalAmount)}</span>
            </div>

            {/* 반복 횟수 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">반복 횟수</span>
              <span className="font-medium text-gray-900">{completeData.repeatCount}회</span>
            </div>

            {/* 수취인 정보 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">수취인</span>
              <div className="text-right">
                <div className="font-medium text-gray-900">{completeData.toName}</div>
                <div className="text-sm text-gray-500">{completeData.toBank} · {completeData.toAccount}</div>
              </div>
            </div>

            {/* 시작 날짜 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">시작 날짜</span>
              <span className="font-medium text-gray-900">{completeData.startDate}</span>
            </div>

            {/* 종료 날짜 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">종료 날짜</span>
              <span className="font-medium text-gray-900">{completeData.endDate}</span>
            </div>

            {/* 출금 계좌 */}
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">출금 계좌</span>
              <div className="text-right">
                <div className="font-medium text-gray-900">{completeData.fromAccountType} · {completeData.fromAccountNo}</div>
                <div className="text-sm text-gray-500">잔액 {formatKRW(completeData.fromAccountBalance)}</div>
              </div>
            </div>

            {/* 메모 */}
            {completeData.memo && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">메모</span>
                <span className="font-medium text-gray-900">{completeData.memo}</span>
              </div>
            )}

            {/* 등록된 예약이체 수 */}
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">등록된 예약이체</span>
              <span className="font-medium text-gray-900">{completeData.repeatCount}건</span>
            </div>
          </div>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 rounded-xl p-4 mb-8">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">자동이체 안내</p>
              <ul className="space-y-1 text-blue-700">
                <li>• 매월 지정일에 자동으로 이체가 실행됩니다</li>
                <li>• 출금 계좌 잔액이 부족할 경우 이체가 실패할 수 있습니다</li>
                <li>• 등록된 예약이체는 계좌 관리 메뉴에서 확인 및 취소할 수 있습니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3">
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

