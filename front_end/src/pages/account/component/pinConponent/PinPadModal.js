import { useEffect, useState, useCallback } from "react";

export function PinPadModal({ length = 6, onSubmit, onCancel }) {
    const [digits, setDigits] = useState([]);

    const push = useCallback((d) => {
        if (digits.length >= length) return;
        const next = [...digits, d];
        setDigits(next);
        if (next.length === length) {
            Promise.resolve(onSubmit(next.join("")))
                .catch(() => {
                    setDigits([]);
                });
        }
    }, [digits, length, onSubmit]);

    const pop = useCallback(() => {
        if (digits.length === 0) return;
        setDigits((arr) => arr.slice(0, -1));
    }, [digits.length]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Backspace") { pop(); return; }
            if (/^\d$/.test(e.key)) { push(e.key); }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [pop, push]);

    const keys = [
        { n: "1", l: "" }, { n: "2", l: "ABC" }, { n: "3", l: "DEF" },
        { n: "4", l: "GHI" }, { n: "5", l: "JKL" }, { n: "6", l: "MNO" },
        { n: "7", l: "PQRS" }, { n: "8", l: "TUV" }, { n: "9", l: "WXYZ" },
    ];

    return (
        <div className="w-full max-w-[320px] mx-auto">

            {/* PIN 점 표시 (개선된 디자인) */}
            <div className="flex justify-center gap-3 mb-6 h-4 items-center">
                {Array.from({ length }).map((_, i) => (
                    <div
                        key={i}
                        aria-hidden
                        className={[
                            "w-4 h-4 rounded-full border-2",
                            "transition-all duration-200",
                            i < digits.length ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300"
                        ].join(" ")}
                    />
                ))}
            </div>

            <input
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                className="sr-only"
                aria-hidden
            />

            {/* 키패드 1~9 (개선된 디자인) */}
            <div className="grid grid-cols-3 gap-3 mb-3">
                {keys.map(k => (
                    <button
                        key={k.n}
                        type="button"
                        onClick={() => push(k.n)}
                        className="h-16 rounded-full bg-transparent hover:bg-blue-50 active:bg-blue-100 active:scale-95 transition-all
                                   flex flex-col items-center justify-center group"
                    >
                        <span className="text-2xl font-medium text-gray-800">{k.n}</span>
                        {k.l && <span className="text-[10px] tracking-widest text-gray-500 group-hover:text-blue-600">{k.l}</span>}
                    </button>
                ))}
            </div>

            {/* 마지막 줄 (개선된 디자인) */}
            <div className="grid grid-cols-3 gap-3">
                <div />
                <button
                    type="button"
                    onClick={() => push("0")}
                    className="h-16 rounded-full bg-transparent hover:bg-blue-50 active:bg-blue-100 active:scale-95 transition-all
                                 flex items-center justify-center"
                >
                    <span className="text-2xl font-medium text-gray-800">0</span>
                </button>
                <button
                    type="button"
                    onClick={pop}
                    className="h-16 rounded-full bg-transparent hover:bg-gray-100 active:bg-gray-200 transition-colors
                                 flex items-center justify-center text-sm font-semibold text-gray-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
}