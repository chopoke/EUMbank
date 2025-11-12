import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import { createLoanConsents } from "../../../api/accounts";
import { FileText, CheckCircle2, AlertCircle, X, ScrollText } from "lucide-react";

const TERMS = [
  {
    termCode: "ELC",
    title: "전자금융거래 약관",
    required: true,
    version: "v1.2",
    body: `[목적] 본 약관은 전자적 장치를 통한 금융거래의 이용조건 및 사고 처리 기준을 정합니다.
[이용시간] 서비스별 고지된 시간 내 이용 가능합니다.
[본인확인] 고객은 지정된 인증수단으로 본인확인을 수행합니다.
[거래지시의 처리] 은행은 고객의 거래지시를 접수 순서대로 처리합니다.
[장애/사고] 전산 장애·통신두절 등 불가피한 사유로 지연/중단될 수 있으며, 은행은 지체 없이 공지합니다.
[오류정정] 고객은 오류 사실을 통지할 수 있으며, 은행은 지체 없이 조사·정정합니다.
[비밀번호/인증수단 관리] 고객의 고의·중과실로 유출된 경우 손실이 고객에게 귀속될 수 있습니다.
[기록 보존] 거래기록은 법령에 따라 보존됩니다.
[분쟁처리] 분쟁 발생 시 관련 법령 및 분쟁조정절차에 따릅니다.`,
  },
  {
    termCode: "PI_COLLECT",
    title: "개인(신용)정보 수집·이용 동의",
    required: true,
    version: "v1.3",
    body: `[수집·이용 목적] 대출 심사, 계약 체결·이행, 사후관리, 민원 처리.
[수집 항목] 식별정보(성명, 연락처 등), 신용정보(평점/대출·연체 이력), 재무정보(소득·재직) 등.
[보유·이용 기간] 목적 달성 시 또는 관련 법령상 의무 보관기간 만료 시까지.
[동의 거부 권리] 동의 거부 가능하나, 이 경우 서비스 이용/계약 체결이 제한될 수 있습니다.`,
  },
  {
    termCode: "CREDIT_MASTER",
    title: "은행여신거래기본약관",
    required: true,
    version: "v1.0",
    body: `[적용범위] 본 약관은 은행과 고객의 모든 여신거래에 적용됩니다.
[계약의 해지] 법령·약관에서 정한 사유 발생 시 해지될 수 있습니다.
[담보/보증] 담보 또는 보증 제공·유지의무가 있을 수 있습니다.
[기타] 분쟁 시 관할, 준거법 등은 관련 법령과 약관에 따릅니다.`,
  },
  {
    termCode: "LOAN_KEY",
    title: "대출거래 기본약관(핵심설명서 포함)",
    required: true,
    version: "v2.0",
    body: `[대출금리] 고정/변동 등 유형 및 산정방식은 개별 약정에 따릅니다.
[한도·기간] 승인금액 및 기간은 심사 결과에 따라 정해집니다.
[상환방법] 원리금균등/원금균등/만기일시 등 합의 방식으로 매월 후취 납입합니다.
[연체이자] 약정 상환일 경과 시 연체이자가 부과될 수 있습니다(상한율/산식 고지).
[기한의 이익 상실] 연체 등 일정 사유 발생 시 기한의 이익이 상실될 수 있습니다.
[조기상환] 중도상환수수료가 부과될 수 있으며, 면제 조건이 있을 수 있습니다.
[채권양도/관리] 은행은 법령 범위 내 채권을 양도·위탁 관리할 수 있습니다.`,
  },
  {
    termCode: "LOAN_FEE",
    title: "수수료·인지세·중도상환수수료 안내",
    required: true,
    version: "v1.0",
    body: `[인지세] 대출금액 구간별 인지세가 부과되며 은행과 고객이 각 50% 부담합니다.
[중도상환수수료] 약정 기간 내 조기상환 시 수수료가 부과될 수 있습니다(율/면제기준 고지).
[기타 수수료] 보증료/보험료/설정비용 등 부대비용은 상품별 안내에 따릅니다.`,
  },
  {
    termCode: "AUTO_DEBIT",
    title: "자동이체 출금 동의(상환계좌)",
    required: true,
    version: "v1.0",
    body: `[출금 계좌] 고객이 지정한 상환계좌에서 이자·원리금을 자동 출금합니다.
[출금일] 지정 납입일(휴일인 경우 다음 영업일)에 출금되며, 잔액 부족 시 연체로 처리될 수 있습니다.
[변경·해지] 출금계좌·일자 변경은 사전 통지 및 승인 절차에 따릅니다.`,
  },
  {
    termCode: "MK_OPTIN",
    title: "마케팅 정보 수신 동의(선택)",
    required: false,
    version: "v1.0",
    body: `[목적] 이벤트·혜택·신규 상품 안내(이메일/문자/앱푸시).
[보유·이용 기간] 철회 시 또는 관련 법령상 기간 만료 시까지.
[철회] 언제든지 수신 거부 가능(수신 거부 시 즉시 반영).`,
  },
];

const USE_CONSENT_API = true;

export default function ApplyAgree() {
  const { code } = useParams();
  const nav = useNavigate();

  const flow = loadFlow(code);

  React.useEffect(() => {
    if (flow) {
      saveFlow(code, { ...flow, step: 1, slug: "agree" });
    }
  }, [code]); // flow는 이미 load된 값이라 의존성에서 뺌

  const product = flow?.product;
  const customerId = flow?.form?.customerId || "1";
  const productType = String(product?.type || "").toUpperCase();

  // 타입별 약관 필터링
  const terms = React.useMemo(() => {
    const isMortgage =
      productType.includes("MORTGAGE") || productType.includes("담보");
    const isJeonse =
      productType.includes("JEONSE") || productType.includes("전세");
    return TERMS.filter((t) => {
      if (t.termCode === "MORT_LIEN") return isMortgage;
      if (t.termCode === "JEONSE_GUAR") return isJeonse;
      return true;
    });
  }, [productType]);

  const [agree, setAgree] = React.useState({});
  const [scrolledEnd, setScrolledEnd] = React.useState({});
  const [all, setAll] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [activeModal, setActiveModal] = React.useState(null); // termCode | null

  const modalBodyRef = React.useRef(null);

  // terms 변경 시 초기화
  React.useEffect(() => {
    const initAgree = {};
    const initScroll = {};
    terms.forEach((t) => {
      initAgree[t.termCode] = false;
      initScroll[t.termCode] = false;
    });
    setAgree(initAgree);
    setScrolledEnd(initScroll);
    setAll(false);
    setActiveModal(null);
  }, [terms]);

  // 전체동의 여부 계산
  const recomputeAll = React.useCallback(
    (state) => {
      if (!terms.length) return false;
      return terms.every((t) => !!state[t.termCode]);
    },
    [terms]
  );

  // 필수 약관 읽음 처리 + 자동 동의
  const markRead = React.useCallback(
    (termCode) => {
      setScrolledEnd((prev) => {
        if (prev[termCode]) return prev;
        return { ...prev, [termCode]: true };
      });

      const term = terms.find((t) => t.termCode === termCode);
      if (term?.required) {
        setAgree((prev) => {
          if (prev[termCode]) return prev;
          const next = { ...prev, [termCode]: true };
          setAll(recomputeAll(next));
          return next;
        });
      }
    },
    [terms, recomputeAll]
  );

  const requiredOk = terms.filter((t) => t.required).every((t) => agree[t.termCode]);
  const viewedOk = terms.filter((t) => t.required).every((t) => scrolledEnd[t.termCode]);
  const canNext = requiredOk && viewedOk && !saving;

  // ✅ 전체 동의 토글 (버그 수정: next 상태를 먼저 계산)
  const handleToggleAll = (checked) => {
    if (!checked) {
      const next = {};
      terms.forEach((t) => (next[t.termCode] = false));
      setAgree(next);
      setAll(false);
      setActiveModal(null);
      return;
    }

    const next = {};
    let firstUnreadRequired = null;

    terms.forEach((t) => {
      if (!t.required) {
        // 선택 약관은 즉시 동의
        next[t.termCode] = true;
      } else {
        // 필수 약관: 이미 열람했으면 동의, 아니면 미동의 + 모달 후보
        if (scrolledEnd[t.termCode]) {
          next[t.termCode] = true;
        } else {
          next[t.termCode] = false;
          if (!firstUnreadRequired) {
            firstUnreadRequired = t.termCode;
          }
        }
      }
    });

    setAgree(next);
    setAll(recomputeAll(next));

    // 아직 안 읽은 필수 약관이 있으면 첫 번째 약관 모달 자동 오픈
    if (firstUnreadRequired) {
      setActiveModal(firstUnreadRequired);
    }
  };

  // 개별 체크 (필수는 열람 완료 전엔 불가)
  const toggleSingleAgree = (t, checked) => {
    if (t.required && !scrolledEnd[t.termCode]) return;
    setAgree((prev) => {
      const next = { ...prev, [t.termCode]: checked };
      setAll(recomputeAll(next));
      return next;
    });
  };

  // 모달 열기/닫기
  const openModal = (termCode) => setActiveModal(termCode);
  const closeModal = () => setActiveModal(null);

  // 모달 스크롤 시 끝까지 가면 읽음 처리
  const handleModalScroll = (termCode, e) => {
    const el = e.currentTarget;
    const hitEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    if (hitEnd) markRead(termCode);
  };

  // 모달 열릴 때 내용 짧으면 스크롤 없이 즉시 읽음 처리
  const ActiveTerm = activeModal ? terms.find((t) => t.termCode === activeModal) : null;
  React.useEffect(() => {
    if (!ActiveTerm || !activeModal) return;
    const timer = setTimeout(() => {
      const el = modalBodyRef.current;
      if (!el) return;
      const needsScroll = el.scrollHeight > el.clientHeight + 1;
      if (!needsScroll) {
        markRead(ActiveTerm.termCode);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [ActiveTerm, activeModal, markRead]);

  const onSaveAndNext = async () => {
    if (!canNext) return;
    try {
      setSaving(true);

      const payload = {
        customerId: String(customerId),
        productCode: String(product?.code || product?.id || code),
        items: terms.map((t) => ({
          termCode: t.termCode,
          title: t.title,
          version: t.version,
          body: t.body,
          required: t.required,
          agreed: !!agree[t.termCode],
          agreedAt: agree[t.termCode] ? new Date().toISOString() : null,
        })),
      };

      if (USE_CONSENT_API) {
        await createLoanConsents(code, payload);
      } else {
        saveFlow(code, { ...flow, consentsPayload: payload });
      }

      saveFlow(code, {
        ...flow,
        step: Math.max(Number(flow?.step || 1), 2),
        consentsSavedAt: new Date().toISOString(),
      });

      nav(`/loan/apply/${encodeURIComponent(code)}/form`);
    } catch (e) {
      alert(
        e?.response?.data?.message ||
          e.message ||
          "약관 동의 처리 중 오류가 발생했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!flow) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-transparent">
          <ApplyGuard requireStep={1}>
            <ApplyLayout current={1}>
              <div className="p-8 text-sm text-gray-500">
                신청 정보가 없습니다.
              </div>
            </ApplyLayout>
          </ApplyGuard>
        </div>
      </div>
    );
  }

  const productName =
    product?.name || product?.loanName || product?.loan_name || "대출 상품";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-transparent">
        <ApplyGuard requireStep={1}>
          <ApplyLayout current={1}>
            {/* 상단 요약 */}
            <div className="mb-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ScrollText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-blue-600 font-semibold">
                  약관 동의 단계
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {productName} 이용을 위한 필수 약관을 확인해 주세요.
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  각 약관의 전문을 확인하신 뒤 동의해 주세요.
                  필수 약관은 전문을 끝까지 확인하면 자동 동의됩니다.
                </p>
              </div>
            </div>

            {/* 전체 동의 */}
            <label className="mt-1 mb-4 flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
              <input
                type="checkbox"
                checked={all}
                onChange={(e) => handleToggleAll(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                전체 동의 (선택 포함)
              </span>
              <span className="ml-2 text-[10px] text-gray-500">
                필수 약관은 열람 후에만 동의 처리됩니다.
              </span>
            </label>

            {/* 약관 리스트 */}
            <div className="divide-y border rounded-2xl bg-white">
              {terms.map((t) => {
                const isRequired = t.required;
                const isAgreed = !!agree[t.termCode];
                const readDone = !!scrolledEnd[t.termCode];
                const disabled = isRequired && !readDone;

                return (
                  <div key={t.termCode} className="py-3 px-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-blue-600"
                          checked={isAgreed}
                          disabled={disabled}
                          onChange={(e) => toggleSingleAgree(t, e.target.checked)}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {t.title}
                            </span>
                            {isRequired ? (
                              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-red-50 text-red-600">
                                필수
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-500">
                                선택
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              버전 {t.version}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {isRequired && (
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                                  readDone
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-gray-50 text-gray-500"
                                }`}
                              >
                                <ScrollText className="w-3 h-3" />
                                {readDone ? "열람 완료" : "내용을 끝까지 읽어주세요"}
                              </span>
                            )}
                            {isAgreed && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-blue-600">
                                <CheckCircle2 className="w-3 h-3" />
                                동의 완료
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openModal(t.termCode)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                      >
                        <FileText className="w-3 h-3" />
                        내용 보기
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 안내 / 다음 버튼 */}
            <div className="mt-5 flex flex-col gap-2">
              {!viewedOk && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  모든 필수 약관을 열람해야 “동의하고 다음” 버튼이 활성화됩니다.
                </div>
              )}
              <button
                className={`mt-1 px-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 ${
                  canNext ? "bg-gray-800 hover:bg-black" : "bg-gray-400 cursor-not-allowed"
                }`}
                disabled={!canNext}
                onClick={onSaveAndNext}
              >
                {saving ? "저장 중…" : "동의하고 다음 단계로"}
                {canNext && !saving && <CheckCircle2 className="w-4 h-4" />}
              </button>
            </div>

            {/* 약관 내용 모달 */}
            {ActiveTerm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={closeModal}
                />
                <div className="relative w-[min(720px,92%)] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col">
                  <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <div className="text-sm font-semibold text-gray-900">
                          {ActiveTerm.title}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          버전 {ActiveTerm.version} · 내용을 끝까지 읽으시면 자동 동의 처리됩니다.
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="w-7 h-7 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div
                    ref={modalBodyRef}
                    className="px-4 py-3 text-sm text-gray-800 leading-relaxed overflow-auto whitespace-pre-wrap"
                    style={{ maxHeight: "calc(80vh - 110px)" }}
                    onScroll={(e) => handleModalScroll(ActiveTerm.termCode, e)}
                  >
                    {ActiveTerm.body}
                  </div>

                  <div className="px-4 py-2 border-t flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-2 text-[11px] text-gray-600">
                      {scrolledEnd[ActiveTerm.termCode] ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>열람 완료되었습니다.</span>
                          {ActiveTerm.required && (
                            <span className="text-emerald-700 font-semibold">
                              (필수 약관 자동 동의 적용)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <ScrollText className="w-4 h-4 text-blue-500" />
                          <span>아래까지 스크롤하면 열람 완료로 처리됩니다.</span>
                        </>
                      )}
                    </div>
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs bg-blue-600 text-white hover:bg-blue-700"
                      onClick={closeModal}
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </ApplyLayout>
        </ApplyGuard>
      </div>
    </div>
  );
}
