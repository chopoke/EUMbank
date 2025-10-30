// src/pages/assetManagement/components/StaticCharts.js
import React from "react";

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

/* ------------------- 월별 복합 (누적막대 + 라인) ------------------- */
export function CompactMonthlyChart({
  data = [
    { m: "7월",  save: 350, invest: 120, net: 420 },
    { m: "8월",  save: 300, invest: 140, net: 360 },
    { m: "9월",  save: 320, invest:  90, net: 280 },
    { m: "10월", save: 330, invest: 110, net: 410 },
  ],
  height = 360,                                 // ⬅ 세로 크기
  colors = { save: "#2563eb", invest: "#10b981", net: "#0ea5e9" },
  yMode = "auto",                               // "auto" | "bar" | "line"
  yTicks = 4,                                   // 눈금 개수(0 포함 yTicks+1줄)
  yUnitLabel = "만",                            // 눈금 단위 텍스트
  yUnitDiv = 1,                                 // 라벨 표시에 나눌 값 (예: 억 단위로 보려면 1000)
}) {
  const H = height, W = 960;

  // 여백(텍스트끼리 안 붙게 넉넉히)
  const padLeft   = 56;
  const padRight  = 24;
  const padTop    = 28;
  const padBottom = 78;                          // 월/설명 2줄 충분히 확보

  const innerW = W - padLeft - padRight;
  const innerH = H - padTop - padBottom;

  // ===== 스케일 선택 =====
  const maxBar  = Math.max(...data.map(d => d.save + d.invest)) || 1;
  const maxLine = Math.max(...data.map(d => d.net)) || 1;

  const domainMax =
    yMode === "bar"  ? maxBar  :
    yMode === "line" ? maxLine :
    Math.max(maxBar, maxLine);

  // 예쁜 눈금(step) 계산
  const rawStep = domainMax / yTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const steps = [1, 2, 2.5, 5, 10];
  const step = (steps.find(s => s * mag >= rawStep) || 10) * mag;
  const niceMax = Math.ceil(domainMax / step) * step;

  // 좌표 변환
  const stepX = innerW / data.length;
  const toXMid = (i) => padLeft + i * stepX + stepX / 2;
  const toXBarLeft = (i, barW) => padLeft + i * stepX + (stepX - barW) / 2;
  const toY = (v) => padTop + innerH - (v / niceMax) * innerH;

  // 반응형 막대 폭
  const barW = Math.max(24, Math.min(64, stepX * 0.74));

  // 라인 좌표
  const linePts = data.map((d, i) => `${toXMid(i)},${toY(d.net)}`).join(" ");

  // 라벨 포맷(단위 축약)
  const fmt = (v) => {
    const n = v / yUnitDiv;              // 예: 억 단위면 1000으로 나눔(만 → 억)
    return Number.isInteger(n) ? n : (+n.toFixed(2));
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: H, display: "block" }}
      preserveAspectRatio="xMidYMid meet"
      aria-label="월별 변화 추이"
    >
      {/* === Y축 그리드/라벨 === */}
      {[...Array(yTicks + 1)].map((_, idx) => {
        const v = step * idx;
        const y = toY(v);
        return (
          <g key={`grid-${idx}`}>
            <line x1={padLeft} y1={y} x2={W - padRight} y2={y}
                  stroke={idx === 0 ? "#E5E7EB" : "#F3F4F6"} />
            <text x={padLeft - 8} y={y + 4} textAnchor="end"
                  fontSize="11" fill="#9CA3AF">
              {fmt(v)}{yUnitLabel}
            </text>
          </g>
        );
      })}
      {/* Y축 본선 */}
      <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + innerH}
            stroke="#E5E7EB" />

      {/* === 누적 막대 === */}
      {data.map((d, i) => {
        const x = toXBarLeft(i, barW);
        const hSave = (d.save   / niceMax) * innerH;
        const hInv  = (d.invest / niceMax) * innerH;
        const ySave = toY(d.save);
        const yInv  = ySave - hInv;

        return (
          <g key={`bar-${i}`}>
            <rect x={x} y={yInv}  width={barW} height={hInv}  rx="3" fill={colors.invest} />
            <rect x={x} y={ySave} width={barW} height={hSave} rx="3" fill={colors.save} />
            {/* 월/설명 라벨 (여백 넉넉히) */}
            <text x={x + barW / 2} y={H - 34} textAnchor="middle"
                  fontSize="12" fill="#6B7280">
              {d.m}
            </text>
            <text x={x + barW / 2} y={H - 14} textAnchor="middle"
                  fontSize="11" fill="#111827">
              적금 {d.save}{yUnitLabel} · 투자 {d.invest}{yUnitLabel}
            </text>
          </g>
        );
      })}

      {/* === 순자산 증감 라인 + 점 === */}
      <polyline points={linePts} fill="none" stroke={colors.net}
                strokeWidth="2.6" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle key={`pt-${i}`} cx={toXMid(i)} cy={toY(d.net)} r="3.2" fill={colors.net} />
      ))}
    </svg>
  );
}



/* ------------------- 목표 게이지 ------------------- */
export function GoalGaugeStatic({ value = 68, size = 120 }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const C = 2 * Math.PI * radius;
  const len = (value / 100) * C;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`목표 달성률 ${value}%`} style={{ display: "block" }}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#2563eb" strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={`${len} ${C - len}`} transform={`rotate(-90 ${center} ${center})`} />
      <text x={center} y={center - 4} textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="700" fill="#111827">{value}%</text>
      <text x={center} y={center + 16} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#6B7280">목표 달성률</text>
    </svg>
  );
}

/* ------------------- 주간 증감 막대 ------------------- */
export function WeeklyDeltaBarsStatic({
  data = [+420, -180, +360, +640],
  labels = ["1주", "2주", "3주", "4주"],
}) {
  const W = 220, H = 120, baseY = H / 2;
  const maxAbs = Math.max(...data.map((v) => Math.abs(v))) || 1;
  const barW = 28, gap = 18;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={svgStyle(120)} aria-label="주간 증감">
      <line x1="0" y1={baseY} x2={W} y2={baseY} stroke="#E5E7EB" strokeWidth="1" />
      {data.map((v, i) => {
        const x = 12 + i * (barW + gap);
        const h = Math.max(4, (Math.abs(v) / maxAbs) * (H / 2 - 10));
        const y = v >= 0 ? baseY - h : baseY;
        const color = v >= 0 ? "#2563eb" : "#9CA3AF";
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} rx="2" fill={color} />
            <circle cx={x + barW / 2} cy={v >= 0 ? y : y + h} r="2.2" fill={color} />
            <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="#9CA3AF">{labels[i]}</text>
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
