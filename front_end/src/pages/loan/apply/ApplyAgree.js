import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import { createLoanConsents } from "../../../api/accounts";

const TERMS = [
  { termCode: "ELC",        title: "전자금융거래 약관",                    required: true,  version: "v1.2",
    body: `[목적] 본 약관은 전자적 장치를 통한 금융거래의 이용조건 및 사고 처리 기준을 정합니다.
      [이용시간] 서비스별 고지된 시간 내 이용 가능합니다.
      [본인확인] 고객은 지정된 인증수단으로 본인확인을 수행합니다.
      [거래지시의 처리] 은행은 고객의 거래지시를 접수 순서대로 처리합니다.
      [장애/사고] 전산 장애·통신두절 등 불가피한 사유로 지연/중단될 수 있으며, 은행은 지체 없이 공지합니다.
      [오류정정] 고객은 오류 사실을 통지할 수 있으며, 은행은 지체 없이 조사·정정합니다.
      [비밀번호/인증수단 관리] 고객의 고의·중과실로 유출된 경우 손실이 고객에게 귀속될 수 있습니다.
      [기록 보존] 거래기록은 법령에 따라 보존됩니다.
      [분쟁처리] 분쟁 발생 시 관련 법령 및 분쟁조정절차에 따릅니다.` },
  { termCode: "PI_COLLECT", title: "개인(신용)정보 수집·이용 동의",         required: true,  version: "v1.3",
    body: `[수집·이용 목적] 대출 심사, 계약 체결·이행, 사후관리, 민원 처리.
      [수집 항목] 식별정보(성명, 연락처 등), 신용정보(평점/대출·연체 이력), 재무정보(소득·재직) 등.
      [보유·이용 기간] 목적 달성 시 또는 관련 법령상 의무 보관기간 만료 시까지.
      [동의 거부 권리] 동의 거부 가능하나, 이 경우 서비스 이용/계약 체결이 제한될 수 있습니다.` },
  { termCode: "CREDIT_MASTER",   title: "은행여신거래기본약관",        required: true,  version: "v1.0",
    body: `[적용범위] 본 약관은 은행과 고객의 모든 여신거래에 적용됩니다.
      [계약의 해지] 법령·약관에서 정한 사유 발생 시 해지될 수 있습니다.
      [담보/보증] 담보 또는 보증 제공·유지의무가 있을 수 있습니다.
      [기타] 분쟁 시 관할, 준거법 등은 관련 법령과 약관에 따릅니다.` },
  { termCode: "LOAN_KEY",   title: "대출거래 기본약관(핵심설명서 포함)",     required: true,  version: "v2.0",
    body: `[대출금리] 고정/변동 등 유형 및 산정방식은 개별 약정에 따릅니다.
      [한도·기간] 승인금액 및 기간은 심사 결과에 따라 정해집니다.
      [상환방법] 원리금균등/원금균등/만기일시 등 합의 방식으로 매월 후취 납입합니다.
      [연체이자] 약정 상환일 경과 시 연체이자가 부과될 수 있습니다(상한율/산식 고지).
      [기한의 이익 상실] 연체 등 일정 사유 발생 시 기한의 이익이 상실될 수 있습니다.
      [조기상환] 중도상환수수료가 부과될 수 있으며, 면제 조건이 있을 수 있습니다.
      [채권양도/관리] 은행은 법령 범위 내 채권을 양도·위탁 관리할 수 있습니다.` },
  { termCode: "LOAN_FEE",   title: "수수료·인지세·중도상환수수료 안내",      required: true,  version: "v1.0",
    body: `[인지세] 대출금액 구간별 인지세가 부과되며 은행과 고객이 각 50% 부담합니다.
      [중도상환수수료] 약정 기간 내 조기상환 시 수수료가 부과될 수 있습니다(율/면제기준 고지).
      [기타 수수료] 보증료/보험료/설정비용 등 부대비용은 상품별 안내에 따릅니다.` },
  { termCode: "AUTO_DEBIT", title: "자동이체 출금 동의(상환계좌)",           required: true,  version: "v1.0",
    body: `[출금 계좌] 고객이 지정한 상환계좌에서 이자·원리금을 자동 출금합니다.
      [출금일] 지정 납입일(휴일인 경우 다음 영업일)에 출금되며, 잔액 부족 시 연체로 처리될 수 있습니다.
      [변경·해지] 출금계좌·일자 변경은 사전 통지 및 승인 절차에 따릅니다.` },
  { termCode: "MK_OPTIN",   title: "마케팅 정보 수신 동의(선택)",            required: false, version: "v1.0",
    body: `[목적] 이벤트·혜택·신규 상품 안내(이메일/문자/앱푸시).
      [보유·이용 기간] 철회 시 또는 관련 법령상 기간 만료 시까지.
      [철회] 언제든지 수신 거부 가능(수신 거부 시 즉시 반영).` },
];
const USE_CONSENT_API = true;
export default function ApplyAgree(){
  const { code } = useParams();
  const nav = useNavigate();

  // 항상 최상단에서 훅 호출
  const flow = loadFlow(code);

  React.useEffect(() => {
    saveFlow(code, { step: 1, slug: 'agree' });
  }, [flow, code]);

  // flow가 없어도 훅은 유지, 값 접근만 안전하게
  const product     = flow?.product;
  const customerId  = flow?.form?.customerId || "1";
  const productType = String(product?.type || "").toUpperCase();

  // 타입별 약관 필터링 (useMemo도 훅이므로 최상단 영역)
  const filteredTerms = React.useMemo(() => {
    const isMortgage = productType.includes("MORTGAGE") || productType.includes("담보");
    const isJeonse   = productType.includes("JEONSE")   || productType.includes("전세");
    return TERMS.filter(t => {
      if (t.termCode === "MORT_LIEN")   return isMortgage;
      if (t.termCode === "JEONSE_GUAR") return isJeonse;
      return true;
    });
  }, [productType]);

  // 본문 refs
  const bodyRefs = React.useRef({});

  // 상태 (filteredTerms 기준 초기화)
  const [terms, setTerms] = React.useState([]);
  const [expanded, setExpanded] = React.useState({});
  const [scrolledEnd, setScrolledEnd] = React.useState({});
  const [agree, setAgree] = React.useState({});
  const [all, setAll] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setTerms(filteredTerms);
    setExpanded(Object.fromEntries(filteredTerms.map(t => [t.termCode, false])));
    setAgree(Object.fromEntries(filteredTerms.map(t => [t.termCode, false])));
    setScrolledEnd(Object.fromEntries(filteredTerms.map(t => [t.termCode, false])));
    bodyRefs.current = {};
  }, [filteredTerms]);

  // 본문 토글 시, 스크롤 불필요면 즉시 열람완료
  const toggleOpen = (term) => {
    setExpanded(prev => ({ ...prev, [term.termCode]: !prev[term.termCode] }));
    setTimeout(() => {
      const el = bodyRefs.current[term.termCode];
      if (!el) return;
      const needsScroll = el.scrollHeight > el.clientHeight + 1;
      if (!needsScroll) {
        setScrolledEnd(prev => ({ ...prev, [term.termCode]: true }));
      }
    }, 0);
  };

  // 스크롤 도달 체크 + 전체동의 켜진 상태면 자동 체크
  const onScrollBody = (termCode, e) => {
    const el = e.currentTarget;
    const hitEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    if (hitEnd) {
      setScrolledEnd(prev => (prev[termCode] ? prev : { ...prev, [termCode]: true }));
      if (all) {
        const t = terms.find(x => x.termCode === termCode);
        if (t?.required) setAgree(prev => ({ ...prev, [termCode]: true }));
      }
    }
  };

  // 전체동의: 선택은 즉시, 필수는 열람완료 시만 체크 (미열람은 펼쳐서 유도)
  const onToggleAll = (checked) => {
    setAll(checked);
    setAgree(prev => {
      const next = { ...prev };
      terms.forEach(t => {
        if (!checked) { next[t.termCode] = false; return; }
        if (t.required) {
          if (scrolledEnd[t.termCode]) {
            next[t.termCode] = true;
          } else {
            next[t.termCode] = false;
            setExpanded(e => ({ ...e, [t.termCode]: true }));
            setTimeout(() => {
              const el = bodyRefs.current[t.termCode];
              if (!el) return;
              const needsScroll = el.scrollHeight > el.clientHeight + 1;
              if (!needsScroll) {
                setScrolledEnd(se => ({ ...se, [t.termCode]: true }));
                setAgree(a => ({ ...a, [t.termCode]: true }));
              }
            }, 0);
          }
        } else {
          next[t.termCode] = true;
        }
      });
      return next;
    });
  };

  const requiredOk = terms.filter(t => t.required).every(t => agree[t.termCode]);
  const viewedOk   = terms.filter(t => t.required).every(t => scrolledEnd[t.termCode]);
  const canNext    = requiredOk && viewedOk && !saving;

  const onSaveAndNext = async () => {
    if (!canNext) return;
    try {
      setSaving(true);
      const payload = {
        customerId: String(customerId),
        productCode: String(product?.code || product?.id || code),
        items: terms.map(t => ({
          termCode: t.termCode,
          title: t.title,
          version: t.version,
          body: t.body,           // ★ 전문 포함 (스냅샷)
          required: t.required,
          agreed: !!agree[t.termCode],
          agreedAt: agree[t.termCode] ? new Date().toISOString() : null,
        })),
      };

      if (USE_CONSENT_API) {
        await createLoanConsents(code, payload);
      } else {
        // 백엔드 준비 전: 로컬에만 저장해 두었다가 최종 제출에서 같이 보낼 수도 있음
        saveFlow(code, { ...flow, consentsPayload: payload });
      }

      saveFlow(
        code,
        { ...flow, step: Math.max(Number(flow?.step || 1), 2), consentsSavedAt: new Date().toISOString() }
      );
      nav(`/loan/apply/${encodeURIComponent(code)}/form`);
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "약관 동의 처리 중 오류");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ApplyGuard requireStep={1}>
      <ApplyLayout current={1}>
        {/* flow가 없으면 화면만 비워둠(위 useEffect가 리다이렉트) */}
        {!flow ? null : (
          <>
            {/* 전체 동의 */}
            <label className="mt-1 mb-3 flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={all} onChange={(e)=> onToggleAll(e.target.checked)} />
              전체 동의 (선택 포함)
            </label>

            <div className="divide-y">
              {terms.map((t) => {
                const isOpen   = !!expanded[t.termCode];
                const readDone = !!scrolledEnd[t.termCode];
                const disabled = t.required ? !readDone : false;
                return (
                  <div key={t.termCode} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="text-sm flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!agree[t.termCode]}
                            onChange={(e)=> 
                              setAgree(prev => ({ ...prev, [t.termCode]: e.target.checked }))}
                            disabled={disabled}
                          />
                          <span className="font-medium">
                            {t.title} {t.required ? <span className="text-red-600">(필수)</span> : <span className="text-gray-400">(선택)</span>}
                          </span>
                        </label>
                        <span className="text-xs text-gray-500">버전 {t.version}</span>
                        {t.required && (
                          <span className={`text-[11px] ml-2 px-2 py-0.5 rounded-full ${readDone ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {readDone ? "열람완료" : "끝까지 열람 필요"}
                          </span>
                        )}
                      </div>
                      <button className="text-xs px-2 py-1 rounded-lg border" onClick={() => toggleOpen(t)}>
                        {isOpen ? "내용 닫기" : "내용 보기"}
                      </button>
                    </div>

                    {isOpen && (
                      <div
                        ref={el => (bodyRefs.current[t.termCode] = el)}
                        className="mt-2 p-3 rounded-xl bg-gray-50 border text-sm h-40 overflow-auto leading-relaxed whitespace-pre-wrap"
                        onScroll={(e)=> onScrollBody(t.termCode, e)}
                      >
                        {t.body}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <button
                className={`px-4 py-2 rounded-xl text-white ${canNext ? "bg-blue-700 hover:bg-blue-800" : "bg-gray-400 cursor-not-allowed"}`}
                disabled={!canNext}
                onClick={onSaveAndNext}
              >
                {saving ? "저장중…" : "동의하고 다음"}
              </button>
              {!viewedOk && (
                <div className="text-xs text-red-600 mt-2">필수 약관은 내용 끝까지 열람해야 동의할 수 있어요.</div>
              )}
            </div>
          </>
        )}
      </ApplyLayout>
    </ApplyGuard>
  );
}
