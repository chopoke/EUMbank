import api from "./axios";

/** 여러 후보 키 중 먼저 존재하는 값을 꺼내기 */
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

/** 날짜 차이(개월) 계산 폴백 */
const monthDiff = (a, b) => {
  if (!a || !b) return null;
  const d1 = new Date(a), d2 = new Date(b);
  if (Number.isNaN(+d1) || Number.isNaN(+d2)) return null;
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
};

/** --- 예금 정규화: 달성/기간 계산 포함 (게이지용 termMonths/elapsedMonths) --- */
const normalizeDeposit = (d) => {
  const openedAt   = pick(d, ["openedAt", "d_join_date", "openDate", "startDate"]);
  const maturityAt = pick(d, ["maturityAt", "d_maturity_date", "endDate", "dueDate"]);

  const termMonthsRaw    = toNum(pick(d, ["termMonths", "term_months"]), NaN);
  const elapsedMonthsRaw = toNum(pick(d, ["elapsedMonths", "elapsed_months"]), NaN);

  const termMonths =
    Number.isFinite(termMonthsRaw) ? termMonthsRaw : monthDiff(openedAt, maturityAt) ?? 0;
  const elapsedMonthsCalc =
    Number.isFinite(elapsedMonthsRaw) ? elapsedMonthsRaw : monthDiff(openedAt, new Date()) ?? 0;

  return {
    id:           pick(d, ["d_no", "dNo", "id"]),
    productName:  pick(d, ["productName", "dp_name", "dpName", "d_product_name"]),
    accountNo:    pick(d, ["d_account_no", "a_account_no", "accountNo"]),
    openedAt,
    maturityAt,
    status:       pick(d, ["d_status", "status"]),
    interestRate: toNum(pick(d, ["d_interest_rate", "interestRate", "rate"], 0)),

    balance:      toNum(pick(d, ["d_principal_bal", "principalBalance", "balance", "dPrincipalBal"], 0)),
    goalAmount:   toNum(pick(d, ["d_amount", "amount", "contractAmount", "goalAmount"], 0)),

    /* ✅ 대시보드가 요구하는 필드들 */
    termMonths,
    elapsedMonths: Math.max(0, Math.min(termMonths, elapsedMonthsCalc)),

    accruedInterest: toNum(pick(d, ["d_accr_int", "accruedInterest"], 0)),
  };
};

/** --- 적금 정규화 --- */
const normalizeSaving = (s) => ({
  id:                 pick(s, ["i_no", "iNo", "id"]),
  productName:        pick(s, ["productName", "ip_name", "ipName", "i_product_name"]),
  accountNo:          pick(s, ["i_account_no", "a_account_no", "accountNo"]),
  joinedAt:           pick(s, ["i_join_date", "joinedAt", "joinDate"]),
  maturityAt:         pick(s, ["i_maturity_date", "maturityAt", "endDate", "dueDate"]),
  status:             pick(s, ["i_status", "status"]),
  monthlyAmount:      toNum(pick(s, ["i_monthly_amt", "monthlyAmount"], 0)),
  paidInstallments:   toNum(pick(s, ["i_paid_installments", "paidInstallments", "paidCnt"], 0)),
  totalInstallments:  toNum(pick(s, ["i_month", "totalInstallments", "installmentCnt"], 0)),
  nextDueDate:        pick(s, ["nextDueDate", "nextPaymentDate"], null),
});

/** --- 대출 정규화 --- */
const normalizeLoan = (l) => ({
  id:          pick(l, ["l_no", "lNo", "id"]),
  productName: pick(l, ["productName", "lpd_name", "lpdName", "loanProductName"]),
  accountNo:   pick(l, ["accountNo", "a_account_no"]),
  startDate:   pick(l, ["start_date", "startDate"]),
  maturityAt:  pick(l, ["l_maturity_date", "maturityAt", "endDate"]),
  status:      pick(l, ["l_status", "status"]),
  balance:     toNum(pick(l, ["outstandingPrincipal", "balance", "principalBalance"], 0)),
  rate:        toNum(pick(l, ["l_interest_rate", "rate"], 0)),
});

/** --- API 호출 + 정규화 --- */
export const fetchMyDeposits = async () => {
  const { data } = await api.get("/api/mypage/deposits");
  const arr = Array.isArray(data) ? data : data?.content || [];
  return arr.map(normalizeDeposit);
};

export const fetchMySavings = async () => {
  const { data } = await api.get("/api/mypage/savings");
  const arr = Array.isArray(data) ? data : data?.content || [];
  return arr.map(normalizeSaving);
};

export const fetchMyLoans = async () => {
  const { data } = await api.get("/api/mypage/loans");
  const arr = Array.isArray(data) ? data : data?.content || [];
  return arr.map(normalizeLoan);
};
