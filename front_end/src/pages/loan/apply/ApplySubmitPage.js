// src/pages/loan/apply/ApplySubmitPage.js
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import { createLoanApplication } from "../../../api/accounts";

function pick(val, ...keys) {
  for (const k of keys) {
    const v = k.split(".").reduce((o, p) => (o ? o[p] : undefined), val);
    if (v != null) return v;
  }
  return undefined;
}
function pickLaId(resp) {
  return (
    pick(resp, "laId", "la_id", "laNo", "la_no", "id", "applicationId") ??
    pick(resp, "data.laId", "data.la_id", "data.laNo", "data.la_no", "data.id", "data.applicationId")
  );
}
function normProduct(p = {}) {
  return {
    lpdNo: Number(p.lpdNo ?? p.lpd_no ?? 0) || 0,
    code: p.productCode ?? p.code ?? p.lpd_code ?? p.lpdCode ?? p.id ?? "",
  };
}

export default function ApplySubmitPage() {
  const { code } = useParams();
  const nav = useNavigate();

  const [submitting, setSubmitting] = React.useState(false);

  const flow = loadFlow(code);
  React.useEffect(() => {
    if (!flow) {
      nav(`/loan/${encodeURIComponent(code)}/quote`, { replace: true });
    }
  }, [flow, code, nav]);

  if (!flow) return null;

  const onSubmit = async () => {
    try {
      setSubmitting(true);

      const product = flow.product || {};
      const form = flow.form || {};
      const quote = flow.quote || {};

      const me = JSON.parse(localStorage.getItem("me") || "{}");
      const customerNo = Number(me?.cNo ?? me?.customerNo ?? form?.customerNo ?? 0) || undefined;

      const P = normProduct(product); // { lpdNo, code }

      // --- V1: 신규 DTO(CreateApplicationRequestDTO) 스키마 ---
      const desiredAmountV1 = Number( (quote?.approvedAmount ?? form.desiredAmount ?? 0) );
      const desiredTermV1   = Number( (quote?.approvedTerm   ?? form.desiredTerm   ?? 0) );

      const payloadV1 = {
        productCode: P.code || String(P.lpdNo || ""),
         ...(customerNo ? { customerNo } : {}),

        payoutAccountNo: Number(form.payoutAccountNo ?? 0),
        repayAccountNo:  Number(form.repayAccountNo  ?? 0),

        desiredAmount: desiredAmountV1,
        desiredTerm:   desiredTermV1,
        purposeCode:   form.purpose ?? "기타",

        // 한글 정책 유지
        rateType: form.rateType ?? "고정금리",
        rpayType: form.rpayType ?? "원리금균등",

        occupation:     form.occupation ?? "",
        incomeAnnual:   Number(form.incomeAnnual ?? 0),
        collateralValue: (form.collateralValue ?? null) != null ? Number(form.collateralValue) : null,
        jeonseDeposit:   (form.jeonseDeposit   ?? null) != null ? Number(form.jeonseDeposit)   : null,

        // 견적 echo
        quoteApprovedAmount: quote?.approvedAmount != null ? Number(quote.approvedAmount) : null,
        quoteAppliedRate:    quote?.appliedRate    != null ? Number(quote.appliedRate)    : null,
        quoteApprovedTerm:   quote?.approvedTerm   != null ? Number(quote.approvedTerm)   : null,
        quoteMonthlyPayment: quote?.monthlyPayment != null ? Number(quote.monthlyPayment) : null,

        extra: quote?.calcTrace ? { calcTrace: quote.calcTrace } : undefined,
      };

      // --- V2: 레거시 스키마 ---
      const laApplAmountV2 = Number( (quote?.approvedAmount ?? form.desiredAmount ?? 0) );
      const laDesiredTermV2 = Number( (quote?.approvedTerm  ?? form.desiredTerm   ?? 0) );

      const payloadV2 = {
        productCode: code,
        ...(customerNo ? { customerNo } : {}),
        ...(P.lpdNo ? { lpdNo: P.lpdNo } : {}),
        laPayoutANo: Number(form.payoutAccountNo ?? 0),
        laRepayANo:  Number(form.repayAccountNo  ?? 0),
        laApplAmount: laApplAmountV2,
        laDesiredTerm: laDesiredTermV2,
        laPurposeCode: form.purpose ?? "기타",
        laChannel: "WEB",
        laRpayType: form.rpayType ?? "원리금균등",
        laRateType: form.rateType ?? "고정금리",
        laRiskScore: quote?.calcTrace?.riskScore ?? null,
      };

      // 우선 V1 → 실패 시 V2 재시도
      let res, data, laId;
      try {
        res = await createLoanApplication(code, payloadV1);
        data = res?.data ?? res;
        laId = pickLaId(data);
        if (!laId) throw new Error("NO_ID_IN_V1");
      } catch (e1) {
        try {
          res = await createLoanApplication(code, payloadV2);
          data = res?.data ?? res;
          laId = pickLaId(data);
          if (!laId) throw new Error("NO_ID_IN_V2");
        } catch (e2) {
          console.error("Submit failed. V1/V2 both failed.", { e1, e2, lastResponse: data });
          throw new Error(
            (e2?.response?.data?.message ||
              e2?.message ||
              "신청 처리 중 오류(응답에 신청번호가 없습니다).")
          );
        }
      }

      const next = { ...flow, step: 6, laId };
      saveFlow(code, next);
      nav(`/loan/apply/${encodeURIComponent(code)}/complete/${encodeURIComponent(laId)}`);
    } catch (e) {
      console.error(e);
      alert(e.message || "신청 처리 중 오류");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ApplyGuard requireStep={5}>
      <ApplyLayout current={5}>
        <div className="rounded-2xl border border-gray-100 p-5 bg-white space-y-4">
          <h3 className="font-semibold">신청 제출</h3>
          <div className="text-sm text-gray-600">
            제출 후 관리자가 확인/승인 과정을 진행합니다. 상태는 “신청중”으로 표시됩니다.
          </div>
          <button
            className={`px-4 py-2 rounded-xl text-white ${submitting ? "bg-gray-400" : "bg-blue-700 hover:bg-blue-800"}`}
            disabled={submitting}
            onClick={onSubmit}
          >
            {submitting ? "제출중…" : "신청 제출"}
          </button>
        </div>
      </ApplyLayout>
    </ApplyGuard>
  );
}
