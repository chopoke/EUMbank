// src/pages/assetManagement/page/AssetReport.js
import { useMemo } from "react";
import AssetPageHeader from "../components/AssetPageHeader";
import AssetCashflowCalendar from "./AssetCashflowCalendar";
import { CategoryBarsStatic } from "../components/StaticCharts";

export default function AssetReport() {
  // 데모 데이터 (원단위)
  const tx = [
    { date: "2025-10-01", type: "income",  amount: 3200000, title: "급여" },
    { date: "2025-10-03", type: "expense", amount: 120000,  title: "식비" },
    { date: "2025-10-05", type: "expense", amount: 45000,   title: "교통" },
    { date: "2025-10-10", type: "expense", amount: 330000,  title: "쇼핑" },
    { date: "2025-10-15", type: "income",  amount: 1000000, title: "보너스" },
    { date: "2025-10-21", type: "expense", amount: 240000,  title: "여가" },
    { date: "2025-10-28", type: "expense", amount: 75000,   title: "구독" },
  ];

  const income = useMemo(
    () => tx.filter(t => t.type === "income").reduce((a, b) => a + b.amount, 0),
    [tx]
  );
  const expense = useMemo(
    () => tx.filter(t => t.type === "expense").reduce((a, b) => a + b.amount, 0),
    [tx]
  );
  const net = income - expense;

  // 월간 지출 카테고리(예시)
  const spendCategories = [
    { label: "주거 · 관리비", value: 32 },
    { label: "식비",        value: 24 },
    { label: "교통 · 이동",  value: 11 },
    { label: "여가 · 취미",  value: 9  },
  ];

  // 디자인 일관화를 위한 공통 카드 클래스
  const card = "rounded-2xl border border-gray-100 bg-white shadow-sm";
  const subtle = "text-[12px] text-gray-500";

  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen">
      <AssetPageHeader
        title="월간 리포트"
        desc="이번 달 수입·지출 캘린더와 지출 카테고리를 한눈에 확인하세요."
        current="report"
      />

      {/* 페이지 폭/여백을 다른 화면과 통일 */}
      <section className="content-container max-w-7xl mx-auto px-6 pt-0 pb-16 md:pb-20">
        <div className={`${card} p-5 md:p-6`}>
          {/* 상단 툴바: 범례 + 내보내기 */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
              <LegendDot color="bg-emerald-500" label="수입" />
              <LegendDot color="bg-red-500" label="지출" />
              <LegendDot color="bg-blue-600" label="자동이체/정기" />
            </div>

            {/* 버튼 톤 통일(다른 페이지와 동일한 ghost 스타일) */}
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-70">
                <path fill="currentColor" d="M5 20h14v-8h2v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9h2zM12 3l5 5h-3v6h-4V8H7l5-5z"/>
              </svg>
              CSV 다운로드
            </button>
          </div>

          {/* 핵심 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-6">
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex flex-col gap-1">
              <div className="text-[12px] text-gray-500">순자산</div>
              <div className="font-semibold text-gray-900 text-base">
                87,520,000원
              </div>
              <div className="text-[12px] text-blue-700 font-medium">
                지난달 대비 +1,240,000원
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex flex-col gap-1">
              <div className="text-[12px] text-gray-500">대출 상환 부담률</div>
              <div className="font-semibold text-gray-900 text-base">
                14.2%
              </div>
              <div className="text-[12px] text-gray-500">
                소득 대비 월 상환액 비율
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex flex-col gap-1">
              <div className="text-[12px] text-gray-500">목표 달성률</div>
              <div className="font-semibold text-gray-900 text-base">
                68%
              </div>
              <div className="text-[12px] text-gray-500">
                목표 순자산 1억 3천만 원 기준
              </div>
            </div>
          </div>

          {/* 본문: 좌(달력) 2, 우(카테고리) 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 캘린더 */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className={`${card} p-4 md:p-5`}>
                <AssetCashflowCalendar
                  month="2025-10"
                  transactions={tx}
                  onDayClick={(d) => console.log("day:", d)}
                  onEventClick={(e) => console.log("tx:", e)}
                  tagClassMap={{
                    income:  "inline-flex items-center gap-1 text-xs font-medium text-emerald-600",
                    expense: "inline-flex items-center gap-1 text-xs font-medium text-red-600",
                    auto:    "inline-flex items-center gap-1 text-xs font-medium text-blue-600",
                  }}
                />
              </div>

              {/* 월간 합계 박스 */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard label="수입 합계"   value={fmt(income) + "원"}   tone="emerald" />
                <StatCard label="지출 합계"   value={fmt(expense) + "원"}  tone="red" />
                <StatCard
                  label="이번 달 순변동"
                  value={`${net >= 0 ? "+" : ""}${fmt(net)}원`}
                  tone={net >= 0 ? "blue" : "red"}
                />
              </div>

              <div className={`${card} p-4`}>
                <h2 className="text-base font-semibold text-gray-900 mb-2">지출 메모</h2>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">주거 · 관리비</span>
                    <span className="font-medium text-gray-900">32%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">식비</span>
                    <span className="font-medium text-gray-900">24%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">교통 · 이동</span>
                    <span className="font-medium text-gray-900">11%</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">여가 · 취미</span>
                    <span className="font-medium text-gray-900">9%</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 지출 카테고리(우측 패널은 sticky + 화이트 카드) */}
            <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start">
              <div className={`${card} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">지출 카테고리</h2>
                  <span className={subtle}>이번 달</span>
                </div>

                <CategoryBarsStatic items={spendCategories} unit="%" />

                <ul className="mt-3 text-[12px] text-gray-500 space-y-1">
                  <li>가장 큰 지출: <b>주거 · 관리비</b> (32%)</li>
                  <li>식비 10% 절감 시 월 <b>+240,000원</b> 여유</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function StatCard({ label, value, tone = "gray" }) {
  const tones = {
    gray:    "text-gray-900",
    red:     "text-red-600",
    blue:    "text-blue-700",
    emerald: "text-emerald-600",
  };
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="text-[12px] text-gray-500">{label}</div>
      <div className={`font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  );
}

function fmt(n) {
  return (n ?? 0).toLocaleString();
}
