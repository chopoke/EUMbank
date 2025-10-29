// src/pages/assetManagement/components/AssetPageHeader.js
import { Link } from "react-router-dom";

/**
 * props:
 * - title: 페이지 타이틀 (예: "자산 분석")
 * - desc:   서브텍스트 (예: "목표 대비 달성도 ...")
 * - current: 현재 페이지 키값 ('analysis' | 'peer' | 'recommend' | 'report')
 *
 * 기능:
 * - 상단에 '← 자산 현황으로' 버튼 (dashboard로 이동)
 * - "자산관리 허브" 블루 박스
 *   - 현재 페이지를 뺀 나머지 3개 섹션으로 가는 버튼들만 보여줌
 */

export default function AssetPageHeader({ title, desc, current }) {
  // 네비게이션 후보 정의
  const sections = [
    {
      key: "analysis",
      label: "자산 분석",
      to: "/asset/analysis",
    },
    {
      key: "peer",
      label: "또래 비교",
      to: "/asset/peer",
    },
    {
      key: "recommend",
      label: "맞춤형 추천",
      to: "/asset/recommend",
    },
    {
      key: "report",
      label: "월간 리포트",
      to: "/asset/report",
    },
  ];

  // 현재 페이지는 버튼에서 제외
  const otherLinks = sections.filter((s) => s.key !== current);

  return (
    <header className="content-container px-6 pt-8 md:pt-10 pb-4 flex flex-col gap-4">
      {/* 1줄차: 뒤로가기 + 제목/설명 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        {/* 왼쪽: 뒤로가기 + 타이틀 */}
        <div className="flex flex-col gap-2">
          {/* 뒤로가기 버튼 */}
          <Link
            to="/asset/dashboard"
            className="inline-flex w-fit items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <span aria-hidden="true">←</span>
            <span>자산 현황으로</span>
          </Link>

          {/* 제목/설명 */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {desc && (
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            )}
          </div>
        </div>
      </div>

      {/* 자산관리 허브 배너 */}
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        {/* 왼쪽 안내 텍스트 */}
        <div className="text-sm font-semibold text-gray-900">
          자산관리 허브
          <span className="ml-2 text-[12px] text-blue-700 font-normal">
            분석 · 또래 비교 · 추천 · 리포트를 한 곳에서
          </span>
        </div>

        {/* 우측(또는 아래): 다른 섹션 이동 버튼들 */}
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
    </header>
  );
}
