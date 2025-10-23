import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 다건이체 완료 페이지
 * - 각 이체 결과를 카드 형태로 표시
 * - 성공: 초록색, 실패: 빨간색
 */
export default function BulkTransferComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    // location.state에서 다건이체 결과 가져오기
    if (location.state?.bulkTransferResults) {
      const data = location.state.bulkTransferResults;
      console.log('다건이체 완료 페이지 - 받은 데이터:', data);
      console.log('results:', data.results);
      console.log('successCount:', data.successCount);
      console.log('failCount:', data.failCount);
      
      setResults(data.results);
      setSummary({
        totalCount: data.totalCount,
        successCount: data.successCount,
        failCount: data.failCount,
        finalBalance: data.finalBalance
      });
    } else {
      console.log('다건이체 결과 데이터가 없음, 리다이렉트');
      // 데이터가 없으면 다건이체 페이지로 리다이렉트
      navigate('/transfer/bulk');
    }
  }, [location.state, navigate]);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (!results || !summary) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">

      <main className="mx-auto max-w-screen-xl px-6 py-8">
        {/* 요약 카드 */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">다건이체 완료</h1>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              summary.failCount === 0 ? 'bg-cyan-100 text-cyan-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
              {summary.failCount === 0 ? '전체 성공' : '일부 실패'}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-600">전체</div>
              <div className="text-2xl font-bold">{summary.totalCount}건</div>
            </div>
            <div className="p-4 rounded-lg bg-sky-100">
              <div className="text-sm text-sky-600">성공</div>
              <div className="text-2xl font-bold text-sky-600">{summary.successCount}건</div>
            </div>
            <div className={`p-4 rounded-lg ${summary.failCount > 0 ? 'bg-red-100' : 'bg-gray-50'}`}>
              <div className={`text-sm ${summary.failCount > 0 ? 'text-red-700' : 'text-gray-700'}`}>실패</div>
              <div className={`text-2xl font-bold ${summary.failCount > 0 ? 'text-red-700' : 'text-gray-700'}`}>{summary.failCount}건</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-100">
              <div className="text-sm text-blue-700">최종 잔액</div>
              <div className="text-2xl font-bold text-blue-700">₩{formatCurrency(summary.finalBalance)}</div>
            </div>
          </div>
        </section>

        {/* 이체 결과 목록 */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">이체 결과 상세</h2>
          
          {results.map((result, index) => (
            <div key={index} className={`rounded-xl border p-5 ${
              result.success 
                ? 'bg-white border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <svg className="text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                      </svg>
                    ) : (
                      <svg className="text-red-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    )}
                    <span className={`font-semibold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.success ? '이체 성공' : '이체 실패'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-gray-600">수취인</div>
                      <div className="font-medium">{result.toAccountHolder || result.recipientName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">계좌</div>
                      <div className="font-medium font-mono">{result.toBankName || result.recipientBank} · {result.toAccountNo || result.recipientAccount}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">금액</div>
                      <div className="text-lg font-bold">₩{formatCurrency(result.amount)}</div>
                    </div>
                    {result.success ? (
                      <div>
                        <div className="text-sm text-gray-600">이체 후 잔액</div>
                        <div className="font-medium">₩{formatCurrency(result.afterBalance)}</div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm text-red-700">실패 사유</div>
                        <div className="font-medium text-red-700">{result.errorMessage || result.message}</div>
                      </div>
                    )}
                  </div>
                  
                  {result.success && result.transferId && (
                    <div className="mt-3 text-xs text-gray-500">
                      거래번호: {result.transferId}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 액션 버튼 */}
        <section className="mt-8 flex justify-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="rounded-full border border-gray-300 px-6 py-3 text-sm text-white bg-blue-700 hover:bg-blue-800"
          >
            홈으로 가기
          </button>
          <button 
            onClick={() => navigate('/transfer/bulk')}
            className="rounded-full border border-gray-300 px-6 py-3 text-sm text-gray-500 bg-gray-200 hover:bg-gray-300"
          >
            다건이체 다시하기
          </button>
          <button 
            onClick={() => navigate('/transfer')}
            className="rounded-full bg-blue-700 px-6 py-3 text-sm text-gray-500 bg-gray-200 hover:bg-gray-300"
          >
            일반 이체로 이동
          </button>
        </section>
      </main>
    </div>
  );
}

