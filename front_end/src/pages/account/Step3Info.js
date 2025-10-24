// Step3Info.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Frame, Header, Stepper, AsideHelp, TextField } from "./commom/ui";
import { useAccountOpenStore } from "./state/accountOpenStore";

// 안전 유틸
const digits = (s = "") => s.replace(/[^0-9]/g, "");
const fmtRRN = (v) => {
    const d = digits(v).slice(0, 13);
    const a = d.slice(0, 6), b = d.slice(6);
    return b ? `${a}-${b}` : a;
};
const fmtPhone = (v) => {
    const d = digits(v).slice(0, 11);
    const a = d.slice(0, 3), b = d.slice(3, 7), c = d.slice(7, 11);
    return [a, b, c].filter(Boolean).join("-");
};
const isRRN = (v) => /^\d{6}-\d{7}$/.test(v);
const isPhone = (v) => /^010-\d{4}-\d{4}$/.test(v);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const formatChangePhone = (v) => {
    // 이 함수가 이미 '000-0000-0000' 형식으로 만들어 줍니다.
    const d = (v || "").replace(/[^0-9]/g, "").slice(0, 11);
    const a = d.slice(0, 3), b = d.slice(3, 7), c = d.slice(7, 11);
    return [a, b, c].filter(Boolean).join("-");
};

export default function Step3Info() {
    const nav = useNavigate();

    // ❗️Zustand는 각각 따로 구독: 객체 리턴 금지(매 렌더 새 객체 → 불필요 재렌더)
    const step2 = useAccountOpenStore((s) => s.step2);
    const setStep3 = useAccountOpenStore((s) => s.setStep3);

    // ✅ 초기값은 useState "초기화 함수"에서 한 번만 계산 (useEffect로 setForm 하지 말 것)
    const [form, setForm] = useState(() => ({
        name: step2?.name || "",
        rrn: step2?.rrn13 ? `${step2.rrn13}` : "",
        phone: formatChangePhone(step2?.phone || ""),
        email: step2?.email || "", // 인증된 사람의 이메일 정보
        address: step2?.address || ""
    }));

    // (선택) OCR 완료 안 했으면 되돌리기 — 의존성은 verified만 (nav 미포함: 불필요 재실행 방지)
    useEffect(() => {
        if (!step2?.verified) nav("/account/open/step2", { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step2?.verified]);

    // (옵션) step2가 "나중에" 채워질 수 있는 경우에만 1회 보정
    const prefilled = useRef(false);
    useEffect(() => {
        if (prefilled.current) return;
        if (!step2) return;
        prefilled.current = true;
        setForm((f) => ({
            ...f,
            name: f.name || step2.name || "",
            address: f.address || step2.address || "",
            rrn: f.rrn || (step2.rrn6 ? `${step2.rrn6}-` : "")
        }));
    }, [step2]);

    const onChange = (k, val) => {
        if (k === "rrn") val = fmtRRN(val);
        if (k === "phone") val = fmtPhone(val);
        setForm((p) => ({ ...p, [k]: val }));
    };

    const canNext =
        form.name.trim() &&
        isRRN(form.rrn) &&
        isPhone(form.phone) &&
        isEmail(form.email) &&
        form.address.trim();

    return (
        <Frame>
            <Header breadcrumbs={["개인", "계좌 개설"]} />
            <main className="mx-auto max-w-6xl px-4 py-6">
                <Stepper current={3} />
                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                    <section className="rounded-2xl border bg-white shadow-sm">
                        <div className="px-5 py-4 border-b"><h2 className="text-base font-semibold">3. 정보입력</h2></div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <TextField label="이름" placeholder="홍길동" value={form.name} onChange={(v) => onChange("name", v)} />
                                <TextField label="주민등록번호" placeholder="000000-0000000" value={form.rrn} onChange={(v) => onChange("rrn", v)}
                                    error={form.rrn && !isRRN(form.rrn) ? "형식: 000000-0000000" : ""} />
                                <TextField label="연락처" placeholder="010-0000-0000" value={form.phone} onChange={(v) => onChange("phone", v)}
                                    error={form.phone && !isPhone(form.phone) ? "형식: 010-0000-0000" : ""} />
                                <TextField label="이메일" placeholder="you@example.com" value={form.email} onChange={(v) => onChange("email", v)}
                                    error={form.email && !isEmail(form.email) ? "올바른 이메일 형식" : ""} />
                            </div>
                            <TextField label="주소" placeholder="도로명 주소" value={form.address} onChange={(v) => onChange("address", v)} full />
                            <div className="flex justify-between pt-2">
                                <button type="button" className="min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    onClick={() => nav(-1)}>이전</button>
                                <button type="button" disabled={!canNext}
                                    className={`min-w-[96px] rounded-xl px-5 py-2.5 text-sm font-semibold ${canNext ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                                    onClick={() => { setStep3(form); nav("/account/open/step4"); }}>다음</button>
                            </div>
                        </div>
                    </section>
                    <AsideHelp />
                </div>
            </main>
        </Frame>
    );
}
