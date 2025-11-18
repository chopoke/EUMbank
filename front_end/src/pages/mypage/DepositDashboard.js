// src/pages/mypage/DepositDashboard.js
import React, { useMemo, useState } from "react";
import ProductDetailsModal from "../../components/ProductDetailsModal";

/* ================= 공통 유틸 ================= */
const clamp = (v, min = 0, max = 100) =>
  Math.max(min, Math.min(max, v));

const toNum = (v) => {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const pct = (num, den) => {
  const n = toNum(num);
  const d = toNum(den);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return 0;
  return clamp(Math.round((n / d) * 100));
};

const fmt = (v, u = "") =>
  v == null || v === "" ? "-" : `${toNum(v).toLocaleString()}${u}`;
const show = (v) =>
  v == null || String(v).trim() === "" ? "-" : String(v);

const showPct = (v) =>
  v == null || String(v).trim() === ""
    ? "-"
    : `${toNum(v).toFixed(2).replace(/\.00$/, "")}%`;

/** obj["a.b"] 처럼 중첩 키도 찾아주는 get */
const getPath = (obj, path) => {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let cur = obj;
  for (const part of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, part)) {
      cur = cur[part];
    } else {
      return undefined;
    }
  }
  return cur;
};

/** 여러 후보 키 중에서 처음 발견되는 값을 숫자로 변환 */
const numFrom = (obj, keys = []) => {
  for (const k of keys) {
    const v = getPath(obj, k);
    if (v != null && v !== "") return toNum(v);
  }
  return 0;
};

/* ===== Donut (72px) ===== */
function ProgressDonut({ value = 0, size = 72, stroke = 10 }) {
  const p = clamp(Math.round(toNum(value)), 0, 100);

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
        stroke="#E5E7EB"
        strokeWidth={stroke}
        fill="none"
      />
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
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="14"
        fontWeight="800"
        fill="#111827"
      >
        {p}%
      </text>
    </svg>
  );
}

/* ===== 본문 ===== */
export default function DepositDashboard({ deposits = [], savings = [] }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState({
    title: "",
    subtitle: "",
    sections: [],
    cta: null,
    variant: "deposit",
  });

  console.log("▶ deposits raw", deposits);
  console.log("▶ savings raw", savings);

  /* ---------------- 적금 카드 ---------------- */
  const savingCards = useMemo(
    () =>
      (savings || []).map((s) => {
        // (1) 기본 값들 (모달용: 금액 계산은 그대로 둠)
        let savingPrincipal = numFrom(s, [
          "principalBalance",
          "iPrincipalBal",
          "i_principal_bal",
          "balance",
          "raw.principalBalance",
          "raw.balance",
        ]);

        let savingTotalMoney = numFrom(s, [
          "expectedMaturityAmount",
          "iExpectedMaturityAmount",
          "i_expected_maturity_amount",
          "amount",
          "iAmount",
          "i_amount",
          "raw.expectedMaturityAmount",
        ]);

        const paid = numFrom(s, [
          "paidInstallments",
          "iPaidInstallments",
          "i_paid_installments",
        ]);
        const total = numFrom(s, ["totalInstallments", "i_month"]);

        const monthly = numFrom(s, ["monthlyAmount", "i_monthly_amt"]);

        // 금액 정보는 모달에서 쓰려고 남겨두지만,
        // === 도넛 퍼센트는 "회차" 기준으로만 계산 ===
        const percent = total > 0 ? pct(paid, total) : 0;

        console.log("[SavingCard]", {
          id: s.id,
          productName: s.productName,
          paid,
          total,
          monthly,
          savingPrincipal,
          savingTotalMoney,
          percent,
        });

        return {
          kind: "SAVING",
          id: s.id,
          title: s.productName ?? s.ipName ?? "적금",
          subtitleTop:
            total != null && total !== 0
              ? `납입 ${paid} / ${total}회`
              : `납입 ${paid}회`,
          subtitleBottom: `다음 납입 ${show(
            s.nextDueDate ?? s.nextDue ?? s.nextPayDate
          )}`,
          percent,
          raw: {
            ...s,
            _computedPrincipal: savingPrincipal,
            _computedTotal: savingTotalMoney,
            _computedPaid: paid,
            _computedTotalInstallments: total,
          },
        };
      }),
    [savings]
  );

  /* ---------------- 예금 카드 ---------------- */
  const depositCards = useMemo(
    () =>
      (deposits || []).map((d) => {
        const principal = numFrom(d, [
          "balance",
          "principalBalance",
          "dPrincipalBal",
          "d_principal_bal",
          "raw.balance",
          "raw.principalBalance",
        ]);

        const totalMoney = numFrom(d, [
          "expectedMaturityAmount",
          "dExpectedMaturityAmount",
          "d_expected_maturity_amount",
          "goalAmount",
          "dAmount",
          "d_amount",
          "raw.expectedMaturityAmount",
          "raw.goalAmount",
        ]);

        // 예금: 만기/목표 금액이 있으면 그 비율, 없고 잔액만 있으면 100%
        let percent = 0;
        if (totalMoney > 0 && principal > 0) {
          percent = pct(principal, totalMoney);
        } else if (principal > 0) {
          percent = 100;
        } else {
          percent = 0;
        }

        console.log("[DepositCard]", {
          id: d.id,
          productName: d.productName,
          principal,
          totalMoney,
          percent,
        });

        return {
          kind: "DEPOSIT",
          id: d.id,
          title: d.productName ?? d.dpName ?? "예금",
          subtitleTop: `잔액 ${fmt(principal, "원")}`,
          subtitleBottom: `만기 ${show(d.maturityAt)}`,
          percent,
          raw: d,
        };
      }),
    [deposits]
  );

  /* ===== 모달: 적금 ===== */
  const openSavingMore = (c) => {
    const m = c.raw || c;

    let savingPrincipal = numFrom(m, [
      "_computedPrincipal", // 앞에서 계산해 둔 값 우선 사용
      "principalBalance",
      "iPrincipalBal",
      "i_principal_bal",
      "balance",
      "raw.principalBalance",
      "raw.balance",
    ]);

    let savingTotalMoney = numFrom(m, [
      "_computedTotal",
      "expectedMaturityAmount",
      "iExpectedMaturityAmount",
      "i_expected_maturity_amount",
      "amount",
      "iAmount",
      "i_amount",
      "raw.expectedMaturityAmount",
    ]);

    const paid = numFrom(m, [
      "_computedPaid",
      "paidInstallments",
      "iPaidInstallments",
      "i_paid_installments",
    ]);
    const total = numFrom(m, [
      "_computedTotalInstallments",
      "totalInstallments",
      "i_month",
    ]);
    const monthly = numFrom(m, ["monthlyAmount", "i_monthly_amt"]);

    // 모달용 금액 보정 (UI는 그대로 사용)
    if (savingPrincipal <= 0 && paid > 0 && monthly > 0) {
      savingPrincipal = monthly * paid;
    }
    if (savingTotalMoney <= 0 && total > 0 && monthly > 0) {
      savingTotalMoney = monthly * total;
    }

    setDetail({
      title: "적금 상세정보",
      subtitle: show(m.productName ?? m.ipName),
      sections: [
        {
          heading: "핵심 정보",
          rows: [
            { label: "상품명", value: show(m.productName ?? m.ipName) },
            { label: "상품유형", value: show(m.ipType) },
            { label: "연이율(약정)", value: showPct(m.ipRate) },
            {
              label: "가입 기간",
              value: total ? `${total}개월` : "-",
            },
            {
              label: "월 납입 금액",
              value: fmt(monthly, "원"),
            },
            {
              label: "현재 적립 원금",
              value: fmt(savingPrincipal, "원"),
            },
            {
              label: "만기 예상 금액",
              value: fmt(savingTotalMoney, "원"),
            },
          ],
        },
        {
          heading: "납입/해지 조건",
          rows: [
            {
              label: "납입 회차",
              value: total ? `${paid} / ${total}회` : "-",
            },
            {
              label: "다음 납입일",
              value: show(m.nextDueDate ?? m.nextDue ?? m.nextPayDate),
            },
          ],
        },
      ],
      cta: m.ipHref
        ? { href: m.ipHref, text: show(m.ipButtonText) || "상품 페이지" }
        : null,
      variant: "saving",
    });
    setOpen(true);
  };

  /* ===== 모달: 예금 ===== */
  const openDepositMore = (c) => {
    const m = c.raw || c;

    const joinAmount = numFrom(m, [
      "goalAmount",
      "dAmount",
      "d_amount",
      "raw.goalAmount",
    ]);
    const expected = numFrom(m, [
      "expectedMaturityAmount",
      "dExpectedMaturityAmount",
      "d_expected_maturity_amount",
      "raw.expectedMaturityAmount",
    ]);
    const principal = numFrom(m, [
      "balance",
      "principalBalance",
      "dPrincipalBal",
      "d_principal_bal",
      "raw.balance",
      "raw.principalBalance",
    ]);

    setDetail({
      title: "예금 상세정보",
      subtitle: show(m.productName ?? m.dpName),
      sections: [
        {
          heading: "핵심 정보",
          rows: [
            { label: "상품명", value: show(m.productName ?? m.dpName) },
            { label: "상품유형", value: show(m.dpType) },
            { label: "약정(적용) 금리", value: showPct(m.dpRate) },
            {
              label: "계약 기간",
              value: m.termMonths ? `${m.termMonths}개월` : "-",
            },
            { label: "가입 금액", value: fmt(joinAmount, "원") },
            { label: "만기 예상 금액", value: fmt(expected, "원") },
          ],
        },
        {
          heading: "수익/해지 조건",
          rows: [
            {
              label: "이자 지급 방식",
              value: show(m.dpInterestPaymentType),
            },
            {
              label: "중도 해지 이율",
              value: showPct(m.dpEarlyTerminationRate),
            },
            {
              label: "현재 원금 잔액",
              value: fmt(principal, "원"),
            },
          ],
        },
      ],
      cta: m.dpHref
        ? { href: m.dpHref, text: show(m.dpButtonText) || "상품 페이지" }
        : null,
      variant: "deposit",
    });
    setOpen(true);
  };

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
            <div className="text-lg md:text-xl font-semibold text-gray-900">
              {show(item.title)}
            </div>
            <div className="mt-1 text-base text-gray-600">
              {item.subtitleTop}
            </div>
            <div className="text-base text-gray-600">
              {item.subtitleBottom}
            </div>
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

      <ProductDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        title={detail.title}
        subtitle={detail.subtitle}
        sections={detail.sections}
        cta={detail.cta}
        variant={detail.variant}
      />
    </>
  );
}
