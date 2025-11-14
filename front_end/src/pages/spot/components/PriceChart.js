import React, { useState, useEffect, useCallback } from 'react';
import '../../../resources/css/spot.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const PriceChart = ({
  metalCode,
  metalName,
  simulate = false,
  basePrice = 97500,
  volatilityPercent = 0.8, // 기본 변동성(%): 금 0.8, 은 1.5 등
  simulateIntervalMs = 5000 // 시세 갱신 주기(ms)
}) => {
  const [priceData, setPriceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:8081'}/api/prices`;

  const fetchPriceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (simulate) {
        // 시뮬레이션: 기준가를 중심으로 ±volatilityPercent% 랜덤 변동
        const points = 72; // 지난 6시간, 5분 간격(더 역동적으로 보이게)
        const now = Date.now();
        let current = basePrice;
        const series = Array.from({ length: points }, (_, i) => {
          // 금과 은의 변동성 차별화
          const volatilityMultiplier = metalCode === 'AU' ? 1.0 : 3.0; // 은은 금보다 변동성 높음
          const rand = (Math.random() - 0.5) * (volatilityPercent * volatilityMultiplier / 50);
          current = Math.max(1, current * (1 + rand));
          const t = new Date(now - (points - 1 - i) * 5 * 60 * 1000);
          
          // 금과 은의 스프레드 차별화
          const spreadMultiplier = metalCode === 'AU' ? 1.0 : 2.0; // 은은 스프레드가 더 큼
          const buy = current * (1 + 0.002 * spreadMultiplier);
          const sell = current * (1 - 0.002 * spreadMultiplier);
          const diff = ((current - basePrice) / basePrice) * 100;
          return {
            time: t.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            basePrice: Math.round(current),
            buyPrice: Math.round(buy),
            sellPrice: Math.round(sell),
            fluctuation: diff,
          };
        });
        setPriceData(series);
        setError(null);
      } else {
        // 백엔드 서버 연결 확인
        const response = await axios.get(`${API_BASE_URL}/recent/${metalCode}?hours=24`, {
          timeout: 10000 // 10초 타임아웃
        });
        
        if (response.data && response.data.length > 0) {
          // 데이터 포맷팅
          const formattedData = response.data.map(item => ({
            time: new Date(item.p_created_at).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            basePrice: item.p_base_price,
            buyPrice: item.p_buy_price,
            sellPrice: item.p_sell_price,
            fluctuation: item.p_fluctuation_rate
          }));
          
          setPriceData(formattedData);
          setError(null);
        } else {
          setError('시세 데이터가 없습니다. 서버를 확인해주세요.');
        }
      }
    } catch (err) {
      console.error('시세 데이터 조회 실패:', err);
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else if (err.code === 'ECONNABORTED') {
        setError('서버 응답 시간이 초과되었습니다.');
      } else {
        setError('시세 데이터를 불러올 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, metalCode, simulate, basePrice, volatilityPercent]);

  useEffect(() => {
    fetchPriceData();
    // 더 짧은 주기로 갱신하여 역동성 강화
    const interval = setInterval(fetchPriceData, simulate ? simulateIntervalMs : 30000);
    return () => clearInterval(interval);
  }, [fetchPriceData, simulate, simulateIntervalMs]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatFluctuation = (fluctuation) => {
    const value = parseFloat(fluctuation);
    const color = value >= 0 ? '#ff4444' : '#4444ff';
    const sign = value >= 0 ? '+' : '';
    return (
      <span style={{ color }}>
        {sign}{value.toFixed(2)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="chart-container">
        <div className="loading">시세 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  const latestData = priceData[priceData.length - 1];

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>{metalName} 시세 차트</h3>
        <div className="price-info">
          {latestData && (
            <>
              <div className="current-price">
                <span className="label">현재가:</span>
                <span className="price">{formatPrice(latestData.basePrice)}원</span>
                <span className="fluctuation">
                  {formatFluctuation(latestData.fluctuation)}
                </span>
              </div>
              <div className="buy-sell-prices">
                <div className="buy-price">
                  <span className="label">매수가:</span>
                  <span className="price">{formatPrice(latestData.buyPrice)}원</span>
                </div>
                <div className="sell-price">
                  <span className="label">매도가:</span>
                  <span className="price">{formatPrice(latestData.sellPrice)}원</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="chart-wrapper" style={{ width: '100%', height: '400px', minHeight: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatPrice(value)}
              domain={metalCode === 'AU' ? ['dataMin - 10000', 'dataMax + 10000'] : ['dataMin - 500', 'dataMax + 500']}
              tickCount={metalCode === 'AU' ? 8 : 6}
            />
            <Tooltip 
              formatter={(value, name) => [
                formatPrice(value), 
                name === 'basePrice' ? '기준가' : 
                name === 'buyPrice' ? '매수가' : '매도가'
              ]}
              labelFormatter={(label) => `시간: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="basePrice" 
              stroke={metalCode === 'AU' ? "#ffd700" : "#c0c0c0"}
              strokeWidth={metalCode === 'AU' ? 3 : 2}
              name="기준가"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="buyPrice" 
              stroke={metalCode === 'AU' ? "#ff6b6b" : "#ff9999"}
              strokeWidth={metalCode === 'AU' ? 2 : 1.5}
              name="매수가"
              dot={false}
              strokeDasharray={metalCode === 'AU' ? "0" : "5 5"}
            />
            <Line 
              type="monotone" 
              dataKey="sellPrice" 
              stroke={metalCode === 'AU' ? "#4ecdc4" : "#66cccc"}
              strokeWidth={metalCode === 'AU' ? 2 : 1.5}
              name="매도가"
              dot={false}
              strokeDasharray={metalCode === 'AU' ? "0" : "5 5"}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      
    </div>
  );
};

export default PriceChart;


