// src/pages/mypage/DepositDashboard.jsx
import React, { useMemo } from "react";

const clampPct = (n) => Math.max(0, Math.min(100, Math.round(n || 0)));
const toNum = (v, f = 0) => (Number.isFinite(+v) ? +v : f);

function Donut({ id, value = 0, size = 80, stroke = 10, caption }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (c * clampPct(value)) / 100;
  const gradId = `grad-${id}`;

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="shrink-0">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#0ea5a4" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="text-gray-200"
          stroke="currentColor"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#${gradId})`}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-gray-900 font-extrabold"
          style={{ fontSize: 13 }}
        >
          {clampPct(value)}%
        </text>
      </svg>
      {caption}
    </div>
  );
}

export default function DepositDashboard({ deposits = [], savings = [] }) {
  const savingRows = useMemo(() => {
    return (savings || []).map((s, i) => {
      const paid = toNum(s.paidInstallments, 0);
      const total = toNum(s.totalInstallments, 0);
      const pct = total > 0 ? (paid / total) * 100 : 0;
      return {
        id: `saving-${s.id ?? i}`,
        name: s.productName ?? "적금",
        paid,
        total,
        next: s.nextDueDate ?? null,
        percent: pct,
      };
    });
  }, [savings]);

  const depositRows = useMemo(() => {
    return (deposits || []).map((d, i) => {
      const term = toNum(d.termMonths, 0);
      const elapsed = Math.min(term || 0, toNum(d.elapsedMonths, 0));
      const pct = term > 0 ? (elapsed / term) * 100 : 0;
      return {
        id: `deposit-${d.id ?? i}`,
        name: d.productName ?? "예금",
        term,
        elapsed,
        maturity: d.maturityAt ?? null,
        percent: pct,
      };
    });
  }, [deposits]);

  return (
    <div className="space-y-8">
      <h3 className="text-2xl md:text-[26px] font-black tracking-tight text-gray-900 flex items-center gap-2">
        <i className="ri-pie-chart-2-line text-indigo-600" />
        예·적금 대시보드
      </h3>

      {/* 적금 진행률 */}
      <section className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-[0_10px_28px_rgba(17,24,39,0.06)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <i className="ri-safe-2-line" />
          </span>
          <div className="text-[17px] font-bold text-gray-900">적금 진행률</div>
        </div>

        {savingRows.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-8 text-base text-gray-700">
            가입된 적금이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {savingRows.map((row) => (
              <div
                key={row.id}
                className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md transition"
              >
                {/* 연출용 배경은 카드 뒤쪽으로만 (텍스트는 불투명 흰 배경 위) */}
                <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-gradient-to-br from-indigo-100 to-teal-100 blur-2xl opacity-60" />
                <Donut
                  id={row.id}
                  value={row.percent}
                  caption={
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 text-base truncate">
                        {row.name}
                      </div>
                      <div className="text-[13.5px] text-gray-700 mt-0.5">
                        납입{" "}
                        <span className="tabular-nums font-semibold text-gray-900">
                          {row.paid} / {row.total}
                        </span>{" "}
                        회
                        {row.next && (
                          <>
                            {" "}
                            · 다음 납입{" "}
                            <span className="tabular-nums">{row.next}</span>
                          </>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 예금 달성률 */}
      <section className="rounded-3xl border border-teal-100 bg-white p-6 shadow-[0_10px_28px_rgba(17,24,39,0.06)]">
        <div className="mb-4 flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
            <i className="ri-timer-2-line" />
          </span>
          <div className="text-[17px] font-bold text-gray-900">예금 달성률</div>
        </div>

        {depositRows.length === 0 ? (
          <div className="rounded-2xl bg-gray-50 p-8 text-base text-gray-700">
            보유 중인 예금이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {depositRows.map((row) => (
              <div
                key={row.id}
                className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md transition"
              >
                <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-gradient-to-br from-teal-100 to-indigo-100 blur-2xl opacity-60" />
                <Donut
                  id={row.id}
                  value={row.percent}
                  caption={
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 text-base truncate">
                        {row.name}
                      </div>
                      <div className="text-[13.5px] text-gray-700 mt-0.5">
                        경과{" "}
                        <span className="tabular-nums font-semibold text-gray-900">
                          {row.elapsed}
                        </span>{" "}
                        개월 / 약정{" "}
                        <span className="tabular-nums font-semibold text-gray-900">
                          {row.term}
                        </span>{" "}
                        개월
                        {row.maturity && (
                          <>
                            {" "}
                            · 만기{" "}
                            <span className="tabular-nums">{row.maturity}</span>
                          </>
                        )}
                      </div>
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
