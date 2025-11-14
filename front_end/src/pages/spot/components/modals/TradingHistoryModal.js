import React, { useEffect, useState } from 'react';
import { fetchTradingHistoryWithPaging } from '../../api/spotApi';
import { downloadTradingHistoryExcel } from '../../../../utils/excelUtils';

/**
 * 거래내역 모달 컴포넌트
 * - 거래내역 페이징: 실제 DB 페이징 (20개씩), 필터링 지원 (거래타입, 금속코드, 지갑명)
 * - 엑셀 다운로드: SheetJS(xlsx) 사용, 전체 데이터 다운로드
 * - 총합 정보: 거래 총액, 수량 등 요약 정보 표시
 * - 기술 스택: React, Spring Boot + JPA + QueryDSL + Spring Data JPA
 */
const TradingHistoryModal = ({ 
  isOpen, 
  onClose, 
  customerNo,
  wallets = []
}) => {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);  // 거래 목록
  const [page, setPage] = useState(0);   // 현재 페이지
  const [size, setSize] = useState(10);   // 페이지 크기
  const [totalElements, setTotalElements] = useState(0); // 거래유형 필터 (매수/매도)
  const [totalPages, setTotalPages] = useState(0);  // 금속 필터 (금/은)
  const [txType, setTxType] = useState(''); // BUY/SELL/''(전체)
  const [metal, setMetal] = useState('');   // AU/AG/''(전체)
  const [walletId, setWalletId] = useState(''); // 현물통장 필터
  const [summary, setSummary] = useState({}); // 총합 정보

  // 거래번호 기준 내림차순 정렬
  const sortByTxNoDesc = (arr = []) => {
    return [...arr].sort((a, b) => {
      const aNo = Number(a?.gNo ?? a?.id ?? a?.txNo ?? 0);
      const bNo = Number(b?.gNo ?? b?.id ?? b?.txNo ?? 0);
      return bNo - aNo;
    });
  };

  // 엑셀 다운로드 함수
  const downloadExcel = async () => {
    if (!customerNo) {
      alert('고객 정보가 없습니다.');
      return;
    }

    setLoading(true);
    try {
      // 전체 데이터를 가져오기 위해 큰 페이지 크기로 요청
      const response = await fetchTradingHistoryWithPaging(
        customerNo, 
        null, // 전체 거래타입
        null, // 전체 금속
        null, // 전체 현물통장
        0, 
        10000 // 큰 페이지 크기로 전체 데이터 가져오기
      );
      
      // 새로운 API 응답 구조 처리
      const transactions = response?.transactions || response;
      const allData = sortByTxNoDesc(transactions?.content || []);
      
      if (allData.length === 0) {
        alert('다운로드할 거래내역이 없습니다.');
        return;
      }

      // SheetJS를 사용한 엑셀 다운로드
      downloadTradingHistoryExcel(allData, '현물거래내역');
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 표 데이터 로딩
  const loadTable = async () => {
    if (!customerNo) {
      console.log('거래내역 조회 실패: customerNo가 없습니다.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetchTradingHistoryWithPaging(
        customerNo,
        txType || null,
        metal || null,
        walletId || null,
        page,
        size
      );
      
      // 새로운 API 응답 구조 처리
      const transactions = response?.transactions || response;
      const content = transactions?.content || [];
      const summary = response?.summary || {};
      
      setRows(sortByTxNoDesc(content));
      setTotalElements(transactions?.totalElements ?? content.length);
      setTotalPages(transactions?.totalPages ?? 1);
      setSummary(summary);
    } catch (e) {
      console.error('거래내역 조회 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // 모달 열릴 때 필터 기본값으로 초기화
      setTxType('');
      setMetal('');
      setWalletId('');
      loadTable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, page, size]);

  // 필터 변경 시 자동으로 데이터 다시 로드
  useEffect(() => {
    if (isOpen) {
      setPage(0); // 필터 변경 시 첫 페이지로 이동
      loadTable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txType, metal, walletId]);

  const resetAndSearch = () => {
    setPage(0);
    loadTable();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-7xl h-5/6 flex flex-col overflow-hidden text-base md:text-lg rounded-lg shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900">거래내역 상세</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadExcel}
              disabled={loading || !customerNo}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              엑셀 다운로드
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* 필터 및 페이지 크기 선택 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              {/* 거래타입 필터 */}
              <label className="font-medium text-gray-700">거래타입:</label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="BUY">매수</option>
                <option value="SELL">매도</option>
              </select>

              {/* 금속코드 필터 */}
              <label className="font-medium text-gray-700">금속:</label>
              <select
                value={metal}
                onChange={(e) => setMetal(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="AU">금</option>
                <option value="AG">은</option>
              </select>

              {/* 현물통장 필터 복원 */}
              <label className="font-medium text-gray-700">현물통장:</label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                {wallets?.map(w => (
                  <option key={w.id ?? w.gwNo} value={w.name ?? w.gwWalletName}>
                    {w.name ?? w.gwWalletName ?? `Wallet ${w.id ?? w.gwNo}`}
                  </option>
                ))}
              </select>

              {/* 페이지 크기 */}
              <label className="font-medium text-gray-700">페이지 크기:</label>
              <select
                value={size}
                onChange={(e)=>{setSize(Number(e.target.value)); setPage(0);}}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5개</option>
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={50}>50개</option>
              </select>
            </div>
            
            <div className="text-gray-600">
              총 {totalElements}건 중 {page * size + 1}-{Math.min((page + 1) * size, totalElements)}건 표시
            </div>
          </div>

          {/* 로딩 표시 */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">거래내역을 불러오는 중...</p>
            </div>
          )}

          {/* 거래내역 테이블 */}
          {!loading && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-base md:text-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">거래번호</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">구분</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">금속</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">현물통장</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">수량(g)</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">단가(원)</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">총액(원)</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">수수료(원)</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">세금(원)</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">거래일시</th>
                    <th className="px-6 py-3 text-left font-medium text-gray-600 uppercase tracking-wider">상태</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-10 text-center text-gray-500">
                        거래 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    rows.map((transaction, idx) => (
                      <tr key={transaction.gNo ?? transaction.id ?? idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {transaction.gNo ?? transaction.id ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (transaction.transactionType ?? transaction.type) === 'BUY' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {(transaction.transactionType ?? transaction.type) === 'BUY' ? '매수' : '매도'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (transaction.metalCode ?? transaction.metal) === 'AU' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {(transaction.metalCode ?? transaction.metal) === 'AU' ? '금(AU)' : '은(AG)'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {transaction.walletName ?? transaction.walletId ?? '기본'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {Number(transaction.quantity ?? transaction.weight ?? 0).toFixed(2)}g
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                          ₩{Math.round(Number(transaction.pricePerG ?? transaction.price ?? 0)).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ₩{Math.round(Number(transaction.totalPrice ?? transaction.amount ?? 0)).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ₩{Math.round(Number(transaction.feeAmount ?? transaction.fee ?? 0)).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          ₩{Math.round(Number(transaction.taxAmount ?? transaction.tax ?? 0)).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                          {transaction.purchasedAt 
                            ? new Date(transaction.purchasedAt).toLocaleString('ko-KR') 
                            : new Date(transaction.transactionDate ?? transaction.createdAt ?? transaction.tradedAt ?? Date.now()).toLocaleString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (transaction.status ?? 'COMPLETED') === 'COMPLETED' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {(transaction.status ?? 'COMPLETED') === 'COMPLETED' ? '완료' : '처리중'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* 총합 정보 표시 */}
          {!loading && summary && Object.keys(summary).length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">거래 총합</h3>
              
              {/* 전체 총합 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600">전체 매수 금액</div>
                  <div className="text-lg font-semibold text-green-600">
                    ₩{Math.round(Number(summary.totalBuyAmount || 0)).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600">전체 매도 금액</div>
                  <div className="text-lg font-semibold text-red-600">
                    ₩{Math.round(Number(summary.totalSellAmount || 0)).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600">전체 수수료</div>
                  <div className="text-lg font-semibold text-blue-600">
                    ₩{Math.round(Number(summary.totalBuyFee || 0) + Number(summary.totalSellFee || 0)).toLocaleString()}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-sm text-gray-600">전체 세금</div>
                  <div className="text-lg font-semibold text-purple-600">
                    ₩{Math.round(Number(summary.totalBuyTax || 0) + Number(summary.totalSellTax || 0)).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 현물통장별 총합 */}
              {summary.walletSummary && Object.keys(summary.walletSummary).length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-3">현물통장별 총합</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(summary.walletSummary).map(([walletName, walletData]) => (
                      <div key={walletName} className="bg-white rounded-lg p-3">
                        <div className="font-semibold text-gray-800 mb-2">{walletName}</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">매수:</span>
                            <span className="text-green-600 font-semibold">
                              ₩{Math.round(Number(walletData.buyAmount || 0)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">매도:</span>
                            <span className="text-red-600 font-semibold">
                              ₩{Math.round(Number(walletData.sellAmount || 0)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">수수료:</span>
                            <span className="text-blue-600 font-semibold">
                              ₩{Math.round(Number(walletData.buyFee || 0) + Number(walletData.sellFee || 0)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">세금:</span>
                            <span className="text-purple-600 font-semibold">
                              ₩{Math.round(Number(walletData.buyTax || 0) + Number(walletData.sellTax || 0)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">평가손익:</span>
                            <span className={`font-semibold ${
                              Number(walletData.evaluationProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Number(walletData.evaluationProfit || 0) >= 0 ? '+' : ''}₩{Math.round(Number(walletData.evaluationProfit || 0)).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">수익률:</span>
                            <span className={`font-semibold ${
                              Number(walletData.profitRate || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Number(walletData.profitRate || 0) >= 0 ? '+' : ''}{Number(walletData.profitRate || 0).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 페이징 */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  처음
                </button>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  이전
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(0, Math.min(totalPages - 5, page - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg ${
                        page === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page + 1 >= totalPages}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  다음
                </button>
                <button
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page + 1 >= totalPages}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  마지막
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingHistoryModal;