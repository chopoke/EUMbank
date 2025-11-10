import React from "react";
import { useParams, useLocation, useNavigate} from "react-router-dom";
import {
  fetchLoanProductDetail, fetchLoanQuote, fetchAccounts
} from "../../../api/accounts";

/**
 * 목적
 * - 상품 상세 → "한도/금리 조회" 버튼 이후 진입
 * - 사용자 직업/소득/담보를 받아 견적(POST /api/loan/:code/quote) 조회
 * - 결과 확인 후 신청 프로세스(스텝 UI)로 진입
 *
 * 백엔드 경로
 * - GET  /api/loan/products/:code
 * - POST /api/loan/:code/quote
 * - POST /api/loan/:code/applications  (최종 스텝에서 호출)
 */

const OCCUPATIONS = [
  { key: "PUBLIC", label: "공무원" },
  { key: "EMPLOYEE", label: "직장인" },
  { key: "SELF_EMPLOYED", label: "자영업" },
  { key: "STUDENT", label: "학생" },
  { key: "UNEMPLOYED", label: "무직" },
];

/** 공통 유틸 */
const won = (n) => Number(n || 0).toLocaleString("ko-KR");
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/** 상품 요약 바 */
function ProductSummaryBar({ product }) {
  if (!product) return null;
  const type = (product.type || "").toUpperCase();
  const rateMin = product.rateMin ?? product.rate_min;
  const rateMax = product.rateMax ?? product.rate_max;
  const limitMax = product.limitMax ?? product.limit_max;
  const termMonths = product.termMonths || [];
  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-500">상품코드 {product.code || product.id}</div>
          <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
          {product.desc && <p className="text-gray-600 mt-1">{product.desc}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700">
            유형: {type === "MORTGAGE" ? "주택담보" : type === "JEONSE" ? "전세자금" : type === "CREDIT" || type === "PERSONAL" ? "신용대출" : product.type}
          </div>
          {rateMin != null && rateMax != null && (
            <div className="px-3 py-2 rounded-xl bg-gray-50 text-gray-700">
              금리: {rateMin}% ~ {rateMax}%
            </div>
          )}
          {limitMax != null && (
            <div className="px-3 py-2 rounded-xl bg-gray-50 text-gray-700">
              최대한도: ₩ {won(limitMax)}
            </div>
          )}
          {!!termMonths.length && (
            <div className="px-3 py-2 rounded-xl bg-gray-50 text-gray-700">
              기간: {termMonths.join(", ")}개월
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Review 모달: 신청 전 사용자 입력/견적 요약 확인 */
function ReviewModal({ open, onClose, onProceed, product, form, quote, accounts }) {
  const [agree1, setAgree1] = React.useState(false);
  const [agree2, setAgree2] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setAgree1(false);
      setAgree2(false);
    }
  }, [open]);

  if (!open) return null;

  const payout = accounts.find(a => String(a.a_no) === String(form.payoutAccountNo));
  const repay  = accounts.find(a => String(a.a_no) === String(form.repayAccountNo));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
      <div className="w-[720px] rounded-2xl bg-white shadow-xl p-6">
        <h3 className="text-lg font-semibold">신청 정보 확인</h3>

        <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border p-4">
            <div className="font-semibold mb-2">입력 정보</div>
            <div className="space-y-1 text-gray-700">
              <div>직업: {OCCUPATIONS.find(o => o.key === form.occupation)?.label || form.occupation}</div>
              <div>연소득: ₩ {won(form.incomeAnnual)}</div>
              <div>신청금액: ₩ {won(form.desiredAmount)}</div>
              <div>희망기간: {form.desiredTerm}개월</div>
              {form.rateType && <div>금리유형: {form.rateType === "FIXED" ? "고정" : form.rateType === "VARIABLE" ? "변동" : form.rateType}</div>}
              {form.rpayType && <div>상환방식: {form.rpayType}</div>}
              <div>대출 목적: {form.purpose}</div>
              {form.collateralValue != null && <div>담보가치: ₩ {won(form.collateralValue)}</div>}
              {form.jeonseDeposit != null && <div>임차보증금: ₩ {won(form.jeonseDeposit)}</div>}
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="font-semibold mb-2">견적 결과</div>
            <div className="space-y-1 text-gray-700">
              <div>적용 금리: {Number(quote?.appliedRate || 0).toFixed(2)}%</div>
              <div>승인(가능) 금액: ₩ {won(quote?.approvedAmount)}</div>
              <div>월 납입액(예상): ₩ {won(quote?.monthlyPayment)}</div>
              <div>승인 기간: {quote?.approvedTerm || form.desiredTerm}개월</div>
            </div>
          </div>
          <div className="rounded-xl border p-4 md:col-span-2">
            <div className="font-semibold mb-2">지급/상환 계좌</div>
            <div className="grid md:grid-cols-2 gap-3 text-gray-700">
              <div>
                <div className="text-xs text-gray-500">지급 계좌 (자금 입금)</div>
                <div className="font-medium">
                  {payout ? `${payout.a_account_no} · ${payout.a_nickname || payout.a_account_type}` : "-"}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">상환 계좌 (매월 출금)</div>
                <div className="font-medium">
                  {repay ? `${repay.a_account_no} · ${repay.a_nickname || repay.a_account_type}` : "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 필수 동의 (간단 체크, 본 약관은 스텝1에서 상세 동의) */}
        <div className="mt-4 space-y-2 text-sm">
          <label className="flex gap-2 items-start">
            <input type="checkbox" checked={agree1} onChange={(e)=>setAgree1(e.target.checked)} />
            <span>전자금융거래 기본 안내를 확인했습니다. (스텝1에서 상세 동의)</span>
          </label>
          <label className="flex gap-2 items-start">
            <input type="checkbox" checked={agree2} onChange={(e)=>setAgree2(e.target.checked)} />
            <span>개인(신용)정보 수집·이용 기본 안내를 확인했습니다. (스텝1에서 상세 동의)</span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="px-4 py-2 rounded-xl border" onClick={onClose}>취소</button>
          <button
            className={`px-4 py-2 rounded-xl text-white ${agree1 && agree2 ? "bg-blue-700 hover:bg-blue-800" : "bg-gray-400 cursor-not-allowed"}`}
            disabled={!(agree1 && agree2)}
            onClick={onProceed}
          >
            신청페이지로 이동
          </button>
        </div>
      </div>
    </div>
  );
}

/** 한도/금리 조회 페이지 */
export function LoanQuotePageInner({ demoProduct=null, demoCustomerId="" }) {
  const { code } = useParams();
  const nav = useNavigate();
  const location = useLocation();

  const stateProduct = location.state?.product ?? demoProduct ?? null;
  const stateCustomer = location.state?.customerId ?? demoCustomerId ?? "";

  // 기본 상태
  const [product, setProduct] = React.useState(stateProduct);
  const [loading, setLoading] = React.useState(!stateProduct);
  const [error, setError] = React.useState(null);

  // 입력
  const [occupation, setOccupation] = React.useState(OCCUPATIONS[1].key); // EMPLOYEE default
  const [incomeAnnual, setIncomeAnnual] = React.useState(60_000_000);
  const [desiredAmount, setDesiredAmount] = React.useState(50_000_000);
  const [desiredTerm, setDesiredTerm] = React.useState(36);
  const [collateralValue, setCollateralValue] = React.useState(300_000_000);
  const [jeonseDeposit, setJeonseDeposit] = React.useState(200_000_000);
  const [purpose, setPurpose] = React.useState("생활비");
  const [rateType, setRateType] = React.useState(""); // FIXED/VARIABLE
  const [rpayType, setRpayType] = React.useState(""); // 상환방식

  // 계좌 목록
  const [accounts, setAccounts] = React.useState([]);
  const [payoutAccountNo, setPayoutAccountNo] = React.useState("");
  const [repayAccountNo, setRepayAccountNo] = React.useState("");

  // 견적 결과
  const [quote, setQuote] = React.useState(null);
  const [quoting, setQuoting] = React.useState(false);

  // Review 모달
  const [reviewOpen, setReviewOpen] = React.useState(false);

  // 타입 판별
  const loanType = (product?.type || "").toUpperCase();
  const isCredit = loanType.includes("CREDIT") || loanType.includes("PERSONAL") || loanType.includes("신용");
  const isJeonse = loanType.includes("JEONSE") || loanType.includes("전세");
  const isMortgage = loanType.includes("MORTGAGE") || loanType.includes("담보");
  const needsCollateral = isJeonse || isMortgage;

  // 옵션 추출
  const opts = React.useMemo(() => Array.isArray(product?.options) ? product.options : [], [product]);
  const allowedTerms = React.useMemo(() => {
    const terms = [
      ...(product?.termMonths || []),
      ...opts.map(op => Number(op.termMonths || op.terms || 0)).filter(Boolean)
    ];
    return [...new Set(terms)].sort((a, b) => a - b);
  }, [product, opts]);
  const allowedRateTypes = React.useMemo(() => {
    const list = opts
      .map(op => (op.rateType || op.rate_type || "").toString().toUpperCase())
      .filter(Boolean);
    return [...new Set(list)];
  }, [opts]);
  const allowedRpayTypes = React.useMemo(() => {
    const list = opts
      .map(op => (op.rpayType ?? op.rpayTypeCode ?? op.rpayTypeNm ?? "").toString().toUpperCase())
      .filter(Boolean);
    return [...new Set(list)];
  }, [opts]);

  // 상품 로딩
  React.useEffect(() => {
    if (stateProduct) {
      setProduct(stateProduct);
      if (stateProduct?.termMonths?.length) setDesiredTerm(stateProduct.termMonths[0]);
    }
    setLoading(!stateProduct);
    if (!code) {
      setLoading(false);
      return;
    }
    fetchLoanProductDetail(code)
      .then(res => {
        const data = res.data ?? res;
        setProduct(data);
        if (data?.termMonths?.length) setDesiredTerm(data.termMonths[0]);

        // limitMax가 있으면 현재 desiredAmount를 즉시 clamp
        const limitMax = data?.limitMax ?? data?.limit_max;
        if (limitMax != null) {
          setDesiredAmount(prev => clamp(Number(prev || 0), 1_000_000, Number(limitMax)));
        }
      })
      .catch(e => setError(e.message || "상품 조회 실패"))
      .finally(() => setLoading(false));
  }, [code, stateProduct]);

  // 옵션 기반 기본값 보정
  React.useEffect(() => {
    if (allowedTerms.length && !allowedTerms.includes(desiredTerm)) {
      setDesiredTerm(allowedTerms[0]);
    }
    if (allowedRateTypes.length && !rateType) {
      setRateType(allowedRateTypes[0]);
    }
    if (allowedRpayTypes.length && !rpayType) {
      setRpayType(allowedRpayTypes[0]);
    }
  }, [allowedTerms, allowedRateTypes, allowedRpayTypes]); // eslint-disable-line

  // 계좌
  React.useEffect(() => {
    fetchAccounts()
      .then(res => {
        const list = res.data ?? res;
        setAccounts(list || []);
        if ((list?.length || 0) > 0) {
          setPayoutAccountNo(list[0].a_no);
          setRepayAccountNo(list[0].a_no);
        }
      })
      .catch(() => setAccounts([]));
  }, []);

  const onQuote = async () => {
    try {
      setQuoting(true);
      const limitMax = product?.limitMax ?? product?.limit_max;
      const reqAmount = limitMax != null
        ? clamp(Number(desiredAmount || 0), 1_000_000, Number(limitMax))
        : Number(desiredAmount || 0);

      if (reqAmount !== desiredAmount) {
        setDesiredAmount(reqAmount); // UI도 동기화
      }

      const req = {
        occupation,
        incomeAnnual,
        desiredAmount: reqAmount,
        desiredTerm,
        rateType,
        rpayType,
        collateralValue: isMortgage ? collateralValue : undefined,
        jeonseDeposit: isJeonse ? jeonseDeposit : undefined,
      };

      // const res = await fetchLoanQuote(code, req);
      // const data = res.data ?? res;
      // setQuote(data);
    } catch (e) {
      console.error(e);
      alert(e.message || "한도/금리 조회 실패");
    } finally {
      setQuoting(false);
    }
  };

  const onApplyClick = () => {
    if (!quote) {
      alert("먼저 한도/금리 조회를 진행해 주세요.");
      return;
    }
    if (!payoutAccountNo || !repayAccountNo) {
      alert("지급 계좌와 상환 계좌를 선택해 주세요.");
      return;
    }
    setReviewOpen(true);
  };

  const proceedToApplyPage = () => {
    setReviewOpen(false);
    // 세션 저장 후 1단계(약관)로 이동
    const flow = {
      product,
      quote,
      form: {
        occupation,
        incomeAnnual,
        desiredAmount,
        desiredTerm,
        rateType,
        rpayType,
        purpose,
        collateralValue: isMortgage ? collateralValue : null,
        jeonseDeposit: isJeonse ? jeonseDeposit : null,
        payoutAccountNo,
        repayAccountNo,
        customerId: stateCustomer || "1",
      },
      step: 1, // 현재 완료된 최종 스텝
    };
    sessionStorage.setItem(`apply:${code}`, JSON.stringify(flow));
   nav(`/loan/apply/${encodeURIComponent(code)}/agree`);
  };

  if (loading) return <div className="p-8">로딩중…</div>;
  if (error) return <div className="p-8 text-red-600">에러: {error}</div>;
  if (!product) return <div className="p-8">상품 정보를 찾을 수 없습니다.</div>;

  const limitMax = product?.limitMax ?? product?.limit_max;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      

      {/* 상품 요약 */}
      <ProductSummaryBar product={product} />

      {/* 입력폼 */}
      <section className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-100 p-5 bg-white space-y-4">
          <h3 className="font-semibold">신용/소득 정보</h3>

          <label className="block text-sm">
            <span className="text-gray-600">직업</span>
            <select
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            >
              {OCCUPATIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-gray-600">연소득(원)</span>
            <input
              type="number"
              value={incomeAnnual}
              onChange={(e) => setIncomeAnnual(clamp(Number(e.target.value || 0), 0, 10_000_000_000))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-600">신청금액(원)</span>
            <input
              type="number"
              value={desiredAmount}
              onChange={(e) => {
                const raw = Number(e.target.value || 0);
                const clamped = limitMax != null
                  ? clamp(raw, 1_000_000, Number(limitMax))
                  : clamp(raw, 1_000_000, 10_000_000_000);
                setDesiredAmount(clamped);
              }}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            />
            {limitMax != null && (
              <div className="text-xs text-gray-500 mt-1">상품 최대한도: ₩ {won(limitMax)}</div>
            )}
          </label>

          {!!allowedTerms.length && (
            <label className="block text-sm">
              <span className="text-gray-600">희망기간(개월)</span>
              <select
                value={desiredTerm}
                onChange={(e) => setDesiredTerm(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              >
                {allowedTerms.map(m => <option key={m} value={m}>{m}개월</option>)}
              </select>
            </label>
          )}

          {!!allowedRateTypes.length && (
            <label className="block text-sm">
              <span className="text-gray-600">금리 유형</span>
              <select
                value={rateType}
                onChange={(e) => setRateType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-700"
                disabled={allowedRateTypes.length === 1}
                aria-readonly={allowedRateTypes.length === 1}
              >
                {allowedRateTypes.map(t => (
                  <option key={t} value={t}>
                    {t === "FIXED" ? "고정금리" : t === "VARIABLE" ? "변동금리" : t}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!!allowedRpayTypes.length && (
            <label className="block text-sm">
              <span className="text-gray-600">상환 방식</span>
              <select
                value={rpayType}
                onChange={(e) => setRpayType(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-700"
                disabled={allowedRpayTypes.length === 1}
              >
                {allowedRpayTypes.map(t => (
                  <option key={t} value={t}>
                    {t === "원리금균등" ? "원리금균등" :
                     t === "분할상환방식" ? "원금균등" :
                     t === "만기일시상환방식" ? "만기일시" : t}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm">
            <span className="text-gray-600">대출 목적</span>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            >
              <option value="생활비">생활비</option>
              <option value="대환자금">대환자금</option>
              <option value="주거비">주거비</option>
            </select>
          </label>
        </div>

        {/* 담보/보증 입력 (주담대/전세 전용) */}
        {needsCollateral && (
          <div className="rounded-2xl border border-gray-100 p-5 bg-white space-y-4">
            <h3 className="font-semibold">담보/보증 정보</h3>

            {isMortgage && (
              <label className="block text-sm">
                <span className="text-gray-600">담보가치(원)</span>
                <input
                  type="number"
                  value={collateralValue}
                  onChange={(e) => setCollateralValue(clamp(Number(e.target.value || 0), 0, 10_000_000_000))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                />
                {product?.ltvMax != null && (
                  <div className="text-xs text-gray-500 mt-1">상품 LTV 최대: {product.ltvMax}%</div>
                )}
              </label>
            )}

            {isJeonse && (
              <label className="block text-sm">
                <span className="text-gray-600">임차보증금(원)</span>
                <input
                  type="number"
                  value={jeonseDeposit}
                  onChange={(e) => setJeonseDeposit(clamp(Number(e.target.value || 0), 0, 10_000_000_000))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                />
                {product?.ltvMax != null && (
                  <div className="text-xs text-gray-500 mt-1">상품 LTV 최대: {product.ltvMax}%</div>
                )}
              </label>
            )}
          </div>
        )}
      </section>

      {/* 계좌 선택 & 견적 */}
      <section className="mt-8 rounded-2xl border border-gray-100 p-5 bg-white">
        <h3 className="font-semibold mb-3">지급/상환 계좌</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-gray-600">지급 계좌 (자금 입금)</span>
            <select
              value={payoutAccountNo}
              onChange={(e) => setPayoutAccountNo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            >
              {accounts.map(a => (
                <option key={a.a_no} value={a.a_no}>
                  {a.a_account_no} · {a.a_nickname || a.a_account_type} · 잔액 {won(a.a_balance)}원
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-gray-600">상환 계좌 (매월 출금)</span>
            <select
              value={repayAccountNo}
              onChange={(e) => setRepayAccountNo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            >
              {accounts.map(a => (
                <option key={a.a_no} value={a.a_no}>
                  {a.a_account_no} · {a.a_nickname || a.a_account_type} · 잔액 {won(a.a_balance)}원
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onQuote}
            disabled={quoting}
            className={`px-4 py-2 rounded-xl text-white ${quoting ? "bg-gray-400" : "bg-blue-700 hover:bg-blue-800"}`}
          >
            {quoting ? "조회중…" : "옵션 적용"}
          </button>

          <button
            onClick={onApplyClick}
            disabled={!quote}
            className={`px-4 py-2 rounded-xl text-white ${!quote ? "bg-gray-400" : "bg-blue-700 hover:bg-blue-800"}`}
          >
            신청하기
          </button>
        </div>

        {quote && (
          <div className="mt-6 grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-600">
                적용 금리 <span className="text-xs text-gray-400">({rateType || "-"})</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {Number(quote.appliedRate || 0).toFixed(2)}%
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-600">
                승인(가능) 금액 <span className="text-xs text-gray-400">({rpayType || "-"})</span>
              </div>
              <div className="text-2xl font-bold mt-1">₩ {won(quote.approvedAmount)}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-sm text-gray-600">월 납입액(예상)</div>
              <div className="text-2xl font-bold mt-1">₩ {won(quote.monthlyPayment)}</div>
            </div>
          </div>
        )}
      </section>

      {/* Review 모달 */}
      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onProceed={proceedToApplyPage}
        product={product}
        quote={quote}
        accounts={accounts}
        form={{
          occupation, incomeAnnual, desiredAmount, desiredTerm,
          rateType, rpayType, purpose, collateralValue, jeonseDeposit,
          payoutAccountNo, repayAccountNo
        }}
      />
    </div>
  );
}

export default function LoanQuotePage() {
  return <LoanQuotePageInner />;  
}