import React from "react";
import { won } from "../../util/money";

export default function LoanSummaryCard({
  annualRate, P_req, P_appr, n, r,
  monthlyReq, monthlyAppr,
  isBullet,
  quote, fieldErr,
  baseRateMin, baseRateMax,
  productName, loanTypeLabel,
  limitMax,
  onRequote, canRequote, quoting,
  totalAtMaturityReq, totalAtMaturityAppr,
  showLtvBadge = false,
}) {
  const appliedLtvRaw =
    quote?.usedLtv ?? quote?.ltv ?? quote?.appliedLtv ?? null; // 혹시 다른 키를 쓰고 있으면 여기 추가
  const appliedLtv = appliedLtvRaw == null ? null : Number(appliedLtvRaw);
  const hasAppliedLtv = Number.isFinite(appliedLtv);

  const rawLabel = String(loanTypeLabel || "");
  const typeUpper = rawLabel.toUpperCase();
  const isMortgage =
    typeUpper.includes("MORTGAGE") || rawLabel.includes("주택담보");
  const isJeonse =
    typeUpper.includes("JEONSE") || rawLabel.includes("전세자금");
  const isAuto =
    typeUpper.includes("AUTO") || rawLabel.includes("자동차");

  const ltvMessage =
    !hasAppliedLtv
      ? null
      : isAuto
      ? `차량가 대비 약 ${appliedLtv}% 한도 적용`
      : isJeonse
      ? `전세보증금 대비 약 ${appliedLtv}% LTV 적용`
      : isMortgage
      ? `담보가 대비 약 ${appliedLtv}% LTV 적용`
      : `담보 기준 약 ${appliedLtv}% LTV 적용`;

  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          <i className="ri-pie-chart-2-line" />
        </span>
        <h3 className="font-semibold text-gray-800">요약 & 미리보기</h3>
      </div>

      <div className="mt-3 space-y-3">
        {fieldErr?._server && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs px-3 py-2">
            {fieldErr._server}
          </div>
        )}

        {/* 상품 기본정보 */}
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
          {limitMax != null && (
            <span className="ml-2">· 최대한도: ₩ {won(limitMax)}</span>
          )}
        </div>

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

        {/* 승인 가능금액 + LTV 배지 */}
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

            {showLtvBadge && ltvMessage && (
              <div className="mt-2 flex justify-center">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-[11px] border border-sky-100">
                  {ltvMessage}
                </span>
              </div>
            )}
          </div>

          {/* 월 납입 / 만기 총액 */}
          {!isBullet ? (
            <div className="rounded-2xl border border-indigo-100 p-3 bg-indigo-50">
              <div className="grid gap-2">
                <div>
                  <div className="text-indigo-700">월 납입(승인)</div>
                  <div className="text-xl font-bold mt-1 text-indigo-900">
                    {won(monthlyAppr)}
                    <span className="text-sm"> 원</span>
                  </div>
                </div>
              </div>
              {P_appr > 0 && P_appr < P_req && (
                <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mt-2">
                  승인 금액이 신청 금액보다 작아 승인 기준 월 납입이 다를 수 있습니다.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-indigo-100 p-3 bg-indigo-50">
              <div className="grid gap-2 text-center">
                <div>
                  <div className="text-[11px] text-indigo-700">
                    만기 총액(승인)
                  </div>
                  <div className="text-xl font-bold mt-1 text-indigo-900">
                    {won(totalAtMaturityAppr)}
                    <span className="text-sm"> 원</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-indigo-700/80 mt-1 text-center">
                단리 기준 추정치
              </div>
            </div>
          )}
        </div>

        {/* 배지/추적 (LTV는 위에서 보여줌) */}
        <div className="flex flex-wrap gap-2">
          {quote?.limitBasis && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] bg-gray-50 text-gray-700 border border-gray-200">
              한도 기준: {String(quote.limitBasis)}
            </span>
          )}
        </div>

        {quote?.calcTrace && (
          <details className="text-[11px] text-gray-600 mt-1">
            <summary className="cursor-pointer select-none">
              계산 근거 상세
            </summary>
            <pre className="mt-1 bg-gray-50 p-2 rounded-lg overflow-x-auto">
              {JSON.stringify(quote.calcTrace, null, 2)}
            </pre>
          </details>
        )}
      </div>

      {/* 재조회 버튼 */}
      <button
        className={`w-full mt-4 px-4 py-2 rounded-xl text-white transition ${
          canRequote
            ? quoting
              ? "bg-blue-400"
              : "bg-blue-600 hover:bg-blue-800"
            : "bg-gray-400 cursor-not-allowed"
        }`}
        onClick={onRequote}
        disabled={!canRequote || quoting}
      >
        {quoting ? "조회중…" : "한도/금리 재조회"}
      </button>
    </div>
  );
}
