import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import { fetchAccounts, fetchLoanProductDetail } from "../../../api/accounts";
import NumberInput from "./components/NumberInput";
import AccountPickers from "./components/AccountPickers";
import LoanSummaryCard from "./components/LoanSummaryCard";
import { won, numberToKorean } from "../util/money";
import { computeVisibility, toKoRateType, normalizeRpayKo } from "../util/loan";
import useLoanQuote from "./hooks/useLoanQuote";

function KoreanMoneyHint({ value, className = "", showWon = false, omitIl = true }) {
  if (!value || Number(value) === 0) return null;
  const text = numberToKorean(value, { money: true, omitIl });
  return <div className={`text-xs text-gray-500 mt-1 ${className}`}>({text}{showWon ? "원" : ""})</div>;
}

// 날짜 유틸
function toDateOnlyInputValue(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 날짜를 1~28사이로 제한
function clampPayDay(day) {
  return Math.max(1, Math.min(28, Number(day || 0)));
}
function computeFirstDue(today, selectedDate) {
  const tY = today.getFullYear();
  const tM = today.getMonth();        
  const tD = today.getDate();

  const selD = selectedDate.getDate();
  const payDay = clampPayDay(selD);
  const clamped = selD !== payDay;
  // - 선택일(day) < 오늘(day) ⇒ 다음달 payDay
  // - 선택일(day) >= 오늘(day) ⇒ 이번달 payDay
  // - (항상 payDay는 1~28로 보정)
  let year = tY;
  let month = tM;
  if (payDay < tD) {
    // 다음달
    month = tM + 1;
    if (month >= 11 + 1) { // 11 = December
      year = tY + 1;
      month = 0;
    }
  }
  const due = new Date(year, month, payDay, 12, 0, 0, 0);

  const isThisMonth = (due.getFullYear() === tY) && (due.getMonth() === tM);
  const isSoonInThisMonth = isThisMonth && payDay >= tD; // "곧 납부" 경고 조건
  const isNextMonth = !isThisMonth;

  return { payDay, clamped, due, isSoonInThisMonth, isNextMonth };
}

export default function ApplyFormPage() {
  const { code } = useParams();
  const nav = useNavigate();

  const [useSameAccount, setUseSameAccount] = React.useState(true);
  const [flow, setFlow] = React.useState(null);
  const [product, setProduct] = React.useState(null);
  const [accounts, setAccounts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  // 납부일 경고
  const [firstDueInput, setFirstDueInput] = React.useState(toDateOnlyInputValue());
  const [duePreview, setDuePreview] = React.useState(null); 

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
    preferredPayDay: null,        // 1~28 고정
  preferredFirstDueDate: "",    // 'YYYY-MM-DD'
  });

  // 초기 로드
  React.useEffect(() => {
    (async () => {
      try {
        const f = loadFlow(code);
        if (!f) {
          nav(`/loan/apply/${encodeURIComponent(code)}/agree`, { replace: true });
          return;
        }
        setFlow(f);

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

        if (arr.length > 0) {
          setForm((s) => {
            const first = arr[0].a_no;
            return {
              ...s,
              payoutAccountNo: s.payoutAccountNo || first,
              repayAccountNo:  s.repayAccountNo  || first,
            };
          });
          setUseSameAccount(true);
        }
      } catch (e) {
        setErr(e?.message || "신청서 로딩 오류");
      } finally {
        setLoading(false);
      }
    })();
  }, [code, nav]);

  // 날짜 변겨시 
  React.useEffect(() => {
  const today = new Date();
  const init = computeFirstDue(today, today);
  setFirstDueInput(toDateOnlyInputValue(today));
  setDuePreview(init);
  setForm(s => ({
    ...s,
    preferredPayDay: init.payDay,
    preferredFirstDueDate: toDateOnlyInputValue(init.due),
  }));
}, []);

  // 파생 옵션
  const opts = React.useMemo(() => (Array.isArray(product?.options) ? product.options : []), [product]);
  const allowedTerms = React.useMemo(() => {
    const terms = [
      ...(product?.termMonths || []),
      ...opts.map((op) => Number(op.termMonths || op.terms || 0)).filter(Boolean),
    ];
    return [...new Set(terms)].sort((a, b) => a - b);
  }, [product, opts]);

  const allowedRateTypesKo = React.useMemo(() => {
    const fromProduct = opts.map((op) => (op.rateType || op.rate_type || "").toString()).filter(Boolean).map(toKoRateType);
    const fromForm = form.rateType ? [toKoRateType(form.rateType)] : [];
    const fallback = ["고정금리", "변동금리"];
    return Array.from(new Set([...fromProduct, ...fromForm, ...fallback]));
  }, [opts, form.rateType]);

  const allowedRpayTypesKo = React.useMemo(() => {
    const fromProduct = opts
      .map((op) => (op.rpayType ?? op.rpayTypeCode ?? op.rpayTypeNm ?? "").toString())
      .filter(Boolean)
      .map(normalizeRpayKo);
    const fromForm = form.rpayType ? [normalizeRpayKo(form.rpayType)] : [];
    const fallback = ["원리금균등", "원금균등", "만기일시"];
    return Array.from(new Set([...fromProduct, ...fromForm, ...fallback]));
  }, [opts, form.rpayType]);

  // 타입 판별
  const loanType = String(product?.type || "");
  const { isMortgage, isJeonse, isPersonal, isBullet } = computeVisibility(loanType, form.rpayType);
  const needsCollateral = isMortgage || isJeonse;

  // 기본값/보정
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

  // 유효성
  const invalidCollateral = isMortgage && (!form.collateralValue || Number(form.collateralValue) <= 0);
  const invalidJeonse    = isJeonse && (!form.jeonseDeposit  || Number(form.jeonseDeposit)  <= 0);

  // 견적 훅 (디바운스 + 파생계산 포함)
  const {
    quote, quoting, fieldErr, onRequote, canRequote,
    derived: { annualRate, P_req, P_appr, n, r, monthlyAppr },
  } = useLoanQuote({ code, product, form, invalidCollateral, invalidJeonse });

  // 만기일시일 때 총액
  const totalAtMaturityAppr = React.useMemo(() => (!P_appr || !n) ? 0 : P_appr + Math.ceil(P_appr * r * n), [P_appr, r, n]);

  // 다음 단계
  const canNext =
    !!form.desiredAmount && !!form.desiredTerm && !!form.payoutAccountNo &&
    (useSameAccount ? true : (!!form.repayAccountNo && String(form.repayAccountNo) !== String(form.payoutAccountNo))) &&
    (!needsCollateral || (!invalidCollateral && !invalidJeonse));

  const onNext = () => {
    if (!canNext) return;

      const normalizedForm = {
      ...form,
      rateType: toKoRateType(form.rateType),
      rpayType: normalizeRpayKo(form.rpayType),
      collateralValue: needsCollateral ? form.collateralValue : null,
      jeonseDeposit:  needsCollateral ? form.jeonseDeposit  : null,
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

  // 렌더
  if (loading) return <div className="p-8">로딩중…</div>;
  if (err) return <div className="p-8 text-red-600">에러: {err}</div>;
  if (!flow || !product) return null;

  const limitMax = product?.limitMax ?? product?.limit_max;
  const productName = product?.name ?? product?.loanName ?? product?.loan_name ?? code;
  const loanTypeLabel = String(product?.type || loanType || "");
  const baseRateMin = product?.rateMin ?? product?.rate_min ?? null;
  const baseRateMax = product?.rateMax ?? product?.rate_max ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-transparent">
        <ApplyGuard requireStep={2}>
          <ApplyLayout current={2}>
            <div className="grid md:grid-cols-12 gap-6">
              {/* 좌측 */}
              <div className="md:col-span-7 space-y-6">
                {/* 금액/기간/옵션 */}
                <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <i className="ri-edit-box-line" />
                    </span>
                    <h3 className="font-semibold text-gray-800">신청서 확인/보완</h3>
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
                      <KoreanMoneyHint value={form.desiredAmount} showWon />
                      {limitMax != null && (
                        <div className="text-xs text-blue-600/80 mt-1">상품 최대한도: ₩ {won(limitMax)}</div>
                      )}
                      {fieldErr?.desiredAmount && (
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
                          {allowedTerms.map((m) => <option key={m} value={m}>{m}개월</option>)}
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

                    {isMortgage && (
                      <label className="block text-sm md:col-span-2">
                        <span className="text-gray-600">담보가치(원)</span>
                        <NumberInput
                          value={form.collateralValue ?? null}
                          onChange={(num) => setForm((s) => ({ ...s, collateralValue: num ?? 0 }))}
                          min={0}
                          placeholder="담보가치를 입력하세요"
                          className={`mt-1 w-full rounded-xl border ${fieldErr?.collateralValue ? "border-red-400" : "border-gray-200"} px-3 py-2`}
                        />
                        <KoreanMoneyHint value={form.collateralValue} showWon />
                        {fieldErr?.collateralValue && <div className="text-xs text-red-600 mt-1">{fieldErr.collateralValue}</div>}
                      </label>
                    )}

                    {isJeonse && (
                      <label className="block text-sm md:col-span-2">
                        <span className="text-gray-600">임차보증금(원)</span>
                        <NumberInput
                          value={form.jeonseDeposit ?? null}
                          onChange={(num) => setForm((s) => ({ ...s, jeonseDeposit: num ?? 0 }))}
                          min={0}
                          placeholder="임차보증금을 입력하세요"
                          className={`mt-1 w-full rounded-xl border ${fieldErr?.jeonseDeposit ? "border-red-400" : "border-gray-200"} px-3 py-2`}
                        />
                        <KoreanMoneyHint value={form.jeonseDeposit} showWon />
                        {fieldErr?.jeonseDeposit && <div className="text-xs text-red-600 mt-1">{fieldErr.jeonseDeposit}</div>}
                      </label>
                    )}
                  </div>
                  <label className="block text-sm">
                    <label className="block text-sm md:col-span-2">
                      <span className="text-gray-600">최초 납부일</span>
                        <input
                          type="date"
                          value={firstDueInput}
                          onChange={(e) => {
                            const v = e.target.value; 
                            setFirstDueInput(v);
                            if (!v) {
                              setDuePreview(null);
                              setForm(s => ({ ...s, preferredPayDay: null, preferredFirstDueDate: "" }));
                              return;
                            }
                            const parts = v.split("-");
                            const selected = new Date(
                              Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])
                            );
                            const today = new Date();
                            const calc = computeFirstDue(today, selected);
                            setDuePreview(calc);
                            setForm(s => ({
                              ...s,
                              preferredPayDay: calc.payDay,
                              preferredFirstDueDate: toDateOnlyInputValue(calc.due),
                            }));
                          }}
                          className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                        />

                        {duePreview?.clamped && (
                          <div className="mt-2 text-xs rounded-lg px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200">
                            29~31일은 지원하지 않아 <b>28일</b>로 자동 조정됩니다. (선택일: {form.preferredPayDay}일)
                          </div>
                        )}
                        {duePreview?.isSoonInThisMonth && (
                          <div className="mt-2 text-xs rounded-lg px-3 py-2 bg-yellow-50 text-yellow-800 border border-yellow-200">
                            이번 달 <b>{form.preferredPayDay}일</b>에 바로 납부가 시작됩니다. 계속하시겠어요?
                          </div>
                        )}
                        {duePreview?.isNextMonth && (
                          <div className="mt-2 text-xs rounded-lg px-3 py-2 bg-sky-50 text-sky-800 border border-sky-200">
                            <b>다음 달 {form.preferredPayDay}일</b>에 첫 납부가 시작됩니다.
                          </div>
                        )}
                        {/* 확정 미리보기 */}
                        {duePreview && (
                          <div className="mt-2 text-xs text-gray-600">
                            확정 최초 납부 예정일: <b>{toDateOnlyInputValue(duePreview.due)}</b> (납부일 {form.preferredPayDay}일)
                          </div>
                        )}
                    </label>
                  </label>
                </div>

                {/* 계좌 */}
                <AccountPickers
                  accounts={accounts}
                  useSameAccount={useSameAccount}
                  setUseSameAccount={setUseSameAccount}
                  form={form}
                  setForm={setForm}
                />
              </div>

              {/* 우측 요약 */}
              <div className="md:col-span-5 space-y-6">
                <LoanSummaryCard
                  annualRate={annualRate}
                  P_req={P_req}
                  P_appr={P_appr}
                  n={n}
                  r={r}
                  // monthlyReq={monthlyReq}
                  monthlyAppr={monthlyAppr}
                  isBullet={isBullet}
                  quote={quote}
                  fieldErr={fieldErr}
                  baseRateMin={baseRateMin}
                  baseRateMax={baseRateMax}
                  productName={productName}
                  loanTypeLabel={loanTypeLabel}
                  limitMax={limitMax}
                  onRequote={onRequote}
                  canRequote={canRequote}
                  quoting={quoting}
                  totalAtMaturityAppr={totalAtMaturityAppr}
                />

                <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
                  <button
                    className={`w-full px-4 py-3 rounded-xl text-white transition ${canNext ? "bg-gray-800 hover:bg-black" : "bg-gray-400 cursor-not-allowed"}`}
                    disabled={!canNext}
                    onClick={onNext}
                  >
                    다음 (서류 제출)
                  </button>
                  {!canNext && (
                    <div className="text-xs text-red-600 mt-2">
                      필수 입력(금액/기간/계좌{needsCollateral ? " 및 담보/보증 값" : ""})을 확인해 주세요.
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