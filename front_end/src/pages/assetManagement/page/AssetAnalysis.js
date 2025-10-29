// src/pages/assetManagement/page/Analysis.js
import { PlaceholderChart } from "../components/PlaceholderChart";
import AssetPageHeader from "../components/AssetPageHeader";
import { Link } from "react-router-dom";
import { CompactMonthlyChart, GoalGaugeStatic, WeeklyDeltaBarsStatic } from "../components/StaticCharts";

export default function AssetAnalysis() {
  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen">
      <AssetPageHeader
        title="자산 분석"
        desc="목표 달성도, 자산 배분 편중 여부, 최근 증감 내역을 분석했습니다."
        current="analysis"
      />

      <section className="content-container px-6  pb-16 md:pb-20">
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-gray-900">자산관리 허브</div>
          <div className="text-[12px] text-blue-700">또래 비교 · 추천 · 리포트를 한 곳에서</div>
          <div className="ml-auto flex gap-2">
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/peer">또래 비교</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/recommend">맞춤 추천</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/report">월간 리포트</Link>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-8">

          {/* 상단 3열 그리드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 목표 달성률 */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">목표 달성률</h2>
                <p className="text-[12px] text-gray-500">
                  설정한 목표 순자산 대비 현재 순자산입니다.
                </p>
              </div>

              {/* <PlaceholderChart label="원형 게이지 (달성률 68%)" height="h-40" /> */}
              <div className="border border-gray-200 bg-white rounded-md p-2">
                <GoalGaugeStatic value={68} />
              </div>

              <div className="text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-[12px] text-gray-500">현재 순자산</span>
                  <span className="font-medium text-gray-900">87,520,000원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-gray-500">목표 순자산</span>
                  <span className="font-medium text-gray-900">130,000,000원</span>
                </div>
                <div className="mt-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-[12px] text-blue-700 font-medium">
                  예상 달성 시점: 2027년 5월
                </div>
              </div>
            </div>

            {/* 자산 배분 분석 */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">자산 배분 분석</h2>
                <p className="text-[12px] text-gray-500">
                  현금, 예금, 투자 등 비중과 균형 상태입니다.
                </p>
              </div>

              <ul className="text-sm text-gray-700 space-y-3">
                <li className="flex justify-between">
                  <span className="text-[12px] text-gray-500">현금성 자산 비중</span>
                  <span className="font-medium text-gray-900">42%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[12px] text-gray-500">투자 자산 비중</span>
                  <span className="font-medium text-gray-900">18%</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[12px] text-gray-500">외화 비중</span>
                  <span className="font-medium text-gray-900">7%</span>
                </li>
              </ul>

              <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-[12px] text-yellow-800 font-medium">
                현금성 자산 비중이 다소 높습니다. 중장기 목표가 있다면
                적금 또는 투자 상품으로 일부 분산하는 것을 고려해 보세요.
              </div>
            </div>

            {/* 자산 증감 상태 */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">자산 증감 상태</h2>
                <p className="text-[12px] text-gray-500">
                  지난달 대비 순자산의 변화입니다.
                </p>
              </div>

              <PlaceholderChart label="막대 차트 (주간 증가/감소)" height="h-32" />

              <div className="text-sm">
                <div className="text-gray-900 font-semibold text-base">
                  지난 30일 동안 +1,240,000원 증가
                </div>
                <div className="text-[12px] text-gray-500 mt-1">
                  급여 입금, 적금 납입이 증가 요인으로 분석됩니다.
                </div>
              </div>

              <div>
                <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  상세 내역 보기
                </button>
              </div>
            </div>
          </div>

          {/* 월별 변화 추이 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">월별 변화 추이</h2>
                <p className="text-[12px] text-gray-500">
                  월별 순자산 변화와 적금·투자 납입 현황입니다.
                </p>
              </div>
              <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                CSV 다운로드
              </button>
            </div>

            <PlaceholderChart label="누적 막대 + 라인 복합 차트" height="h-64" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <div className="text-[12px] text-gray-500">순자산 증감</div>
                <div className="font-semibold text-gray-900">+1,240,000원</div>
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <div className="text-[12px] text-gray-500">적금 납입 합계</div>
                <div className="font-semibold text-gray-900">1,000,000원</div>
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <div className="text-[12px] text-gray-500">투자 매수 금액</div>
                <div className="font-semibold text-gray-900">240,000원</div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
