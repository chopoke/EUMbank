// src/api/products.js
import api from "./axios";

/* ---------- 공통 유틸 ---------- */
const pick = (obj, keys, fallback = undefined) => {
  if (!obj) return fallback;
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return fallback;
};
const toNum = (v, fallback = 0) => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const monthDiff = (a, b) => {
  if (!a || !b) return null;
  const d1 = new Date(a),
    d2 = new Date(b);
  if (Number.isNaN(+d1) || Number.isNaN(+d2)) return null;
  return (
    (d2.getFullYear() - d1.getFullYear()) * 12 +
    (d2.getMonth() - d1.getMonth())
  );
};

/* ================= 예금 ================= */
const normalizeDeposit = (d) => {
  const openedAt = pick(d, ["openedAt", "d_join_date", "openDate", "startDate"]);
  const maturityAt = pick(d, [
    "maturityAt",
    "d_maturity_date",
    "endDate",
    "dueDate",
  ]);

  const termMonthsRaw = toNum(
    pick(d, ["termMonths", "term_months", "d_term_month"], null),
    NaN
  );
  const elapsedMonthsRaw = toNum(
    pick(d, ["elapsedMonths", "elapsed_months"], null),
    NaN
  );

  const termMonths = Number.isFinite(termMonthsRaw)
    ? termMonthsRaw
    : monthDiff(openedAt, maturityAt) ?? 0;
  const elapsedMonthsCalc = Number.isFinite(elapsedMonthsRaw)
    ? elapsedMonthsRaw
    : monthDiff(openedAt, new Date()) ?? 0;

  // 상품 타입 / 금리
  const type = pick(d, ["productType", "dpType", "dp_type", "type"]);
  const rate = toNum(
    pick(d, ["rate", "interestRate", "d_interest_rate", "dpRate", "dp_rate"]),
    0
  );

  // 핵심 금액들
  const balance = toNum(
    pick(d, ["balance", "d_principal_bal", "principalBalance", "dPrincipalBal"]),
    0
  );
  const joinAmount = toNum(
    pick(d, ["joinAmount", "d_amount", "amount", "contractAmount", "goalAmount"]),
    0
  );
  const expectedMaturityAmount = toNum(
    pick(d, [
      "expectedMaturityAmount",
      "d_maturity_amount",
      "maturityAmount",
      "dExpectedMaturityAmount",
    ]),
    0
  );
  // goalAmount 는 없으면 만기예상금액 / 가입금액 중 하나로 채우기
  const goalAmount =
    toNum(
      pick(d, ["goalAmount", "d_amount", "amount", "contractAmount"], null),
      0
    ) || expectedMaturityAmount || joinAmount;

  // 이자 지급 방식 / 중도 해지 이율
  const payMethod = pick(d, [
    "payMethod",
    "dpInterestPaymentType",
    "interestPayMethod",
  ]);
  const earlyTerminationRate = toNum(
    pick(d, [
      "earlyTerminationRate",
      "dpEarlyTerminationRate",
      "earlyTerminateRate",
    ]),
    0
  );

  return {
    id: pick(d, ["d_no", "dNo", "id"]),
    productName: pick(d, ["productName", "dp_name", "dpName", "d_product_name"]),

    // 상품 정보
    productType: type,
    dpType: type, // ← dpType 로도 alias
    rate,
    dpRate: rate, // ← dpRate 로도 alias

    // 금액/기간
    joinAmount,
    goalAmount,
    expectedMaturityAmount,
    accountNo: pick(d, ["d_account_no", "a_account_no", "accountNo"]),
    openedAt,
    maturityAt,
    status: pick(d, ["d_status", "status"]),
    balance,

    termMonths,
    elapsedMonths: Math.max(0, Math.min(termMonths, elapsedMonthsCalc)),

    // 모달 하단
    payMethod,
    dpInterestPaymentType: payMethod, // alias
    earlyTerminationRate,
    dpEarlyTerminationRate: earlyTerminationRate, // alias
    minAmt: toNum(pick(d, ["minAmt", "dpMinAmount"], null)),
    maxAmt: toNum(pick(d, ["maxAmt", "dpMaxAmount"], null)),
    feature: pick(d, ["feature", "dpFeature"]),
  };
};

/* ================= 적금 ================= */
const normalizeSaving = (s) => {
  const rate = toNum(
    pick(s, ["rate", "ipRate", "i_interest_rate"], null),
    null
  );

  const principalBalance = toNum(
    pick(s, [
      "principalBalance",
      "i_principal_bal",
      "iPrincipalBal",
      "balance",
    ]),
    0
  );

  const expectedMaturityAmount = toNum(
    pick(s, [
      "expectedMaturityAmount",
      "i_maturity_amount",
      "i_expected_maturity_amount",
    ]),
    0
  );

  return {
    id: pick(s, ["i_no", "iNo", "id"]),

    productName: pick(s, ["productName", "ip_name", "ipName", "i_product_name"]),
    accountNo: pick(s, ["i_account_no", "a_account_no", "accountNo"]),

    ipType: pick(s, ["ipType", "ip_type", "i_product_type", "productType", "type"]),

    // 금리 (둘 다 채워서 어디서 불러도 나오게)
    rate,
    ipRate: rate,

    termMonths: toNum(
      pick(s, ["termMonths", "i_month", "totalInstallments"], null),
      null
    ),

    joinedAt: pick(s, ["i_join_date", "joinedAt", "joinDate"]),
    maturityAt: pick(s, ["i_maturity_date", "maturityAt", "endDate", "dueDate"]),
    status: pick(s, ["i_status", "status"]),

    monthlyAmount: toNum(
      pick(s, ["i_monthly_amt", "monthlyAmount"], 0)
    ),

    // 회차 정보
    paidInstallments: toNum(
      pick(
        s,
        ["paidInstallments", "iPaidInstallments", "i_paid_installments", "paidCnt"],
        0
      )
    ),
    totalInstallments: toNum(
      pick(s, ["totalInstallments", "i_month", "installmentCnt"], 0)
    ),

    nextDueDate: pick(s, ["nextDueDate", "nextPaymentDate", "nextPayDate"], null),

    // 원금 / 만기 예상 금액
    principalBalance,
    expectedMaturityAmount,

    // 모달 하단
    ipInterestPaymentType: pick(s, [
      "ipInterestPaymentType",
      "ip_interest_payment_type",
    ]),
    ipEarlyTerminationRate: pick(s, [
      "ipEarlyTerminationRate",
      "ip_early_termination_rate",
    ]),
    ipFeature: pick(s, ["ipFeature", "ip_feature", "ip_featue"]),
  };
};

/* ================= 대출 ================= */
const normalizeLoan = (l) => ({
  id: pick(l, ["l_no", "lNo", "l_id", "id"]),
  productName: pick(l, ["productName", "lpd_name", "lpdName", "loanProductName"]),

  accountNo: pick(l, ["accountNo", "a_account_no"]),
  rate: toNum(pick(l, ["rate", "l_interest_rate"], 0)),
  principal: toNum(pick(l, ["principal", "l_principal_amount"], 0)),
  balance: toNum(
    pick(l, ["balance", "l_balance", "outstandingPrincipal", "principalBalance"]),
    0
  ),

  termMonths: toNum(pick(l, ["termMonths", "l_term_month", "term"]), null),
  openedAt: pick(l, ["openedAt", "l_start_date", "start_date", "startDate"]),
  maturityAt: pick(l, ["maturityAt", "l_maturity_date", "endDate"]),

  loanType: pick(l, ["loanType", "lpd_type", "productType", "type"]),
  repayMethod: pick(l, ["repayMethod", "l_repay_method", "repaymentMethod"]),
  rateType: pick(l, ["rateType", "l_rate_type", "interestType"]),
  lender: pick(l, ["lender", "lpd_bank_name", "bankName", "financeCompany"]),
});

/* ================= API 호출 ================= */
export const fetchMyDeposits = async () => {
  try {
    const { data } = await api.get("/api/mypage/deposits");
    const arr = Array.isArray(data) ? data : data?.content || [];
    const out = arr.map(normalizeDeposit);
    if (out[0]) console.table([{ type: "deposit", ...out[0] }]);
    return out;
  } catch (e) {
    console.warn(
      "[products] /deposits error",
      e?.response?.status,
      e?.response?.data || e?.message
    );
    return [];
  }
};

export const fetchMySavings = async () => {
  try {
    const { data } = await api.get("/api/mypage/savings");
    const arr = Array.isArray(data) ? data : data?.content || [];
    const out = arr.map(normalizeSaving);
    if (out[0]) console.table([{ type: "saving", ...out[0] }]);
    return out;
  } catch (e) {
    console.warn(
      "[products] /savings error",
      e?.response?.status,
      e?.response?.data || e?.message
    );
    return [];
  }
};

export const fetchMyLoans = async () => {
  try {
    const { data } = await api.get("/api/mypage/loans");
    const arr = Array.isArray(data) ? data : data?.content || [];
    const out = arr.map(normalizeLoan);
    if (out[0]) console.table([{ type: "loan", ...out[0] }]);
    return out;
  } catch (e) {
    console.warn(
      "[products] /loans error",
      e?.response?.status,
      e?.response?.data || e?.message
    );
    return [];
  }
};
