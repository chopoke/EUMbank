// src/account-open/ui.js
import React from "react";

export function Frame({ children }) {
    return <div className="min-h-screen bg-gray-50 text-gray-800">{children}</div>;
}

export function Header({ breadcrumbs }) {
    return (
        <header className="border-b bg-white">
            <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
                <nav className="flex items-center gap-2 text-sm text-gray-500">
                    {breadcrumbs?.map((b, i) => (
                        <span key={i} className={i === breadcrumbs.length - 1 ? "text-gray-900 font-medium" : undefined}>
                            {i > 0 && <span className="mx-2 text-gray-300">›</span>}
                            {b}
                        </span>
                    ))}
                </nav>
            </div>
        </header>
    );
}

export function Stepper({ current }) {
    const steps = ["약관동의", "본인인증", "정보입력", "상품선택", "확인/개설"];
    return (
        <div className="rounded-2xl border bg-white shadow-sm">
            <ol className="flex flex-wrap items-center gap-2 px-4 py-3">
                {steps.map((label, i) => {
                    const idx = i + 1;
                    const active = current === idx;
                    return (
                        <li key={idx} className="flex items-center gap-2">
                            <span className={["flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                                active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"].join(" ")}>{idx}</span>
                            <span className={"text-sm " + (active ? "font-semibold text-gray-900" : "text-gray-600")}>{label}</span>
                            {idx < steps.length && <span className="mx-1 text-gray-300">›</span>}
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

export function InfoCard({ title, children }) {
    return (
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-semibold">{title}</h3>
            {children}
        </section>
    );
}

export function AsideHelp() {
    return (
        <aside className="space-y-4">
            <InfoCard title="안내">
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>만 14세 이상만 개설 가능합니다.</li>
                    <li>본인 명의 휴대폰이 필요합니다.</li>
                    <li>신분증(주민등록증/운전면허증)을 준비하세요.</li>
                </ul>
            </InfoCard>
            <InfoCard title="보안">
                <p className="text-sm text-gray-700 leading-6">
                    고객센터를 사칭한 연락에 주의하세요. <br/>OTP/비밀번호는 절대 공유하지 마세요.
                </p>
            </InfoCard>
        </aside>
    );
}

export function Checkbox({ checked, onChange, label }) {
    return (
        <label className="flex select-none items-start gap-3 rounded-xl p-2 hover:bg-gray-50">
            <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={checked}
                onChange={onChange}
            />
            <div className="text-sm text-gray-800">{label}</div>
        </label>
    );
}

export function LabelWithBadge({ text, required = false }) {
    return (
        <span className="inline-flex items-center gap-2">
            {text}
            <span className={["inline-flex items-center rounded-full px-2 py-0.5 text-[11px]",
                required ? "bg-red-50 text-red-600 ring-1 ring-red-100" : "bg-gray-100 text-gray-600"].join(" ")}>
                {required ? "필수" : "선택"}
            </span>
        </span>
    );
}

export function Divider() {
    return <div className="my-2 h-px w-full bg-gray-100" />;
}

export function TextField({ label, placeholder, value, onChange, error = "", full = false, type = "text", inputMode }) {
    return (
        <div className={full ? "md:col-span-2" : undefined}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                inputMode={inputMode}
                className={["w-full rounded-xl border px-3 py-2 text-sm outline-none",
                    error ? "border-red-300 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:ring-2 focus:ring-blue-200"].join(" ")}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

export function RadioCard({ checked, onClick, title, subtitle }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={["w-full rounded-2xl border p-5 text-left transition",
                checked ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300 hover:shadow-sm"].join(" ")}
        >
            <div className="flex items-start gap-3">
                <span className={["mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border",
                    checked ? "border-blue-600" : "border-gray-400"].join(" ")}>
                    {checked && <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                </span>
                <div>
                    <div className="text-base font-semibold">{title}</div>
                    <div className="text-sm text-gray-500">{subtitle}</div>
                </div>
            </div>
        </button>
    );
}

export function KV({ k, v }) {
    return (
        <div className="grid grid-cols-[120px_1fr] gap-3">
            <div className="text-sm text-gray-500">{k}</div>
            <div className="text-sm text-gray-900">{v}</div>
        </div>
    );
}

export function NextCard({ title, desc }) {
    return (
        <div className="rounded-xl border p-4">
            <div className="text-sm font-semibold mb-1">{title}</div>
            <div className="text-sm text-gray-600">{desc}</div>
        </div>
    );
}
