// src/pages/loan/apply/ApplyCompletePage.js
import React from "react";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { ApplyLayout } from "./ApplyLayoutGuard";
import { loadFlow } from "./ApplyStorage";
import api from "../../../api/axios";

const won = (n) => Number(n || 0).toLocaleString("ko-KR");

// 약관 동의 PDF 다운로드 (원래 로직 그대로)
async function downloadConsentsPdf(laId) {
  if (!laId || String(laId).trim() === "") {
    alert("신청번호(laId)가 비어 있습니다.");
    return;
  }

  const url = `/api/loan/applications/${laId}/consents.pdf`;
  console.log("[PDF] requesting:", url);

  const res = await api.get(url, {
    responseType: "blob",
    validateStatus: (s) => s < 500,
  });

  if (res.status >= 400) {
    try {
      const text = await res.data.text();
      alert(text || `PDF 생성 실패 (HTTP ${res.status})`);
    } catch {
      alert(`PDF 생성 실패 (HTTP ${res.status})`);
    }
    return;
  }

  const blob = new Blob([res.data], { type: "application/pdf" });
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `loan-consents_${laId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export default function ApplyCompletePage() {
  const { code, laId } = useParams();
  const nav = useNavigate();
  const { state } = useLocation() || {};

  // 완료 직전 단계에서 저장해둔 플로우 (있으면 요약용으로만 사용)
  const flow = loadFlow(code);
  const product = flow?.product;
  const form = flow?.form;
  const quote = flow?.quote;

  const statusLabel = state?.status || "신청중";

  return (
    <ApplyLayout current={5}>
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 md:p-8 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
        {/* 상단 뱃지 */}
        <div className="mb-4 flex items-center gap-2 text-xs text-emerald-700">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 font-medium">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            신청 완료
          </span>
          <span className="text-gray-500">
            대출 신청이 안전하게 접수되었습니다.
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* 왼쪽 영역 */}
          <div className="flex-1 flex gap-4">
            {/* 아이콘 */}
            <div className="mt-1 hidden sm:flex items-start">
              <div className="relative">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    className="text-white"
                  >
                    <path
                      fill="currentColor"
                      d="M12 22q-2.05 0-3.875-.788t-3.175-2.137t-2.137-3.175T2 12t.813-3.888t2.137-3.2T8.125 2.787T12 2t3.875.8t3.175 2.15t2.137 3.2T22 12t-.813 3.9t-2.137 3.175t-3.175 2.137T12 22m-1.125-5.5l7.2-7.2l-1.4-1.4l-5.8 5.8l-2.8-2.8l-1.4 1.4z"
                    />
                  </svg>
                </div>
                <div className="absolute -inset-2 -z-10 rounded-3xl bg-emerald-200/30 blur-xl" />
              </div>
            </div>

            {/* 텍스트 & 요약 */}
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
                신청이 완료되었습니다.
              </h2>
              <p className="mt-2 text-sm md:text-base text-slate-600 leading-relaxed">
                접수된 신청은 이음은행 심사 기준에 따라 순차적으로 검토됩니다.
                처리 결과는 마이페이지의 신청 내역 및 알림으로 안내드릴게요.
              </p>

              {/* 신청번호 / 상태 */}
              <div className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 border border-slate-100 shadow-sm">
                <div>
                  <div className="text-[10px] text-slate-400">신청번호</div>
                  <div className="text-sm font-semibold text-slate-900">
                    {laId}
                  </div>
                </div>
                <div className="w-px h-7 bg-slate-200 mx-2 hidden sm:block" />
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-slate-500">현재 상태</span>
                  <span className="rounded-full bg-slate-900 text-white px-3 py-1 text-[10px] font-medium">
                    {statusLabel}
                  </span>
                </div>
              </div>

              {/* 상품 / 조건 / 금리 요약 (원래 로직 그대로, UI만 카드화) */}
              {(product || form || quote) && (
                <div className="mt-5 grid gap-3 md:grid-cols-3 text-xs md:text-sm">
                  {/* 상품 */}
                  <div className="rounded-2xl bg-white/95 border border-slate-100 p-3.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-sky-50 text-sky-500">
                        <svg
                          viewBox="0 0 24 24"
                          width="10"
                          height="10"
                          fill="currentColor"
                        >
                          <path d="M7 3h10l4 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
                        </svg>
                      </span>
                      신청 상품
                    </div>
                    <div className="font-semibold text-slate-900 truncate">
                      {product?.name || "-"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      코드: {product?.code || product?.id || "-"}
                    </div>
                  </div>

                  {/* 신청 조건 */}
                  <div className="rounded-2xl bg-white/95 border border-slate-100 p-3.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                        ₩
                      </span>
                      신청 조건
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>신청 금액</span>
                      <b>
                        ₩{" "}
                        {won(
                          quote?.approvedAmount ??
                            form?.desiredAmount ??
                            0
                        )}
                      </b>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>기간</span>
                      <b>
                        {quote?.approvedTerm ??
                          form?.desiredTerm ??
                          "-"}
                        개월
                      </b>
                    </div>
                  </div>

                  {/* 예상 금리 */}
                  <div className="rounded-2xl bg-white/95 border border-slate-100 p-3.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                        %
                      </span>
                      예상 적용 금리
                    </div>
                    <div className="text-lg font-semibold text-indigo-600">
                      {quote?.appliedRate != null
                        ? `${Number(
                            quote.appliedRate
                          ).toFixed(2)}%`
                        : "-"}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      실제 적용 금리는 심사 결과 및 약정 시점에 따라 변동될 수 있습니다.
                    </div>
                  </div>
                </div>
              )}

              {/* 버튼 (기존 동작 유지) */}
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  to="/loan/products"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M10 20v-6H4v-4h6V4h4v6h6v4h-6v6z" />
                    </svg>
                  </span>
                  다른 대출상품 보기
                </Link>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition"
                  onClick={() =>
                    nav(`/loan/${encodeURIComponent(code)}/quote`)
                  }
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-50 text-sky-500">
                    <svg
                      viewBox="0 0 24 24"
                      width="12"
                      height="12"
                      fill="currentColor"
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </span>
                  같은 상품 다시 조회
                </button>

                <button
                  type="button"
                  onClick={() => downloadConsentsPdf(laId)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition shadow-md"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="currentColor"
                    >
                      <path d="M12 3v12.17l4.59-4.58L18 12l-6 6-6-6 1.41-1.41L11 15.17V3h1zM5 19h14v2H5z" />
                    </svg>
                  </span>
                  약관 동의서(PDF) 다운로드
                </button>
              </div>

              <div className="mt-4 text-[10px] text-slate-500 leading-relaxed">
                관리자가 확인 후 승인 / 보류 / 반려를 처리합니다.
                진행 현황은 추후 “신청 내역 보기” 메뉴에서 확인하실 수 있습니다.
              </div>
            </div>
          </div>

          {/* 오른쪽 요약 카드 (순수 표시용) */}
          <div className="w-full lg:w-64 xl:w-72">
            <div className="h-full rounded-2xl bg-white/95 border border-slate-100 px-4 py-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="currentColor"
                  >
                    <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  진행 단계 요약
                </div>
              </div>

              <ul className="space-y-1.5 text-[11px] text-slate-600">
                <li>✔ 상품 선택 완료</li>
                <li>✔ 한도 / 금리 조회 완료</li>
                <li>✔ 정보 입력 및 약관 동의 완료</li>
                <li>✔ 신청 접수 (심사 대기)</li>
              </ul>

              <div className="mt-2 pt-2 border-t border-dashed border-slate-100 text-[10px] text-slate-500">
                마이페이지 &gt; 대출 신청 내역에서
                진행 상황을 언제든 확인하실 수 있습니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </ApplyLayout>
  );
}
