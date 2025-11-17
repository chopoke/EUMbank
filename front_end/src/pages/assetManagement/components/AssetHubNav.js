import { NavLink } from "react-router-dom";

const items = [
  { to: "/asset/dashboard", label: "자산 현황" },
  { to: "/asset/analysis",  label: "자산 분석" },
  { to: "/asset/peer",      label: "또래 비교" },
  { to: "/asset/report",    label: "월간 리포트" },
];

export default function AssetHubNav() {
  return (
    <nav className="rounded-md border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center gap-3">
      <div className="text-sm font-semibold text-gray-900">자산관리 허브</div>
      <div className="text-[12px] text-blue-700">현황 · 분석 · 또래 비교 · 리포트를 한 곳에서</div>

      <div className="ml-auto flex gap-2">
        {items.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              [
                "rounded-full px-3.5 py-1.5 text-xs border transition-colors",
                isActive
                  ? "bg-blue-600 text-white border-blue-600"      // 활성: 진한 파랑 솔리드
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:text-gray-900", // 비활성
              ].join(" ")
            }
            aria-current={({ isActive }) => (isActive ? "page" : undefined)}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
