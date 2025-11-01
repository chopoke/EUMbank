import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import { fetchAccounts, fetchLoanProductDetail, fetchLoanQuote } from "../../../api/accounts";

// 유틸
// --------------------------------------
const won = (n) => Number(n || 0).toLocaleString("ko-KR");
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function useDebouncedEffect(effect, deps, delay = 300) {
  React.useEffect(() => {
    const h = setTimeout(effect, delay);
    return () => clearTimeout(h);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

// 월납입(원리금균등) 계산
function monthlyAnnuity(P, n, annualRate) {
  P = Number(P || 0);
  n = Number(n || 0);
  const r = Number(annualRate || 0) / 100 / 12;
  if (!P || !n) return 0;
  if (!r) return Math.ceil(P / n);
  const a = (P * r) / (1 - Math.pow(1 + r, -n));
  return Math.ceil(a);
}

// ---- 숫자 유틸
const onlyDigits = (s = "") => s.replace(/[^\d]/g, "");
const toNum = (s = "") => {
  const clean = onlyDigits(String(s));
  if (!clean) return null;
  try {
    return Number(clean);
  } catch {
    return null;
  }
};
const fmtKO = (n) => Number(n || 0).toLocaleString("ko-KR");

// ---- 공통 숫자 입력 컴포넌트
function NumberInput({
  value,
  onChange,
  min, max,
  placeholder,
  disabled,
  className = "",
  clampOnBlur = true,
}) {
  const [text, setText] = React.useState(
    value == null || value === 0 ? "" : fmtKO(value)
  );
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (focused) return;
    setText(value == null || value === 0 ? "" : fmtKO(value));
  }, [value, focused]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setText(raw);
    const num = toNum(raw);
    onChange?.(num);
  };

  const handleBlur = () => {
    setFocused(false);
    if (!clampOnBlur) {
      const num = toNum(text);
      setText(num == null ? "" : fmtKO(num));
      return;
    }
    let num = toNum(text);
    if (num == null) {
      setText("");
      onChange?.(null);
      return;
    }
    if (min != null) num = Math.max(min, num);
    if (max != null) num = Math.min(max, num);
    setText(fmtKO(num));
    onChange?.(num);
  };

  return (
    <input
      type="tel"
      inputMode="numeric"
      className={className}
      value={text}
      onFocus={() => setFocused(true)}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

// ---- 숫자 → 한글(금액) 유틸
function numberToKorean(n, { money = true, omitIl = true } = {}) {
  if (n == null) return "";
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  if (num === 0) return money ? "영원" : "영";

  const small = ["", "십", "백", "천"];
  const digit = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  const big = money ? ["", "만", "억", "조", "경"] : ["", "만", "억", "조", "경"];

  const parts = [];
  let rest = Math.abs(Math.trunc(num));
  let bigIdx = 0;

  while (rest > 0 && bigIdx < big.length) {
    const chunk = rest % 10000;
    rest = Math.floor(rest / 10000);
    if (chunk) {
      let chunkStr = "";
      let temp = chunk;
      for (let i = 0; i < 4; i++) {
        const d = temp % 10;
        if (d) {
          const dKo = (omitIl && d === 1 && i > 0) ? "" : digit[d];
          chunkStr = dKo + small[i] + chunkStr;
        }
        temp = Math.floor(temp / 10);
        if (temp === 0) break;
      }
      parts.unshift(chunkStr + (bigIdx > 0 ? big[bigIdx] : ""));
    }
    bigIdx++;
  }

  const sign = num < 0 ? "마이너스 " : "";
  return sign + parts.join("");
}

// 영어/혼합 입력 → 한글 저장(정규화)
function toKoRateType(v = "") {
  const s = String(v).trim().toUpperCase();
  if (s === "FIXED" || s === "고정" || s === "고정금리") return "고정금리";
  if (s === "VARIABLE" || s === "변동" || s === "변동금리") return "변동금리";
  return "고정금리";
}
function normalizeRpayKo(v = "") {
  const s = String(v).trim();
  if (!s) return "원리금균등";
  if (/분할상환|원금균등/i.test(s)) return "원금균등";
  if (/만기일시/i.test(s)) return "만기일시";
  if (/원리금균등/i.test(s)) return "원리금균등";
  return "원리금균등";
}

// 화면 가시성 계산
function computeVisibility(productType = "", rpayKo = "") {
  const t = String(productType).toUpperCase();
  const isMortgage = t.includes("MORTGAGE") || t.includes("담보");
  const isJeonse = t.includes("JEONSE") || t.includes("전세");
  const isPersonal = !isMortgage && !isJeonse;
  const isBullet = /만기일시/.test(String(rpayKo));
  const showMonthlyCard = true;
  const monthlyDisabled = isBullet;
  return { isMortgage, isJeonse, isPersonal, isBullet, showMonthlyCard, monthlyDisabled };
}

// 숫자 입력시 한글 변환 표시
function KoreanMoneyHint({ value, className = "" , showWon = false, omitIl = true }) {
  if (!value || Number(value) === 0) return null;
  const text = numberToKorean(value, { money: true, omitIl });
  return <div className={`text-xs text-gray-500 mt-1 ${className}`}>({text}{showWon ? "원" : ""})</div>;
}

export default function ApplyFormPage() {
  const { code } = useParams();
  const nav = useNavigate();

  // --------------------------------------
  // State
  // --------------------------------------
  const [flow, setFlow] = React.useState(null);
  const [product, setProduct] = React.useState(null);
  const [accounts, setAccounts] = React.useState([]);
  const [quote, setQuote] = React.useState(null);
  const lastReqRef = React.useRef("");

  const [form, setForm] = React.useState({
    occupation: "EMPLOYEE",
    incomeAnnual: 0,
    desiredAmount: 0,
    desiredTerm: 12,
    rateType: "",
    rpayType: "",
    purpose: "생활비",
    collateralValue: null,
    jeonseDeposit: null,
    employer: "",
    creditScore: null,
    payoutAccountNo: "",
    repayAccountNo: "",
    customerId: "1",
  });

  const [quoting, setQuoting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const [fieldErr, setFieldErr] = React.useState({});

  // --------------------------------------
  // 초기 로드
  // --------------------------------------
  React.useEffect(() => {
    (async () => {
      try {
        const f = loadFlow(code);
        if (!f) {
          nav(`/loan/apply/${encodeURIComponent(code)}/agree`, { replace: true });
          return;
        }
        setFlow(f);
        setQuote(f.quote || null);

        setForm((prev) => ({
          ...prev,
          occupation: f.form?.occupation || "EMPLOYEE",
          incomeAnnual: Number(f.form?.incomeAnnual || 0),
          desiredAmount: Number(f.form?.desiredAmount || 0),
          desiredTerm: Number(f.form?.desiredTerm || 12),
          rateType: toKoRateType(f.form?.rateType || ""),
          rpayType: normalizeRpayKo(f.form?.rpayType || ""),
          purpose: f.form?.purpose || "생활비",
          collateralValue: f.form?.collateralValue ?? null,
          jeonseDeposit: f.form?.jeonseDeposit ?? null,
          employer: f.form?.employer || "",
          creditScore: f.form?.creditScore ?? null,
          payoutAccountNo: f.form?.payoutAccountNo || "",
          repayAccountNo: f.form?.repayAccountNo || "",
          customerId: f.form?.customerId || "1",
        }));

        let prod = f.product || null;
        if (!prod) {
          const res = await fetchLoanProductDetail(code);
          prod = res?.data ?? res;
        }
        setProduct(prod);

        const accRes = await fetchAccounts().catch(() => ({ data: [] }));
        const list = accRes?.data ?? accRes ?? [];
        const arr = Array.isArray(list) ? list : [];
        setAccounts(arr);

        // 초기값: 서로 다른 계좌로 세팅 시도
        if (arr.length > 0) {
          setForm((s) => {
            const payout = s.payoutAccountNo || arr[0].a_no;
            const repay  = s.repayAccountNo  || (arr[1]?.a_no || "");
            return { ...s, payoutAccountNo: payout, repayAccountNo: repay };
          });
        }
      } catch (e) {
        console.error(e);
        setErr(e?.message || "신청서 로딩 오류");
      } finally {
        setLoading(false);
      }
    })();
  }, [code, nav]);

  // --------------------------------------
  // 옵션 파생값
  // --------------------------------------
  const opts = React.useMemo(() => (Array.isArray(product?.options) ? product.options : []), [product]);

  const allowedTerms = React.useMemo(() => {
    const terms = [
      ...(product?.termMonths || []),
      ...opts.map((op) => Number(op.termMonths || op.terms || 0)).filter(Boolean),
    ];
    return [...new Set(terms)].sort((a, b) => a - b);
  }, [product, opts]);

  // 한글 라벨 리스트
  const allowedRateTypesKo = React.useMemo(() => {
    const fromProduct = opts
      .map((op) => (op.rateType || op.rate_type || "").toString())
      .filter(Boolean)
      .map(toKoRateType);

    const q = flow?.quote || quote;
    const fromQuote = []
      .concat((q?.rateTypes && Array.isArray(q.rateTypes) ? q.rateTypes : []), q?.rateType ? [q.rateType] : [])
      .map(toKoRateType);

    const fromForm = form.rateType ? [toKoRateType(form.rateType)] : [];
    const fallback = ["고정금리", "변동금리"];

    return Array.from(new Set([...fromProduct, ...fromQuote, ...fromForm, ...fallback]));
  }, [opts, flow?.quote, quote, form.rateType]);

  const allowedRpayTypesKo = React.useMemo(() => {
    const fromProduct = opts
      .map((op) => (op.rpayType ?? op.rpayTypeCode ?? op.rpayTypeNm ?? "").toString())
      .filter(Boolean)
      .map(normalizeRpayKo);

    const q = flow?.quote || quote;
    const fromQuote = []
      .concat(
        (q?.rpayTypes && Array.isArray(q.rpayTypes) ? q.rpayTypes : []),
        q?.rpayType ? [q.rpayType] : [],
        q?.rpayTypeNm ? [q.rpayTypeNm] : []
      )
      .map(normalizeRpayKo);

    const fromForm = form.rpayType ? [normalizeRpayKo(form.rpayType)] : [];
    const fallback = ["원리금균등", "원금균등", "만기일시"];

    return Array.from(new Set([...fromProduct, ...fromQuote, ...fromForm, ...fallback]));
  }, [opts, flow?.quote, quote, form.rpayType]);

  // --------------------------------------
  // 타입 판별/가시성
  // --------------------------------------
  const loanType = String(product?.type || "");
  const { isMortgage, isJeonse, isPersonal, isBullet, showMonthlyCard, monthlyDisabled } =
    computeVisibility(loanType, form.rpayType);
  const needsCollateral = isMortgage || isJeonse;
  const isLtvPresent = needsCollateral && product?.ltvMax != null && Number(product.ltvMax) > 0;

  // --------------------------------------
  // 기본값/정합성 보정
  // --------------------------------------
  React.useEffect(() => {
    if (allowedTerms.length && !allowedTerms.includes(Number(form.desiredTerm))) {
      setForm((s) => ({ ...s, desiredTerm: allowedTerms[0] }));
    }
    if (allowedRateTypesKo.length && !form.rateType) {
      setForm((s) => ({ ...s, rateType: allowedRateTypesKo[0] }));
    }
    if (allowedRpayTypesKo.length && !form.rpayType) {
      setForm((s) => ({ ...s, rpayType: allowedRpayTypesKo[0] }));
    }
    const limitMax = product?.limitMax ?? product?.limit_max;
    if (limitMax != null && Number(form.desiredAmount) > Number(limitMax)) {
      setForm((s) => ({ ...s, desiredAmount: Number(limitMax) }));
    }
    if (!needsCollateral) {
      setForm((s) => ({ ...s, collateralValue: null, jeonseDeposit: null }));
    }
  }, [allowedTerms, allowedRateTypesKo, allowedRpayTypesKo, product, needsCollateral]); // eslint-disable-line react-hooks/exhaustive-deps

  // --------------------------------------
  // 유효성/버튼 활성 조건
  // --------------------------------------
  const invalidCollateral = isMortgage && (!form.collateralValue || Number(form.collateralValue) <= 0);
  const invalidJeonse = isJeonse && (!form.jeonseDeposit || Number(form.jeonseDeposit) <= 0);

  const canRequote =
    !!form.desiredAmount && !!form.desiredTerm && (!isMortgage || !invalidCollateral) && (!isJeonse || !invalidJeonse);

  // --------------------------------------
  // 견적 재조회
  // --------------------------------------
  const onRequote = async () => {
    const nextErr = {};
    if (invalidCollateral) nextErr.collateralValue = "주택담보대출: 담보가치를 입력해야 합니다.";
    if (invalidJeonse) nextErr.jeonseDeposit = "전세자금대출: 임차보증금(전세금)을 입력해야 합니다.";
    if ((form.desiredAmount ?? 0) < 1_000_000) nextErr.desiredAmount = "신청금액은 최소 1,000,000원 이상입니다.";
    setFieldErr(nextErr);
    if (Object.keys(nextErr).length > 0) return;

    try {
      setQuoting(true);
      const limitMax = product?.limitMax ?? product?.limit_max;
      const reqAmount =
        limitMax != null
          ? clamp(Number(form.desiredAmount || 0), 1_000_000, Number(limitMax))
          : Number(form.desiredAmount || 0);

      const req = {
        occupation: form.occupation,
        desiredAmount: reqAmount,
        desiredTerm: Number(form.desiredTerm || 0),
        rateType: toKoRateType(form.rateType),
        rpayType: normalizeRpayKo(form.rpayType),
        annualIncome: Number(form.incomeAnnual || 0),
        collateralValue: isMortgage ? Number(form.collateralValue || 0) : undefined,
        jeonseDeposit: isJeonse ? Number(form.jeonseDeposit || 0) : undefined,
        extra: form.creditScore != null && form.creditScore !== "" ? { creditScore: Number(form.creditScore) } : undefined,
      };

      const sig = JSON.stringify({ code, ...req });
      if (lastReqRef.current === sig) {
        setQuoting(false);
        return;
      }
      lastReqRef.current = sig;

      const res = await fetchLoanQuote(code, req);
      const data = res?.data ?? res;
      setQuote(data);
      setFieldErr({});
    } catch (e) {
      console.error(e);
      setFieldErr((prev) => ({ ...prev, _server: e?.response?.data?.message || e?.message || "견적 재조회 실패" }));
    } finally {
      setQuoting(false);
    }
  };

  // --------------------------------------
  // 자동 재조회(디바운스)
  // --------------------------------------
  useDebouncedEffect(
    () => {
      if (!product) return;
      if (!form.desiredAmount || !form.desiredTerm) return;
      if (invalidCollateral || invalidJeonse) return;
      onRequote();
    },
    [
      product, code,
      form.desiredAmount, form.desiredTerm,
      form.rateType, form.rpayType,
      form.collateralValue, form.jeonseDeposit,
      form.incomeAnnual, form.creditScore,
    ],
    300
  );

  // --------------------------------------
  // 다음 단계
  // --------------------------------------
  const sameAccount =
    !!form.payoutAccountNo &&
    !!form.repayAccountNo &&
    form.payoutAccountNo === form.repayAccountNo;

  const canNext =
    !!form.desiredAmount &&
    !!form.desiredTerm &&
    !!form.payoutAccountNo &&
    !!form.repayAccountNo &&
    !sameAccount &&
    (!needsCollateral || (!invalidCollateral && !invalidJeonse));

  const onNext = () => {
    if (!canNext) return;
    const normalizedForm = {
      ...form,
      rateType: toKoRateType(form.rateType),
      rpayType: normalizeRpayKo(form.rpayType),
      collateralValue: needsCollateral ? form.collateralValue : null,
      jeonseDeposit: needsCollateral ? form.jeonseDeposit : null,
      employer: isPersonal ? form.employer : "",
      creditScore: isPersonal ? form.creditScore : null,
    };
    const next = {
      ...flow,
      step: Math.max(Number(flow?.step || 1), 3),
      product,
      form: { ...flow?.form, ...normalizedForm },
      quote: quote || flow?.quote || null,
    };
    saveFlow(code, next);
    nav(`/loan/apply/${encodeURIComponent(code)}/docs`);
  };

  // --------------------------------------
  // 금리/미리보기 계산 (신청/승인 기준 동시 표시)
  // --------------------------------------
  const baseRateMin = product?.rateMin ?? product?.rate_min ?? null;
  const baseRateMax = product?.rateMax ?? product?.rate_max ?? null;
  const annualRate =
    quote?.appliedRate != null
      ? Number(quote.appliedRate)
      : baseRateMin != null && baseRateMax != null
      ? (Number(baseRateMin) + Number(baseRateMax)) / 2
      : 6;

  const P_req  = Number(form.desiredAmount || 0);
  const P_appr = Number(quote?.approvedAmount || 0);
  const n = Number(form.desiredTerm || 0);

  const monthlyReq  = React.useMemo(() => monthlyAnnuity(P_req,  n, annualRate), [P_req, n, annualRate]);
  const monthlyAppr = React.useMemo(() => monthlyAnnuity(P_appr, n, annualRate), [P_appr, n, annualRate]);

  // 만기일시 총액(신청/승인)
  const r = Number(annualRate) / 100 / 12;
  const totalAtMaturityReq  = React.useMemo(() => (!P_req || !n) ? 0 : P_req  + Math.ceil(P_req  * r * n), [P_req, n, r]);
  const totalAtMaturityAppr = React.useMemo(() => (!P_appr|| !n) ? 0 : P_appr + Math.ceil(P_appr * r * n), [P_appr, n, r]);

  // --------------------------------------
  // 렌더
  // --------------------------------------
  if (loading) return <div className="p-8">로딩중…</div>;
  if (err) return <div className="p-8 text-red-600">에러: {err}</div>;
  if (!flow || !product) return null;

  const limitMax = product?.limitMax ?? product?.limit_max;
  const productName = product?.name ?? product?.loanName ?? product?.loan_name ?? code;
  const loanTypeLabel = String(product?.type || loanType || "");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-transparent">
        <ApplyGuard requireStep={2}>
          <ApplyLayout current={2}>
            <div className="grid md:grid-cols-12 gap-6">
              {/* 좌측: 입력 섹션 */}
              <div className="md:col-span-7 space-y-6">
                {/* 금액/기간/옵션 */}
                <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <i className="ri-edit-box-line" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-800">신청서 확인/보완</h3>
                      {/* 상품 요약 정보 */}
                      <div className="text-xs text-gray-500 mt-1 leading-5">
                        <span className="font-medium text-gray-700">{productName}</span>
                        {loanTypeLabel && <span className="ml-2">· 유형: {loanTypeLabel}</span>}
                        {(baseRateMin != null || baseRateMax != null) && (
                          <span className="ml-2">
                            · 기본 이율:{" "}
                            {baseRateMin != null && baseRateMax != null
                              ? `${baseRateMin}% ~ ${baseRateMax}%`
                              : `${baseRateMin ?? baseRateMax}%`}
                          </span>
                        )}
                        {limitMax != null && <span className="ml-2">· 최대한도: ₩ {won(limitMax)}</span>}
                        {product?.ltvMax != null && <span className="ml-2">· LTV: {product.ltvMax}%</span>}
                      </div>
                    </div>
                  </div>

                  <div className="grid md-grid-cols-2 md:grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="text-gray-600">신청금액(원)</span>
                      <NumberInput
                        value={form.desiredAmount ?? null}
                        onChange={(num) => setForm((s) => ({ ...s, desiredAmount: num ?? 0 }))}
                        min={0}
                        max={limitMax ?? undefined}
                        placeholder="신청 금액을 입력하세요"
                        className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                      />
                      <KoreanMoneyHint value={form.desiredAmount} showWon/>
                      {limitMax != null && (
                        <div className="text-xs text-blue-600/80 mt-1">상품 최대한도: ₩ {won(limitMax)}</div>
                      )}
                      {fieldErr.desiredAmount && (
                        <div className="text-xs text-red-600 mt-1">{fieldErr.desiredAmount}</div>
                      )}
                    </label>

                    <label className="block text-sm">
                      <span className="text-gray-600">기간(개월)</span>
                      {allowedTerms.length ? (
                        <select
                          className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                          value={form.desiredTerm}
                          onChange={(e) => setForm((s) => ({ ...s, desiredTerm: Number(e.target.value) }))}
                        >
                          {allowedTerms.map((m) => (
                            <option key={m} value={m}>{m}개월</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                          value={form.desiredTerm}
                          onChange={(e) => setForm((s) => ({ ...s, desiredTerm: Number(e.target.value || 0) }))}
                        />
                      )}
                    </label>

                    {/* 금리유형 */}
                    <label className="block text-sm">
                      <span className="text-gray-600">금리유형</span>
                      <select
                        className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                        value={form.rateType}
                        onChange={(e) => setForm((s) => ({ ...s, rateType: toKoRateType(e.target.value) }))}
                        disabled={allowedRateTypesKo.length === 1}
                      >
                        {allowedRateTypesKo.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>

                    {/* 상환방식 */}
                    <label className="block text-sm">
                      <span className="text-gray-600">상환방식</span>
                      <select
                        className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                        value={form.rpayType}
                        onChange={(e) => setForm((s) => ({ ...s, rpayType: normalizeRpayKo(e.target.value) }))}
                        disabled={allowedRpayTypesKo.length === 1}
                      >
                        {allowedRpayTypesKo.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </label>

                    <label className="block text-sm">
                      <span className="text-gray-600">대출 목적</span>
                      <select
                        className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                        value={form.purpose}
                        onChange={(e) => setForm((s) => ({ ...s, purpose: e.target.value }))}
                      >
                        <option value="생활비">생활비</option>
                        <option value="대환자금">대환자금</option>
                        <option value="주거비">주거비</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* 담보/보증 입력 */}
                {needsCollateral && (
                  <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                        <i className="ri-shield-check-line" />
                      </span>
                      <h3 className="font-semibold text-gray-800">담보/보증 정보</h3>
                    </div>

                    {isMortgage && (
                      <label className="block text-sm">
                        <span className="text-gray-600">담보가치(원)</span>
                        <NumberInput
                          value={form.collateralValue ?? null}
                          onChange={(num) => setForm((s) => ({ ...s, collateralValue: num ?? 0 }))}
                          min={0}
                          placeholder="담보가치를 입력하세요"
                          className={`mt-1 w-full rounded-xl border ${fieldErr.collateralValue ? "border-red-400" : "border-gray-200"} focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition`}
                        />
                        <KoreanMoneyHint value={form.collateralValue} showWon/>
                        {fieldErr.collateralValue ? (
                          <div className="text-xs text-red-600 mt-1">{fieldErr.collateralValue}</div>
                        ) : (
                          product?.ltvMax != null && (
                            <div className="text-xs text-blue-600/80 mt-1">상품 LTV 최대: {product.ltvMax}%</div>
                          )
                        )}
                      </label>
                    )}

                    {isJeonse && (
                      <label className="block text-sm">
                        <span className="text-gray-600">임차보증금(원)</span>
                        <NumberInput
                          value={form.jeonseDeposit ?? null}
                          onChange={(num) => setForm((s) => ({ ...s, jeonseDeposit: num ?? 0 }))}
                          min={0}
                          placeholder="임차보증금을 입력하세요"
                          className={`mt-1 w-full rounded-xl border ${fieldErr.jeonseDeposit ? "border-red-400" : "border-gray-200"} focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition`}
                        />
                        <KoreanMoneyHint value={form.jeonseDeposit} showWon/>
                        {fieldErr.jeonseDeposit ? (
                          <div className="text-xs text-red-600 mt-1">{fieldErr.jeonseDeposit}</div>
                        ) : (
                          product?.ltvMax != null && (
                            <div className="text-xs text-blue-600/80 mt-1">상품 LTV 최대: {product.ltvMax}%</div>
                          )
                        )}
                      </label>
                    )}
                  </div>
                )}

                {/* 신용대출 전용 입력 */}
                {isPersonal && (
                  <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                        <i className="ri-id-card-line" />
                      </span>
                      <h3 className="font-semibold text-gray-800">신용 정보</h3>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <label className="block text-sm">
                        <span className="text-gray-600">직장</span>
                        <input
                          type="text"
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                          value={form.employer || ""}
                          onChange={(e) => setForm((s) => ({ ...s, employer: e.target.value }))}
                          placeholder="회사명/직장명"
                        />
                      </label>

                      <label className="block text-sm">
                        <span className="text-gray-600">연소득(원)</span>
                        <NumberInput
                          value={form.incomeAnnual ?? null}
                          onChange={(num) => setForm((s) => ({ ...s, incomeAnnual: num ?? 0 }))}
                          min={0}
                          placeholder="예: 40,000,000"
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                        />
                        <KoreanMoneyHint value={form.incomeAnnual}  showWon/>
                      </label>

                      <label className="block text-sm">
                        <span className="text-gray-600">신용점수</span>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                          value={form.creditScore ?? ""}
                          onChange={(e) => setForm((s) => ({ ...s, creditScore: clamp(Number(e.target.value || 0), 0, 1000) }))}
                          placeholder="예: 850"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* 계좌 선택 */}
                <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <i className="ri-bank-line" />
                    </span>
                    <h3 className="font-semibold text-gray-800">지급/상환 계좌</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="text-gray-600">지급 계좌 (자금 입금)</span>
                      <select
                        className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                        value={form.payoutAccountNo}
                        onChange={(e) =>
                          setForm((s) => {
                            const nextPayout = e.target.value;
                            const same = nextPayout === s.repayAccountNo;
                            let nextRepay = s.repayAccountNo;
                            if (same) {
                              const alt = accounts.find(x => String(x.a_no) !== String(nextPayout));
                              nextRepay = alt ? alt.a_no : "";
                            }
                            return { ...s, payoutAccountNo: nextPayout, repayAccountNo: nextRepay };
                          })
                        }
                      >
                        {accounts.map((a) => (
                          <option key={a.a_no} value={a.a_no} disabled={a.a_no === form.repayAccountNo}>
                            {a.a_account_no} · {a.a_nickname || a.a_account_type} · 잔액 {won(a.a_balance)}원
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm">
                      <span className="text-gray-600">상환 계좌 (매월 출금)</span>
                      <select
                        className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                        value={form.repayAccountNo}
                        onChange={(e) =>
                          setForm((s) => {
                            const nextRepay = e.target.value;
                            const same = nextRepay === s.payoutAccountNo;
                            let nextPayout = s.payoutAccountNo;
                            if (same) {
                              const alt = accounts.find(x => String(x.a_no) !== String(nextRepay));
                              nextPayout = alt ? alt.a_no : "";
                            }
                            return { ...s, repayAccountNo: nextRepay, payoutAccountNo: nextPayout };
                          })
                        }
                      >
                        {accounts.map((a) => (
                          <option key={a.a_no} value={a.a_no} disabled={a.a_no === form.payoutAccountNo}>
                            {a.a_account_no} · {a.a_nickname || a.a_account_type} · 잔액 {won(a.a_balance)}원
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {sameAccount && (
                    <div className="text-xs text-red-600 mt-2">
                      지급 계좌와 상환 계좌는 서로 다른 계좌여야 합니다.
                    </div>
                  )}
                  {accounts.length < 2 && (
                    <div className="text-xs text-orange-600 mt-2">
                      사용 가능한 계좌가 2개 이상 있어야 서로 다른 지급/상환 계좌를 선택할 수 있습니다.
                    </div>
                  )}
                </div>
              </div>

              {/* 우측: 요약/견적/미리보기 */}
              <div className="md:col-span-5 space-y-6">
                <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <i className="ri-pie-chart-2-line" />
                    </span>
                    <h3 className="font-semibold text-gray-800">요약 & 미리보기</h3>
                  </div>

                  <div className="mt-3 space-y-3">
                    {fieldErr._server && (
                      <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs px-3 py-2">
                        {fieldErr._server}
                      </div>
                    )}

                    {/* 적용 금리 */}
                    <div className="rounded-xl border border-gray-100 p-3 text-center bg-white">
                      <div className="text-xs text-gray-500">적용금리</div>
                      <div className="text-xl font-bold mt-1">
                        <span className="inline-flex items-baseline gap-1 tabular-nums">
                          <span>
                            {Number.isFinite(Number(annualRate))
                              ? Number(annualRate).toFixed(2)
                              : "-"}
                          </span>
                          <span className="text-base font-medium">%</span>
                        </span>
                      </div>
                    </div>

                    {/* 승인 가능금액 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-center [&>div]:min-w-0">
                      <div className="rounded-xl border border-gray-100 p-3 bg-white">
                        <div className="text-xs text-gray-500">승인(가능)금액</div>
                        <div className="text-2xl font-bold mt-1">
                          <span className="inline-flex items-baseline gap-1 tabular-nums">
                            <span className="inline-block truncate whitespace-nowrap max-w-[16ch] sm:max-w-[18ch]">
                              {won(P_appr)}
                            </span>
                            <span className="text-base font-medium flex-none">원</span>
                          </span>
                        </div>
                      </div>

                      {/* 신청 vs 승인 기준 월 납입 */}
                      {!monthlyDisabled ? (
                        <div className="rounded-2xl border border-indigo-100 p-3 bg-indigo-50">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-[11px] text-gray-600">월 납입(신청)</div>
                              <div className="text-xl font-bold mt-1">{won(monthlyReq)}<span className="text-sm"> 원</span></div>
                            </div>
                            <div>
                              <div className="text-[11px] text-indigo-700">월 납입(승인)</div>
                              <div className="text-xl font-bold mt-1 text-indigo-900">{won(monthlyAppr)}<span className="text-sm"> 원</span></div>
                            </div>
                          </div>
                          {(P_appr > 0 && P_appr < P_req) && (
                            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mt-2">
                              승인 금액이 신청 금액보다 작아 승인 기준 월 납입이 다를 수 있습니다.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border p-3 border-gray-200 bg-gray-50 opacity-70">
                          <div className="text-xs text-gray-400">월 납입(예상)</div>
                          <div className="text-2xl font-bold mt-1 text-gray-400">해당 없음</div>
                        </div>
                      )}
                    </div>

                    {/* 만기일시일 때: 신청/승인 기준 만기 총액 */}
                    {isBullet && (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div>
                            <div className="text-[11px] text-indigo-700">만기 총액(신청)</div>
                            <div className="text-xl font-bold mt-1 text-indigo-900">{won(totalAtMaturityReq)}<span className="text-sm"> 원</span></div>
                          </div>
                          <div>
                            <div className="text-[11px] text-indigo-700">만기 총액(승인)</div>
                            <div className="text-xl font-bold mt-1 text-indigo-900">{won(totalAtMaturityAppr)}<span className="text-sm"> 원</span></div>
                          </div>
                        </div>
                        <div className="text-[11px] text-indigo-700/80 mt-1 text-center">
                          단리 기준 추정치
                        </div>
                      </div>
                    )}

                    {/* 적용 근거 배지들 (있을 경우) */}
                    <div className="flex flex-wrap gap-2">
                      {typeof quote?.usedLtv === "number" && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] bg-sky-50 text-sky-700 border border-sky-100">
                          LTV 적용: {quote.usedLtv}%
                        </span>
                      )}
                      {quote?.limitBasis && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] bg-gray-50 text-gray-700 border border-gray-200">
                          한도 기준: {String(quote.limitBasis)}
                        </span>
                      )}
                    </div>
                    {quote?.calcTrace && (
                      <details className="text-[11px] text-gray-600 mt-1">
                        <summary className="cursor-pointer select-none">계산 근거 상세</summary>
                        <pre className="mt-1 bg-gray-50 p-2 rounded-lg overflow-x-auto">{JSON.stringify(quote.calcTrace, null, 2)}</pre>
                      </details>
                    )}
                  </div>

                  <button
                    className={`w-full mt-4 px-4 py-2 rounded-xl text-white transition ${
                      canRequote ? (quoting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-800") : "bg-gray-400 cursor-not-allowed"
                    }`}
                    onClick={onRequote}
                    disabled={!canRequote || quoting}
                  >
                    {quoting ? "조회중…" : "한도/금리 재조회"}
                  </button>

                  {quote?.approvedTerm && (
                    <div className="text-xs text-gray-500 mt-2 leading-relaxed">
                      승인기간: {quote.approvedTerm}개월 · {form.rateType || "-"} / {form.rpayType || "-"}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
                  <button
                    className={`w-full px-4 py-3 rounded-xl text-white transition ${
                      canNext ? "bg-gray-800 hover:bg-black" : "bg-gray-400 cursor-not-allowed"
                    }`}
                    disabled={!canNext}
                    onClick={onNext}
                  >
                    다음 (서류 제출)
                  </button>
                  {!canNext && (
                    <div className="text-xs text-red-600 mt-2">
                      필수 입력(금액/기간/계좌
                      {needsCollateral ? " 및 담보/보증 값" : ""})을 확인해 주세요.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ApplyLayout>
        </ApplyGuard>
      </div>
    </div>
  );
}
