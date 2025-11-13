// src/pages/loan/apply/ApplySubmitPage.js
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import { createLoanApplication } from "../../../api/accounts";
import Modal from "../../account/component/pinConponent/Modal";
import { PinPadModal } from "../../account/component/pinConponent/PinPadModal";
import api from "../../../api/axios";


function normProduct(p = {}) {
  return {
    lpdNo: Number(p.lpdNo ?? p.lpd_no ?? 0) || 0,   // 혹시 몰라서 폴백방어
    code: p.productCode ?? p.code ?? p.lpd_code ?? p.lpdCode ?? p.id ?? "",
  };
}

export default function ApplySubmitPage() {
  const { code } = useParams();
  const nav = useNavigate();
  const [pinOpen, setPinOpen] = React.useState(false);
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

      // 약관 단계에서 생성/저장해둔 batchKey 가져오기
      const storageKey = `loan:termsBatchKey:${code}`;
      const termsBatchKey = localStorage.getItem(storageKey) || null;

      // 컨텍스트 로드
      const product = flow.product || {};
      const form = flow.form || {};
      const quote = flow.quote || {};
      const rawConsents = (flow.consents || form.consents || []).filter(Boolean);

      // 동의 항목 정규화
      const consents = rawConsents.map((c) => ({
        code: String(c.code || c.id || "").toUpperCase(),
        agreed: !!c.agreed,
        agreedAt: c.agreedAt || new Date().toISOString(),
      }));

      //  고객번호 추출
      const me = JSON.parse(localStorage.getItem("me") || "{}");
      const customerNo =
        Number(me?.cNo ?? me?.customerNo ?? form?.customerNo ?? 0) || undefined;

      // 상품 정규화
      const P = normProduct(product);       // lpdNo, code

      // DTo에 맞게 페이로드 구성
      const desiredAmount = Number(
        quote?.approvedAmount ?? form.desiredAmount ?? 0
      );
      const desiredTerm = Number(
        quote?.approvedTerm ?? form.desiredTerm ?? 0
      );

      const payload = {
        productCode: P.code || String(P.lpdNo || ""),
        ...(customerNo ? { customerNo } : {}),

        payoutAccountNo: Number(form.payoutAccountNo ?? 0),
        repayAccountNo: Number(form.repayAccountNo ?? 0),

        desiredAmount,
        desiredTerm,
        purposeCode: form.purpose ?? "기타",

        // 한글 저장 정책
        rateType: form.rateType ?? "고정금리",
        rpayType: form.rpayType ?? "원리금균등",

        occupation: form.occupation ?? "",
        incomeAnnual: Number(form.incomeAnnual ?? 0),
        collateralValue:
          form.collateralValue != null ? Number(form.collateralValue) : null,
        jeonseDeposit:
          form.jeonseDeposit != null ? Number(form.jeonseDeposit) : null,

        // 견적 echo
        quoteApprovedAmount:
          quote?.approvedAmount != null ? Number(quote.approvedAmount) : null,
        quoteAppliedRate:
          quote?.appliedRate != null ? Number(quote.appliedRate) : null,
        quoteApprovedTerm:
          quote?.approvedTerm != null ? Number(quote.approvedTerm) : null,
        quoteMonthlyPayment:
          quote?.monthlyPayment != null ? Number(quote.monthlyPayment) : null,

        consents,
        extra: quote?.calcTrace ? { calcTrace: quote.calcTrace } : undefined,

        // 약관신청 매핑용 그룹용 키!!!
        termsBatchKey,
      };

      // 신청 생성
      const res = await createLoanApplication(code, payload);
      const data = res?.data ?? res;
      const laId = data?.laId || data?.data?.laId;
      if (!laId) throw new Error("신청 처리는 되었으나 신청번호(laId)가 응답에 없습니다.");

      //로컬 플로우/라우팅 처리
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
            className={`px-4 py-2 rounded-xl text-white ${
              submitting ? "bg-gray-400" : "bg-blue-700 hover:bg-blue-800"
            }`}
            disabled={submitting}
            onClick={() => setPinOpen(true)}
          >
            {submitting ? "제출중…" : "신청 제출"}
          </button>
        </div>

        <Modal
          open={pinOpen}
          close={() => !submitting && setPinOpen(false)}
          header="거래 PIN 6자리 입력"
        >
          <PinPadModal
            length={6}
            onSubmit={async (val) => {
              try {
                // 1) 서버에 PIN 검증 요청
                const { data } = await api.post(
                  `/api/loan/${encodeURIComponent(code)}/pin-verify`,
                  { pin: val }
                );

                if (!data?.ok) {
                  alert("등록된 PIN과 일치하지 않습니다.");
                  return; // 모달 유지 -> 재입력
                }

                // 2) 일치 시 실제 신청 진행
                setPinOpen(false);
                await onSubmit();
              } catch (e) {
                console.error(e);
                alert("PIN 확인 중 오류가 발생했습니다.");
              }
            }}
            onCancel={() => !submitting && setPinOpen(false)}
          />
        </Modal>
      </ApplyLayout>
    </ApplyGuard>
  );
}
