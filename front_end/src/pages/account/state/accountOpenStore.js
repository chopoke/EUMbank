import { create } from "zustand";
import { devtools } from 'zustand/middleware';

// 새 계좌번호 생성 (형식: 110-123-456789)
const rand = n => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
export const genAccountNo = () => `110-${rand(3)}-${rand(6)}`;

export const useAccountOpenStore = create(devtools((set, get) => ({

    // 1단계
    step1: { all: false, eContract: false, privacy: false, marketing: false },
    setStep1: (agreements) => set({ step1: { ...agreements } }),

    // 2단계 (OCR 검증/추출)
    step2: { verified: false, name: "", rrn13: "", rrn6: "", address: "", pinNumber: "", email: "", phone: "" },
    setStep2: (payload) => set({ step2: { ...get().step2, ...payload } }),

    // 3단계 (정보입력)
    step3: { name: "", rrn: "", phone: "", email: "", address: "" },
    setStep3: (form) => set({ step3: { ...form } }),

    // 4단계 (상품/출금계좌/비번/신규계좌)
    step4: { product: "saving", fromAccount: "", mPin: "", newAccountNo: genAccountNo() },
    setStep4: (payload) => set({ step4: { ...get().step4, ...payload } }),

    // 5단계 저장 호출 여부(중복 저장 방지)
    submitted: false,
    markSubmitted: () => set({ submitted: true }),

    // 서버 전송용 페이로드 생성기
    buildPayload: () => {
        const s1 = get().step1, s2 = get().step2, s3 = get().step3, s4 = get().step4;
        return {
            consent: {
                all: s1.all, eContract: s1.eContract, privacy: s1.privacy, marketing: s1.marketing
            },
            verification: {
                verified: s2.verified, nameFromId: s2.name, rrn13FormId: s2.rrn13, rrn6FromId: s2.rrn6, addressFromId: s2.address, pinNumber: s2.pinNumber, email: s2.email, phone: s2.phone
            },
            customer: {
                name: s3.name, rrn: s3.rrn, phone: s3.phone, email: s3.email, address: s3.address
            },
            product: {
                type: s4.product, fromAccount: s4.fromAccount, newAccountNo: s4.newAccountNo, mPin: s4.mPin
            },
            meta: {
                // 감사/추적 용(선택)
                createdAt: new Date().toISOString()
            }
        };
    },

    resetAll: () => set({
        step1: { all: false, eContract: false, privacy: false, marketing: false },
        step2: { verified: false, name: "", rrn13: "", rrn6: "", address: "", pinNumber: "", email: "", phone: "" },
        step3: { name: "", rrn: "", phone: "", email: "", address: "" },
        step4: { product: "saving", fromAccount: "", mPin: "", newAccountNo: genAccountNo() },
        submitted: false,
    })
}), { name: "AccountOpenStore" }));
