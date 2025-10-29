// src/pages/assetManagement/page/Recommendation.js
import { Link } from "react-router-dom";
import AssetPageHeader from "../components/AssetPageHeader";

export default function AssetRecommendation() {
  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen">
      <AssetPageHeader
        title="맞춤형 추천"
        desc="현재 자산 구조와 목표 달성률을 기준으로 자동으로 산출한 상품 및 관리 전략입니다."
        current="recommend"
      />

      <section className="content-container px-6 pt-0 pb-16 md:pb-20">
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-gray-900">자산관리 허브</div>
          <div className="text-[12px] text-blue-700">분석 · 또래 비교 · 리포트를 한 곳에서</div>
          <div className="ml-auto flex gap-2">
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/analysis">자산 분석</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/peer">또래 비교</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/report">월간 리포트</Link>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-8">

          {/* 개인화 제안 배너 */}
          <div className="rounded-md border border-blue-200 bg-blue-50 p-4 flex flex-col gap-2">
            <div className="text-[12px] font-medium text-blue-700">개인화 제안</div>
            <div className="text-base font-semibold text-gray-900">
              자동 이체로 매월 50만 원 적립 시 목표 달성 시점을 약 6개월 앞당길 수 있어요.
            </div>
            <div className="text-[12px] text-blue-700">
              현재 현금성 자산 비율이 높습니다. 일부를 중장기 상품으로 전환하는 것이 유리합니다.
            </div>
          </div>

          {/* 추천 상품 리스트 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 적금 상품 */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2">
                <span className="rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-medium px-2 py-0.5">
                  안정형
                </span>
                <h2 className="text-base font-semibold text-gray-900">
                  e-UM 목표 적금 (12개월)
                </h2>
              </div>
              <p className="text-sm text-gray-600 -mt-2">
                자동 이체만 설정하면 꾸준히 쌓이는 목표형 적금입니다.
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="rounded-md bg-white border border-gray-200 p-4">
                  <div className="text-[12px] text-gray-500">연 이자율</div>
                  <div className="font-semibold text-gray-900">연 4.2%</div>
                </div>
                <div className="rounded-md bg-white border border-gray-200 p-4">
                  <div className="text-[12px] text-gray-500">월 납입 예시</div>
                  <div className="font-semibold text-gray-900">500,000원</div>
                </div>
              </div>

              <div className="text-[12px] text-gray-500">
                납입 금액은 변경 가능하며, 중도 해지 시 이자는 변동될 수 있습니다.
              </div>

              <button className="inline-flex items-center w-fit rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-blue-700">
                가입하기
              </button>
            </div>

            {/* 대출 리파이낸스 추천 */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2">
                <span className="rounded-full bg-green-50 border border-green-200 text-green-700 text-[11px] font-medium px-2 py-0.5">
                  비용 절감
                </span>
                <h2 className="text-base font-semibold text-gray-900">
                  주택담보대출 금리 절감안
                </h2>
              </div>
              <p className="text-sm text-gray-600 -mt-2">
                현재 대출 금리보다 낮은 금리(예: 2.91% 예상)가 가능할 수 있습니다.
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="rounded-md bg-white border border-gray-200 p-4">
                  <div className="text-[12px] text-gray-500">현재 금리</div>
                  <div className="font-semibold text-gray-900">3.21%</div>
                </div>
                <div className="rounded-md bg-white border border-gray-200 p-4">
                  <div className="text-[12px] text-gray-500">예상 가능 금리</div>
                  <div className="font-semibold text-gray-900">2.91%</div>
                </div>
              </div>

              <div className="text-[12px] text-gray-500">
                실제 적용 금리는 심사 결과에 따라 달라질 수 있습니다.
              </div>

              <button className="inline-flex items-center w-fit rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                금리 비교 신청
              </button>
            </div>
          </div>

          {/* 전략 제안 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700">
              <div className="font-semibold text-gray-900 text-sm mb-1">
                비상자금은 유지하고 초과 현금은 목적성 적금으로 이동
              </div>
              <div className="text-[12px] text-gray-500">
                평균 생활비 3개월치를 제외한 현금은 장기 목표 기반 상품으로
                전환하는 것이 효율적입니다.
              </div>
            </div>

            <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700">
              <div className="font-semibold text-gray-900 text-sm mb-1">
                대출 금리 인하 = 저축 여력 증가
              </div>
              <div className="text-[12px] text-gray-500">
                월 상환액이 줄어들면, 그만큼을 적금이나 투자에 돌릴 수 있습니다.
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
