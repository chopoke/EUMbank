// src/pages/mypage/DepositDashboard.js
import React, { useMemo, useState } from "react";
import ProductDetailsModal from "../../components/ProductDetailsModal";

/* ================= 공통 유틸 ================= */
const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));
const pct = (num, den) => {
  const n = Number(num ?? 0);
  const d = Number(den ?? 0);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return 0;
  return clamp(Math.round((n / d) * 100));
};
const betweenMonths = (startISO, endISO, now = new Date()) => {
  if (!startISO || !endISO) return { total: 0, done: 0, pct: 0 };
  const s = new Date(startISO);
  const e = new Date(endISO);
  const total =
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth()) +
    (e.getDate() >= s.getDate() ? 1 : 0);
  const done =
    (now.getFullYear() - s.getFullYear()) * 12 +
    (now.getMonth() - s.getMonth()) +
    (now.getDate() >= s.getDate() ? 1 : 0);
  const safeTotal = Math.max(total, 0);
  const safeDone = clamp(done, 0, safeTotal);
  return { total: safeTotal, done: safeDone, pct: safeTotal ? clamp(Math.round((safeDone / safeTotal) * 100)) : 0 };
};

// 통화 표기
const fmt = (v, unit = "") => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? `${n.toLocaleString()}${unit}` : `${String(v)}${unit}`;
};

// 화면 표시 세이프가드
const show = (v) => {
  if (v === null || v === undefined) return "-";
  const s = String(v);
  return s.trim() ? s : "-";
};

// % 텍스트
const showPercent = (v) => {
  if (v === null || v === undefined || String(v).trim() === "") return "-";
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? `${n}%` : `${String(v)}`;
};

// 후보 값 중 첫 번째 유효값
const pick = (...vals) => vals.find((x) => !(x === undefined || x === null || String(x).trim?.() === ""));

// p(상품), r(row)에서 키 배열을 순서대로 탐색
const fromKeys = (p, r, keys) => pick(...keys.map((k) => p?.[k]), ...keys.map((k) => r?.[k]));

/* ================= 도넛 ================= */
function ProgressDonut({ value = 0, size = 72, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (c * clamp(value)) / 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="currentColor"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="text-indigo-600"
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="800" fill="#111827">
        {clamp(value)}%
      </text>
    </svg>
  );
}

/* ================= 본문 ================= */
export default function DepositDashboard({ deposits = [], savings = [], loans = [] }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState({ title: "", subtitle: "", sections: [], cta: null });

  /* ---------- 적금 카드 ---------- */
  const savingCards = useMemo(
    () =>
      (savings || []).map((s) => {
        const productData = s.product ?? s.installmentProduct ?? {};
        const title = pick(productData.ipName, productData.ip_name, s.productName, s.i_name, "적금");
        const paid = s.paidInstallments ?? s.i_paid_installments ?? 0;
        const total = s.totalInstallments ?? s.i_month ?? 0;
        return {
          kind: "SAVING",
          id: s.id ?? s.i_no,
          title,
          subtitleTop: `납입 ${paid} / ${total}회`,
          subtitleBottom: `다음 납입 ${show(s.nextDueDate ?? s.nextDue)}`,
          percent: pct(paid, total),
          product: productData,
          raw: s,
        };
      }),
    [savings]
  );

  /* ---------- 예금 카드 ---------- */
  const depositCards = useMemo(
    () =>
      (deposits || []).map((d) => {
        const productData = d.product ?? d.depositProduct ?? {};
        const title = pick(productData.dpName, productData.dp_name, d.productName, d.d_name, "예금");

        let percent = 0;
        if ((d.goalAmount ?? null) !== null || (d.d_amount ?? null) !== null) {
          percent = pct(d.balance ?? d.d_principal_bal, d.goalAmount ?? d.d_amount);
        } else {
          const opened = d.openedAt ?? d.openDate ?? d.d_join_date;
          const maturity = d.maturityAt ?? d.maturity ?? d.d_maturity_date;
          if (opened && maturity) percent = betweenMonths(opened, maturity).pct;
        }

        return {
          kind: "DEPOSIT",
          id: d.id ?? d.d_no,
          title,
          subtitle: `잔액 ${fmt(d.balance ?? d.d_principal_bal, "원")} · 만기 ${show(d.maturityAt ?? d.maturity ?? d.d_maturity_date)}`,
          percent,
          product: productData,
          raw: d,
        };
      }),
    [deposits]
  );

  /* ---------- 대출 카드 ---------- */
  const loanCards = useMemo(
    () =>
      (loans || []).map((l) => {
        const title = l.productName ?? "대출";
        const { pct: p } = betweenMonths(l.openedAt, l.maturityAt);
        return {
          kind: "LOAN",
          id: l.id ?? l.l_no,
          title,
          subtitle: `약정금리 ${showPercent(l.rate)} · 만기 ${show(l.maturityAt)}`,
          percent: p,
          product: l,
          raw: l,
        };
      }),
    [loans]
  );

  /* ================= 모달: 적금 ================= */
  const openSavingMore = (c) => {
    const p = c.product || {};
    const r = c.raw || {};

    const name = fromKeys(p, r, ["ipName", "ip_name", "productName", "i_name", "title"]);
    const type = fromKeys(p, r, ["ipType", "ip_type", "type"]);
    const rate = fromKeys(p, r, ["ipRate", "ip_rate", "rate", "interestRate", "i_interest_rate"]);
    const minMonths = fromKeys(p, r, ["ipMinMonths", "ip_min_months", "minMonths"]);
    const maxMonths = fromKeys(p, r, ["ipMaxMonths", "ip_max_months", "maxMonths"]);
    const minMonthly = fromKeys(p, r, ["ipMinMonthlyAmount", "ip_min_monthly_amount", "minMonthlyAmount"]);
    const maxMonthly = fromKeys(p, r, ["ipMaxMonthlyAmount", "ip_max_monthly_amount", "maxMonthlyAmount"]);
    const interestPayType = fromKeys(p, r, ["ipInterestPaymentType", "ip_interest_payment_type", "interestPaymentType"]);
    const earlyRate = fromKeys(p, r, ["ipEarlyTerminationRate", "ip_early_termination_rate", "earlyTerminationRate"]);
    const feature = fromKeys(p, r, ["ipFeature", "ip_feature", "ip_featue", "feature", "features"]);
    const href = fromKeys(p, r, ["ipHref", "ip_href", "href"]);
    const buttonText = fromKeys(p, r, ["ipButtonText", "ip_button_text", "buttonText"]);

    const totalInstallments = r.totalInstallments ?? r.i_month;
    const paidInstallments = r.paidInstallments ?? r.i_paid_installments;
    const monthlyAmount = r.monthlyAmount;

    setDetail({
      title: "적금 상세정보",
      subtitle: show(name),
      sections: [
        {
          heading: "핵심 정보",
          rows: [
            { label: "상품명", value: show(name) },
            { label: "상품유형", value: show(type) },
            { label: "연이율(약정)", value: showPercent(rate) },
            {
              label: "가입 기간",
              value:
                totalInstallments != null
                  ? `${totalInstallments}개월`
                  : minMonths || maxMonths
                  ? `${show(minMonths)} ~ ${show(maxMonths)}개월`
                  : "-",
            },
            {
              label: "월 납입 한도",
              value:
                minMonthly || maxMonthly
                  ? `${fmt(minMonthly, "원")} ~ ${fmt(maxMonthly, "원")}`
                  : monthlyAmount != null
                  ? fmt(monthlyAmount, "원")
                  : "-",
            },
          ],
        },
        {
          heading: "납입/해지 조건",
          rows: [
            { label: "이자 지급 방식", value: show(interestPayType) },
            { label: "중도 해지 이율", value: showPercent(earlyRate) },
            { label: "다음 납입일", value: show(r?.nextDueDate ?? r?.nextDue) },
            {
              label: "납입 회차",
              value:
                paidInstallments != null && totalInstallments != null
                  ? `${paidInstallments} / ${totalInstallments}회`
                  : "-",
            },
            { label: "특징", value: show(feature) },
          ],
        },
      ],
      cta: href ? { href, text: show(buttonText) === "-" ? "상품 페이지" : show(buttonText) } : null,
    });
    setOpen(true);
  };

  /* ================= 모달: 예금 ================= */
  const openDepositMore = (c) => {
    const p = c.product || {};
    const r = c.raw || {};

    // 가능한 모든 키에서 안전하게 값 뽑기
    const name = fromKeys(p, r, ["dpName", "dp_name", "productName", "d_name", "title"]);
    const type =
      fromKeys(p, r, ["dpType", "dp_type", "type"]) ||
      (String(name).includes("예금") ? "정기예금" : undefined); // 최소 폴백
    const rate = pick(r?.d_interest_rate, r?.rate, fromKeys(p, r, ["dpRate", "dp_rate", "rate", "interestRate"]));
    const minMonths = fromKeys(p, r, ["dpMinMonths", "dp_min_months", "minMonths"]);
    const maxMonths = fromKeys(p, r, ["dpMaxMonths", "dp_max_months", "maxMonths"]);
    const minAmount = fromKeys(p, r, ["dpMinAmount", "dp_min_amount", "minAmount"]);
    const maxAmount = fromKeys(p, r, ["dpMaxAmount", "dp_max_amount", "maxAmount"]);
    const interestPayType = fromKeys(p, r, ["dpInterestPaymentType", "dp_interest_payment_type", "interestPaymentType"]);
    const earlyRate = fromKeys(p, r, ["dpEarlyTerminationRate", "dp_early_termination_rate", "earlyTerminationRate"]);
    const feature = fromKeys(p, r, ["dpFeature", "dp_feature", "feature", "features"]);
    const href = fromKeys(p, r, ["dpHref", "dp_href", "href"]);
    const buttonText = fromKeys(p, r, ["dpButtonText", "dp_button_text", "buttonText"]);

    const termMonths = r.termMonths ?? r.d_period;
    const opened = r.openedAt ?? r.openDate ?? r.d_join_date;
    const maturity = r.maturityAt ?? r.maturity ?? r.d_maturity_date;

    setDetail({
      title: "예금 상세정보",
      subtitle: show(name),
      sections: [
        {
          heading: "핵심 정보",
          rows: [
            { label: "상품명", value: show(name) },
            { label: "상품유형", value: show(type) },
            { label: "약정(적용) 금리", value: showPercent(rate) },
            {
              label: "계약 기간",
              value:
                termMonths != null
                  ? `${termMonths}개월`
                  : minMonths || maxMonths
                  ? `${show(minMonths)} ~ ${show(maxMonths)}개월`
                  : opened && maturity
                  ? `${betweenMonths(opened, maturity).total}개월`
                  : "-",
            },
            { label: "가입 금액", value: fmt(r?.goalAmount ?? r?.d_amount, "원") },
          ],
        },
        {
          heading: "수익/해지 조건",
          rows: [
            { label: "이자 지급 방식", value: show(interestPayType) },
            { label: "중도 해지 이율", value: showPercent(earlyRate) },
            { label: "최소/최대 금액", value: `${fmt(minAmount, "원")} / ${fmt(maxAmount, "원")}` },
            { label: "특징", value: show(feature) },
          ],
        },
      ],
      cta: href ? { href, text: show(buttonText) === "-" ? "상품 페이지" : show(buttonText) } : null,
    });
    setOpen(true);
  };

  /* ================= 모달: 대출 ================= */
  const openLoanMore = (c) => {
    const p = c.product || {};
    setDetail({
      title: "대출 상세정보",
      subtitle: show(p.productName ?? c.title),
      sections: [
        {
          heading: "핵심 정보",
          rows: [
            { label: "대출 상품", value: show(p.productName ?? c.title) },
            { label: "약정 금리", value: showPercent(p.rate) },
            { label: "개시일", value: show(p.openedAt) },
            { label: "만기일", value: show(p.maturityAt) },
          ],
        },
      ],
      cta: null,
    });
    setOpen(true);
  };

  /* ================= 카드/행 ================= */
  const Card = ({ children }) => (
    <div className="relative rounded-2xl bg-gradient-to-r from-gray-50 to-white p-6 shadow-sm ring-1 ring-gray-100">
      {children}
    </div>
  );

  const Row = ({ item, onMore }) => (
    <Card>
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <ProgressDonut value={item.percent} />
          <div>
            <div className="text-lg md:text-xl font-semibold text-gray-900">{show(item.title)}</div>
            {item.subtitle ? (
              <div className="mt-1 text-base text-gray-600">{item.subtitle}</div>
            ) : (
              <>
                <div className="mt-1 text-base text-gray-600">{item.subtitleTop}</div>
                <div className="text-base text-gray-600">{item.subtitleBottom}</div>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => onMore(item)}
          className="px-3.5 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
        >
          더보기
        </button>
      </div>
    </Card>
  );

  return (
    <>
      {savingCards.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold">
            <i className="ri-time-line text-indigo-600" />
            적금 진행률
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {savingCards.map((c) => (
              <Row key={`S-${c.id}`} item={c} onMore={openSavingMore} />
            ))}
          </div>
        </section>
      )}

      {depositCards.length > 0 && (
        <section className="mt-10 space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold">
            <i className="ri-check-line text-teal-600" />
            예금 달성률
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {depositCards.map((c) => (
              <Row key={`D-${c.id}`} item={c} onMore={openDepositMore} />
            ))}
          </div>
        </section>
      )}

      {loanCards.length > 0 && (
        <section className="mt-10 space-y-4">
          <div className="flex items-center gap-2 text-xl font-bold">
            <i className="ri-file-list-2-line text-rose-600" />
            대출 진행률
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loanCards.map((c) => (
              <Row key={`L-${c.id}`} item={c} onMore={openLoanMore} />
            ))}
          </div>
        </section>
      )}

      <ProductDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        title={detail.title}
        subtitle={detail.subtitle}
        sections={detail.sections}
        cta={detail.cta}
      />
    </>
  );
}
