import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Frame, Header, Stepper, AsideHelp, Checkbox, LabelWithBadge, Divider } from './commom/ui';
import { useAccountOpenStore } from './state/accountOpenStore';


export default function Step1Consent() {
    const navigate = useNavigate();

    // 스텝1에 대한 값을 zustand에 넣기
    const setStep1 = useAccountOpenStore(s => s.setStep1);

    // 스토어의 모든 변경사항을 구독하고, 변경될 때마다 콘솔에 출력합니다.
    useAccountOpenStore.subscribe((state) => {
        console.log('들어가는 값 확인 : ', state);
    });

    const [agreements, setAgreements] = useState({ all: false, eContract: false, privacy: false, marketing: false });

    // 전체 토클에 대한 처리
    const toggleAll = () => {
        // !는 반대이기 때문에 처음에 초기값이 false이니, 전체 체크박스를 체크하게되면 true가 되기 위해... 그리고 그외 3가지 동의에 대해서 전체 체크를 true하게 됨
        const next = !agreements.all;
        setAgreements({ all: next, eContract: next, privacy: next, marketing: next });
    };

    const toggleOne = (k) => {
        const next = { ...agreements, [k]: !agreements[k] };
        // 전체가 체크되어 있다면(true 라면), toggleAll도 true로 체크 
        next.all = next.eContract && next.privacy && next.marketing;
        setAgreements(next);
    };

    const canProceed = useMemo(() => agreements.eContract && agreements.privacy, [agreements]);

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
                                <Checkbox checked={agreements.all} onChange={toggleAll}
                                    label={<span className="font-medium">전체 동의 <span className="text-sm text-gray-500">(선택 포함)</span></span>} />
                                <Divider />
                                <Checkbox checked={agreements.eContract} onChange={() => toggleOne("eContract")} label={<LabelWithBadge text="전자금융거래약관" required />} />
                                <Checkbox checked={agreements.privacy} onChange={() => toggleOne("privacy")} label={<LabelWithBadge text="개인정보 수집·이용 동의" required />} />
                                <Checkbox checked={agreements.marketing} onChange={() => toggleOne("marketing")} label={<LabelWithBadge text="마케팅 정보 수신 동의" />} />
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
        </Frame>
    );
}
