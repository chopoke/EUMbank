import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApplyLayout, ApplyGuard } from "./ApplyLayoutGuard";
import { loadFlow, saveFlow } from "./ApplyStorage";
import { createLoanConsents } from "../../../api/accounts";

const TERMS = [
  { termCode: "ELC",        title: "전자금융거래 약관",                    required: true,  version: "v1.2",
    body: `전자금융거래의 이용조건, 장애·사고시 책임, 분쟁 처리, 기록 보존 등에 관한 약관입니다.` },
  { termCode: "E_DOC",      title: "전자문서 교부 및 전자적 방법에 의한 교부 동의", required: true,  version: "v1.0",
    body: `약관 및 각종 안내/통지를 전자적 방법(웹/앱/이메일 등)으로 제공하는 것에 동의합니다.` },
  { termCode: "PI_COLLECT", title: "개인(신용)정보 수집·이용 동의",         required: true,  version: "v1.3",
    body: `수집·이용 목적(대출 심사/계약/관리 등), 수집 항목, 보유·이용 기간, 동의 철회 등에 관한 안내입니다.` },
  { termCode: "PI_THIRD",   title: "개인(신용)정보 제3자 제공 동의",        required: true,  version: "v1.2",
    body: `신용평가사, 제휴 금융사, 보증기관 등 제3자 제공 대상·목적·항목·보유기간에 관한 안내입니다.` },
  { termCode: "CB_INQ",     title: "신용정보 조회(개인신용평가) 동의",       required: true,  version: "v1.1",
    body: `대출 심사 목적으로 신용정보회사(CB)에 대한 신용조회 수행에 동의합니다. (평점 변동 가능성 안내 포함)` },
  { termCode: "LOAN_KEY",   title: "대출거래 기본약관(핵심설명서 포함)",     required: true,  version: "v2.0",
    body: `대출금리, 한도/기간, 상환방법, 연체 이자율, 기한이익 상실, 채권양도 등 핵심사항에 대한 설명서 포함.` },
  { termCode: "LOAN_FEE",   title: "수수료·인지세·중도상환수수료 안내",      required: true,  version: "v1.0",
    body: `인지세 부담 주체, 각종 수수료 부과 기준, 중도상환수수료율/면제 조건 등을 안내합니다.` },
  { termCode: "AUTO_DEBIT", title: "자동이체 출금 동의(상환계좌)",           required: true,  version: "v1.0",
    body: `이자/원리금 상환을 위해 지정 계좌에서 자동이체 출금 처리에 동의합니다.` },
  { termCode: "MORT_LIEN",  title: "담보 설정 및 말소 관련 동의(주담대)",    required: false, version: "v1.0",
    body: `근저당권 설정/말소 절차, 비용 부담, 등기 처리 진행 방식 등에 대한 안내입니다.` },
  { termCode: "JEONSE_GUAR",title: "보증기관 보증약관(전세자금)",            required: false, version: "v1.0",
    body: `보증 가입/해지, 보증료율, 구상권 행사 등 보증기관 관련 약관 안내.` },
  { termCode: "MK_OPTIN",   title: "마케팅 정보 수신 동의(선택)",            required: false, version: "v1.0",
    body: `이메일/문자/앱푸시를 통한 이벤트·혜택 안내 수신에 대한 선택 동의입니다.` },
];
const USE_CONSENT_API = false;
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
          version: t.version,
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
