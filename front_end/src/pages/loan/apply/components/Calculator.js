import React from "react";

// === 상세 페이지 내 계산기 컴포넌트 ===
export function InlineCalculator({ product, isCredit, isAuto, carType: carTypeProp, onCarTypeChange }) {
  // 기본 금액/기간은 상품 정보 기준으로 세팅
  const terms = React.useMemo(() => {
    if (!product) return [];
    const base = Number(product.rateMin ?? 0);
    const list =
      product.termMonths && product.termMonths.length > 0
        ? product.termMonths
        : isCredit
        ? [12, 24, 36]
        : [];
    return list.map((m) => ({ months: m, rate: base }));
  }, [product, isCredit]);

  const fmt = (n) => Number(n || 0).toLocaleString("ko-KR");
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const [amount, setAmount] = React.useState(50_000_000);
  const [term, setTerm] = React.useState(() => terms[0]?.months || 36);
  const isControlled = typeof carTypeProp !== "undefined";
  const [carTypeInner, setCarTypeInner] = React.useState(carTypeProp ?? "NEW");
  React.useEffect(() => {
    if (isControlled) setCarTypeInner(carTypeProp);
  }, [isControlled, carTypeProp]);
  const setCarType = (v) => {
    if (!isControlled) setCarTypeInner(v);
    onCarTypeChange?.(v);
  }
  const carType = carTypeInner;
  const baseRate = React.useMemo(() => {
    const t = terms.find((t) => t.months === term);
    return t ? t.rate : Number(product?.rateMin ?? 0);
  }, [terms, term, product]);


  const effectiveRate = React.useMemo(() => {
    let r = baseRate;
    if (isAuto && carType === "USED") r += 0.7;
    return Math.max(0, r);
  }, [baseRate, isAuto, carType]);

  // 원리금균등 월 상환액(표시용)
  const monthlyPayment = React.useMemo(() => {
    const P = amount || 0;
    const n = term || 0;
    const m = effectiveRate / 100 / 12;
    if (n === 0) return 0;
    if (m === 0) return Math.ceil(P / n);
    const M = P * (m / (1 - Math.pow(1 + m, -n)));
    return Math.ceil(M);
  }, [amount, term, effectiveRate]);

  const totalPayment = monthlyPayment * (term || 0);
  const totalInterest = totalPayment - (amount || 0);

  return (
    <section className="mt-8 rounded-2xl border border-gray-100 p-4 lg:p-6 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
          {/* 아이콘은 굳이 추가 임포트 안 해도 됨. 필요하면 lucide-react Calc 아이콘 써도 O */}
          <span className="text-sm font-semibold text-indigo-800">간편 계산기 (원리금균등 예시)</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-4">
        {/* 입력 */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-gray-600">대출금액 (원)</span>
            <input
              type="number"
              value={amount}
              min={1_000_000}
              max={product?.limitMax || 1_000_000_000}
              onChange={(e) =>
                setAmount(
                  clamp(parseInt(e.target.value || "0", 10), 1_000_000, product?.limitMax || 1_000_000_000)
                )
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {product?.limitMax && (
              <div className="mt-1 text-xs text-gray-500">최대 {fmt(product.limitMax)} 원</div>
            )}
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">기간</span>
            <select
              value={term}
              onChange={(e) => setTerm(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {terms.map((t) => (
                <option key={t.months} value={t.months}>
                  {t.months}개월 (기본 {t.rate.toFixed(2)}%)
                </option>
              ))}
            </select>
          </label>

          {/* 자동차대출이면 신차/중고차 토글 노출  (( 중고차일경우 +0.7%)) */}
          {isAuto && (
            <div className="block">
              <span className="text-sm text-gray-600">차량 유형</span>
              <div className="mt-2 inline-flex rounded-xl border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCarType("NEW")}
                  className={
                    "px-4 py-2 text-sm transition " +
                    (carType === "NEW" ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50")
                  }
                >
                  신차
                </button>
                <button
                  type="button"
                  onClick={() => setCarType("USED")}
                  className={
                    "px-4 py-2 text-sm transition border-l border-gray-200 " +
                    (carType === "USED" ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50")
                  }
                >
                  중고차 (+0.7%p)
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                * 실제 적용금리는 심사 결과 및 상환방식/금리유형에 따라 달라질 수 있습니다.
              </div>
            </div>
          )}
        </div>

        {/* 결과 */}
        <div className="grid sm:grid-cols-2 gap-3 content-start">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">적용금리(연)</div>
            <div className="text-xl font-semibold mt-1">{effectiveRate.toFixed(2)}%</div>
            {isAuto && carType === "USED" && (
              <div className="mt-1 text-[11px] text-gray-500">* 중고차 가산 +0.7%p 포함</div>
            )}
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">월 상환액(예시)</div>
            <div className="text-xl font-semibold mt-1">{fmt(monthlyPayment)} 원</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">총 상환액(예시)</div>
            <div className="text-lg font-semibold mt-1">{fmt(totalPayment)} 원</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">총 이자(예시)</div>
            <div className="text-lg font-semibold mt-1 whitespace-nowrap">{fmt(totalInterest)} 원</div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        ※ 예시 계산 결과로, 실제 승인 한도/금리/월 납입액은 신청서 입력값과 내부 심사 및 상환방식(원리금/원금/만기일시)에 따라 달라질 수 있습니다.
      </p>
    </section>
  );
}
export default InlineCalculator;