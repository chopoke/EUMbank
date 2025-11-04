// src/pages/mypage/DepositDashboard.js
import React from "react";

/** 원형 진행률 SVG (라벨 제거) */
function Ring({ percent = 0, size = 96, stroke = 10 }) {
  const p = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="#e5e7eb" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        strokeLinecap="round"
        stroke="#3b82f6"
        fill="none"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="text-sm font-semibold fill-gray-800"
      >
        {Math.round(p)}%
      </text>
    </svg>
  );
}

export default function DepositDashboard({ summary, deposits = [], savings = [] }) {
  // ---  배열로 들어오면 자동 계산 ---
  let paidInstallments, targetInstallments, nextDueDate, installmentProgress;

  if (Array.isArray(savings) && savings.length) {
    paidInstallments = savings.reduce((s, v) => s + (v.paidInstallments ?? 0), 0);
    targetInstallments = savings.reduce((s, v) => s + (v.totalInstallments ?? 0), 0);
    installmentProgress = targetInstallments > 0 ? (paidInstallments / targetInstallments) * 100 : 0;

    // 가장 빠른 다음 납입일(문자열로 가정)
    const dates = savings.map((s) => s.nextDueDate).filter(Boolean);
    nextDueDate = dates.length ? dates.sort()[0] : "-";
  } else {

    const {
      installmentProgress: p = 0,
      paidInstallments: pi = 0,
      targetInstallments: ti = 0,
      nextDueDate: nd = "-",
    } = summary || {};
    installmentProgress = p;
    paidInstallments = pi;
    targetInstallments = ti;
    nextDueDate = nd;
  }

  // 예금 달성률(있으면 표시)
  const depositPercent = (() => {
    if (!Array.isArray(deposits) || !deposits.length) return 0;
    const now = new Date();
    const arr = deposits.map((d) => {
      if (d.goalAmount && d.goalAmount > 0) return ((d.balance ?? 0) / d.goalAmount) * 100;
      const opened = d.openedAt ? new Date(d.openedAt) : null;
      const maturity = d.maturityAt ? new Date(d.maturityAt) : null;
      if (opened && maturity && maturity > opened) {
        const t = (now - opened) / (maturity - opened);
        return Math.max(0, Math.min(100, t * 100));
      }
      return 0;
    });
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  })();

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">예·적금 대시보드</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 적금 진행률(원형) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-2">적금 진행률</div>
          <div className="flex items-center gap-4">
            <Ring percent={installmentProgress || 0} />
            <div>
              <div className="text-2xl font-extrabold text-gray-800">
                {Math.round(installmentProgress || 0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                납입 {paidInstallments ?? 0} / {targetInstallments ?? 0} 회
              </div>
            </div>
          </div>
        </div>

        {/* 예금 달성률(원형) */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-2">예금 달성률</div>
          <div className="flex items-center gap-4">
            <Ring percent={depositPercent || 0} />
            <div>
              <div className="text-2xl font-extrabold text-gray-800">
                {Math.round(depositPercent || 0)}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                가입 예금 {Array.isArray(deposits) ? deposits.length : 0}개
              </div>
            </div>
          </div>
        </div>

        {/* 다음 납입일 */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-sm text-gray-500 mb-1">다음 납입 예정일</div>
          <div className="text-2xl font-bold text-gray-800">{nextDueDate || "-"}</div>
        </div>
      </div>
    </div>
  );
}
