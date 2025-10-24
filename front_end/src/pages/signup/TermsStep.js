import { useEffect, useRef, useState } from "react";

function TermsModal({ open, title, onClose, onReadComplete, children }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const el = boxRef.current;
    if (!el) return;

    const onScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      if (atBottom) onReadComplete?.(); // 바닥 찍으면 읽음 처리
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [open, onReadComplete]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-[90%] max-w-2xl rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-lg">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded hover:bg-gray-100 text-gray-600"
          >
            닫기
          </button>
        </div>
        <div
          ref={boxRef}
          className="text-sm text-gray-700 overflow-y-auto pr-2 space-y-4"
          style={{ maxHeight: "60vh" }}
        >
          {children}
        </div>
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TermsStep({ terms, updateFormData }) {
  const {
    agreeTerms,
    agreePrivacy,
    agreeMarketing,
    hasReadTerms,
    hasReadPrivacy,
  } = {
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
    hasReadTerms: false,
    hasReadPrivacy: false,
    ...terms,
  };

  const [open, setOpen] = useState({ terms: false, privacy: false, marketing: false });

  const setTermsState = (patch) => updateFormData({ ...terms, ...patch });

  const toggle = (key) => (e) => setTermsState({ [key]: e.target.checked });

  const toggleAll = (e) => {
    const checked = e.target.checked;
    setTermsState({
      agreeTerms: checked && hasReadTerms ? true : false,
      agreePrivacy: checked && hasReadPrivacy ? true : false,
      agreeMarketing: checked,
    });
  };

  const allChecked = agreeTerms && agreePrivacy && agreeMarketing;
  const someChecked =
    [agreeTerms, agreePrivacy, agreeMarketing].filter(Boolean).length > 0 && !allChecked;

  const masterRef = useRef(null);
  useEffect(() => {
    if (masterRef.current) masterRef.current.indeterminate = someChecked;
  }, [someChecked]);

  return (
    <div>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">약관 동의</h3>

      <div className="space-y-4">
        {/* 전체 동의 */}
        <label className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 cursor-pointer">
          <input
            ref={masterRef}
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className="mt-1"
            aria-checked={someChecked ? "mixed" : allChecked}
          />
          <div>
            <div className="font-medium">전체 동의</div>
            <div className="text-sm text-gray-500">
              선택 항목 포함 전체 약관에 동의합니다. (필수 약관은 원문을 끝까지 읽어야 체크 가능)
            </div>
          </div>
        </label>

        {/* 필수: 서비스 이용약관 */}
        <label className="flex items-start gap-3 p-3 rounded-lg border">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={toggle("agreeTerms")}
            className="mt-1"
            disabled={!hasReadTerms}
          />
          <div className="flex-1">
            <div className="font-medium">
              서비스 이용약관 동의 <span className="text-blue-600">(필수)</span>
              {hasReadTerms ? (
                <span className="ml-2 text-xs text-green-600">읽음 확인</span>
              ) : (
                <span className="ml-2 text-xs text-gray-400">(원문 읽기 필요)</span>
              )}
            </div>
            <p className="text-xs text-gray-500">서비스 제공을 위한 기본 약관입니다.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((s) => ({ ...s, terms: true }))}
            className="text-sm text-blue-600 hover:underline ml-2 whitespace-nowrap"
          >
            원문 보기
          </button>
        </label>

        {/* 필수: 개인정보처리방침 */}
        <label className="flex items-start gap-3 p-3 rounded-lg border">
          <input
            type="checkbox"
            checked={agreePrivacy}
            onChange={toggle("agreePrivacy")}
            className="mt-1"
            disabled={!hasReadPrivacy}
          />
          <div className="flex-1">
            <div className="font-medium">
              개인정보처리방침 동의 <span className="text-blue-600">(필수)</span>
              {hasReadPrivacy ? (
                <span className="ml-2 text-xs text-green-600">읽음 확인</span>
              ) : (
                <span className="ml-2 text-xs text-gray-400">(원문 읽기 필요)</span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              회원 가입 및 서비스 제공을 위한 개인정보 수집·이용에 동의합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((s) => ({ ...s, privacy: true }))}
            className="text-sm text-blue-600 hover:underline ml-2 whitespace-nowrap"
          >
            원문 보기
          </button>
        </label>

        {/* 선택: 마케팅 수신동의 */}
        <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer">
          <input
            type="checkbox"
            checked={agreeMarketing}
            onChange={toggle("agreeMarketing")}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="font-medium">마케팅 정보 수신 동의 (선택)</div>
            <p className="text-xs text-gray-500">
              이벤트/혜택 등의 정보를 이메일 또는 문자로 받아볼 수 있어요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((s) => ({ ...s, marketing: true }))}
            className="text-sm text-blue-600 hover:underline ml-2 whitespace-nowrap"
          >
            원문 보기
          </button>
        </label>

        <p className="text-xs text-gray-500">
          * 필수 약관은 원문을 끝까지 읽고 체크해야 회원가입이 가능합니다.
        </p>
      </div>

      {/* 모달: 서비스 이용약관 (길게) */}
      <TermsModal
        open={open.terms}
        title="서비스 이용약관"
        onClose={() => setOpen((s) => ({ ...s, terms: false }))}
        onReadComplete={() => setTermsState({ hasReadTerms: true })}
      >
        <h5 className="font-semibold">제1조(목적)</h5>
        <p>
          본 약관은 EUM은행(이하 “회사”)이 제공하는 인터넷·모바일 기반 금융 서비스(이하
          “서비스”)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 서비스
          이용조건과 절차 등 기본적인 사항을 규정함을 목적으로 합니다.
        </p>

        <h5 className="font-semibold">제2조(용어의 정의)</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>“회원”이란 본 약관에 동의하고 회사와 이용계약을 체결하여 서비스를 이용하는 자를 말합니다.</li>
          <li>“계정”이란 서비스를 이용하기 위하여 회원이 등록한 식별 수단을 말합니다.</li>
          <li>“접근매체”란 전자금융거래에 있어 거래지시를 하거나 이용자 및 거래 내용을 확인하는 데 사용되는 수단으로서, 전자식 카드, 비밀번호, 생체정보, 공인·사설 인증서, 기타 회사가 지정한 것을 의미합니다.</li>
          <li>기타 본 약관에서 사용하는 용어의 정의는 관련 법령 및 서비스 안내에서 정하는 바에 따릅니다.</li>
        </ul>

        <h5 className="font-semibold">제3조(약관의 효력 및 변경)</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>본 약관은 서비스를 이용하고자 하는 자가 동의함으로써 효력이 발생합니다.</li>
          <li>회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 시행일자 및 개정 사유를 명시하여 서비스 내 공지사항 또는 기타 합리적 수단으로 사전에 공지합니다.</li>
          <li>회원은 변경된 약관에 동의하지 않는 경우 이용계약을 해지할 수 있으며, 공지일 이후에도 서비스를 계속 이용할 경우 변경 약관에 동의한 것으로 봅니다.</li>
        </ul>

        <h5 className="font-semibold">제4조(이용계약의 체결)</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>이용계약은 회원이 약관에 동의하고 필요한 정보를 입력하여 가입을 신청하면 회사가 승낙함으로써 체결됩니다.</li>
          <li>회사는 타인의 명의를 도용한 경우, 허위 정보를 제공한 경우, 법령 또는 약관을 위반하여 계정이 제한되었던 경우 등에는 승낙을 유보하거나 거절할 수 있습니다.</li>
        </ul>

        <h5 className="font-semibold">제5조(서비스의 내용)</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>계좌 조회, 이체, 예·적금 가입/관리, 대출 신청/관리, 카드 서비스 조회, 환전 및 해외송금 등 회사가 정하는 금융 기능</li>
          <li>고객센터, 공지사항, 알림/보안설정, 개인화 추천 등의 부가 서비스</li>
          <li>법령 또는 회사 정책에 따라 서비스의 전부 또는 일부가 변경·중단될 수 있습니다.</li>
        </ul>

        <h5 className="font-semibold">제6조(전자금융거래 기본 원칙)</h5>
        <p>
          전자금융거래법, 전자서명법 등 관련 법령을 준수하며, 회원은 접근매체·비밀번호 등의
          관리 책임을 부담합니다. 회사는 안전한 거래를 위한 기술적·관리적 보호조치를
          취합니다.
        </p>

        <h5 className="font-semibold">제7조(회원의 의무)</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>회원은 법령·약관·공지사항 및 서비스 이용안내를 준수해야 합니다.</li>
          <li>접근매체 분실·도난·유출이 의심되는 경우 즉시 회사에 통지해야 하며, 지연 통지로 인한 손해는 회원에게 귀속될 수 있습니다.</li>
          <li>서비스를 부정한 목적으로 이용하거나 제3자에게 계정을 양도·대여할 수 없습니다.</li>
        </ul>

        <h5 className="font-semibold">제8조(회사의 의무)</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>회사는 안정적인 서비스 제공을 위해 최선을 다하며, 장애가 발생한 경우 지체 없이 복구합니다.</li>
          <li>회사는 회원의 개인정보를 관련 법령 및 개인정보처리방침에 따라 안전하게 보호합니다.</li>
        </ul>

        <h5 className="font-semibold">제9조(수수료 및 이율)</h5>
        <p>
          서비스 이용과 관련된 수수료, 이율 등은 개별 상품 안내 및 고지한 기준에 따르며, 회사는
          시장 상황 및 정책 변경에 따라 이를 조정할 수 있습니다.
        </p>

        <h5 className="font-semibold">제10조(거래지시의 철회)</h5>
        <p>
          회원은 전자금융거래법 등 관련 법령이 허용하는 범위에서 거래지시를 철회할 수 있으며,
          철회 가능 시점·방법은 서비스 화면에 안내합니다.
        </p>

        <h5 className="font-semibold">제11조(오류의 정정)</h5>
        <p>
          회원은 거래 내역에 오류가 있는 경우 즉시 정정을 요구할 수 있으며, 회사는 정당한
          사유가 없는 한 지체 없이 조사·정정합니다.
        </p>

        <h5 className="font-semibold">제12조(책임과 면책)</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>불가항력(천재지변, 전쟁, 테러, 전국적 네트워크 장애 등)으로 인한 서비스 중단에 대해서는 회사가 책임을 지지 않습니다.</li>
          <li>회원의 고의·과실로 인한 손해(접근매체 관리 소홀, 악성코드 설치, 비밀번호 유출 등)는 회원 책임입니다.</li>
        </ul>

        <h5 className="font-semibold">제13조(계약 해지 및 이용 제한)</h5>
        <p>
          회원은 언제든지 서비스 내 절차에 따라 이용계약을 해지할 수 있으며, 회사는 법령 위반,
          약관 위반, 부정 사용 등 합리적 사유가 있는 경우 사전 통지 후 이용을 제한할 수
          있습니다.
        </p>

        <h5 className="font-semibold">제14조(분쟁 해결)</h5>
        <p>
          회사는 분쟁 조정을 위한 고객센터를 운영하며, 전자금융거래 분쟁은 관련 법령과 금융감독원
          분쟁조정 절차에 따를 수 있습니다.
        </p>

        <h5 className="font-semibold">제15조(준거법 및 관할)</h5>
        <p>본 약관은 대한민국 법령에 따르며, 분쟁의 관할은 민사소송법 등 관련 법령에 따릅니다.</p>

        <hr className="my-2" />
        <p className="text-xs text-gray-500">
          시행일: 2025-10-10 / 상호: EUM은행 / 주소: (예) 서울특별시 … / 고객센터: 0000-0000
        </p>
      </TermsModal>

      {/* 모달: 개인정보처리방침 (길게) */}
      <TermsModal
        open={open.privacy}
        title="개인정보처리방침"
        onClose={() => setOpen((s) => ({ ...s, privacy: false }))}
        onReadComplete={() => setTermsState({ hasReadPrivacy: true })}
      >
        <h5 className="font-semibold">1. 총칙</h5>
        <p>
          EUM은행(이하 “회사”)은 이용자의 개인정보를 중요시하며, 개인정보보호법, 정보통신망법,
          전자금융거래법 등 관련 법령을 준수합니다. 본 방침은 회사가 제공하는 모든 서비스에
          적용됩니다.
        </p>

        <h5 className="font-semibold">2. 처리하는 개인정보의 항목</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>회원가입: 아이디, 비밀번호, 이름, 휴대전화번호, 이메일</li>
          <li>본인확인(선택/상품에 따라): 생년월일, 성별, 내외국인 여부, CI/DI 등</li>
          <li>금융서비스 이용: 계좌번호, 거래내역, 상품 가입·해지 내역, 카드/대출 정보(해당 시)</li>
          <li>접속기록: IP, 단말기 정보, 브라우저 정보, 쿠키, 접속 일시</li>
          <li>마케팅(선택): 수신동의 여부, 이벤트 참여 이력</li>
        </ul>

        <h5 className="font-semibold">3. 개인정보의 수집 방법</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>회원이 서비스 화면에 직접 입력</li>
          <li>전자적 전송(본인확인기관, 신용정보회사 등 제휴/위탁사)</li>
          <li>서비스 이용 과정에서 자동 생성·수집(접속기록, 쿠키 등)</li>
        </ul>

        <h5 className="font-semibold">4. 개인정보의 이용 목적</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>회원 식별 및 가입의사 확인, 부정가입 방지</li>
          <li>계정/보안 관리, 전자금융거래 이행 및 고객 상담</li>
          <li>금융상품 안내·가입·관리, 요금 정산 및 민원 처리</li>
          <li>서비스 품질 개선, 통계·분석 및 신규 서비스 개발</li>
          <li>이벤트/혜택 안내 등 마케팅 활용(선택 동의 시에 한함)</li>
        </ul>

        <h5 className="font-semibold">5. 개인정보의 보유 및 이용 기간</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>회원 탈퇴 후 지체 없이 파기. 다만, 법령에 따라 일정 기간 보관이 필요한 경우 해당 법령에서 정한 기간 동안 보관</li>
          <li>전자금융거래 기록: 전자금융거래법에 따른 보존 기간</li>
          <li>민원·분쟁 대응을 위한 최소한의 정보: 분쟁 해결 시까지</li>
        </ul>

        <h5 className="font-semibold">6. 개인정보의 제3자 제공</h5>
        <p>
          회사는 이용자의 동의가 있거나 법령에 근거가 있는 경우에 한하여 최소한의 범위에서
          제3자에게 제공합니다. 제공 대상·목적·항목·보유 기간은 제공 시점에 별도 고지합니다.
        </p>

        <h5 className="font-semibold">7. 개인정보 처리 위탁</h5>
        <p>
          회사는 서비스 제공을 위해 일부 업무를 외부에 위탁할 수 있으며, 위탁 시 수탁자, 업무
          내용, 보유 및 이용 기간 등을 고지하고, 수탁자를 관리·감독합니다.
        </p>

        <h5 className="font-semibold">8. 해외 이전</h5>
        <p>
          원칙적으로 개인정보를 국외로 이전하지 않습니다. 다만, 클라우드 사용 등 불가피한 경우
          관련 법령에 따른 고지·동의 절차를 이행합니다.
        </p>

        <h5 className="font-semibold">9. 이용자의 권리</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>이용자는 언제든지 자신의 개인정보를 열람·정정·삭제·처리정지 요구할 수 있습니다.</li>
          <li>법정대리인은 만 14세 미만 아동의 권리를 행사할 수 있습니다.</li>
          <li>권리 행사는 고객센터 또는 서비스 내 전용 메뉴를 통해 요청할 수 있습니다.</li>
        </ul>

        <h5 className="font-semibold">10. 쿠키의 사용</h5>
        <p>
          회사는 맞춤형 서비스 제공을 위해 쿠키를 사용할 수 있습니다. 이용자는 브라우저 설정을
          통해 쿠키 저장을 거부하거나 삭제할 수 있으나, 일부 기능 이용에 제한이 있을 수 있습니다.
        </p>

        <h5 className="font-semibold">11. 안전성 확보 조치</h5>
        <ul className="list-disc pl-5 space-y-1">
          <li>관리적 조치: 내부관리계획 수립·시행, 정기 교육</li>
          <li>기술적 조치: 접근통제, 암호화, 보안 프로그램 설치 및 갱신, 로그 모니터링</li>
          <li>물리적 조치: 전산실·자료보관실 접근통제</li>
        </ul>

        <h5 className="font-semibold">12. 만 14세 미만 아동의 개인정보</h5>
        <p>
          회사는 원칙적으로 만 14세 미만 아동의 회원가입을 제한합니다. 부득이하게 처리하는 경우
          법정대리인의 동의를 얻고 관련 법령을 준수합니다.
        </p>

        <h5 className="font-semibold">13. 개인정보 보호책임자</h5>
        <p>
          성명: 홍길동 / 부서: 정보보호실 / 연락처: 0000-0000 / 이메일: privacy@eumbank.co.kr
          (예시)
        </p>

        <h5 className="font-semibold">14. 고지의 의무</h5>
        <p>
          본 방침은 법령·정책 또는 보안 기술의 변경에 따라 내용이 변경될 수 있으며, 변경 시
          서비스 공지사항 등을 통해 고지합니다.
        </p>

        <hr className="my-2" />
        <p className="text-xs text-gray-500">
          시행일: 2025-10-10 / 상호: EUM은행 / 주소: (예) 서울특별시 … / 고객센터: 0000-0000
        </p>
      </TermsModal>

      {/* 모달: 마케팅 수신 안내(선택) - 길게 */}
      <TermsModal
        open={open.marketing}
        title="마케팅 정보 수신 동의 안내(선택)"
        onClose={() => setOpen((s) => ({ ...s, marketing: false }))}
      >
        <h5 className="font-semibold">1. 수집·이용 목적</h5>
        <p>
          신상품·이벤트·제휴 혜택·맞춤형 콘텐츠·금융 정보 등 광고성 정보 제공 및 고객 만족도
          조사, 서비스 품질 개선을 위한 분석에 활용합니다.
        </p>

        <h5 className="font-semibold">2. 수집 항목</h5>
        <p>연락처(이메일, 휴대전화번호), 이름, 서비스 이용 이력, 관심사 추정 정보 등</p>

        <h5 className="font-semibold">3. 보유·이용 기간</h5>
        <p>
          동의 철회 또는 회원 탈퇴 시까지. 단, 관련 법령에 별도 보관 의무가 있는 경우 해당 기간
          동안 보관합니다.
        </p>

        <h5 className="font-semibold">4. 수신 경로</h5>
        <p>이메일, 문자(SMS/MMS), 앱 푸시 알림, 인앱 메시지 등</p>

        <h5 className="font-semibold">5. 동의 철회</h5>
        <p>
          서비스 내 알림 설정 또는 고객센터를 통해 언제든지 수신 동의를 철회할 수 있으며, 철회 후
          즉시 광고성 정보 발송이 중단됩니다.
        </p>

        <h5 className="font-semibold">6. 유의사항</h5>
        <p>
          마케팅 수신 동의를 하지 않아도 필수 서비스 이용에는 제한이 없으며, 다만 이벤트·혜택
          정보 수신이 어려울 수 있습니다.
        </p>
      </TermsModal>
    </div>
  );
}
