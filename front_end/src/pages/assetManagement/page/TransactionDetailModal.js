// src/pages/assetManagement/page/TransactionDetailModal.js
import { useMemo } from "react";

/**
 * 거래 상세 모달 컴포넌트
 * 날짜 클릭 시 해당 날짜의 타인과의 거래 내역을 표시
 */
export default function TransactionDetailModal({ date, transactions, loading, onClose }) {
  const dateStr = date ? date.toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  }) : '';

  const totalIncome = transactions?.totalIncome || 0;
  const totalExpense = transactions?.totalExpense || 0;
  const netChange = transactions?.netChange || 0;
  const transactionList = transactions?.transactions || [];

  // 시간순 정렬 (이미 백엔드에서 정렬되어 있지만 안전장치)
  const sortedTransactions = useMemo(() => {
    return [...transactionList].sort((a, b) => {
      const dateA = new Date(a.transferAt);
      const dateB = new Date(b.transferAt);
      return dateA - dateB;
    });
  }, [transactionList]);

  // 거래 시간 포맷팅
  const formatTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 금액 포맷팅
  const formatAmount = (amount) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  // 모달 외부 클릭 시 닫기 방지
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{dateStr}</h2>
            <p className="text-sm text-gray-500 mt-1">
              타인과의 거래 내역
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            aria-label="닫기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* 요약 정보 */}
        <div className="px-6 pt-4 pb-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">수입</div>
              <div className="text-base font-semibold text-emerald-600">
                {formatAmount(totalIncome)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">지출</div>
              <div className="text-base font-semibold text-red-600">
                {formatAmount(totalExpense)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">순변동</div>
              <div className={`text-base font-semibold ${netChange >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {netChange >= 0 ? '+' : ''}{formatAmount(netChange)}
              </div>
            </div>
          </div>
        </div>

        {/* 거래 내역 리스트 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">거래 내역을 불러오는 중...</div>
            </div>
          ) : sortedTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
              </svg>
              <p className="text-sm">이 날짜에는 거래 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTransactions.map((transaction, index) => {
                const isIncome = transaction.transferType === '입금';
                const amountColor = isIncome ? 'text-emerald-600' : 'text-red-600';
                const amountPrefix = isIncome ? '+' : '-';

                return (
                  <div
                    key={transaction.transferId || index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        {/* 거래 유형 및 시간 */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            isIncome 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {transaction.transferType}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(transaction.transferAt)}
                          </span>
                        </div>

                        {/* 메모 */}
                        {transaction.memo && (
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {transaction.memo}
                          </div>
                        )}

                        {/* 계좌 정보 */}
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <div>
                            내 계좌: <span className="text-gray-700">{transaction.myAccountNickname}</span>
                            <span className="ml-1 text-gray-400">({transaction.myAccountNo})</span>
                          </div>
                          {transaction.otherAccount && transaction.otherAccount !== '***' && (
                            <div>
                              상대 계좌: <span className="text-gray-700">{transaction.otherAccount}</span>
                              {transaction.otherBank && (
                                <span className="ml-1 text-gray-400">({transaction.otherBank})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 금액 */}
                      <div className="text-right ml-4">
                        <div className={`text-lg font-semibold ${amountColor}`}>
                          {amountPrefix}{formatAmount(transaction.amount)}
                        </div>
                        {transaction.afterBalance !== null && (
                          <div className="text-xs text-gray-400 mt-1">
                            잔액: {formatAmount(transaction.afterBalance)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              총 {sortedTransactions.length}건의 거래
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

