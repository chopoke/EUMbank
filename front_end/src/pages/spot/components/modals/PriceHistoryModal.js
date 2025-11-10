import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

/**
 * 시세 이력 조회 모달 컴포넌트
 * - 기간별 시세 조회: 5개월, 1년, 3년, 5년, 전체, 커스텀 날짜 선택
 * - 차트 및 테이블 표시: Recharts로 차트, 테이블로 상세 데이터 표시
 * - 가상시뮬레이션: 선택한 기간의 시세 데이터 생성
 * - 성능 최적화: useCallback, React.memo로 리렌더링 최적화
 */
const PriceHistoryModal = ({ 
  isOpen, 
  onClose, 
  metalCode = 'AU', 
  metalName = '금' 
}) => {
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('전체');
  const [chartReady, setChartReady] = useState(false);

  // 기간 선택에 따른 날짜 설정
  const setPeriodDates = (period) => {
    const today = new Date();
    let startDate = new Date();
    
    switch(period) {
      case '5개월':
        startDate = new Date(today.getTime() - 5 * 30 * 24 * 60 * 60 * 1000);
        break;
      case '1년':
        startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '3년':
        startDate = new Date(today.getTime() - 3 * 365 * 24 * 60 * 60 * 1000);
        break;
      case '5년':
        startDate = new Date(today.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
      case '전체':
        startDate = new Date('2025-10-01'); // 전체 기간 시작일
        break;
      default:
        return; // 커스텀 날짜는 변경하지 않음
    }
    
    setStartDate(startDate.toISOString().slice(0, 16));
    setEndDate(today.toISOString().slice(0, 16));
  };

  // 기본 날짜 설정 및 스크롤 위치 고정
  useEffect(() => {
    if (isOpen) {
      setPeriodDates('전체');
      // 스크롤 위치 고정 (더 강력한 방법)
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // 모달 닫힐 때 스크롤 복원
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    
    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen]);


  // 시세 이력 조회 (순수 시뮬레이션)
  const loadPriceHistory = useCallback(async () => {
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 순수 시뮬레이션 데이터 생성 
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);
      const timeDiff = endDateTime.getTime() - startDateTime.getTime();
      
      // 기본 가격 설정
      const basePrice = metalCode === 'AU' ? 808000 : 12000;
      const volatilityPercent = metalCode === 'AU' ? 0.8 : 1.5; // 금 0.8%, 은 1.5%
      
      // 시뮬레이션 데이터 생성 (하루 오전/오후 2번)
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      const points = daysDiff * 2; // 하루에 오전/오후 2번
      let currentPrice = basePrice;
      const series = [];
      
      for (let i = 0; i < points; i++) {
        // 연속적 변동 (상승 중심으로 수정)
        const rand = Math.random() * (volatilityPercent / 100); // 0 ~ volatility% (상승만)
        currentPrice = Math.max(basePrice * 0.8, currentPrice * (1 + rand));
        
        const buyPrice = currentPrice * 1.002;  // 스프레드
        const sellPrice = currentPrice * 0.998; // 스프레드
        const fluctuation = ((currentPrice - basePrice) / basePrice) * 100;
        
        // 하루에 오전/오후 2번 (12시간 간격)
        const dayOffset = Math.floor(i / 2);
        const timeOfDay = i % 2 === 0 ? 9 : 21; // 오전 9시, 오후 9시
        const time = new Date(startDateTime.getTime() + dayOffset * 24 * 60 * 60 * 1000 + timeOfDay * 60 * 60 * 1000);
        
        series.push({
          time: time.toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          basePrice: Math.round(currentPrice),
          buyPrice: Math.round(buyPrice),
          sellPrice: Math.round(sellPrice),
          fluctuation: Math.round(fluctuation * 100) / 100
        });
      }
      
      setPriceHistory(series);
      
      // 차트 렌더링을 위한 지연
      setTimeout(() => {
        setChartReady(true);
      }, 100);
      
    } catch (err) {
      console.error('시세 이력 조회 실패:', err);
      setError('시세 이력을 조회할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, metalCode]);
  
  const tooltipFormatter = useCallback((value, name, props) => [
    new Intl.NumberFormat('ko-KR').format(value),
    props.dataKey === 'basePrice' ? '기준가' : 
    props.dataKey === 'buyPrice' ? '매수가' : '매도가'
  ], []);

  const labelFormatter = useCallback((label) => `시간: ${label}`, []);

  // 모달 닫기 (useCallback으로 메모이제이션)
  const handleClose = useCallback(() => {
    setPriceHistory([]);
    setError(null);
    // 스크롤 복원 (더 강력한 방법)
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    if (scrollY) {
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 mx-0 my-0 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {metalName} 시세 이력 조회
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 날짜 선택 및 조회 버튼 */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {/* 기간 선택 버튼들 */}
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {['5개월', '1년', '3년', '5년', '전체'].map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setPeriodDates(period);
                    }}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      selectedPeriod === period
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              
              {/* 커스텀 날짜 선택 */}
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={startDate.split('T')[0]}
                  onChange={(e) => {
                    setStartDate(e.target.value + 'T00:00');
                    setSelectedPeriod('커스텀');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">~</span>
                <input
                  type="date"
                  value={endDate.split('T')[0]}
                  onChange={(e) => {
                    setEndDate(e.target.value + 'T23:59');
                    setSelectedPeriod('커스텀');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* 검색 버튼 */}
            <button
              onClick={loadPriceHistory}
              disabled={loading}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '조회 중...' : '검색'}
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-auto h-full">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">시세 이력을 불러오는 중...</span>
            </div>
          )}

          {priceHistory.length > 0 && !loading && (
            <div>
              {/* 차트 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {metalName} 시세 차트
                </h3>
                {priceHistory.length > 0 && chartReady ? (
                  <div className="w-full" style={{ height: '320px', minHeight: '320px', minWidth: '300px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
                    <LineChart data={priceHistory} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Intl.NumberFormat('ko-KR').format(value)}
                        domain={metalCode === 'AU' ? ['dataMin - 5000', 'dataMax + 5000'] : ['dataMin - 200', 'dataMax + 200']}
                      />
                      <Tooltip 
                        formatter={tooltipFormatter}
                        labelFormatter={labelFormatter}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="basePrice" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="기준가"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="buyPrice" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="매수가"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="sellPrice" 
                        stroke="#ffc658" 
                        strokeWidth={2}
                        name="매도가"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                ) : (
                  <div className="w-full h-80 flex items-center justify-center text-gray-500">
                    차트 데이터를 불러오는 중...
                  </div>
                )}
              </div>

              {/* 데이터 테이블 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  시세 데이터 ({priceHistory.length}건)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          시간
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          기준가
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          매수가
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          매도가
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          변동률
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {priceHistory.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {item.time}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Intl.NumberFormat('ko-KR').format(item.basePrice)}원
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Intl.NumberFormat('ko-KR').format(item.buyPrice)}원
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Intl.NumberFormat('ko-KR').format(item.sellPrice)}원
                          </td>
                          <td className={`px-4 py-3 text-sm ${
                            item.fluctuation >= 0 ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {item.fluctuation >= 0 ? '+' : ''}{item.fluctuation.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {priceHistory.length === 0 && !loading && !error && (
            <div className="text-center py-8 text-gray-500">
              조회할 기간을 선택하고 '조회' 버튼을 클릭하세요.
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PriceHistoryModal);
