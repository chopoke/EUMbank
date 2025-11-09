import React, { useEffect, useMemo, useState } from "react";
import { fetchMyLoans } from "../../api/products"; // ← 기존 호출(이미 쓰고 있던 목록용만 사용)
import ProductDetailsModal from "../../components/ProductDetailsModal";

const fmt = (n, u = "") => (n == null ? "-" : `${Number(n).toLocaleString()}${u}`);
const monthDiff = (a, b) => {
  const d1 = typeof a === "string" ? new Date(a) : a;
  const d2 = typeof b === "string" ? new Date(b) : b;
  const y = d2.getFullYear() - d1.getFullYear();
  const m = d2.getMonth() - d1.getMonth();
  return y * 12 + m + (d2.getDate() >= d1.getDate() ? 0 : -1);
};

function Ring({ percent }) {
  const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const r = 26, c = 2 * Math.PI * r, dash = (c * p) / 100;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="8"
              strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
              transform="rotate(-90 36 36)" className="transition-[stroke-dasharray] duration-700" />
      <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700">{p}%</text>
    </svg>
  );
}

export default function LoanDashboard() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState({ title: "", subtitle: "", sections: [] });

  useEffect(() => {
    (async () => {
      try { setLoans(await fetchMyLoans()); } finally { setLoading(false); }
    })();
  }, []);

  const cards = useMemo(() => {
    return (Array.isArray(loans) ? loans : []).map((l) => {
      const openedAt = l.start_date ?? l.startDate ?? l.openedAt;
      const maturityAt = l.l_maturity_date ?? l.maturityAt;
      const totalMonths = Math.max(0, monthDiff(openedAt, maturityAt));
      const elapsed = Math.max(0, monthDiff(openedAt, new Date()));
      const progress = totalMonths > 0 ? (elapsed / totalMonths) * 100 : 0;

      const product = l.product ?? l.loanProduct ?? l; // lpd_* 가 들어있다면 활용

      return {
        id: l.l_no ?? l.id,
        title: product.lpd_name ?? l.productName ?? "대출",
        principal: l.l_principal_amount ?? l.principal ?? l.balance,
        rate: l.l_interest_rate ?? l.rate,
        openedAt, maturityAt, totalMonths, elapsed, progress,
        repayMethod: l.l_repay_method, rateType: l.l_rate_type,
        product,
      };
    });
  }, [loans]);

  const openMore = (c) => {
    const p = c.product || {};
    setDetail({
      title: "대출 상세정보",
      subtitle: c.title,
      sections: [
        {
          heading: "핵심 정보",
          rows: [
            { label: "대출종류", value: p.lpd_type },
            { label: "약정금리", value: c.rate != null ? `${c.rate}%` : (p.lpd_rate_min || p.lpd_rate_max) ? `${p.lpd_rate_min ?? "-"} ~ ${p.lpd_rate_max ?? "-"}%` : "-" },
            { label: "원금", value: fmt(c.principal, "원") },
            { label: "기간", value: c.totalMonths ? `${c.totalMonths}개월` : p.lpd_max_month ? `${p.lpd_max_month}개월(최대)` : "-" },
          ],
        },
        {
          heading: "상환/조건",
          rows: [
            { label: "상환방식", value: c.repayMethod },
            { label: "금리유형", value: c.rateType },
            { label: "우대금리", value: p.lpd_prime_rate != null ? `${p.lpd_prime_rate}%` : "-" },
            { label: "거치기간", value: p.lpd_grace_month != null ? `${p.lpd_grace_month}개월` : "-" },
            { label: "은행/금융사", value: p.lpd_bank_name },
          ],
        },
      ],
    });
    setOpen(true);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-100 mb-4" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-gray-50" />
      </div>
    );
  }

  if (!cards.length) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2"><i className="ri-bank-card-line text-lg" /><h3 className="text-lg font-bold">대출 대시보드</h3></div>
        <p className="text-sm text-gray-500">보유 중인 대출이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2"><i className="ri-bank-card-line text-lg" /><h3 className="text-lg font-bold">대출 대시보드</h3></div>
      <div className="space-y-4">
        {cards.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-gray-50 to-white p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center gap-6">
              <Ring percent={c.progress} />
              <div>
                <div className="text-base font-semibold text-gray-800">{c.title}</div>
                <div className="mt-1 text-sm text-gray-500">
                  원금 <span className="font-medium text-gray-700">{fmt(c.principal,"원")}</span>
                  <span className="mx-2">·</span>
                  금리 <span className="font-medium text-gray-700">{c.rate}%</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">개시일 {c.openedAt ?? "-"} · 만기 {c.maturityAt ?? "-"}</div>
              </div>
            </div>
            <button onClick={() => openMore(c)} className="rounded-xl px-3 py-2 text-xs font-semibold bg-gray-900 text-white">더보기</button>
          </div>
        ))}
      </div>

      <ProductDetailsModal open={open} onClose={() => setOpen(false)}
        title={detail.title} subtitle={detail.subtitle} sections={detail.sections} />
    </div>
  );
}
