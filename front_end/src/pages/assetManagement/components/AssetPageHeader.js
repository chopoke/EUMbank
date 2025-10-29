// src/pages/assetManagement/components/AssetPageHeader.js
import { Link } from "react-router-dom";

export default function AssetPageHeader({ title, desc, current }) {
  const sections = [
    { key: "analysis",   label: "자산 분석",     to: "/asset/analysis" },
    { key: "peer",       label: "또래 비교",     to: "/asset/peer" },
    { key: "recommend",  label: "맞춤형 추천",  to: "/asset/recommend" },
    { key: "report",     label: "월간 리포트",   to: "/asset/report" },
  ];

  const otherLinks = sections.filter((s) => s.key !== current);

  return (
    <header
      className="
        content-container
        px-6
        pt-8 md:pt-10
        /* pb-4 지우고 아래 마진으로 제어 */
        pb-0
        flex flex-col gap-4
      "
    >
      {/* 위 라인: 뒤로가기 + 타이틀/설명 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Link
            to="/asset/dashboard"
            className="inline-flex w-fit items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <span aria-hidden="true">←</span>
            <span>자산 현황으로</span>
          </Link>

          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {desc && (
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            )}
          </div>
        </div>
      </div>

    </header>
  );
}
