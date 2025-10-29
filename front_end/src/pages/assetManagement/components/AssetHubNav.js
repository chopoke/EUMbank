// src/pages/assetManagement/components/AssetHubNav.js
import { Link } from "react-router-dom";

/**
 * props:
 * - current: 'analysis' | 'peer' | 'recommend' | 'report'
 *
 * 이 컴포넌트는 흰 카드 안 최상단에 들어간다.
 * 파란 배경 박스가 카드의 헤더처럼 보이게 해서
 * 아래 본문과 시각적으로 '한 덩어리'가 되게 한다.
 */
export default function AssetHubNav({ current }) {
  const sections = [
    { key: "analysis",   label: "자산 분석",     to: "/asset/analysis" },
    { key: "peer",       label: "또래 비교",     to: "/asset/peer" },
    { key: "recommend",  label: "맞춤형 추천",   to: "/asset/recommend" },
    { key: "report",     label: "월간 리포트",   to: "/asset/report" },
  ];

  const otherLinks = sections.filter((s) => s.key !== current);

  return (
    <div
      className="
        rounded-md border border-blue-200 bg-blue-50
        p-4
        flex flex-col gap-3
        md:flex-row md:items-start md:justify-between
      "
    >
      <div className="text-sm font-semibold text-gray-900">
        자산관리 허브
        <span className="ml-2 text-[12px] text-blue-700 font-normal">
          분석 · 또래 비교 · 추천 · 리포트를 한 곳에서
        </span>
      </div>

      <div className="flex flex-wrap gap-2 md:justify-end">
        {otherLinks.map((item) => (
          <Link
            key={item.key}
            to={item.to}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
