import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Frame, Header, Stepper, AsideHelp, Checkbox, LabelWithBadge, Divider } from './commom/ui';
import { useAccountOpenStore } from './state/accountOpenStore';

// 약관 모달 컴포넌트
function TermsModal({ isOpen, onClose, title, content, onComplete, isCompleted }) {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

    const handleScroll = (e) => {
        const element = e.target;
        const isAtBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 5;
        if (isAtBottom) {
            setHasScrolledToBottom(true);
        }
    };

    const handleConfirm = () => {
        onComplete();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                </div>
                <div 
                    className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-700"
                    onScroll={handleScroll}
                >
                    {content}
                </div>
                <div className="px-6 py-4 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        {hasScrolledToBottom || isCompleted ? '✓ 약관을 모두 확인했습니다' : '약관을 끝까지 읽어주세요'}
                    </span>
                    <button
                        onClick={handleConfirm}
                        disabled={!hasScrolledToBottom && !isCompleted}
                        className={`px-6 py-2 rounded-lg font-semibold ${
                            hasScrolledToBottom || isCompleted
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Step1Consent() {
    const navigate = useNavigate();
    const setStep1 = useAccountOpenStore(s => s.setStep1);

    useAccountOpenStore.subscribe((state) => {
        console.log('들어가는 값 확인 : ', state);
    });

    const [agreements, setAgreements] = useState({ all: false, eContract: false, privacy: false, marketing: false });
    const [scrollCompleted, setScrollCompleted] = useState({ eContract: false, privacy: false, marketing: false });
    const [modalState, setModalState] = useState({ isOpen: false, type: null });

    // 약관 내용
    const termsContent = {
        eContract: (
            <div className="space-y-4">
                <h4 className="font-semibold text-base">전자금융거래 기본약관</h4>
                <div className="space-y-3">
                    <p className="font-medium">제1조 (목적)</p>
                    <p>이 약관은 ○○은행(이하 "은행"이라 합니다)이 제공하는 전자금융거래 서비스의 이용과 관련하여 은행과 이용자 사이의 권리, 의무 및 책임사항, 기타 필요한 사항을 정함을 목적으로 합니다.</p>
                    
                    <p className="font-medium mt-4">제2조 (용어의 정의)</p>
                    <p>이 약관에서 정하는 용어의 정의는 다음과 같습니다.</p>
                    <p>1. "전자금융거래"라 함은 은행이 전자적 장치를 통하여 제공하는 금융상품 및 서비스를 이용자가 전자적 장치를 통하여 비대면·자동화된 방식으로 직접 이용하는 거래를 말합니다.</p>
                    <p>2. "이용자"라 함은 전자금융거래를 위하여 은행과 체결한 계약에 따라 은행이 제공하는 전자금융거래 서비스를 이용하는 자를 말합니다.</p>
                    <p>3. "접근매체"라 함은 전자금융거래에 있어서 거래지시를 하거나 이용자 및 거래내용의 진실성과 정확성을 확보하기 위하여 사용되는 수단 또는 정보로서 전자식 카드 및 이에 준하는 전자적 정보, 「전자서명법」에 따른 전자서명생성정보 및 인증서, 은행에 등록된 이용자번호, 이용자의 생체정보, 이상의 수단이나 정보를 사용하는데 필요한 비밀번호 등을 말합니다.</p>
                    
                    <p className="font-medium mt-4">제3조 (약관의 명시 및 변경)</p>
                    <p>1. 은행은 이용자가 전자금융거래 서비스를 이용하기 전에 이 약관을 게시하고 이용자가 이 약관의 중요한 내용을 확인할 수 있도록 합니다.</p>
                    <p>2. 은행은 법령의 범위 내에서 이 약관을 변경할 수 있으며, 약관을 변경할 경우에는 변경내용과 적용일자를 정하여 적용일자 1개월 전부터 공지합니다.</p>
                    
                    <p className="font-medium mt-4">제4조 (전자지급거래계약의 효력)</p>
                    <p>1. 은행은 이용자의 거래지시가 전자지급거래에 관한 경우 그 지급절차를 대행합니다.</p>
                    <p>2. 전자지급거래는 이용자가 거래지시한 금액의 자금이체가 이루어지는 것을 말합니다.</p>
                    
                    <p className="font-medium mt-4">제5조 (거래내용의 확인)</p>
                    <p>1. 은행은 이용자가 전자금융거래의 내용을 추적, 검색하거나 그 내용에 오류가 있는 경우 이를 정정할 수 있는 대상 및 방법을 다음과 같이 제공합니다.</p>
                    <p>가. 인터넷뱅킹: 거래내역조회를 통하여 확인</p>
                    <p>나. 모바일뱅킹: 거래내역조회를 통하여 확인</p>
                    
                    <p className="mt-4">... 이하 약관 내용 생략 (실제로는 전체 약관 내용이 표시됩니다)</p>
                </div>
            </div>
        ),
        privacy: (
            <div className="space-y-4">
                <h4 className="font-semibold text-base">개인정보 수집·이용 동의</h4>
                <div className="space-y-3">
                    <p className="font-medium">1. 개인정보의 수집·이용 목적</p>
                    <p>회사는 다음의 목적을 위하여 개인정보를 수집 및 이용합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                    <p>가. 계좌 개설 및 관리</p>
                    <p>나. 본인 식별·인증</p>
                    <p>다. 금융거래 처리 및 금융상품 제공</p>
                    <p>라. 법령 및 이용약관을 위반하는 회원에 대한 이용 제한 조치</p>
                    
                    <p className="font-medium mt-4">2. 수집하는 개인정보의 항목</p>
                    <p>회사는 계좌개설, 상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
                    <p>가. 필수항목: 성명, 주민등록번호, 주소, 전화번호, 이메일, 직업, 국적</p>
                    <p>나. 선택항목: 추천인</p>
                    <p>다. 서비스 이용과정에서 자동으로 생성·수집되는 정보: IP주소, 쿠키, 방문일시, 서비스 이용기록, 불량 이용기록</p>
                    
                    <p className="font-medium mt-4">3. 개인정보의 보유 및 이용기간</p>
                    <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                    <p>가. 계약 또는 청약철회 등에 관한 기록: 5년</p>
                    <p>나. 대금결제 및 재화 등의 공급에 관한 기록: 5년</p>
                    <p>다. 소비자의 불만 또는 분쟁처리에 관한 기록: 3년</p>
                    
                    <p className="font-medium mt-4">4. 개인정보의 제3자 제공</p>
                    <p>회사는 원칙적으로 이용자의 개인정보를 제1항에서 명시한 범위 내에서 처리하며, 이용자의 사전 동의 없이는 본래의 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.</p>
                    
                    <p className="mt-4">... 이하 내용 생략</p>
                </div>
            </div>
        ),
        marketing: (
            <div className="space-y-4">
                <h4 className="font-semibold text-base">마케팅 정보 수신 동의</h4>
                <div className="space-y-3">
                    <p className="font-medium">1. 마케팅 정보 수신 목적</p>
                    <p>회사는 고객에게 다양한 혜택 정보 및 이벤트 정보를 제공하기 위하여 마케팅 정보를 발송합니다.</p>
                    
                    <p className="font-medium mt-4">2. 발송 방법</p>
                    <p>이메일, SMS, 앱 푸시 알림, 우편 등의 방법으로 마케팅 정보를 발송합니다.</p>
                    
                    <p className="font-medium mt-4">3. 발송 내용</p>
                    <p>가. 신상품 및 서비스 안내</p>
                    <p>나. 이벤트 및 프로모션 정보</p>
                    <p>다. 금융 상품 혜택 안내</p>
                    <p>라. 맞춤형 광고 및 컨텐츠 제공</p>
                    
                    <p className="font-medium mt-4">4. 개인정보의 보유 및 이용기간</p>
                    <p>마케팅 정보 수신 동의일로부터 회원 탈퇴 시 또는 동의 철회 시까지</p>
                    
                    <p className="font-medium mt-4">5. 수신 동의 철회</p>
                    <p>고객님은 언제든지 마케팅 정보 수신을 철회하실 수 있습니다.</p>
                    <p>가. 수신 거부 방법: 고객센터(1234-5678), 이메일 하단의 수신거부 링크, 홈페이지 마이페이지</p>
                    <p>나. 수신 거부 시 처리: 즉시 발송 중단 (단, 이미 발송된 메시지는 수신될 수 있습니다)</p>
                    
                    <p className="bg-yellow-50 p-3 rounded mt-4">
                        <strong>※ 유의사항</strong><br/>
                        본 동의는 선택사항이며, 동의하지 않으셔도 계좌 개설 및 서비스 이용에는 영향이 없습니다. 다만, 마케팅 정보를 받지 못하게 되어 각종 혜택 및 이벤트 안내를 받으실 수 없습니다.
                    </p>
                </div>
            </div>
        )
    };

    const openModal = (type) => {
        setModalState({ isOpen: true, type });
    };

    const closeModal = () => {
        setModalState({ isOpen: false, type: null });
    };

    const handleModalComplete = () => {
        if (modalState.type) {
            setScrollCompleted(prev => ({ ...prev, [modalState.type]: true }));
        }
    };

    const toggleAll = () => {
        const next = !agreements.all;
        // 전체 동의는 필수 약관을 모두 읽었을 때만 가능
        if (next && (!scrollCompleted.eContract || !scrollCompleted.privacy)) {
            alert('필수 약관을 모두 확인해주세요.');
            return;
        }
        setAgreements({ all: next, eContract: next, privacy: next, marketing: next });
    };

    const toggleOne = (k) => {
        // 해당 약관을 읽지 않았으면 모달 열기
        if (!scrollCompleted[k]) {
            openModal(k);
            return;
        }
        
        const next = { ...agreements, [k]: !agreements[k] };
        next.all = next.eContract && next.privacy && next.marketing;
        setAgreements(next);
    };

    const canProceed = useMemo(() => agreements.eContract && agreements.privacy, [agreements]);

    const getModalTitle = (type) => {
        const titles = {
            eContract: '전자금융거래약관',
            privacy: '개인정보 수집·이용 동의',
            marketing: '마케팅 정보 수신 동의'
        };
        return titles[type];
    };

    return (
        <Frame>
            <Header breadcrumbs={["개인", "계좌 개설"]} />
            <main className="mx-auto max-w-6xl px-4 py-6">
                <Stepper current={1} />
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                    <section className="rounded-2xl border bg-white shadow-sm">
                        <div className="px-5 py-4 border-b"><h2 className="text-base font-semibold">1. 약관동의</h2></div>
                        <div className="p-5">
                            <div className="space-y-3">
                                <Checkbox 
                                    checked={agreements.all} 
                                    onChange={toggleAll}
                                    label={<span className="font-medium">전체 동의 <span className="text-sm text-gray-500">(선택 포함)</span></span>} 
                                />
                                <Divider />
                                
                                <div className="flex items-center justify-between">
                                    <Checkbox 
                                        checked={agreements.eContract} 
                                        onChange={() => toggleOne("eContract")} 
                                        label={<LabelWithBadge text="전자금융거래약관" required />} 
                                    />
                                    <button
                                        onClick={() => openModal("eContract")}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        보기
                                    </button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <Checkbox 
                                        checked={agreements.privacy} 
                                        onChange={() => toggleOne("privacy")} 
                                        label={<LabelWithBadge text="개인정보 수집·이용 동의" required />} 
                                    />
                                    <button
                                        onClick={() => openModal("privacy")}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        보기
                                    </button>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <Checkbox 
                                        checked={agreements.marketing} 
                                        onChange={() => toggleOne("marketing")} 
                                        label={<LabelWithBadge text="마케팅 정보 수신 동의" />} 
                                    />
                                    <button
                                        onClick={() => openModal("marketing")}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        보기
                                    </button>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-between">
                                <button type="button" className="min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    onClick={() => navigate(-1)}>이전</button>
                                <button type="button" disabled={!canProceed}
                                    className={`min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold ${canProceed ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                    onClick={() => { setStep1(agreements); navigate("/account/open/step2"); }}>다음</button>
                            </div>
                        </div>
                    </section>
                    <AsideHelp />
                </div>
            </main>

            {/* 약관 모달 */}
            {modalState.isOpen && (
                <TermsModal
                    isOpen={modalState.isOpen}
                    onClose={closeModal}
                    title={getModalTitle(modalState.type)}
                    content={termsContent[modalState.type]}
                    onComplete={handleModalComplete}
                    isCompleted={scrollCompleted[modalState.type]}
                />
            )}
        </Frame>
    );
}