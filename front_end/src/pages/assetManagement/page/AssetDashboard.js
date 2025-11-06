// src/pages/assetManagement/page/Dashboard.js
import { StatCard } from "../components/StatCard";
import { Link } from "react-router-dom";
import { DonutPercentOnly, LineChartWithDatesStatic, TrendFooterStats } from "../components/StaticCharts";
import { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";

// Chart.js 도넛 설정
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
} from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

const COLOR_MAP = {
  "입출금": "#53d2f8",
  "외화":   "#fac569",
  "적금":   "#fc7fd2",
  "예금":   "#34dfa6",
  "현물":   "#a78bfa",
  "기타":   "#9ca3af",
};

function formatKrw(n) {
  if (n == null) return "-";
  const num = typeof n === "number" ? n : Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString("ko-KR") + "원";
}

function hexToRgba(hex, a = 0.14) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
const pct = (v) => `${Math.round(v)}%`;

export default function AssetDashboard() {

  const [data, setData] = useState(null);   // AssetSummaryDto
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const summary = async () => {
      try {
        const res = await api.get("/api/asset/dashboard/summary");
        if(res.status === 200){
          setData(res.data);
        }
      } catch(e) {
        console.error(e);
        alert("요약 조회에 실패하였습니다.");
      } finally {
        setLoading(false);
      }
    };
    summary();
  }, []);

  const totalAssets      = data?.totalAssets ?? 0;
  const totalLiabilities = data?.totalLiabilities ?? 0;
  const netWorth         = data?.netWorth ?? 0;
  const monthlyDue       = data?.monthlyDue ?? 0;
  const composition      = data?.composition ?? [];

  // 도넛 데이터(Chart.js)
  const donutData = useMemo(() => {
    const labels = composition.map(c => c.category);
    const values = composition.map(c => Number(c.amountKrw || 0));
    const colors = composition.map(c => COLOR_MAP[c.category] || "#9ca3af");
    const total  = values.reduce((a, b) => a + b, 0);

    // 퍼센트(0~100) 계산
    const shares = total > 0 ? values.map(v => (v / total) * 100) : values.map(() => 0);

    // 최댓값 카테고리
    let topIdx = 0;
    shares.forEach((s, i) => { if (s > shares[topIdx]) topIdx = i; });
    const top = labels[topIdx] ? {
      label: labels[topIdx],
      pct: shares[topIdx] || 0,
      color: colors[topIdx] || "#9ca3af",
    } : null;
    
    return {
      total: total || 1,
      shares, labels, colors,
      top,
      chart: {
        labels,
        datasets: [{
          label: "자산 구성",
          data: values,
          backgroundColor: colors.map(c => `${c}CC`), // 살짝 투명
          borderColor: colors,
          borderWidth: 1.2,
          hoverOffset: 6,
          cutout: "62%",       // 두께
          rotation: 0,       // 12시 시작
        }]
      }
    };
  }, [composition]);

  const donutOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 900,
      easing: "easeOutQuart",
      animateRotate: true,
      animateScale: true,
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: { usePointStyle: true, boxWidth: 8 }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed;
            const pct = Math.round((v / (donutData.total || 1)) * 100);
            return ` ${ctx.label}: ${formatKrw(v)} (${pct}%)`;
          }
        }
      }
    }
  }), [donutData.total]);

  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen">
      {/* 상단 타이틀 영역 */}
      <header className="content-container px-6 pt-8 md:pt-10 pb-4">
        <h1 className="text-xl font-semibold text-gray-900">자산 현황</h1>
        <p className="text-sm text-gray-500 mt-1">
          보유 중인 자산과 부채를 한눈에 확인하고, 변동 내역과 상환 일정을 관리하세요.
        </p>
      </header>

      {/* 메인 카드 */}
      <section className="content-container px-6 pb-16 md:pb-20">
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-gray-900">자산관리 허브</div>
          <div className="text-[12px] text-blue-700">분석 · 또래 비교 · 추천 · 리포트를 한 곳에서</div>
          <div className="ml-auto flex gap-2">
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/analysis">자산 분석</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/peer">또래 비교</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/recommend">맞춤 추천</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/report">월간 리포트</Link>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-8">

          {/* 핵심 수치 4칸 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="순자산"
              value={loading ? "..." : formatKrw(netWorth)}
              sub="전일 대비 +320,000원"
            />
            <StatCard
              title="총자산"
              value={loading ? "..." : formatKrw(totalAssets)}
              sub="입출금 · 예금 · 적금 · 외화 · 대출 · 현물 포함"
            />
            <StatCard
              title="총부채"
              value={loading ? "..." : formatKrw(totalLiabilities)}
              sub="주택담보대출 1건"
            />
            <StatCard
              title="이번 달 납입 예정액"
              value={loading ? "..." : formatKrw(monthlyDue)}
              sub="적금 · 공과금 · 대출 상환 합산"
            />
          </div>

          {/* 자산 비율 / 순자산 추이 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* 자산 구성 비율 */}
            <div className="col-span-1 xl:col-span-1 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">자산 구성 비율</h2>
                  <p className="text-[12px] text-gray-500">
                    현금성 자산, 적금, 외화 등 비중입니다.
                  </p>
                </div>
                {/* 동적 배지 */}
                {(!loading && donutData.top) && (
                  <span
                    className="rounded-full text-[11px] font-medium px-2 py-0.5 border"
                    style={{
                      backgroundColor: hexToRgba(donutData.top.color, 0.14),
                      color: donutData.top.color,
                      borderColor: hexToRgba(donutData.top.color, 0.35),
                    }}
                  >
                    {`${donutData.top.label} 비중 높음 · ${pct(donutData.top.pct)}`}
                  </span>
                )}
              </div>

               <div className="w-full" style={{ height: 220 }}>
                {loading
                  ? <div className="h-full grid place-items-center text-sm text-gray-500">로딩 중…</div>
                  : composition.length === 0
                    ? <div className="h-full grid place-items-center text-sm text-gray-500">표시할 데이터가 없습니다</div>
                    : <Doughnut data={donutData.chart} options={donutOptions} />
                }
              </div>

              {/* 비율 레전드 */}
              {!loading && composition.length > 0 && (
                <ul className="text-sm text-gray-700 grid grid-cols-2 gap-y-2 mt-2">
                  {donutData.labels.map((label, i) => (
                    <li key={label} className="flex items-center gap-2">
                      {/* 색 점(도넛 색과 동일) */}
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: donutData.colors[i] }}
                        aria-hidden
                      />
                      <div className="flex flex-col">
                        <span className="text-gray-500 text-[12px]">{label}</span>
                        <span className="font-medium text-gray-900">
                          {pct(donutData.shares[i])}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 순자산 추이 */}
            <div className="col-span-1 xl:col-span-2 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">순자산 추이</h2>
                  <p className="text-[12px] text-gray-500">
                    최근 30일 동안의 순자산 변동입니다.
                  </p>
                </div>
                {/* <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  자세히 보기
                </button> */}
              </div>

              <LineChartWithDatesStatic
                points={[87.3, 87.6, 88.0, 88.2, 88.5, 88.9, 89.3]}
                labels={["10-01","10-15","오늘"]}
                height={200}
                yTicks={4}
                yFormatter={(v) => `${v.toFixed(1)}억`}   // ← 87.0억, 88.0억 처럼
              />
              {/* <PlaceholderChart label="라인 차트 (순자산 추이)" height="h-52" /> */}
              <TrendFooterStats
                stats={[
                  { label: "최근 30일 증감", value: "+1,240,000원" },
                  { label: "최고값", value: "89,300,000원" },
                  { label: "최저값", value: "87,300,000원" },
                  { label: "변동폭", value: "+2.0%" },
                ]}
              />

            </div>
          </div>

          {/* 예금/적금 & 대출 요약 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 예금 · 적금 */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">예금 · 적금</h3>
                <div className="text-[12px] text-gray-500 -mt-1">
                  가장 잔액이 큰 순으로 정렬했습니다.
                </div>
              </div>

              <ul className="divide-y divide-gray-200 text-sm">
                <li className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">e-UM 자유입출금</div>
                    <div className="text-[12px] text-gray-500">111-2222-333333</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">28,450,000원</div>
                    <div className="text-[12px] text-blue-600 font-medium">
                      전일 대비 +30,000원
                    </div>
                  </div>
                </li>

                <li className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">e-UM 고정적금</div>
                    <div className="text-[12px] text-gray-500">12개월 만기 · 4.2%</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">12,000,000원</div>
                    <div className="text-[12px] text-gray-500">
                      월 납입 1,000,000원
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            {/* 대출 현황 */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">대출 현황</h3>
                <div className="text-[12px] text-gray-500 -mt-1">
                  금리와 상환 일정을 한눈에 확인하세요.
                </div>
              </div>

              <ul className="divide-y divide-gray-200 text-sm">
                <li className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">주택담보대출</div>
                    <div className="text-[12px] text-gray-500">
                      변동금리 3.21% · 남은 기간 17년 2개월
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">44,480,000원</div>
                    <div className="text-[12px] text-gray-500">
                      월 상환 420,000원
                    </div>
                  </div>
                </li>
              </ul>

              <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-gray-50 border-blue-200 text-blue-700">
                금리 낮은 대출로 갈아타기
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
