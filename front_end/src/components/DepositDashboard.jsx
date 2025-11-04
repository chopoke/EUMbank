// src/components/DepositDashboard.jsx
import React from "react";

function Ring({ percent = 0, size = 96, stroke = 10, label = '' }) {
  const p = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size/2} cy={size/2} r={r} strokeWidth={stroke} stroke="#e5e7eb" fill="none" />
      <circle
        cx={size/2} cy={size/2} r={r} strokeWidth={stroke} strokeLinecap="round"
        stroke="#3b82f6" fill="none" strokeDasharray={`${dash} ${c-dash}`}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-sm font-semibold fill-gray-800">
        {Math.round(p)}%
      </text>
      {label && (
        <text x="50%" y={size - 6} textAnchor="middle" className="text-[10px] fill-gray-500">{label}</text>
      )}
    </svg>
  );
}

export default function DepositDashboard({ deposits = [], savings = [] }) {
  const totalPaid = savings.reduce((s,v)=> s + (v.paidInstallments ?? 0), 0);
  const totalCount = savings.reduce((s,v)=> s + (v.totalInstallments ?? 0), 0);
  const savingPercent = totalCount > 0 ? (totalPaid/totalCount)*100 : 0;

  const now = new Date();
  const depositPercents = deposits.map(d => {
    if (d.goalAmount && d.goalAmount > 0) return (d.balance ?? 0) / d.goalAmount * 100;
    const opened = d.openedAt ? new Date(d.openedAt) : null;
    const maturity = d.maturityAt ? new Date(d.maturityAt) : null;
    if (opened && maturity && maturity > opened) {
      const t = (now - opened) / (maturity - opened);
      return Math.max(0, Math.min(100, t*100));
    }
    return 0;
  });
  const depositPercent = depositPercents.length
    ? depositPercents.reduce((a,b)=>a+b,0) / depositPercents.length
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="p-6 rounded-2xl shadow-sm border bg-white">
        <div className="flex items-center gap-4">
          <Ring percent={savingPercent} label="적금 달성률" />
          <div>
            <h3 className="text-lg font-bold text-gray-800">적금 대시보드</h3>
            <p className="text-sm text-gray-500">
              총 납입 회차: <b>{totalPaid}</b> / {totalCount}
            </p>
            <p className="text-xs text-gray-400 mt-1">가입 상품 수: {savings.length}개</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {savings.map((s) => {
            const paid = s.paidInstallments ?? 0;
            const total = s.totalInstallments ?? 0;
            const p = total>0 ? Math.min(100, (paid/total)*100) : 0;
            return (
              <div key={s.id} className="border rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-800">{s.productName}</span>
                  <span className="text-gray-500">{paid} / {total} 회</span>
                </div>
                <div className="h-2 bg-gray-100 rounded mt-2 overflow-hidden">
                  <div className="h-full rounded bg-blue-500" style={{ width: `${p}%` }} />
                </div>
                {s.nextDueDate && (
                  <div className="text-xs text-gray-400 mt-1">다음 납입일: {s.nextDueDate}</div>
                )}
              </div>
            );
          })}
          {savings.length === 0 && <div className="text-sm text-gray-500">가입된 적금이 없습니다.</div>}
        </div>
      </div>

      <div className="p-6 rounded-2xl shadow-sm border bg-white">
        <div className="flex items-center gap-4">
          <Ring percent={depositPercent} label="예금 달성률" />
          <div>
            <h3 className="text-lg font-bold text-gray-800">예금 대시보드</h3>
            <p className="text-sm text-gray-500">평균 달성률 기준</p>
            <p className="text-xs text-gray-400 mt-1">가입 상품 수: {deposits.length}개</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {deposits.map((d) => {
            const p = d.goalAmount && d.goalAmount>0
              ? Math.min(100, ((d.balance ?? 0)/d.goalAmount)*100)
              : 0;
            return (
              <div key={d.id} className="border rounded-xl p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-800">{d.productName}</span>
                  <span className="text-gray-500">
                    {d.balance?.toLocaleString?.() ?? '-'}원
                    {d.goalAmount ? ` / ${d.goalAmount.toLocaleString()}원` : ''}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded mt-2 overflow-hidden">
                  <div className="h-full rounded bg-blue-500" style={{ width: `${p}%` }} />
                </div>
                {(d.openedAt || d.maturityAt) && (
                  <div className="text-xs text-gray-400 mt-1">
                    {d.openedAt && <>개설 {d.openedAt}</>} {d.maturityAt && <> · 만기 {d.maturityAt}</>}
                  </div>
                )}
              </div>
            );
          })}
          {deposits.length === 0 && <div className="text-sm text-gray-500">가입된 예금이 없습니다.</div>}
        </div>
      </div>

      <div className="p-6 rounded-2xl shadow-sm border bg-white">
        <h3 className="text-lg font-bold text-gray-800">대출 현황</h3>
        <div className="mt-4 text-sm text-gray-500">
          상단 “내 상품” 목록 섹션에서 상세 확인 가능
        </div>
      </div>
    </div>
  );
}
