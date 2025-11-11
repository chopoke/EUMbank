// src/pages/assetManagement/components/StaticCharts.js
import React, { useState, useRef, useEffect } from "react";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function useAnimationProgress(deps, duration = 800) {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    let frameId;
    let start;
    setProgress(0);

    const step = (timestamp) => {
      if (start === undefined) start = timestamp;
      const elapsed = timestamp - start;
      const t = Math.min(1, elapsed / duration);
      setProgress(easeOutCubic(t));
      if (t < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, deps);

  return progress;
}

const svgStyle = (h = 220) => ({
  width: "100%",
  height: h,
  display: "block",
  textRendering: "optimizeLegibility",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
});

/* ------------------- Donut (다중 조각, 퍼센트 레이블) ------------------- */
export function DonutPercentOnly({
  size = 180,
  stroke = 22,
  segments = [
    { value: 42, color: "#2563eb" }, // 현금성
    { value: 28, color: "#60a5fa" }, // 적금·예금
    { value: 18, color: "#10b981" }, // 투자
    { value: 7,  color: "#f59e0b" }, // 외화
    { value: 3,  color: "#a78bfa" }, // 보험
    { value: 2,  color: "#9ca3af" }, // 기타
  ],
  minLabelPct = 8,
}) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  const cx = size / 2, cy = size / 2;
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const rad = (deg) => (deg * Math.PI) / 180;

  const items = segments.map((s) => {
    const ratio = s.value / total;
    const len = ratio * C * 0.995;
    const off = C - acc * C;
    const startDeg = acc * 360;
    const midDeg = startDeg + (ratio * 360) / 2;
    acc += ratio;
    const labelR = r;
    const lx = cx + labelR * Math.cos(rad(midDeg - 90));
    const ly = cy + labelR * Math.sin(rad(midDeg - 90));
    return { ...s, ratio, len, off, lx, ly };
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={svgStyle(size)} preserveAspectRatio="xMidYMid meet" aria-label="자산 구성 비율">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      {items.map((a, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={a.color}
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={`${a.len} ${C - a.len}`}
          strokeDashoffset={a.off}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ))}
      {items.map((a, i) =>
        a.ratio * 100 >= minLabelPct ? (
          <text
            key={i}
            x={a.lx}
            y={a.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontWeight="700"
            fill="#111827"
          >
            {Math.round(a.ratio * 100)}%
          </text>
        ) : null
      )}
    </svg>
  );
}

/* ------------------- 라인 (좌/중/우 라벨, 높이 조절) ------------------- */
export function LineChartWithDatesStatic({
  points = [87.3, 87.6, 88.0, 88.2, 88.6, 89.1, 89.3],
  labels = ["10-01", "10-15", "오늘"],
  height = 240,
  showGrid = true,
  showYAxis = true,
  yTicks = 3,
  yFormatter = (v) => v.toLocaleString(),
}) {
  const H = height;
  const W = 640;
  const padRight = 16;
  const padTop = 14;
  const padBottom = 36;
  const padLeft = showYAxis ? 56 : 24;

  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;

  const pMin = Math.min(...points);
  const pMax = Math.max(...points);
  const rawStep = (pMax - pMin) / Math.max(1, yTicks);
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const steps = [1, 2, 2.5, 5, 10];
  const step = (steps.find((s) => s * mag >= rawStep) || 10) * mag;
  const niceMin = Math.floor(pMin / step) * step;
  const niceMax = Math.ceil(pMax / step) * step;
  const safeRange = Math.max(1e-6, niceMax - niceMin);

  const toX = (i) => padLeft + (innerW / (points.length - 1)) * i;
  const toY = (v) => padTop + innerH - ((v - niceMin) / safeRange) * innerH;

  const polyPoints = points.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const areaPath =
    `M ${toX(0)} ${toY(points[0])} ` +
    points
      .slice(1)
      .map((v, i) => `L ${toX(i + 1)} ${toY(v)}`)
      .join(" ") +
    ` L ${toX(points.length - 1)} ${padTop + innerH}` +
    ` L ${toX(0)} ${padTop + innerH} Z`;

  const labelXs = [padLeft, padLeft + innerW / 2, padLeft + innerW];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: H, display: "block" }}
      preserveAspectRatio="xMidYMid meet"
      aria-label="순자산 추이"
    >
      <defs>
        <linearGradient id="nwArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(37,99,235,0.25)" />
          <stop offset="100%" stopColor="rgba(37,99,235,0.04)" />
        </linearGradient>
      </defs>

      {showYAxis && (
        <>
          {[...Array(yTicks + 1)].map((_, idx) => {
            const value = niceMin + step * idx;
            const y = toY(value);
            return (
              <g key={`grid-${idx}`}>
      {showGrid && (
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={W - padRight}
                    y2={y}
                    stroke={idx === 0 ? "#E5E7EB" : "#F3F4F6"}
                  />
                )}
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#9CA3AF"
                >
                  {yFormatter(value)}
                </text>
              </g>
            );
          })}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + innerH}
            stroke="#E5E7EB"
          />
        </>
      )}

      {!showYAxis && showGrid && (
        <>
          <line
            x1="0"
            y1={padTop + innerH}
            x2={W}
            y2={padTop + innerH}
            stroke="#E5E7EB"
          />
          <line
            x1="0"
            y1={padTop + innerH * 0.66}
            x2={W}
            y2={padTop + innerH * 0.66}
            stroke="#F3F4F6"
          />
          <line
            x1="0"
            y1={padTop + innerH * 0.33}
            x2={W}
            y2={padTop + innerH * 0.33}
            stroke="#F3F4F6"
          />
        </>
      )}

      <path d={areaPath} fill="url(#nwArea)" />
      <polyline
        points={polyPoints}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={toX(points.length - 1)}
        cy={toY(points[points.length - 1])}
        r="3.2"
        fill="#2563eb"
      />

      {labels.slice(0, 3).map((text, idx) => (
        <text
          key={idx}
          x={labelXs[idx]}
          y={H - 10}
          textAnchor="middle"
          fontSize="11"
          fill="#9CA3AF"
        >
          {text}
        </text>
      ))}
    </svg>
  );
}

/* ------------------- 월별 복합 (누적막대 + 라인) - 주식차트 스타일 ------------------- */
export function CompactMonthlyChart({
  data = [
    { m: "7월", income: 350, expense: 120 },
    { m: "8월", income: 300, expense: 140 },
    { m: "9월", income: 320, expense: 90 },
    { m: "10월", income: 330, expense: 110 },
  ],
  height = 360,
  colors = { income: "#10b981", expense: "#ef4444" },
  yTicks = 4,
  yUnitLabel = "만",
  yUnitDiv = 1,
  showIncome = true,
  showExpense = true,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [viewStart, setViewStart] = useState(0); // 보이는 범위 시작 인덱스
  const [viewEnd, setViewEnd] = useState(null); // 보이는 범위 끝 인덱스 (null이면 전체)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartViewStart, setDragStartViewStart] = useState(0);
  const [dragWindowLength, setDragWindowLength] = useState(0);
  const svgRef = useRef(null);
  const H = height, W = 960;
  
  // 초기 viewEnd 설정 (기본적으로 최근 데이터만 보이도록)
  useEffect(() => {
    if (viewEnd === null && data.length > 0) {
      const defaultViewCount = Math.min(12, data.length); // 기본 12개만 보이기
      setViewStart(Math.max(0, data.length - defaultViewCount));
      setViewEnd(data.length);
    }
  }, [data.length, viewEnd]);
  
  // 보이는 데이터 범위
  const visibleData = viewEnd !== null 
    ? data.slice(viewStart, viewEnd)
    : data;
  const visibleStartIndex = viewStart;

  // 여백(텍스트끼리 안 붙게 넉넉히)
  const padLeft   = 56;
  const padRight  = 24;
  const padTop    = 28;
  const padBottom = 78;                          // 월/설명 2줄 충분히 확보

  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;

  // 스케일 계산 (visibleData 기준)
  const maxIncome = showIncome ? Math.max(...visibleData.map((d) => d.income || 0)) : 0;
  const maxExpense = showExpense ? Math.max(...visibleData.map((d) => d.expense || 0)) : 0;
  const domainMax = Math.max(maxIncome, maxExpense, 1);

  // 예쁜 눈금(step) 계산
  const rawStep = domainMax / yTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const steps = [1, 2, 2.5, 5, 10];
  const step = (steps.find(s => s * mag >= rawStep) || 10) * mag;
  const niceMax = Math.ceil(domainMax / step) * step;

  // 좌표 변환
  const windowLength = Math.max(1, visibleData.length);
  const stepX = innerW / windowLength;
  const toXMid = (i) => padLeft + i * stepX + stepX / 2;
  const toXLeftEdge = (i) => padLeft + i * stepX;

  // 막대/라인 보조 값
  const barDenominator = niceMax === 0 ? 1 : niceMax;
  const zeroY = padTop + innerH / 2;
  const toYPositive = (v) => zeroY - (v / barDenominator) * (innerH / 2);
  const toYNegative = (v) => zeroY + (Math.abs(v) / barDenominator) * (innerH / 2);

  // X축 라벨 간격 동적 조정 (줌 축소 시 겹침 방지)
  const minLabelSpacing = 60; // 픽셀 단위 최소 간격
  const labelInterval = Math.max(1, Math.ceil(minLabelSpacing / Math.max(stepX, 1e-6)));

  const animationKey = visibleData.map(d => `${d.m}:${d.income}:${d.expense}`).join("|");
  const animationProgress = useAnimationProgress([animationKey, showIncome, showExpense], 900);

  const animatedData = visibleData.map(d => {
    const income = showIncome ? (d.income || 0) * animationProgress : 0;
    const expense = showExpense ? (d.expense || 0) * animationProgress : 0;
    return {
      original: d,
      incomeAnimated: income,
      expenseAnimated: expense,
    };
  });

  const parseDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const yearMarkers = [];
  let lastYear = null;
  visibleData.forEach((item, index) => {
    const date = parseDate(item.periodStartDate);
    if (!date) {
      return;
    }
    const year = date.getFullYear();
    const markerX = toXLeftEdge(index);
    if (lastYear === null) {
      yearMarkers.push({ x: markerX, year, isInitial: true });
      lastYear = year;
      return;
    }
    if (year !== lastYear) {
      yearMarkers.push({ x: markerX, year, isInitial: false });
      lastYear = year;
    }
  });

  // 드래그 핸들러
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // 왼쪽 버튼만
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartViewStart(viewStart);
    const currentWindow = (viewEnd !== null ? viewEnd : data.length) - viewStart;
    setDragWindowLength(Math.max(1, currentWindow));
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const windowLength = dragWindowLength || Math.max(1, (viewEnd !== null ? viewEnd : data.length) - dragStartViewStart);
    const stepPerItem = innerW / windowLength;
    if (stepPerItem <= 0) return;

    const deltaX = e.clientX - dragStartX;
    const threshold = stepPerItem * 0.35;
    if (Math.abs(deltaX) < threshold) {
      return;
    }

    const direction = deltaX > 0 ? -1 : 1;
    const maxStart = Math.max(0, data.length - windowLength);
    const proposedStart = Math.max(0, Math.min(dragStartViewStart + direction, maxStart));
    const newViewEnd = Math.min(data.length, proposedStart + windowLength);

    setViewStart(proposedStart);
    setViewEnd(newViewEnd);
    setDragStartX(e.clientX);
    setDragStartViewStart(proposedStart);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragWindowLength(0);
  };
  
  // 마우스 휠 줌 핸들러
  const handleWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) {
      return; // 일반 스크롤은 페이지 스크롤에 맡김
    }
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    const zoomFactor = 1.2;
    
    if (delta > 0) {
      // 줌 아웃 (더 많은 데이터 보기)
      const currentCount = visibleData.length;
      const newCount = Math.min(data.length, Math.ceil(currentCount * zoomFactor));
      const centerIndex = viewStart + Math.floor(currentCount / 2);
      const newStart = Math.max(0, centerIndex - Math.floor(newCount / 2));
      const newEnd = Math.min(data.length, newStart + newCount);
      setViewStart(newStart);
      setViewEnd(newEnd);
    } else {
      // 줌 인 (더 적은 데이터 보기)
      const currentCount = visibleData.length;
      const newCount = Math.max(4, Math.floor(currentCount / zoomFactor));
      const centerIndex = viewStart + Math.floor(currentCount / 2);
      const newStart = Math.max(0, centerIndex - Math.floor(newCount / 2));
      const newEnd = Math.min(data.length, newStart + newCount);
      setViewStart(newStart);
      setViewEnd(newEnd);
    }
  };

  // 반응형 막대 폭
  const barW = Math.max(24, Math.min(64, stepX * 0.74));

  // 라벨 포맷(단위 축약)
  const fmt = (v) => {
    const n = v / yUnitDiv;              // 예: 억 단위면 1000으로 나눔(만 → 억)
    return Number.isInteger(n) ? n : (+n.toFixed(2));
  };

  // 전역 마우스 이벤트 리스너
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e) => handleMouseMove(e);
      const handleGlobalMouseUp = () => handleMouseUp();
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStartX, dragStartViewStart, visibleData.length, data.length, innerW, dragWindowLength, viewEnd]);

  return (
    <div className="relative">
      {/* 드래그/줌 안내 */}
      <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
        <span>💡 드래그로 이동, Ctrl(또는 ⌘)+휠로 확대/축소</span>
        {viewEnd !== null && data.length > visibleData.length && (
          <span className="text-blue-600">
            {visibleStartIndex + 1}~{viewEnd} / {data.length}개 표시 중
          </span>
        )}
      </div>
      <svg
        ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
        style={{ 
          width: "100%", 
          height: H, 
          display: "block",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none"
        }}
      preserveAspectRatio="xMidYMid meet"
      aria-label="월별 변화 추이"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        {/* === Y축 그리드/라벨 === */}
        {[...Array(yTicks * 2 + 1)].map((_, idx) => {
          const v = -niceMax + step * idx;
          const y = v >= 0 ? toYPositive(v) : toYNegative(v);
          const isZero = Math.abs(v) < 0.01;
          return (
            <g key={`grid-${idx}`}>
              <line
                x1={padLeft}
                y1={y}
                x2={W - padRight}
                y2={y}
                stroke={isZero ? "#9CA3AF" : idx % 2 === 0 ? "#D1D5DB" : "#E5E7EB"}
                strokeWidth={isZero ? 1.5 : idx % 2 === 0 ? 1 : 0.5}
                strokeDasharray={isZero ? "2,2" : idx % 2 === 0 ? "none" : "4,4"}
              />
              {idx % 2 === 0 && (
                <text
                  x={padLeft - 12}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill={isZero ? "#6B7280" : "#9CA3AF"}
                  fontWeight={isZero ? "600" : "400"}
                >
                  {fmt(v)}{yUnitLabel}
                </text>
              )}
            </g>
          );
        })}
      {/* Y축 본선 */}
      <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + innerH}
              stroke="#D1D5DB" strokeWidth="1.5" />

        {/* 연도 구분선/레이블 */}
        {yearMarkers.map((marker) =>
          marker.isInitial ? (
            <text
              key={`year-label-${marker.year}-${marker.x}`}
              x={marker.x + 6}
              y={padTop + 14}
              fontSize="11"
              fill="#9CA3AF"
              fontWeight="500"
            >
              {`${marker.year}년`}
            </text>
          ) : (
            <g key={`year-line-${marker.year}-${marker.x}`}>
              <line
                x1={marker.x}
                y1={padTop}
                x2={marker.x}
                y2={padTop + innerH}
                stroke="#CBD5F5"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={marker.x + 6}
                y={padTop + 14}
                fontSize="11"
                fill="#9CA3AF"
                fontWeight="500"
              >
                {`${marker.year}년`}
              </text>
            </g>
          )
        )}

        {/* === 막대 그래프 (수익/소비 별도 표시) === */}
        {animatedData.map((d, i) => {
          const { original } = d;
          const incomeVal = showIncome ? (original.income || 0) : 0;
          const expenseVal = showExpense ? (original.expense || 0) : 0;
          const incomeDisplay = showIncome ? d.incomeAnimated : 0;
          const expenseDisplay = showExpense ? d.expenseAnimated : 0;
          const isHovered = hoveredIndex === i;
          
          // 막대 개수에 따라 위치 조정
          let barIndex = 0;
          const barGap = 4; // 막대 간 간격
          const totalBars = (showIncome && incomeVal > 0 ? 1 : 0) + (showExpense && expenseVal > 0 ? 1 : 0);
          const totalBarWidth = totalBars * barW + (totalBars > 1 ? (totalBars - 1) * barGap : 0);
          // 각 데이터 포인트의 중앙(toXMid)을 기준으로 막대 그룹을 중앙 정렬
          const centerX = toXMid(i);
          const startX = centerX - totalBarWidth / 2;

          // 라벨 텍스트 생성
          const labelParts = [];
          if (showIncome && incomeVal > 0) labelParts.push(`수익 ${fmt(incomeVal)}${yUnitLabel}`);
          if (showExpense && expenseVal > 0) labelParts.push(`소비 ${fmt(expenseVal)}${yUnitLabel}`);
          const labelText = labelParts.length > 0 ? labelParts.join(" · ") : "";

        return (
          <g key={`bar-${i}`}>
              {/* 수익 막대 (0 기준선에서 위로) */}
              {showIncome && incomeVal > 0 && (
                <rect 
                  x={startX + barIndex * (barW + barGap)} 
                  y={toYPositive(incomeDisplay)} 
                  width={barW} 
                  height={(incomeDisplay / barDenominator) * (innerH / 2)} 
                  rx="3" 
                  fill={colors.income}
                  opacity={isHovered ? 0.9 : 0.7}
                  style={{ transition: "opacity 0.2s" }}
                />
              )}
              {showIncome && incomeVal > 0 && (barIndex++)}
              
              {/* 소비 막대 (0 기준선에서 아래로) */}
              {showExpense && expenseVal > 0 && (
                <rect 
                  x={startX + barIndex * (barW + barGap)} 
                  y={zeroY} 
                  width={barW} 
                  height={(expenseDisplay / barDenominator) * (innerH / 2)} 
                  rx="3" 
                  fill={colors.expense}
                  opacity={isHovered ? 0.9 : 0.7}
                  style={{ transition: "opacity 0.2s" }}
                />
              )}
              {showExpense && expenseVal > 0 && (barIndex++)}
              
              {/* 호버 영역 (보이지 않지만 클릭 가능) */}
              <rect
                x={padLeft + i * stepX}
                y={padTop}
                width={stepX}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: isDragging ? "grabbing" : "pointer" }}
              />
            {/* 월/설명 라벨 (여백 넉넉히) */}
              {i % labelInterval === 0 && (
                <text x={toXMid(i)} y={H - 34} textAnchor="middle"
                      fontSize="12" fill="#6B7280" fontWeight={isHovered ? "600" : "400"}>
                  {original.m}
            </text>
              )}
              {labelText && i % labelInterval === 0 && (
                <text x={toXMid(i)} y={H - 14} textAnchor="middle"
                  fontSize="11" fill="#111827">
                  {labelText}
            </text>
              )}
          </g>
        );
      })}

        {/* === 호버 툴팁 === */}
        {hoveredIndex !== null && hoveredIndex < visibleData.length && visibleData[hoveredIndex] && (() => {
          const tooltipWidth = 140;
          const tooltipHeight = 86;
          const tooltipPadding = 8;
          const pointX = toXMid(hoveredIndex);
          const pointY = padTop + innerH / 2;
          
          // 툴팁 위치 계산 (화면 경계 내에 있도록)
          let tooltipX = pointX - tooltipWidth / 2;
          let tooltipY = pointY - tooltipHeight - tooltipPadding;
          
          // 왼쪽 경계 체크
          if (tooltipX < padLeft) {
            tooltipX = padLeft + tooltipPadding;
          }
          // 오른쪽 경계 체크
          if (tooltipX + tooltipWidth > W - padRight) {
            tooltipX = W - padRight - tooltipWidth - tooltipPadding;
          }
          
          // 위쪽 경계 체크
          if (tooltipY < padTop) {
            tooltipY = pointY + tooltipPadding + 20; // 아래쪽에 표시
          }
          // 아래쪽 경계 체크
          if (tooltipY + tooltipHeight > H - padBottom) {
            tooltipY = pointY - tooltipHeight - tooltipPadding; // 위쪽에 표시
            // 그래도 안되면 더 위로
            if (tooltipY < padTop) {
              tooltipY = padTop + tooltipPadding;
            }
          }
          
          // 텍스트 위치 (툴팁 박스 내부)
          const textX = tooltipX + tooltipWidth / 2;
          const textY1 = tooltipY + 20;
          const textY2 = tooltipY + 35;
          const textY3 = tooltipY + 50;
          const textY4 = tooltipY + 65;

          const hoveredData = visibleData[hoveredIndex];
          const incomeValue = showIncome ? hoveredData.income || 0 : 0;
          const expenseValue = showExpense ? hoveredData.expense || 0 : 0;
          const netValue = incomeValue - expenseValue;
          
          return (
            <g>
              {/* 수직선 */}
              <line
                x1={pointX}
                y1={padTop}
                x2={pointX}
                y2={padTop + innerH}
                stroke="#9CA3AF"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.5"
              />
              {/* 툴팁 박스 */}
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="6"
                fill="white"
                stroke="#E5E7EB"
                strokeWidth="1"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
              />
              <text
                x={textX}
                y={textY1}
                textAnchor="middle"
                fontSize="12"
                fill="#111827"
                fontWeight="600"
              >
                {visibleData[hoveredIndex].m}
              </text>
              <text
                x={textX}
                y={textY2}
                textAnchor="middle"
                fontSize="11"
                fill="#6B7280"
              >
                수익: {fmt(incomeValue)}{yUnitLabel}
              </text>
              <text
                x={textX}
                y={textY3}
                textAnchor="middle"
                fontSize="11"
                fill="#6B7280"
              >
                소비: {fmt(expenseValue)}{yUnitLabel}
              </text>
              <text
                x={textX}
                y={textY4}
                textAnchor="middle"
                fontSize="11"
                fill={netValue >= 0 ? "#047857" : "#B91C1C"}
                fontWeight="600"
              >
                순변동: {fmt(netValue)}{yUnitLabel}
              </text>
            </g>
          );
        })()}
    </svg>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs flex-wrap">
        {showIncome && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.income }}></div>
            <span className="text-gray-600">수익</span>
          </div>
        )}
        {showExpense && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.expense }}></div>
            <span className="text-gray-600">소비</span>
          </div>
        )}
      </div>
    </div>
  );
}



/* ------------------- 목표 게이지 ------------------- */
export function GoalGaugeStatic({ value = 68, size = 120 }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const C = 2 * Math.PI * radius;
  const progress = useAnimationProgress([value], 900);
  const animatedValue = Math.round(value * progress);
  const len = (Math.min(value, 100) / 100) * C * progress;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`목표 달성률 ${value}%`} style={{ display: "block" }}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#2563eb" strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={`${len} ${C - len}`} transform={`rotate(-90 ${center} ${center})`} />
      <text x={center} y={center - 4} textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="700" fill="#111827">{animatedValue}%</text>
      <text x={center} y={center + 16} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#6B7280">목표 달성률</text>
    </svg>
  );
}

/* ------------------- 주간 증감 막대 ------------------- */
export function WeeklyDeltaBarsStatic({
  data = [+420, -180, +360, +640],
  labels = ["1주", "2주", "3주", "4주"],
}) {
  const W = 220; // 고정 너비 (카드 크기에 맞춤)
  const H = 120, baseY = H / 2;
  const maxAbs = Math.max(...data.map((v) => Math.abs(v))) || 1;
  const dataCount = data.length;
  const animationKey = data.join(",");
  const progress = useAnimationProgress([animationKey], 700);
  
  // 막대 개수에 따라 막대 폭과 간격 동적 조정 (카드 안에 맞추기)
  // 사용 가능한 너비: W - paddingLeft - paddingRight
  const paddingLeft = 8;
  const paddingRight = 8;
  const availableWidth = W - paddingLeft - paddingRight;
  
  // 막대 개수에 따라 최적의 막대 폭과 간격 계산
  let barW, gap;
  if (dataCount === 1) {
    // 1개: 중앙에 배치
    barW = 28;
    gap = 0;
  } else if (dataCount <= 4) {
    // 4개 이하: 여유 있게
    barW = 28;
    gap = (availableWidth - dataCount * barW) / (dataCount - 1);
  } else if (dataCount === 5) {
    // 5개: 중간 크기
    barW = 22;
    gap = (availableWidth - dataCount * barW) / (dataCount - 1);
  } else if (dataCount === 6) {
    // 6개: 작게
    barW = 18;
    gap = (availableWidth - dataCount * barW) / (dataCount - 1);
  } else {
    // 7개: 최소 크기
    barW = 15;
    gap = (availableWidth - dataCount * barW) / (dataCount - 1);
  }
  
  // 간격이 너무 작으면 막대 폭을 더 줄이기
  if (gap < 6 && dataCount > 4) {
    barW = Math.floor((availableWidth - (dataCount - 1) * 6) / dataCount);
    gap = 6;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={svgStyle(120)} aria-label="주간 증감">
      <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="#E5E7EB" strokeWidth="1" />
      {data.map((v, i) => {
        // 1개일 때는 중앙에 배치
        const totalBarWidth = dataCount * barW + (dataCount - 1) * gap;
        const startX = dataCount === 1 
          ? (W - barW) / 2 
          : paddingLeft + (availableWidth - totalBarWidth) / 2;
        const x = startX + i * (barW + gap);
        const targetH = (Math.abs(v) / maxAbs) * (H / 2 - 10);
        const h = targetH * progress;
        const y = v >= 0 ? baseY - h : baseY;
        const color = v >= 0 ? "#2563eb" : "#9CA3AF";
        const circleRadius = barW > 18 ? 2.2 : barW > 15 ? 1.8 : 1.5; // 막대 크기에 따라 점 크기 조정
        const fontSize = barW < 18 ? 9 : 10; // 막대가 작으면 폰트도 작게
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="2" fill={color} />
            <circle cx={x + barW / 2} cy={v >= 0 ? y : y + h} r={circleRadius} fill={color} />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={fontSize} fill="#9CA3AF">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------- 카테고리 가로 막대 ------------------- */
export function CategoryBarsStatic({
  items = [
    { label: "주거 · 관리비", value: 32 },
    { label: "식비", value: 24 },
    { label: "교통 · 이동", value: 11 },
    { label: "여가 · 취미", value: 9 },
  ],
  unit = "%", // "%", "원" 등
}) {
  const max = Math.max(...items.map(i => i.value)) || 1;

  return (
    <div style={{ width: "100%" }}>
      <ul style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, idx) => (
          <li key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 112, fontSize: 12, color: "#4B5563" }}>{it.label}</div>
            <div style={{ position: "relative", flex: 1, height: 8, borderRadius: 4, background: "#F3F4F6" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${(it.value / max) * 100}%`,
                  background: "#2563eb",
                  borderRadius: 4,
                }}
                aria-hidden="true"
              />
            </div>
            <div style={{ width: 48, textAlign: "right", fontSize: 12, color: "#111827", fontWeight: 600 }}>
              {it.value}{unit}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------- 하단 KPI 스트립 ------------------- */
export function TrendFooterStats({
  stats = [
    { label: "최근 30일 증감", value: "+1,240,000원" },
    { label: "최고값", value: "89,300,000원" },
    { label: "최저값", value: "87,300,000원" },
    { label: "변동폭", value: "+2.0%" },
  ],
}) {
  const wrap = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  };
  const card = {
    border: "1px solid #E5E7EB",
    background: "#FFFFFF",
    borderRadius: 8,
    padding: "8px 12px",
  };
  const label = { fontSize: 12, color: "#6B7280" };
  const val = { fontSize: 14, fontWeight: 600, color: "#111827" };

  return (
    <div style={wrap}>
      {stats.map((s, i) => (
        <div key={i} style={card}>
          <div style={label}>{s.label}</div>
          <div style={val}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// --- 나 vs 평균 가로 막대 비교 ---
export function BarCompareStatic({
  leftLabel = "나",
  rightLabel = "평균",
  leftValue = 42,   // 0~100
  rightValue = 35,  // 0~100
  metric = "지표",
}) {
  const rowWrap = { display: "flex", alignItems: "center", fontSize: 11, color: "#6B7280", marginBottom: 6 };
  const labelBox = { width: 32, color: "#111827", fontWeight: 500 };
  const track = { position: "relative", flex: 1, height: 8, background: "#F3F4F6", borderRadius: 6, margin: "0 8px" };
  const val  = { fontSize: 12, color: "#111827", fontWeight: 600 };

  return (
    <div style={{ width: "100%", border: "1px solid #E5E7EB", background: "#FFFFFF", borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: "#374151", fontWeight: 500, marginBottom: 8 }}>{metric}</div>

      {/* 왼쪽(나) */}
      <div style={rowWrap}>
        <span style={labelBox}>{leftLabel}</span>
        <div style={track} aria-hidden="true">
          <div style={{
            position: "absolute",
            left: 0, top: 0, bottom: 0,
            width: `${leftValue}%`,
            background: "#2563eb",
            borderRadius: 6
          }}/>
        </div>
        <span style={val}>{leftValue}%</span>
      </div>

      {/* 오른쪽(평균) */}
      <div style={{ ...rowWrap, marginBottom: 0 }}>
        <span style={labelBox}>{rightLabel}</span>
        <div style={track} aria-hidden="true">
          <div style={{
            position: "absolute",
            left: 0, top: 0, bottom: 0,
            width: `${rightValue}%`,
            background: "#9CA3AF",
            borderRadius: 6
          }}/>
        </div>
        <span style={val}>{rightValue}%</span>
      </div>
    </div>
  );
}
