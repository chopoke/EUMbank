import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchPrices, fetchRecentPrices } from '../api/spotApi';

/**
 * 작은 시세 위젯 컴포넌트
 * 메인페이지나 다른 페이지에서 재사용 가능한 작은 시세 표시
 */
const PriceWidget = React.memo(({ 
  size = 'small', // 'small', 'medium', 'large'
  showChart = false,
  className = '' 
}) => {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentAu, setRecentAu] = useState(null);
  const [recentAg, setRecentAg] = useState(null);

  const loadPrices = useCallback(async () => {
    try {
      const priceData = await fetchPrices();
      setPrices(priceData);
      setError(null);
    } catch (err) {
      console.error('시세 조회 실패:', err);
      setError('시세 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
    // 30초마다 시세 업데이트
    const interval = setInterval(loadPrices, 30000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  // 미니 차트용 최근 데이터 로딩 (옵션)
  useEffect(() => {
    let cancelled = false;
    const loadRecent = async () => {
      if (!showChart) return;
      try {
        const [au, ag] = await Promise.all([
          fetchRecentPrices('AU', 6), // 최근 6시간
          fetchRecentPrices('AG', 6)
        ]);
        if (!cancelled) {
          setRecentAu(Array.isArray(au) ? au : (au?.data || []));
          setRecentAg(Array.isArray(ag) ? ag : (ag?.data || []));
        }
      } catch (e) {
        // 차트 실패는 조용히 무시 (본체 위젯은 그대로 표시)
      }
    };
    loadRecent();
    const timer = showChart ? setInterval(loadRecent, 60000) : null; // 1분 간격 갱신
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [showChart]);

  const sparklinePath = useCallback((points, width = 120, height = 32, padding = 2) => {
    if (!points || points.length === 0) return '';
    const xs = points.map((p, i) => i);
    const ys = points.map(p => Number(p?.price ?? p?.basePrice ?? p?.close ?? p) || 0);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = Math.max(1, points.length - 1);
    const scaleX = (width - padding * 2) / span;
    const scaleY = (height - padding * 2) / (maxY - minY || 1);
    const toX = (i) => padding + i * scaleX;
    const toY = (y) => height - padding - (y - minY) * scaleY;
    let d = `M ${toX(0)} ${toY(ys[0])}`;
    for (let i = 1; i < ys.length; i++) {
      d += ` L ${toX(i)} ${toY(ys[i])}`;
    }
    return d;
  }, []);

  const chartSize = useMemo(() => {
    switch (size) {
      case 'large': return { w: 180, h: 48 };
      case 'medium': return { w: 150, h: 40 };
      default: return { w: 120, h: 32 };
    }
  }, [size]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(Math.round(price));
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

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-xs';
      case 'medium':
        return 'text-sm';
      case 'large':
        return 'text-base';
      default:
        return 'text-xs';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg p-3 shadow-sm border ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !prices) {
    return (
      <div className={`bg-white rounded-lg p-3 shadow-sm border ${className}`}>
        <div className="text-red-500 text-xs">시세 조회 실패</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-3 shadow-sm border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold text-gray-800 ${getSizeClasses()}`}>
          금/은 시세
        </h3>
        <span className="text-xs text-gray-500">
          {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      <div className="space-y-2">
        {/* 금 시세 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">🥇</span>
            <span className={`text-gray-700 ${getSizeClasses()}`}>금</span>
          </div>
          <div className="text-right">
            <div className={`font-semibold ${getSizeClasses()}`}>
              {formatPrice(prices.AU?.basePrice || 0)}원
            </div>
            <div className="text-xs">
              {formatFluctuation(prices.AU?.fluctuationRate || 0)}
            </div>
          </div>
        </div>

        {/* 은 시세 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">🥈</span>
            <span className={`text-gray-700 ${getSizeClasses()}`}>은</span>
          </div>
          <div className="text-right">
            <div className={`font-semibold ${getSizeClasses()}`}>
              {formatPrice(prices.AG?.basePrice || 0)}원
            </div>
            <div className="text-xs">
              {formatFluctuation(prices.AG?.fluctuationRate || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* 작은 차트 표시 (선택사항) */}
      {showChart && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-yellow-700">금</span>
              </div>
              <svg width={chartSize.w} height={chartSize.h} viewBox={`0 0 ${chartSize.w} ${chartSize.h}`} aria-label="AU mini chart">
                <path d={`M0 ${chartSize.h-0.5} H ${chartSize.w}`} stroke="#f0f0f0" strokeWidth="1" fill="none" />
                <path d={sparklinePath(recentAu, chartSize.w, chartSize.h)} stroke="#d97706" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-700">은</span>
              </div>
              <svg width={chartSize.w} height={chartSize.h} viewBox={`0 0 ${chartSize.w} ${chartSize.h}`} aria-label="AG mini chart">
                <path d={`M0 ${chartSize.h-0.5} H ${chartSize.w}`} stroke="#f0f0f0" strokeWidth="1" fill="none" />
                <path d={sparklinePath(recentAg, chartSize.w, chartSize.h)} stroke="#374151" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default PriceWidget;
