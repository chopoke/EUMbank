// src/pages/loan/apply/ApplyLayoutGuard.js
import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { loadFlow, ensureStep } from "./ApplyStorage";

/** 탭 라벨과 슬러그 매핑 */
const stepToSlug = (step) => {
  if (step <= 1) return "agree";
  if (step === 2) return "form";
  if (step === 3) return "docs";
  if (step === 4) return "sign";
  return "submit";
};

/** 공통 상단 탭 레이아웃 */
export function ApplyLayout({ current, children }) {
  const { code } = useParams();
  const Tab = ({ to, idx, label }) => (
    <Link
      to={`/loan/apply/${encodeURIComponent(code)}/${to}`}
      className={`px-3 py-1.5 rounded-full text-sm ${
        current === idx ? "px-4 py-2 md:px-5 md:py-4 bg-blue-600 text-white font-semibold rounded-xl shadow-md transition-all" 
        : "px-4 py-2 md:px-5 md:py-4 bg-white text-gray-700 font-medium rounded-xl shadow-md transition-all"
      }`}
    >
      {idx}. {label}
    </Link>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Tab to="agree"  idx={1} label="약관동의" />
        <Tab to="form"   idx={2} label="신청서 작성" />
        <Tab to="docs"   idx={3} label="서류제출" />
        <Tab to="sign"   idx={4} label="최종약정/전자서명" />
        <Tab to="submit" idx={5} label="신청" />
      </div>
      {children}
    </div>
  );
}

/** 스텝 진입 가드: 이전 스텝 미완료시 되돌리기/가장 마지막 완료 스텝으로 */
export function ApplyGuard({ requireStep, children }) {
  const { code } = useParams();
  const nav = useNavigate();
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    const flow = loadFlow(code);

    // 플로우 자체가 없으면 agree로
    if (!flow) {
      nav(`/loan/apply/${encodeURIComponent(code)}/agree`, { replace: true });
      return;
    }

    // 요구 스텝을 만족하지 못하면 마지막 완료 스텝으로 이동
    if (!ensureStep(flow, requireStep)) {
      const to = stepToSlug(Number(flow.step || 1));
      nav(`/loan/apply/${encodeURIComponent(code)}/${to}`, { replace: true });
      return;
    }

    setOk(true);
  }, [code, requireStep, nav]);

  return ok ? children : null;
}