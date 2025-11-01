import React from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { ApplyLayout } from "./ApplyLayoutGuard";
import { loadFlow } from "./ApplyStorage";

const won = (n)=> Number(n||0).toLocaleString("ko-KR");

export default function ApplyCompletePage(){
  const { code, laId } = useParams();
  const nav = useNavigate();
  const { state } = useLocation() || {};
  // 완료 시점에 세션을 비우지만, 혹시 남아있다면 요약용으로만 읽음
  const flow = loadFlow(code);

  const product = flow?.product;
  const form = flow?.form;
  const quote = flow?.quote;

  return (
    <ApplyLayout current={5}>
      <div className="rounded-2xl border border-gray-100 p-6 bg-white">
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-1">
            <svg width="40" height="40" viewBox="0 0 24 24" className="text-green-600">
              <path fill="currentColor" d="M12 22q-2.05 0-3.875-.788t-3.175-2.137t-2.137-3.175T2 12t.813-3.888t2.137-3.2T8.125 2.787T12 2t3.875.8t3.175 2.15t2.137 3.2T22 12t-.813 3.9t-2.137 3.175t-3.175 2.137T12 22m-1.125-5.5l7.2-7.2l-1.4-1.4l-5.8 5.8l-2.8-2.8l-1.4 1.4z"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">신청이 완료되었습니다.</h2>
            <p className="text-gray-600 mt-1">
              신청번호 <span className="font-medium">{laId}</span> (상태: <span className="font-medium">{state?.status || "신청중"}</span>)
            </p>

            {/* 요약 정보 (있을 때만 노출) */}
            {(product || form || quote) && (
              <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-gray-500">상품</div>
                  <div className="font-medium">{product?.name || "-"}</div>
                  <div className="text-gray-500">코드: {product?.code || product?.id || "-"}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-gray-500">신청 조건</div>
                  <div>금액: ₩ {won(quote?.approvedAmount ?? form?.desiredAmount)}</div>
                  <div>기간: {quote?.approvedTerm ?? form?.desiredTerm}개월</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-gray-500">적용 금리(예상)</div>
                  <div className="font-medium">
                    {quote?.appliedRate != null ? `${Number(quote.appliedRate).toFixed(2)}%` : "-"}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {/* <Link
                to={`/loans/applications/${encodeURIComponent(laId)}`}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white"
              >
                신청 내역 보기
              </Link> */}
              <Link
                to="/loan/products"
                className="px-4 py-2 rounded-xl border"
              >
                다른 대출상품 보기
              </Link>
              <button
                className="px-4 py-2 rounded-xl border"
                onClick={() => nav(`/loan/${encodeURIComponent(code)}/quote`)}
              >
                같은 상품 다시 조회
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              관리자가 확인 후 승인/보류/반려 처리를 진행합니다. 진행 현황은 “신청 내역 보기”에서 확인할 수 있습니다.  ((추가?))
            </div>
          </div>
        </div>
      </div>
    </ApplyLayout>
  );
}
