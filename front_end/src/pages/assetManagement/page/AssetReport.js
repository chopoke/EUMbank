// src/pages/assetManagement/page/Report.js
import AssetPageHeader from "../components/AssetPageHeader";
import { Link } from "react-router-dom";
import { CategoryBarsStatic, DonutPercentOnly } from "../components/StaticCharts";

export default function AssetReport() {
  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen">
      <AssetPageHeader
        title="월간 리포트"
        desc="이번 달 자산 요약, 지출 패턴, 목표 진행 상황을 정리했습니다."
        current="report"
      />

      <section className="content-container px-6 pt-0 pb-16 md:pb-20">
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-gray-900">자산관리 허브</div>
          <div className="text-[12px] text-blue-700">분석 · 또래 비교 · 추천를 한 곳에서</div>
          <div className="ml-auto flex gap-2">
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/analysis">자산 분석</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/peer">또래 비교</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/recommend">맞춤 추천</Link>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-8">

          {/* 상단 액션 (PDF / 상담예약) */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="text-sm text-gray-500">
              아래 정보는 전월 말 기준입니다.
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                PDF 다운로드
              </button>
              <button className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700">
                상담 예약
              </button>
            </div>
          </div>

          {/* 요약 지표 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-md bg-gray-50 border border-gray-200 p-4 flex flex-col gap-1">
              <div className="text-[12px] text-gray-500">순자산</div>
              <div className="font-semibold text-gray-900 text-base">
                87,520,000원
              </div>
              <div className="text-[12px] text-blue-700 font-medium">
                지난달 대비 +1,240,000원
              </div>
            </div>

            <div className="rounded-md bg-gray-50 border border-gray-200 p-4 flex flex-col gap-1">
              <div className="text-[12px] text-gray-500">대출 상환 부담률</div>
              <div className="font-semibold text-gray-900 text-base">
                14.2%
              </div>
              <div className="text-[12px] text-gray-500">
                소득 대비 월 상환액 비율
              </div>
            </div>

            <div className="rounded-md bg-gray-50 border border-gray-200 p-4 flex flex-col gap-1">
              <div className="text-[12px] text-gray-500">목표 달성률</div>
              <div className="font-semibold text-gray-900 text-base">
                68%
              </div>
              <div className="text-[12px] text-gray-500">
                목표 순자산 1억 3천만 원 기준
              </div>
            </div>
          </div>

          {/* 자산 구성 / 지출 패턴 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 자산 구성 비율 */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">자산 구성 비율</h2>
                <p className="text-[12px] text-gray-500 -mt-1">
                  예금, 적금, 투자, 외화 등 비율입니다.
                </p>
              </div>

              <div className="border border-gray-200 bg-white rounded-md p-3 flex items-center justify-center h-48">
                <DonutPercentOnly
                  size={160}
                  stroke={18}
                  segments={[
                    { value: 42, color: "#2563eb" },
                    { value: 28, color: "#60a5fa" },
                    { value: 18, color: "#10b981" },
                    { value: 7,  color: "#f59e0b" },
                    { value: 3,  color: "#a78bfa" },
                    { value: 2,  color: "#9ca3af" },
                  ]}
                  minLabelPct={6}
                />
              </div>
              {/* <PlaceholderChart label="파이 차트 (카테고리 비율)" height="h-48" /> */}

              <ul className="text-sm text-gray-700 grid grid-cols-2 gap-y-2">
                <li className="flex flex-col">
                  <span className="text-[12px] text-gray-500">현금성 자산</span>
                  <span className="font-medium text-gray-900">42%</span>
                </li>
                <li className="flex flex-col">
                  <span className="text-[12px] text-gray-500">투자 자산</span>
                  <span className="font-medium text-gray-900">18%</span>
                </li>
                <li className="flex flex-col">
                  <span className="text-[12px] text-gray-500">적금 · 예금</span>
                  <span className="font-medium text-gray-900">28%</span>
                </li>
                <li className="flex flex-col">
                  <span className="text-[12px] text-gray-500">외화</span>
                  <span className="font-medium text-gray-900">7%</span>
                </li>
              </ul>
            </div>

            {/* 지출 패턴 */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">지출 패턴</h2>
                <p className="text-[12px] text-gray-500 -mt-1">
                  주요 지출 카테고리와 비율입니다.
                </p>
              </div>

              <CategoryBarsStatic
                items={[
                  { label: "주거 · 관리비", value: 32 },
                  { label: "식비", value: 24 },
                  { label: "교통 · 이동", value: 11 },
                  { label: "여가 · 취미", value: 9 },
                 ]}
              />
              {/* <PlaceholderChart label="카테고리 막대 차트 (지출)" height="h-48" /> */}

              <ul className="text-sm text-gray-700 space-y-3">
                <li className="flex justify-between">
                  <span className="text-[12px] text-gray-500">주거 · 관리비</span>
                  <span className="font-medium text-gray-900">32%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[12px] text-gray-500">식비</span>
                  <span className="font-medium text-gray-900">24%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[12px] text-gray-500">교통 · 이동</span>
                  <span className="font-medium text-gray-900">11%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[12px] text-gray-500">여가 · 취미</span>
                  <span className="font-medium text-gray-900">9%</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 우선순위 (주의/안내 톤) */}
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-[12px] text-yellow-800 flex flex-col gap-3">
            <div className="font-semibold text-yellow-800 text-sm">
              이번 달 우선 관리 항목
            </div>
            <div>- 비상 자금을 제외한 여유 현금의 일부를 목표 적금으로 이동해 보세요. 자동 이체를 설정하면 더 꾸준하게 모을 수 있습니다.</div>
            <div>- 주택담보대출 금리를 다시 비교해 보세요. 낮은 금리로 갈아타면 월 상환액이 줄어들고 저축 여력이 생깁니다.</div>
            <div>- 식비 지출 비중이 상대적으로 높습니다. 주간 예산 상한을 설정하면 관리에 도움이 됩니다.</div>
          </div>

        </div>
      </section>
    </main>
  );
}
