import { Link } from "react-router-dom";

export default function AssetHubNav() {
  return (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center gap-3">
      <div className="text-sm font-semibold text-gray-900">자산관리 허브</div>
      <div className="text-[12px] text-blue-700">
        현황 · 분석 · 또래 비교 · 리포트를 한 곳에서
      </div>
      <div className="ml-auto flex gap-2">
        <Link
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          to="/asset/dashboard"
        >
          자산 현황
        </Link>
        <Link
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          to="/asset/analysis"
        >
          자산 분석
        </Link>
        <Link
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          to="/asset/peer"
        >
          또래 비교
        </Link>
        <Link
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
          to="/asset/report"
        >
          월간 리포트
        </Link>
      </div>
    </div>
  );
}
