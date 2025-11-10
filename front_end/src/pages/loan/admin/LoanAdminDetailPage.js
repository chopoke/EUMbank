// ============================================================
// /src/pages/admin/loan/LoanAdminDetailPage.js
// - 신청 상세, 심사 시작, 승인(금액/기간/금리 + 첫 지급일), 반려
// ============================================================
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  adminGetApplicationDetail,
  adminStartReview,
  adminApprove,
  adminReject
} from "../../../api/accounts";

function Field({ label, children }){
  return (
    <div className="grid grid-cols-4 gap-2 py-2">
      <div className="col-span-1 text-sm text-gray-500">{label}</div>
      <div className="col-span-3 text-sm text-gray-800">{children}</div>
    </div>
  );
}

export function JsonViewer({ value }){
  try {
    const obj = typeof value === 'string' ? JSON.parse(value) : value;
    return (
      <pre className="text-xs bg-slate-50 border border-slate-100 rounded-xl p-3 overflow-auto max-h-80">
        {JSON.stringify(obj, null, 2)}
      </pre>
    );
  } catch {
    return <div className="text-xs text-gray-500">(파싱 불가)</div>;
  }
}   

// ========================== 유틸
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function computeNextDueDate({ payoutAtISO, payDay }) {
  const now = new Date();
  const payoutAt = payoutAtISO ? new Date(payoutAtISO) : now;
  const y = payoutAt.getFullYear();
  const m = payoutAt.getMonth();
  const base = new Date(y, m, payoutAt.getDate(), 0, 0, 0, 0);

  const d = clamp(Number(payDay || base.getDate()), 1, 28);
  let next = new Date(y, m, d, 0, 0, 0, 0);
  if (next <= base) next = new Date(y, m + 1, d, 0, 0, 0, 0);
  return next;
}
function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bb - aa) / MS);
}



export default function LoanAdminDetailPage(){
  const { laId } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);
  const [detail, setDetail] = React.useState(null);

  const [approvedAmount, setApprovedAmount] = React.useState(0);
  const [approvedTerm, setApprovedTerm] = React.useState(0);
  const [approvedRate, setApprovedRate] = React.useState(0);
  const [firstPayoutAt, setFirstPayoutAt] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");
  const [payDay, setPayDay] = React.useState(null);             // 납입일 용

  const load = React.useCallback(async ()=>{
    try {
      setLoading(true);
      const res = await adminGetApplicationDetail(laId);
      const d = res?.data ?? res;
      setDetail(d);
      setErr(null);

      // 폼 초기값(승인 폼에 편의상 채워두기)
      setApprovedAmount(Number(d?.approvedAmount || d?.summary?.applyAmount || 0));
      setApprovedTerm(Number(d?.approvedTerm || d?.summary?.desiredTerm || 0));
      setApprovedRate(Number(d?.approvedRate || 0));

      // 초기 날짜 세팅 (없으면1~28중에)
      try {
        const submit = d?.summary?.submitDate ? new Date(d.summary.submitDate) : new Date();
        setPayDay(clamp(submit.getDate(), 1, 28));
      } catch {  }

    } catch(e){
      setErr(e?.response?.data?.message || e?.message || "상세 조회 실패");
    } finally { setLoading(false); }
  }, [laId]);

  React.useEffect(()=>{ load(); }, [load]);

  const status = detail?.summary?.applyStatus;

  const onStartReview = async ()=>{
    try{
      await adminStartReview(laId);
      await load();
    }catch(e){ alert(e?.response?.data?.message || e?.message || "심사 시작 실패"); }
  };

  // 경고/안내 문구 (지급일/납부일에 따른 첫 납부 예정일 계산)
  const warning = React.useMemo(() => {
    try {
      const payoutISO = firstPayoutAt ? new Date(firstPayoutAt).toISOString() : null;
      const nextDue = computeNextDueDate({ payoutAtISO: payoutISO, payDay });
      const today = new Date();
      const diff = daysBetween(today, nextDue);
      if (diff <= 3) {
        return {
          level: "warn",
          text: `선택한 납부일(${payDay ?? (firstPayoutAt ? new Date(firstPayoutAt).getDate() : "")}일)이 ${diff === 0 ? "오늘" : `${diff}일 후`}입니다. 너무 임박했어요.`
        };
      }
      return {
        level: "info",
        text: `다음 납부 예정일: ${nextDue.getFullYear()}-${String(nextDue.getMonth()+1).padStart(2,"0")}-${String(nextDue.getDate()).padStart(2,"0")}`
      };
    } catch {
      return null;
    }
  }, [firstPayoutAt, payDay]);

  const onApprove = async ()=>{
    try{
    if (!approvedAmount || approvedAmount <= 0) {
      return alert("승인금액을 0보다 크게 입력하세요.");
    }
    if (!approvedTerm || approvedTerm <= 0) {
      return alert("승인기간(개월)을 1 이상 입력하세요.");
    }
    if (payDay != null && (payDay < 1 || payDay > 28)) {
      return alert("최초 납부일(payDay)은 1~28 사이여야 합니다.");
    }
    const payload = {
      approvedAmount: Number(approvedAmount||0),
      approvedTerm: Number(approvedTerm||0),    
      approvedRate: Number(approvedRate||0),
      firstPayoutAt: firstPayoutAt ? new Date(firstPayoutAt).toISOString() : null,
      payDay: (payDay != null)
        ? Math.min(28, Math.max(1, Number(payDay)))
        : (firstPayoutAt ? Math.min(28, Math.max(1, new Date(firstPayoutAt).getDate())) : null),
      memo: ""
    };
    console.log("APPROVE payload =>", payload); // 네트워크 탭과 같이 확인
    await adminApprove(laId, payload);
    alert("승인 및 집행 완료");
    nav("/admin/loan/applications");
  }catch(e){
    const msg = e?.response?.data?.message || e?.response?.data || e?.message || "승인 실패";
    alert(msg);
  }
  };

  const onReject = async ()=>{
    try{
      const payload = { reason: rejectReason };
      await adminReject(laId, payload);
      alert("반려 완료");
      nav("/admin/loan/applications");
    }catch(e){ alert(e?.response?.data?.message || e?.message || "반려 실패"); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">신청 상세</h1>
          <button onClick={()=>nav(-1)} className="text-sm text-gray-600 hover:text-black inline-flex items-center gap-1"><i className="ri-arrow-left-line"/>뒤로</button>
        </div>

        {/* Summary */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          {loading && <div className="text-sm text-gray-500">불러오는 중…</div>}
          {err && <div className="text-sm text-red-600">{err}</div>}
          {!loading && !err && detail && (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-500">신청ID</div>
                  <div className="font-mono text-sm">{detail.summary.laId}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">상태</div>
                  <div className="text-sm font-medium">{detail.summary.applyStatus}</div>
                </div>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="font-medium text-gray-800 mb-2">신청 요약</div>
                  <Field label="상품명">{detail.summary.productName || detail.summary.loanName}</Field>
                  <Field label="신청금액">₩ {Number(detail.summary.applyAmount||0).toLocaleString("ko-KR")}</Field>
                  <Field label="기간">{detail.summary.desiredTerm}개월</Field>
                  <Field label="지급계좌">{detail.summary.payoutAccountNo}</Field>
                  <Field label="상환계좌">{detail.summary.repayAccountNo}</Field>
                  <Field label="제출일">{String(detail.summary.submitDate||"").replace("T"," ")}</Field>
                </div>

                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="font-medium text-gray-800 mb-2">승인 정보</div>
                  <Field label="승인금액">₩ {Number(detail.approvedAmount||0).toLocaleString("ko-KR")}</Field>
                  <Field label="승인기간">{detail.approvedTerm||"-"}개월</Field>
                  <Field label="승인금리">{detail.approvedRate ?? "-"}%</Field>
                  {detail.reviewedAt && <Field label="심사일">{String(detail.reviewedAt).replace("T"," ")}</Field>}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4 mt-4">
                <div className="font-medium text-gray-800 mb-2">신청 폼 스냅샷</div>
                <JsonViewer value={detail.applicationForm} />
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-4">
                {status === "SUBMITTED" && (
                  <div className="rounded-xl border border-gray-100 p-4 bg-yellow-50/40">
                    <div className="font-medium text-gray-800 mb-2">심사 시작</div>
                    <button onClick={onStartReview} className="px-4 py-2 rounded-xl bg-amber-600 text-white">심사 상태로 전환</button>
                  </div>
                )}

                {status === "UNDER_REVIEW" && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* 승인 카드 */}
                    <div className="rounded-xl border border-gray-100 p-4">
                      <div className="font-medium text-gray-800 mb-3">승인 및 집행</div>
                      <div className="space-y-3">
                        <label className="block text-sm">
                          <span className="text-gray-600">승인금액(원)</span>
                          <input type="number" value={approvedAmount}
                                 onChange={(e)=> setApprovedAmount(Number(e.target.value||0))}
                                 className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"/>
                        </label>
                        <label className="block text-sm">
                          <span className="text-gray-600">승인기간(개월)</span>
                          <input type="number" value={approvedTerm}
                                 onChange={(e)=> setApprovedTerm(Number(e.target.value||0))}
                                 className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"/>
                        </label>
                        <label className="block text-sm">
                          <span className="text-gray-600">승인금리(연 %)</span>
                          <input type="number" step="0.01" value={approvedRate}
                                 onChange={(e)=> setApprovedRate(Number(e.target.value||0))}
                                 className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"/>
                        </label>
                        <label className="block text-sm">
                          <span className="text-gray-600">첫 지급일(선택)</span>
                          <input type="datetime-local" value={firstPayoutAt}
                                 onChange={(e)=> setFirstPayoutAt(e.target.value)}
                                 className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"/>
                        </label>

                        {/* ★ 최초 납부일(1~28) 입력 */}
                        <label className="block text-sm">
                          <span className="text-gray-600">최초 납부일(1~28)</span>
                          <input
                            type="number"
                            min={1}
                            max={28}
                            value={payDay ?? ""}
                            placeholder="예: 15"
                            onChange={(e)=> setPayDay(e.target.value === "" ? null : clamp(Number(e.target.value || 0), 1, 28))}
                            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
                          />
                        </label>

                        {/* 경고/안내 배지 */}
                        {warning && (
                          <div
                            className={`text-xs mt-1 rounded-lg px-3 py-2 ${
                              warning.level === "warn"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-slate-50 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {warning.text}
                          </div>
                        )}

                        <button onClick={onApprove}
                                className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2">승인 & 집행</button>
                      </div>
                    </div>

                    {/* 반려 카드 */}
                    <div className="rounded-xl border border-gray-100 p-4">
                      <div className="font-medium text-gray-800 mb-3">반려</div>
                      <label className="block text-sm">
                        <span className="text-gray-600">반려 사유</span>
                        <textarea value={rejectReason} onChange={(e)=> setRejectReason(e.target.value)}
                                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 h-28"/>
                      </label>
                      <button onClick={onReject}
                              className="mt-3 w-full rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2">반려 처리</button>
                    </div>
                  </div>
                )}

                {status === "APPROVED" && (
                  <div className="rounded-2xl border border-gray-100 p-4 bg-emerald-50/40 text-emerald-800">이미 승인되었습니다. (집행 파사드에서 FUNDED로 전환 예정)</div>
                )}
                {status === "FUNDED" && (
                  <div className="rounded-2xl border border-gray-100 p-4 bg-indigo-50/40 text-indigo-800">집행 완료(FUNDED)</div>
                )}
                {status === "REJECTED" && (
                  <div className="rounded-2xl border border-gray-100 p-4 bg-rose-50/40 text-rose-800">반려됨</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}