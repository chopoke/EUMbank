import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Frame, Header, Stepper, AsideHelp, RadioCard } from './commom/ui';
import { useAccountOpenStore, genAccountNo } from "./state/accountOpenStore";

export default function Step4Product() {
    const nav = useNavigate();
    const setStep4 = useAccountOpenStore(s => s.setStep4);
    const storeNewAcctNo = useAccountOpenStore(s => s.step4.newAccountNo);

    const randDigits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
    const genMockAccountNo = () => `110-${randDigits(3)}-${randDigits(6)}`;
    const generateAccounts = (count = 3) => Array.from({ length: count }, () => genMockAccountNo());

    // ===== 계좌번호 랜덤 생성 (형식: 110-123-456789) =====
    const [accounts] = useState(() => generateAccounts(3));
    const defaultFrom = `입출금통장 · ${accounts[0]}`;

    const [product, setProduct] = useState("saving"); // saving=자유적금, deposit=입출금
    const [fromAccount, setFromAccount] = useState(defaultFrom);
    const [mPin, setMPin] = useState("");


    const onlyDigits = (s) => s.split("").filter(ch => ch >= "0" && ch <= "9").join("");
    const onPinChange = (v) => { setMPin(onlyDigits(v).slice(0, 6)); };


    const canNext = product && fromAccount && mPin.length === 6;


    return (
        <Frame>
            <Header breadcrumbs={["개인", "계좌 개설"]} />
            <main className="mx-auto max-w-6xl px-4 py-6">
                <Stepper current={4} />
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                    <section className="rounded-2xl border bg-white shadow-sm">
                        <div className="px-5 py-4 border-b"><h2 className="text-base font-semibold">4. 상품선택</h2></div>
                        <div className="p-5 space-y-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <RadioCard checked={product === "deposit"} onClick={() => setProduct("deposit")} title="입출금통장" subtitle="수수료 우대, 체크카드 연계" />
                                <RadioCard checked={product === "saving"} onClick={() => setProduct("saving")} title="자유적금" subtitle="매월 자유 납입, 목표저축" />
                            </div>


                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">출금계좌(수수료)</label>
                                    <select
                                        value={fromAccount}
                                        onChange={(e) => setFromAccount(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200"
                                    >
                                        {accounts.map((acct, idx) => (
                                            <option key={idx}>{`입출금통장 · ${acct}`}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">모바일 뱅킹 비밀번호</label>
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        value={mPin}
                                        onChange={(e) => onPinChange(e.target.value)}
                                        placeholder="6자리"
                                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 tracking-widest"
                                    />
                                </div>
                            </div>


                            <div className="flex justify-between pt-2">
                                <button type="button" className="min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => nav(-1)}>이전</button>
                                <button
                                    type="button"
                                    disabled={!canNext}
                                    className={["min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold", canNext ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"].join(" ")}
                                    onClick={() => {
                                        // 필요 시 newAccountNo를 여기서도 갱신 가능
                                        setStep4({ product, fromAccount, mPin, newAccountNo: genAccountNo() });
                                        nav("/account/open/step5");
                                    }}
                                >
                                    다음
                                </button>
                            </div>
                        </div>
                    </section>
                    <AsideHelp />
                </div>
            </main>
        </Frame>
    );
}
