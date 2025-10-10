import { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react"; // 선택사항

export function PinPadModal({ length = 6, onSubmit, onCancel }) {
    const [digits, setDigits] = useState([]);

    const push = useCallback((d) => {
        if (digits.length >= length) return;
        const next = [...digits, d];
        setDigits(next);
        if (next.length === length) {
            // 입력 완료 → 서버 확인/등록
            Promise.resolve(onSubmit(next.join("")))
                .catch(() => {
                    // 실패: 자리 초기화 + 시도 차감
                    setDigits([]);
                });
        }
    }, [digits, length, onSubmit]);

    const pop = useCallback(() => {
        if (digits.length === 0) return;
        setDigits((arr) => arr.slice(0, -1));
    }, [digits.length]);

    // 물리 키보드 숫자 입력 지원
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Backspace") { pop(); return; }
            if (/^\d$/.test(e.key)) { push(e.key); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [pop, push]);

    // 키패드 표기(문자 라벨 포함)
    const keys = [
        { n: "1", l: "" }, { n: "2", l: "ABC" }, { n: "3", l: "DEF" },
        { n: "4", l: "GHI" }, { n: "5", l: "JKL" }, { n: "6", l: "MNO" },
        { n: "7", l: "PQRS" }, { n: "8", l: "TUV" }, { n: "9", l: "WXYZ" },
    ];

    return (
        <div className="w-full max-w-[320px] mx-auto">


            {/* PIN 점 표시 (iOS 스타일) */}
            <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length }).map((_, i) => (
                    <div
                        key={i}
                        aria-hidden
                        className={[
                            "w-10 h-10 rounded-md border border-gray-300 bg-white",
                            "flex items-center justify-center",
                        ].join(" ")}
                    >
                        {i < digits.length ? <span className="text-2xl leading-none select-none">•</span> : null}
                    </div>
                ))}
            </div>

            {/* 숨은 실제 입력(모바일 자동 숫자 키패드 유도) */}
            <input
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                className="sr-only"
                aria-hidden
            />

            {/* 키패드 1~9 */}
            <div className="grid grid-cols-3 gap-3 mb-3">
                {keys.map(k => (
                    <button
                        key={k.n}
                        type="button"
                        onClick={() => push(k.n)}
                        className="h-16 rounded-full bg-gray-100 shadow-inner active:scale-95 transition-transform
                       flex flex-col items-center justify-center"
                    >
                        <span className="text-xl font-medium">{k.n}</span>
                        {k.l && <span className="text-[10px] tracking-widest text-gray-500">{k.l}</span>}
                    </button>
                ))}
            </div>

            {/* 마지막 줄: 빈자리, 0, 백스페이스 */}
            <div className="grid grid-cols-3 gap-3">
                <div />
                <button
                    type="button"
                    onClick={() => push("0")}
                    className="h-16 rounded-full bg-gray-100 shadow-inner active:scale-95 transition-transform
                     flex items-center justify-center"
                >
                    <span className="text-xl font-medium">0</span>
                </button>
                <button
                    type="button"
                    onClick={pop}
                    className="h-16 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors
                     flex items-center justify-center text-sm font-semibold"
                >
                    ⟵ 삭제
                </button>
            </div>
        </div>
    );
}
