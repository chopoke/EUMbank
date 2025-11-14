import React, { useEffect, useRef, useState } from "react";
import { Frame, Header, Stepper, InfoCard, KV, NextCard } from "./commom/ui";
import { saveAccount } from "./api/accountApi";
import { useNavigate } from "react-router-dom";
import { useAccountOpenStore } from "./state/accountOpenStore";

export default function Step5Done() {
    const nav = useNavigate();

    // 1) 스토어는 개별 selector로 (객체 묶지 않기)
    const step2 = useAccountOpenStore(s => s.step2);
    const step3 = useAccountOpenStore(s => s.step3);
    const step4 = useAccountOpenStore(s => s.step4);
    const submitted = useAccountOpenStore(s => s.submitted);

    // 2) 액션/빌더는 ref로 고정 (참조 불변)
    const buildPayloadRef = useRef(useAccountOpenStore.getState().buildPayload);

    // 3) StrictMode 이펙트 중복 호출 방지
    const hasPostedRef = useRef(false);

    const [saving, setSaving] = useState(false);
    const [saveErr, setSaveErr] = useState("");

    useEffect(() => {
        if (submitted || hasPostedRef.current) return; // 이미 저장했으면 스킵
        hasPostedRef.current = true;                   // ← StrictMode 중복 방지

        (async () => {
            try {
                setSaving(true);
                const payload = buildPayloadRef.current();
                await saveAccount(payload);               // POST /api/account/save
                //markSubmittedRef.current();               // submitted=true (이펙트 종료)
            } catch (e) {
                console.error(e);
                setSaveErr(e?.message || "계좌 저장 중 오류");
            } finally {
                setSaving(false);
            }
        })();
    }, [submitted]);

    const productLabel =
        step4.product === "자유적금" ? "자유적금" :
            step4.product === "입출금" ? "입출금통장" : "-";
    if (saving) {
        return (
            <Frame>
                <Header breadcrumbs={["계좌 개설", "완료"]} />
                <main className="mx-auto max-w-6xl px-4 py-6">
                    <Stepper current={5} />
                    <section className="mt-6 rounded-2xl border bg-white shadow-sm p-8 text-center">
                        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                        <h2 className="text-lg font-semibold">서버에 저장 중입니다…</h2>
                        <p className="text-sm text-gray-600 mt-1">잠시만 기다려 주세요.</p>
                    </section>
                </main>
            </Frame>
        );
    }

    // 실패 화면
    if (saveErr) {
        return (
            <Frame>
                <Header breadcrumbs={["계좌 개설", "완료"]} />
                <main className="mx-auto max-w-6xl px-4 py-6">
                    <Stepper current={5} />
                    <section className="mt-6 rounded-2xl border bg-white shadow-sm p-8">
                        <div className="flex items-start gap-3">
                            <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white">!</span>
                            <div>
                                <h2 className="text-lg font-semibold">저장 실패</h2>
                                <p className="text-sm text-red-700 mt-1">{saveErr}</p>
                            </div>
                        </div>
                    </section>
                </main>
            </Frame>
        );
    }
    return (
        <Frame>
            <Header breadcrumbs={["계좌 개설", "완료"]} />
            <main className="mx-auto max-w-6xl px-4 py-6">
                <Stepper current={5} />
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                    <section className="rounded-2xl border bg-white shadow-sm">
                        <div className="p-6 border-b">
                            <div className="flex items-start gap-3">
                                <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white">✓</span>
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {saveErr ? "저장 실패" : "축하드립니다! 계좌가 개설되었습니다."}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {saving ? "서버에 저장 중입니다…" :
                                            saveErr ? `사유: ${saveErr}` : "아래 정보를 안전한 곳에 보관해 주세요."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <KV k="계좌번호" v={<strong>{step4.newAccountNo}</strong>} />
                                <KV k="개설 시각" v={new Date().toLocaleString()} />
                                <KV k="상품" v={productLabel} />
                                <KV k="모바일뱅킹" v="등록 완료" />
                                <KV k="예금주" v={step3.name || step2.name || "-"} />
                                <KV k="연락처" v={step3.phone || "-"} />
                            </div>
                            <div className="mt-4">
                                <button
                                    className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                                    onClick={() => { nav("/"); }}
                                >
                                    메인으로
                                </button>
                            </div>
                        </div>


                    </section>

                    <aside className="space-y-4">
                        <InfoCard title="보안 안내">
                            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                                계좌번호/OTP/인증코드는 절대 타인에게 공유하지 마세요.
                            </div>
                        </InfoCard>
                    </aside>
                </div>
            </main>
        </Frame>
    );
}