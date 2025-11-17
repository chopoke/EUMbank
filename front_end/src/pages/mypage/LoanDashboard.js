// src/pages/mypage/LoanDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { fetchMyLoans } from "../../api/products";
import ProductDetailsModal from "../../components/ProductDetailsModal";

/* ===== 유틸 ===== */
const fmt = (n, u = "") =>
  n == null ? "-" : `${Number(n).toLocaleString()}${u}`;

const toDate = (v) =>
  v instanceof Date ? v : v ? new Date(v) : null;

const toYmd = (v) => {
  const d = toDate(v);
  if (!d || Number.isNaN(d.getTime())) return "-";
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const monthDiff = (a, b) => {
  const d1 = toDate(a),
    d2 = toDate(b);
  if (
    !d1 ||
    !d2 ||
    Number.isNaN(d1.getTime()) ||
    Number.isNaN(d2.getTime())
  )
    return 0;
  const y = d2.getFullYear() - d1.getFullYear();
  const m = d2.getMonth() - d1.getMonth();
  return y * 12 + m + (d2.getDate() >= d1.getDate() ? 0 : -1);
};

/* 금액 기준 퍼센트 */
const pctAmount = (num, den) => {
  const n = Number(num ?? 0);
  const d = Number(den ?? 0);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
  const v = Math.round((n / d) * 100);
  return Math.max(0, Math.min(100, v));
};

/* 72px 도넛 */
function ProgressDonut({ value = 0, size = 72, stroke = 10 }) {
  const p = Math.max(0, Math.min(100, Math.round(value || 0)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (c * p) / 100;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="text-indigo-600"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
      >
        {p}%
      </text>
    </svg>
  );
}

export default function LoanDashboard({ loans: loansProp }) {
  const [loans, setLoans] = useState(
    Array.isArray(loansProp) ? loansProp : []
  );
  const [loading, setLoading] = useState(!Array.isArray(loansProp));
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState({
    title: "",
    subtitle: "",
    sections: [],
    variant: "loan",
  });

  // /api/mypage/loans 만 호출
  useEffect(() => {
    if (Array.isArray(loansProp)) return;
    (async () => {
      try {
        const data = await fetchMyLoans().catch(() => []);
        setLoans(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [loansProp]);

  // 카드 변환 (금액 기준 진행률)
  const cards = useMemo(() => {
    const src = Array.isArray(loans) ? loans : [];
    return src.map((l) => {
      const openedAt =
        l.openedAt ??
        l.l_start_date ??
        l.lStartDate ??
        l.startDate ??
        l.l_created_at ??
        null;
      const maturityAt =
        l.maturityAt ??
        l.l_maturity_date ??
        l.maturityDate ??
        l.l_closed_at ??
        null;

      const principal = Number(
        l.principal ?? l.l_principal_amount ?? l.amount ?? 0
      );
      const balance = Number(l.balance ?? l.l_balance ?? 0);
      const repaid = principal > 0 ? principal - Math.max(balance, 0) : 0;
      const progress = principal > 0 ? pctAmount(repaid, principal) : 0;

      return {
        id:
          l.id ??
          l.l_id ??
          l.lNo ??
          l.l_no ??
          Math.random().toString(36).slice(2),
        title: l.productName ?? l.lpd_name ?? l.l_name ?? "대출",
        principal,
        balance,
        rate: l.rate ?? l.l_interest_rate,
        rateType: l.rateType ?? l.l_rate_type,
        repayMethod: l.repayMethod ?? l.l_repay_method,
        termMonths: l.termMonths ?? l.l_term_month,
        openedAt,
        maturityAt,
        totalMonths: Math.max(0, monthDiff(openedAt, maturityAt)),
        progress,
      };
    });
  }, [loans]);

  const openMore = (c) => {
    const periodText = c.totalMonths
      ? `${c.totalMonths}개월`
      : c.termMonths
      ? `${c.termMonths}개월`
      : "-";
    setDetail({
      title: "대출 상세정보",
      subtitle: c.title,
      sections: [
        {
          heading: "핵심 정보",
          rows: [
            {
              label: "약정금리",
              value: c.rate != null ? `${c.rate}%` : "-",
            },
            { label: "약정 원금", value: fmt(c.principal, "원") },
            {
              label: "남은 상환잔액",
              value: fmt(c.balance, "원"),
            },
            { label: "기간", value: periodText },
          ],
        },
        {
          heading: "상환/조건",
          rows: [
            { label: "상환방식", value: c.repayMethod ?? "-" },
            { label: "금리유형", value: c.rateType ?? "-" },
            {
              label: "개시일/만기일",
              value: `${toYmd(c.openedAt)} ~ ${toYmd(
                c.maturityAt
              )}`,
            },
          ],
        },
      ],
      variant: "loan",
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

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <i className="ri-bank-card-line text-lg" />
        <h3 className="text-lg font-bold">대출 대시보드</h3>
      </div>

      {cards.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-6 rounded-2xl bg-gradient-to-r from-gray-50 to-white p-6 shadow-sm ring-1 ring-gray-100"
            >
              <div className="flex items-center gap-6">
                <ProgressDonut value={c.progress} />
                <div>
                  <div className="text-lg md:text-xl font-semibold text-gray-900">
                    {c.title}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    약정 원금{" "}
                    <span className="font-medium text-gray-800">
                      {fmt(c.principal, "원")}
                    </span>
                    <span className="mx-2">·</span>
                    금리{" "}
                    <span className="font-medium text-gray-800">
                      {c.rate ?? "-"}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    남은 상환잔액{" "}
                    <span className="font-medium text-gray-800">
                      {fmt(c.balance, "원")}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    개시일 {toYmd(c.openedAt)} · 만기{" "}
                    {toYmd(c.maturityAt)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => openMore(c)}
                className="px-3.5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
              >
                더보기
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          보유 중인 대출이 없습니다.
        </p>
      )}

      <ProductDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        title={detail.title}
        subtitle={detail.subtitle}
        sections={detail.sections}
        variant={detail.variant}
      />
    </div>
  );
}
