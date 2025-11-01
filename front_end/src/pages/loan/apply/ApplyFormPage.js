import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import { fetchAccounts, fetchLoanProductDetail, fetchLoanQuote } from "../../../api/accounts";

// 포맷 유틸
const won = (n) => Number(n || 0).toLocaleString("ko-KR");
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// [ADD] 디바운스 훅
function useDebouncedEffect(effect, deps, delay = 300) {
  React.useEffect(() => {
    const h = setTimeout(effect, delay);
    return () => clearTimeout(h);
  }, deps);
}

export default function ApplyFormPage() {
  const { code } = useParams();
  const nav = useNavigate();

  // -------------------- State --------------------
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
    payoutAccountNo: "",
    repayAccountNo: "",
    customerId: "1",
  });

  const [quoting, setQuoting] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  // -------------------- 초기 로드
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
          rateType: f.form?.rateType || "",
          rpayType: f.form?.rpayType || "",
          purpose: f.form?.purpose || "생활비",
          collateralValue: f.form?.collateralValue ?? null,
          jeonseDeposit: f.form?.jeonseDeposit ?? null,
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
        setAccounts(Array.isArray(list) ? list : []);

        if ((list?.length || 0) > 0) {
          setForm((s) => ({
            ...s,
            payoutAccountNo: s.payoutAccountNo || list[0].a_no,
            repayAccountNo: s.repayAccountNo || list[0].a_no,
          }));
        }
      } catch (e) {
        console.error(e);
        setErr(e?.message || "신청서 로딩 오류");
      } finally {
        setLoading(false);
      }
    })();
  }, [code, nav]);

  // -------------------- 옵션 파생값
  const opts = React.useMemo(() => (Array.isArray(product?.options) ? product.options : []), [product]);

  const allowedTerms = React.useMemo(() => {
    const terms = [
      ...(product?.termMonths || []),
      ...opts.map((op) => Number(op.termMonths || op.terms || 0)).filter(Boolean),
    ];
    return [...new Set(terms)].sort((a, b) => a - b);
  }, [product, opts]);

  const allowedRateTypes = React.useMemo(() => {
    const fromProduct = opts
      .map((op) => (op.rateType || op.rate_type || "").toString().toUpperCase())
      .filter(Boolean);

    const q = flow?.quote || quote;
    const fromQuote = []
      .concat(
        (q?.rateTypes && Array.isArray(q.rateTypes) ? q.rateTypes : []),
        (q?.rateType ? [q.rateType] : [])
      )
      .map((v) => String(v).toUpperCase())
      .filter(Boolean);

    const fromForm = form.rateType ? [String(form.rateType).toUpperCase()] : [];
    const fallback = ["FIXED", "VARIABLE"];

    return Array.from(new Set([...fromProduct, ...fromQuote, ...fromForm, ...fallback]));
  }, [opts, flow?.quote, quote, form.rateType]);

  const allowedRpayTypes = React.useMemo(() => {
    const fromProduct = opts
      .map((op) => (op.rpayType ?? op.rpayTypeCode ?? op.rpayTypeNm ?? "").toString().toUpperCase())
      .filter(Boolean);

    const q = flow?.quote || quote;
    const fromQuote = []
      .concat(
        (q?.rpayTypes && Array.isArray(q.rpayTypes) ? q.rpayTypes : []),
        (q?.rpayType ? [q.rpayType] : []),
        (q?.rpayTypeNm ? [q.rpayTypeNm] : [])
      )
      .map((v) => String(v).toUpperCase())
      .filter(Boolean);

    const fromForm = form.rpayType ? [String(form.rpayType).toUpperCase()] : [];
    const fallback = ["원리금균등", "분할상환방식", "만기일시상환방식"].map((v) => v.toUpperCase());

    return Array.from(new Set([...fromProduct, ...fromQuote, ...fromForm, ...fallback]));
  }, [opts, flow?.quote, quote, form.rpayType]);

  // -------------------- 타입 판별
  const loanType = String(product?.type || "").toUpperCase();
  const isMortgage = loanType.includes("MORTGAGE") || loanType.includes("담보");
  const isJeonse = loanType.includes("JEONSE") || loanType.includes("전세");
  const needsCollateral = isMortgage || isJeonse;

  // [LTV 없는 상품, 신용대출은 담보/전세 입력/전달 모두 skip]
  const isLtvPresent = needsCollateral && product?.ltvMax != null && Number(product.ltvMax) > 0;

  // -------------------- 기본값/정합성 보정
  React.useEffect(() => {
    if (allowedTerms.length && !allowedTerms.includes(Number(form.desiredTerm))) {
      setForm((s) => ({ ...s, desiredTerm: allowedTerms[0] }));
    }
    if (allowedRateTypes.length && !form.rateType) {
      setForm((s) => ({ ...s, rateType: allowedRateTypes[0] }));
    }
    if (allowedRpayTypes.length && !form.rpayType) {
      setForm((s) => ({ ...s, rpayType: allowedRpayTypes[0] }));
    }
    const limitMax = product?.limitMax ?? product?.limit_max;
    if (limitMax != null && Number(form.desiredAmount) > Number(limitMax)) {
      setForm((s) => ({
        ...s,
        desiredAmount: clamp(Number(s.desiredAmount || 0), 1_000_000, Number(limitMax)),
      }));
    }
    if (!needsCollateral) {
      setForm((s) => ({ ...s, collateralValue: null, jeonseDeposit: null }));
    }
  }, [allowedTerms, allowedRateTypes, allowedRpayTypes, product, needsCollateral]);

  function mapUiRpayToCode(v = "") {
    const s = String(v).trim().toUpperCase();
    if (["분할상환", "분할상환방식", "원금균등", "PRINCIPAL_EQUAL"].includes(s)) return "PRINCIPAL_EQUAL";
    if (["만기일시", "만기일시상환", "만기일시상환방식", "BULLET"].includes(s)) return "BULLET";
    return "AMORTIZED";
  }
  function mapUiRateType(v = "") {
    const s = String(v).trim().toUpperCase();
    if (["FIXED", "고정", "고정금리"].includes(s)) return "FIXED";
    if (["VARIABLE", "변동", "변동금리"].includes(s)) return "VARIABLE";
    return s || "FIXED";
  }
  function normalizeQuote(data = {}) {
    return {
      ...data,
      appliedRate: data.appliedRate ?? data.applied_rate ?? null,
      approvedAmount: data.approvedAmount ?? data.approved_amount ?? null,
      approvedTerm: data.approvedTerm ?? data.approved_term ?? null,
      monthlyPayment: data.monthlyPayment ?? data.monthly_payment ?? null,
    };
  }

    // 영어 코드 → 한글 표기
    function toKoRateType(v = "") {
        const s = String(v).trim().toUpperCase();
        if (s === "FIXED") return "고정금리";
        if (s === "VARIABLE") return "변동금리";
        return v || "고정금리";
    }

    // rpayType은 화면에서 이미 한글이므로 그대로 사용.
    // (원리금균등 / 분할상환방식(=원금균등) / 만기일시상환방식)
    function normalizeRpayKo(v = "") {
        // UI에서 값이 혹시 섞여 들어올 경우를 대비한 안전망
        const s = String(v).trim();
        if (!s) return "원리금균등";
        if (/분할상환/.test(s) || /원금균등/.test(s)) return "원금균등";
        if (/만기일시/.test(s)) return "만기일시";
        if (/원리금균등/.test(s)) return "원리금균등";
        return s;
    }

  // -------------------- 견적 재조회
  const onRequote = async () => {
    try {
      setQuoting(true);
      const limitMax = product?.limitMax ?? product?.limit_max;
      const reqAmount = limitMax != null
        ? clamp(Number(form.desiredAmount || 0), 1_000_000, Number(limitMax))
        : Number(form.desiredAmount || 0);
  
      // 견적 요청 DTO 구조와 맞춤: 값 비었거나 숫자 아닌 부분엔 직접 체크 
      const req = {
        occupation: form.occupation,
        desiredAmount: reqAmount,
        desiredTerm: Number(form.desiredTerm || 0),
        rateType: toKoRateType(form.rateType),
        rpayType: normalizeRpayKo(form.rpayType),
        annualIncome: Number(form.incomeAnnual || 0),
        // 전달 조건 강화 (isLtvPresent == true일 때만 전송)
        collateralValue: isLtvPresent && isMortgage ? Number(form.collateralValue || 0) : undefined,
        jeonseDeposit: isLtvPresent && isJeonse ? Number(form.jeonseDeposit || 0) : undefined,
      };
      // 추가: 견적 요청 파라미터 메모
      console.log("[LoanQuoteReq]", req);
  
      // (이 부분부터 원래 코드대로)
      const sig = JSON.stringify({ code, ...req });
      if (lastReqRef.current === sig) {
        setQuoting(false);
        return;
      }
      lastReqRef.current = sig;
  
      // 담보/LTV(주담대/전세자금) 상품인 경우, 필수값 미입력 시 견적 요청 자체를 막음
      if (isMortgage && (!form.collateralValue || Number(form.collateralValue) <= 0)) {
        alert("담보가치(주택)을 입력해야 견적이 조회됩니다.");
        setQuoting(false);
        return;
      }
      if (isJeonse && (!form.jeonseDeposit || Number(form.jeonseDeposit) <= 0)) {
        alert("임차보증금(전세)을 입력해야 견적이 조회됩니다.");
        setQuoting(false);
        return;
      }
  
      const res = await fetchLoanQuote(code, req);  
      const data = res?.data ?? res;
      setQuote(data);
  
      // ...
    } catch (e) {
      console.error(e);
      // 400 응답의 상세 메시지도 사용자에게 바로 보여주기
      alert(e?.response?.data?.message || e?.message || "견적 재조회 실패");
    } finally {
      setQuoting(false);
    }
  };

  // -------------------- 자동 재조회(디바운스)
  useDebouncedEffect(
    () => {
      if (!product) return;
      if (!form.desiredAmount || !form.desiredTerm) return;
      if (isMortgage && !Number(form.collateralValue || 0)) return;
      if (isJeonse && !Number(form.jeonseDeposit || 0)) return;
      onRequote();
    },
    [
      product,
      code,
      form.desiredAmount,
      form.desiredTerm,
      form.rateType,
      form.rpayType,
      form.collateralValue,
      form.jeonseDeposit,
    ],
    300
  );

  // -------------------- 다음 단계 이동
  const canNext =
    !!form.desiredAmount &&
    !!form.desiredTerm &&
    !!form.payoutAccountNo &&
    !!form.repayAccountNo &&
    (!needsCollateral ||
      (isMortgage ? form.collateralValue > 0 : true) &&
      (isJeonse ? form.jeonseDeposit > 0 : true));

  const onNext = () => {
    if (!canNext) {
      alert("입력값을 확인해 주세요.");
      return;
    }
    const next = {
      ...flow,
      step: Math.max(Number(flow?.step || 1), 3),
      form: { ...flow?.form, ...form },
      quote: quote || flow?.quote || null,
    };
    saveFlow(code, next);
    nav(`/loan/apply/${encodeURIComponent(code)}/docs`);
  };

  // -------------------- 월 납입액 미리보기
  const previewMonthly = React.useMemo(() => {
    if (quote?.monthlyPayment) return Number(quote.monthlyPayment);
    const rateMin = product?.rateMin ?? product?.rate_min ?? 0;
    const rateMax = product?.rateMax ?? product?.rate_max ?? 0;
    const fallback = 6;
    const annual = rateMin && rateMax ? (Number(rateMin) + Number(rateMax)) / 2 : fallback;
    const P = Number(form.desiredAmount || 0);
    const n = Number(form.desiredTerm || 0);
    if (!P || !n) return 0;
    const r = Number(annual) / 100 / 12;
    if (!r) return Math.ceil(P / n);
    const annuity = (P * r) / (1 - Math.pow(1 + r, -n));
    return Math.ceil(annuity);
  }, [quote, product, form.desiredAmount, form.desiredTerm]);

  // -------------------- 렌더
  if (loading) return <div className="p-8">로딩중…</div>;
  if (err) return <div className="p-8 text-red-600">에러: {err}</div>;
  if (!flow || !product) return null;

  const limitMax = product?.limitMax ?? product?.limit_max;

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
                    <h3 className="font-semibold text-gray-800">신청서 확인/보완</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="text-gray-600">신청금액(원)</span>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                        value={form.desiredAmount === 0 ? '' : form.desiredAmount}
                        placeholder="신청 금액을 입력하세요"
                        onChange={e => {
                          const raw = Number(e.target.value || 0);
                          const clamped =
                            limitMax != null ? clamp(raw, 1_000_000, Number(limitMax)) : clamp(raw, 1_000_000, 10_000_000_000);
                          setForm(s => ({ ...s, desiredAmount: clamped }));
                        }}
                      />
                      {limitMax != null && (
                        <div className="text-xs text-blue-600/80 mt-1">상품 최대한도: ₩ {won(limitMax)}</div>
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
                            <option key={m} value={m}>
                              {m}개월
                            </option>
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

                    <label className="block text-sm">
                      <span className="text-gray-600">금리유형</span>
                      {allowedRateTypes.length ? (
                        <select
                          className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                          value={form.rateType}
                          onChange={(e) => setForm((s) => ({ ...s, rateType: e.target.value }))}
                          disabled={allowedRateTypes.length === 1}
                        >
                          {allowedRateTypes.map((t) => (
                            <option key={t} value={t}>
                              {t === "FIXED" ? "고정금리" : t === "VARIABLE" ? "변동금리" : t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                          value={form.rateType}
                          onChange={(e) => setForm((s) => ({ ...s, rateType: e.target.value }))}
                        />
                      )}
                    </label>

                    <label className="block text-sm">
                      <span className="text-gray-600">상환방식</span>
                      {allowedRpayTypes.length ? (
                        <select
                          className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                          value={form.rpayType}
                          onChange={(e) => setForm((s) => ({ ...s, rpayType: e.target.value }))}
                          disabled={allowedRpayTypes.length === 1}
                        >
                          {allowedRpayTypes.map((t) => (
                            <option key={t} value={t}>
                              {t === "원리금균등"
                                ? "원리금균등"
                                : t === "분할상환방식"
                                ? "원금균등"
                                : t === "만기일시상환방식"
                                ? "만기일시"
                                : t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                          value={form.rpayType}
                          onChange={(e) => setForm((s) => ({ ...s, rpayType: e.target.value }))}
                        />
                      )}
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
                        <input
                          type="number"
                          className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                          value={form.collateralValue === 0 ? '' : form.collateralValue}
                          placeholder="담보가치를 입력하세요"
                          onChange={(e) => setForm((s) => ({ ...s, collateralValue: clamp(Number(e.target.value || 0), 0, 10_000_000_000) }))}
                        />
                        {product?.ltvMax != null && (
                          <div className="text-xs text-blue-600/80 mt-1">상품 LTV 최대: {product.ltvMax}%</div>
                        )}
                      </label>
                    )}

                    {isJeonse && (
                      <label className="block text-sm">
                        <span className="text-gray-600">임차보증금(원)</span>
                        <input
                          type="number"
                          className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
                          value={form.jeonseDeposit === 0 ? '' : form.jeonseDeposit}
                          placeholder="임차보증금을 입력하세요"
                          onChange={(e) => setForm((s) => ({ ...s, jeonseDeposit: clamp(Number(e.target.value || 0), 0, 10_000_000_000) }))}
                        />
                        {product?.ltvMax != null && (
                          <div className="text-xs text-blue-600/80 mt-1">상품 LTV 최대: {product.ltvMax}%</div>
                        )}
                      </label>
                    )}
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
                        onChange={(e) => setForm((s) => ({ ...s, payoutAccountNo: e.target.value }))}
                      >
                        {accounts.map((a) => (
                          <option key={a.a_no} value={a.a_no}>
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
                        onChange={(e) => setForm((s) => ({ ...s, repayAccountNo: e.target.value }))}
                      >
                        {accounts.map((a) => (
                          <option key={a.a_no} value={a.a_no}>
                            {a.a_account_no} · {a.a_nickname || a.a_account_type} · 잔액 {won(a.a_balance)}원
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
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
                    <div className="rounded-xl border border-gray-100 p-3 text-center bg-white">
                      <div className="text-xs text-gray-500">적용금리</div>
                      <div className="text-xl font-bold mt-1">
                        <span className="inline-flex items-baseline gap-1 tabular-nums">
                          <span>{quote?.appliedRate != null ? Number(quote.appliedRate).toFixed(2) : "-"}</span>
                          <span className="text-base font-medium">%</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-center [&>div]:min-w-0">
                      <div className="rounded-xl border border-gray-100 p-3 bg-white">
                        <div className="text-xs text-gray-500">승인(가능)금액</div>
                        <div className="text-2xl font-bold mt-1">
                          <span className="inline-flex items-baseline gap-1 tabular-nums">
                            <span className="inline-block truncate whitespace-nowrap max-w-[16ch] sm:max-w-[18ch]">
                              {won(quote?.approvedAmount ?? 0)}
                            </span>
                            <span className="text-base font-medium flex-none">원</span>
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-100 p-3 bg-white">
                        <div className="text-xs text-gray-500">월 납입(예상)</div>
                        <div className="text-2xl font-bold mt-1">
                          <span className="inline-flex items-baseline gap-1 tabular-nums">
                            <span className="inline-block truncate whitespace-nowrap max-w-[16ch] sm:max-w-[18ch]">
                              {won(previewMonthly)}
                            </span>
                            <span className="text-base font-medium flex-none">원</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    className={`w-full mt-4 px-4 py-2 rounded-xl text-white transition ${
                      quoting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-800"
                    }`}
                    onClick={onRequote}
                    disabled={quoting}
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
