import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// ===== 다이얼로그/모달 컴포넌트 =====
import PriceHistoryModal from './modals/PriceHistoryModal';
// ===================================
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
 * 시세 표시 컴포넌트
 * - 시세 조회 및 차트 표시: React + Recharts, Spring Boot + JPA+QueryDSL
 * - 성능 최적화: useMemo, useCallback, React.memo로 리렌더링 최적화
 * - 시세 전용 테이블 분리 관리, 가상시뮬레이션으로 실시간 변동률 표시
 */
const PriceDisplay = ({ goldPrice, silverPrice, goldChange, silverChange }) => {
  const navigate = useNavigate();
  
  // 그래프 데이터 상태
  const [goldDomesticChartData, setGoldDomesticChartData] = useState([]);
  const [goldInternationalChartData, setGoldInternationalChartData] = useState([]);
  const [silverDomesticChartData, setSilverDomesticChartData] = useState([]);
  const [silverInternationalChartData, setSilverInternationalChartData] = useState([]);
  const [selectedTab, setSelectedTab] = useState('domestic'); // 'domestic' 또는 'international'
  const [selectedRange, setSelectedRange] = useState('실시간'); // 기간 선택
  
  // 실시간 변동률 상태
  const [realTimeGoldChange, setRealTimeGoldChange] = useState(0);
  const [realTimeSilverChange, setRealTimeSilverChange] = useState(0);
  const [previousGoldPrice, setPreviousGoldPrice] = useState(goldPrice);
  const [previousSilverPrice, setPreviousSilverPrice] = useState(silverPrice);
  
  // ===== 다이얼로그/모달 상태 관리 =====
  // 시세 이력 모달 상태
  const [showPriceHistoryModal, setShowPriceHistoryModal] = useState(false);
  const [selectedMetalForHistory, setSelectedMetalForHistory] = useState('AU');
  // =====================================
  
  // 카드 하단 변동률/변동금액 계산 (차트 데이터 기반)
  const getCardChangeInfo = useCallback((dataArray) => {
    if (!dataArray || dataArray.length < 2) {
      return { percent: 0, amount: 0 };
    }
    const first = dataArray[0].price;
    const last = dataArray[dataArray.length - 1].price;
    if (!first || first === 0) {
      return { percent: 0, amount: 0 };
    }
    const amount = last - first;
    const percent = (amount / first) * 100;
    return { percent, amount };
  }, []);


  // 가격 데이터 생성 함수
  const generatePriceData = (minPrice, maxPrice, count, type, metalType = 'AU') => {
    const data = [];
    let currentPrice = (minPrice + maxPrice) / 2;
    
    // 금과 은의 변동성 차별화
    const volatilityMultiplier = metalType === 'AU' ? 1.0 : 2.0; // 은은 금보다 변동성 높음
    
    for (let i = 0; i < count; i++) {
      let volatility;
      switch(type) {
        case 'domestic_realtime':
          volatility = 0.02 * volatilityMultiplier; // 금: 2%, 은: 4% 변동성
          break;
        case 'international_realtime':
          volatility = 0.015 * volatilityMultiplier; // 금: 1.5%, 은: 3% 변동성
          break;
        case 'domestic_volatile':
          volatility = 0.03 * volatilityMultiplier; // 금: 3%, 은: 6% 변동성
          break;
        case 'international_volatile':
          volatility = 0.025 * volatilityMultiplier; // 금: 2.5%, 은: 5% 변동성
          break;
        case 'domestic_trending':
          volatility = 0.025 * volatilityMultiplier; // 금: 2.5%, 은: 5% 변동성
          break;
        case 'international_trending':
          volatility = 0.02 * volatilityMultiplier; // 금: 2%, 은: 4% 변동성
          break;
        case 'domestic_stable':
          volatility = 0.015 * volatilityMultiplier; // 금: 1.5%, 은: 3% 변동성
          break;
        case 'international_stable':
          volatility = 0.01 * volatilityMultiplier; // 금: 1%, 은: 2% 변동성
          break;
        case 'domestic_longterm':
          volatility = 0.01 * volatilityMultiplier; // 금: 1%, 은: 2% 변동성
          break;
        case 'international_longterm':
          volatility = 0.008 * volatilityMultiplier; // 금: 0.8%, 은: 1.6% 변동성
          break;
        default:
          volatility = 0.02 * volatilityMultiplier; // 기본값
      }
      
      // 더 안정적인 변동 (금 변동 평균 수준)
      const change = (Math.random() - 0.5) * volatility * 0.3; // 변동폭을 30%로 줄임
      currentPrice = currentPrice * (1 + change);
      
      // 가격 범위 제한
      currentPrice = Math.max(minPrice * 0.8, Math.min(maxPrice * 1.2, currentPrice));
      
      data.push(Math.round(currentPrice));
    }
    
    return data;
  };

  // 기간별 차트 데이터 생성
  const generateChartDataByRange = (range) => {
    const now = new Date();
    let dataPoints, timeInterval;
    
    switch(range) {
      case '실시간':
        dataPoints = 24; // 시간 단위로 더 촘촘하게
        timeInterval = 60 * 60 * 1000; // 1시간
        break;
      case '1개월':
        dataPoints = 30; // 일 단위
        timeInterval = 24 * 60 * 60 * 1000; // 1일
        break;
      case '5개월':
        dataPoints = 30; // 1개월과 동일한 간격(가독성 향상)
        timeInterval = 5 * 24 * 60 * 60 * 1000; // 5일 간격로 5개월 커버
        break;
      case '1년':
        dataPoints = 52; // 주 단위
        timeInterval = 7 * 24 * 60 * 60 * 1000; // 1주
        break;
      case '3년':
        dataPoints = 36; // 월 단위(3년)
        timeInterval = 30 * 24 * 60 * 60 * 1000; // 1개월
        break;
      default:
        dataPoints = 15;
        timeInterval = 24 * 60 * 60 * 1000;
    }

    // 금과 은의 데이터를 별도로 생성
    const goldDomesticPrices = generatePriceData(2250000, 3375000, dataPoints, 'domestic_realtime', 'AU');
    const goldInternationalPrices = generatePriceData(30000, 60000, dataPoints, 'international_realtime', 'AU');
    const silverDomesticPrices = generatePriceData(2250000, 3375000, dataPoints, 'domestic_realtime', 'AG');
    const silverInternationalPrices = generatePriceData(30000, 60000, dataPoints, 'international_realtime', 'AG');

    const goldDomesticData = goldDomesticPrices.map((price, i) => {
      const time = new Date(now.getTime() - (dataPoints - 1 - i) * timeInterval);
      const month = time.getMonth() + 1;
      const year = time.getFullYear();
      
      return {
        time: range === '실시간' ? `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}` : 
              range === '1개월' ? `${month}/${time.getDate()}` : 
              `${year}-${month.toString().padStart(2, '0')}`,
        price: price,
        fullTime: time
      };
    });

    const goldInternationalData = goldInternationalPrices.map((price, i) => {
      const time = new Date(now.getTime() - (dataPoints - 1 - i) * timeInterval);
      const month = time.getMonth() + 1;
      const year = time.getFullYear();
      
      return {
        time: range === '실시간' ? `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}` : 
              range === '1개월' ? `${month}/${time.getDate()}` : 
              `${year}-${month.toString().padStart(2, '0')}`,
        price: price,
        fullTime: time
      };
    });

    const silverDomesticData = silverDomesticPrices.map((price, i) => {
      const time = new Date(now.getTime() - (dataPoints - 1 - i) * timeInterval);
      const month = time.getMonth() + 1;
      const year = time.getFullYear();
      
      return {
        time: range === '실시간' ? `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}` : 
              range === '1개월' ? `${month}/${time.getDate()}` : 
              `${year}-${month.toString().padStart(2, '0')}`,
        price: price,
        fullTime: time
      };
    });

    const silverInternationalData = silverInternationalPrices.map((price, i) => {
      const time = new Date(now.getTime() - (dataPoints - 1 - i) * timeInterval);
      const month = time.getMonth() + 1;
      const year = time.getFullYear();
      
      return {
        time: range === '실시간' ? `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}` : 
              range === '1개월' ? `${month}/${time.getDate()}` : 
              `${year}-${month.toString().padStart(2, '0')}`,
        price: price,
        fullTime: time
      };
    });
    
    setGoldDomesticChartData(goldDomesticData);
    setGoldInternationalChartData(goldInternationalData);
    setSilverDomesticChartData(silverDomesticData);
    setSilverInternationalChartData(silverInternationalData);
  };

  // 초기 데이터 생성
  useEffect(() => {
    generateChartDataByRange(selectedRange);
  }, [selectedRange]);

  // 실시간 변동률 계산
  useEffect(() => {
    const currentGoldPrice = goldPrice.basePrice || goldPrice;
    const currentSilverPrice = silverPrice.basePrice || silverPrice;
    
    if (previousGoldPrice && currentGoldPrice !== previousGoldPrice) {
      const change = ((currentGoldPrice - previousGoldPrice) / previousGoldPrice) * 100;
      setRealTimeGoldChange(change);
      setPreviousGoldPrice(currentGoldPrice);
    }
    
    if (previousSilverPrice && currentSilverPrice !== previousSilverPrice) {
      const change = ((currentSilverPrice - previousSilverPrice) / previousSilverPrice) * 100;
      setRealTimeSilverChange(change);
      setPreviousSilverPrice(currentSilverPrice);
    }
  }, [goldPrice, silverPrice, previousGoldPrice, previousSilverPrice]);

  // 실시간 변동률 시뮬레이션 (5초마다 업데이트)
  useEffect(() => {
    const interval = setInterval(() => {
      // 금 변동률 시뮬레이션 (-0.5% ~ +0.5%)
      const goldVariation = (Math.random() - 0.5) * 1.0;
      setRealTimeGoldChange(prev => prev + goldVariation);
      
      // 은 변동률 시뮬레이션 (-0.3% ~ +0.3%)
      const silverVariation = (Math.random() - 0.5) * 0.6;
      setRealTimeSilverChange(prev => prev + silverVariation);
    }, 5000);

    return () => clearInterval(interval);
  }, []);


  // Recharts 기반 인터랙티브 그래프 렌더링 함수
  const renderInteractiveChart = (data, color, title, cardType = 'default', metalType = 'AU') => {
    if (data.length === 0) return null;

    // 카드 타입에 따른 배경색 설정
    const backgroundColor = cardType === 'gold' ? '#fefce8' : cardType === 'silver' ? '#f9fafb' : 'white';
    const axisColor = cardType === 'gold' ? '#d97706' : cardType === 'silver' ? '#6b7280' : '#374151';
    const textColor = cardType === 'gold' ? '#92400e' : cardType === 'silver' ? '#1f2937' : '#111827';

    // 데이터 범위 계산 (지그재그가 잘 보이도록 축을 데이터에 맞게 조정)
    const values = data.map(d => d.price);
    const minPrice = Math.min(...values);
    const maxPrice = Math.max(...values);
    const range = Math.max(1, maxPrice - minPrice);
    const domainMin = Math.floor(minPrice - range * 0.08);
    const domainMax = Math.ceil(maxPrice + range * 0.08);

    // 커스텀 툴팁 컴포넌트
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        const currentData = payload[0].payload;
        const firstPrice = data.length > 0 ? data[0].price : currentData.price;
        const changePercent = ((currentData.price - firstPrice) / firstPrice * 100).toFixed(2);
        
        return (
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700">
            <div className="font-semibold text-yellow-300">{title}</div>
            <div className="mt-1">시간: {label}</div>
            <div className="mt-1">가격: <span className="font-bold text-green-300">₩{currentData.price.toLocaleString()}</span></div>
            <div className="mt-1">변동률: <span className={`font-bold ${changePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {changePercent >= 0 ? '+' : ''}{changePercent}%
            </span></div>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="relative rounded-lg p-1 -mt-1" style={{ backgroundColor }}>
        <div className="w-full h-48 rounded-lg -mt-1" style={{ minHeight: '192px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 14, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={axisColor} opacity={0.3} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 9, fill: textColor, fontWeight: 'bold' }}
                axisLine={{ stroke: axisColor, strokeWidth: 2 }}
                tickLine={{ stroke: axisColor }}
                interval="preserveStartEnd"
                padding={{ left: 10, right: 20 }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: textColor, fontWeight: 'bold' }}
                axisLine={{ stroke: axisColor, strokeWidth: 2 }}
                tickLine={{ stroke: axisColor }}
                tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`}
                domain={metalType === 'AU' ? [domainMin - 5000, domainMax + 5000] : [domainMin - 200, domainMax + 200]}
                tickCount={metalType === 'AU' ? 8 : 6}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="linear" 
                dataKey="price" 
                stroke={color}
                strokeWidth={metalType === 'AU' ? 3 : 2}
                dot={{ fill: color, strokeWidth: 2, r: metalType === 'AU' ? 3 : 2 }}
                activeDot={{ r: metalType === 'AU' ? 5 : 4, fill: color }}
                connectNulls={false}
                strokeDasharray={metalType === 'AU' ? "0" : "3 3"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">현재 시세</h2>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* 시세 이력 조회 버튼들 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/spot/SpotPriceHistory?metal=AU')}
              className="px-3 py-1 text-xs sm:text-sm font-medium bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
            >
              금 시세 이력
            </button>
            <button
              onClick={() => navigate('/spot/SpotPriceHistory?metal=AG')}
              className="px-3 py-1 text-xs sm:text-sm font-medium bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
            >
              은 시세 이력
            </button>
          </div>
          
          {/* 기간 선택 버튼들 */}
          <div className="flex flex-wrap gap-2">
            {['실시간', '1개월', '5개월', '1년', '3년'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  selectedRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 국내/국제 탭 */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1 w-full max-w-xs">
          <button
            onClick={() => setSelectedTab('domestic')}
            className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'domestic'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            국내시세
          </button>
          <button
            onClick={() => setSelectedTab('international')}
            className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              selectedTab === 'international'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            국제시세
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 금 가격 */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <h3 className="text-lg sm:text-xl font-bold">금 (AU)</h3>
            <div className={`flex items-center text-sm font-bold text-green-100`}>
              <span className="mr-1 text-base sm:text-lg">↗</span>
              <span className="text-base sm:text-lg">{Math.abs(realTimeGoldChange).toFixed(2)}%</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2">
            ₩{Math.round(goldPrice.basePrice || goldPrice).toLocaleString()}
          </div>
          <div className="text-xs sm:text-sm opacity-90 mb-4">
            (KRW/3.75g)
          </div>
          
          {/* 금 그래프 - 작은 카드 모양 */}
          <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200 shadow-sm h-40 sm:h-52 mt-4">
            {renderInteractiveChart(
              selectedTab === 'domestic' ? goldDomesticChartData : goldInternationalChartData, 
              '#f59e0b', 
              '금 (AU)',
              'gold',
              'AU'
            )}
          </div>
        </div>

        {/* 은 가격 */}
        <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <h3 className="text-lg sm:text-xl font-bold">은 (AG)</h3>
            <div className={`flex items-center text-sm font-bold text-green-100`}>
              <span className="mr-1 text-base sm:text-lg">↗</span>
              <span className="text-base sm:text-lg">{Math.abs(realTimeSilverChange).toFixed(2)}%</span>
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold mb-2">
            ₩{Math.round(silverPrice.basePrice || silverPrice).toLocaleString()}
          </div>
          <div className="text-xs sm:text-sm opacity-90 mb-4">
            (KRW/3.75g)
          </div>
          
          {/* 은 그래프 - 작은 카드 모양 */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm h-40 sm:h-52 mt-4">
            {renderInteractiveChart(
              selectedTab === 'domestic' ? silverDomesticChartData : silverInternationalChartData, 
              '#6b7280', 
              '은 (AG)',
              'silver',
              'AG'
            )}
          </div>
        </div>
      </div>

      {/* 순금시세/은시세 카드 */}
      <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 순금시세 */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-3 sm:p-4 border border-yellow-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">순금시세</h3>
              <p className="text-xs sm:text-sm text-gray-600">Gold24k-3.75g</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-gray-500">내가 살 때 (VAT포함)</div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">₩{Math.round((goldPrice?.buyPrice || goldPrice || 0)).toLocaleString()}</div>
              {(() => {
                const { percent } = getCardChangeInfo(selectedTab === 'domestic' ? goldDomesticChartData : goldInternationalChartData);
                const isUp = percent >= 0;
                return (
                  <div className={`text-xs sm:text-sm font-semibold ${isUp ? 'text-red-600' : 'text-blue-600'}`}>
                    {isUp ? '+' : ''}{percent.toFixed(2)}%
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs text-gray-500">내가 팔 때</div>
            <div className="text-base sm:text-lg font-semibold text-gray-900">₩{Math.round((goldPrice?.sellPrice || goldPrice || 0)).toLocaleString()}</div>
          </div>
        </div>

        {/* 은시세 */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">은시세</h3>
              <p className="text-xs sm:text-sm text-gray-600">Silver-3.75g</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-gray-500">내가 살 때 (VAT포함)</div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">₩{Math.round((silverPrice?.buyPrice || silverPrice || 0)).toLocaleString()}</div>
              {(() => {
                const { percent } = getCardChangeInfo(selectedTab === 'domestic' ? silverDomesticChartData : silverInternationalChartData);
                const isUp = percent >= 0;
                return (
                  <div className={`text-xs sm:text-sm font-semibold ${isUp ? 'text-red-600' : 'text-blue-600'}`}>
                    {isUp ? '+' : ''}{percent.toFixed(2)}%
                  </div>
                );
              })()}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs text-gray-500">내가 팔 때 (자사실버바기준)</div>
            <div className="text-base sm:text-lg font-semibold text-gray-900">₩{Math.round((silverPrice?.sellPrice || silverPrice || 0)).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 시세 업데이트 정보 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        {selectedTab === 'domestic' ? '국내' : '국제'} {selectedRange} 시세 (업데이트: {new Date().toLocaleTimeString('ko-KR')})
      </div>

      {/* ===== 다이얼로그/모달 컴포넌트 ===== */}
      {/* 시세 이력 모달 - 금/은 가격 차트 상세 조회 */}
      <PriceHistoryModal
        isOpen={showPriceHistoryModal}
        onClose={() => setShowPriceHistoryModal(false)}
        metalCode={selectedMetalForHistory}
        metalName={selectedMetalForHistory === 'AU' ? '금' : '은'}
      />
      {/* =================================== */}
    </div>
  );
};

export default React.memo(PriceDisplay);
