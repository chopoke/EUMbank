// src/pages/assetManagement/page/Dashboard.js
import { StatCard } from "../components/StatCard";
import { PlaceholderChart } from "../components/PlaceholderChart";
import { Link } from "react-router-dom";

export default function AssetDashboard() {
  
  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen">
      {/* 상단 타이틀 영역 */}
      <header className="content-container px-6 pt-8 md:pt-10 pb-4">
        <h1 className="text-xl font-semibold text-gray-900">자산 현황</h1>
        <p className="text-sm text-gray-500 mt-1">
          보유 중인 자산과 부채를 한눈에 확인하고, 변동 내역과 상환 일정을 관리하세요.
        </p>
      </header>

      {/* 메인 카드 */}
      <section className="content-container px-6 pb-16 md:pb-20">
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-gray-900">자산관리 허브</div>
          <div className="text-[12px] text-blue-700">분석 · 또래 비교 · 추천 · 리포트를 한 곳에서</div>
          <div className="ml-auto flex gap-2">
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/analysis">자산 분석</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/peer">또래 비교</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/recommend">맞춤 추천</Link>
            <Link className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50" to="/asset/report">월간 리포트</Link>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-8">

          {/* 핵심 수치 4칸 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="순자산"
              value="87,520,000원"
              sub="전일 대비 +320,000원"
            />
            <StatCard
              title="총자산"
              value="132,000,000원"
              sub="예금 · 적금 · 투자 · 외화 포함"
            />
            <StatCard
              title="총부채"
              value="44,480,000원"
              sub="주택담보대출 1건"
            />
            <StatCard
              title="이번 달 납입 예정액"
              value="1,200,000원"
              sub="적금 · 대출 상환 합산"
            />
          </div>

          {/* 자산 비율 / 순자산 추이 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* 자산 구성 비율 */}
            <div className="col-span-1 xl:col-span-1 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">자산 구성 비율</h2>
                  <p className="text-[12px] text-gray-500">
                    현금성 자산, 적금, 투자, 외화 등 비중입니다.
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium px-2 py-0.5 border border-blue-200">
                  예금 비중 높음
                </span>
              </div>

              <PlaceholderChart label="파이 차트 (자산 비율)" height="h-44" />

              <ul className="text-sm text-gray-700 grid grid-cols-2 gap-y-2">
                <li className="flex flex-col">
                  <span className="text-gray-500 text-[12px]">현금성 자산</span>
                  <span className="font-medium text-gray-900">42%</span>
                </li>
                <li className="flex flex-col">
                  <span className="text-gray-500 text-[12px]">적금 · 예금</span>
                  <span className="font-medium text-gray-900">28%</span>
                </li>
                <li className="flex flex-col">
                  <span className="text-gray-500 text-[12px]">투자</span>
                  <span className="font-medium text-gray-900">18%</span>
                </li>
                <li className="flex flex-col">
                  <span className="text-gray-500 text-[12px]">외화</span>
                  <span className="font-medium text-gray-900">7%</span>
                </li>
                <li className="flex flex-col">
                  <span className="text-gray-500 text-[12px]">보험</span>
                  <span className="font-medium text-gray-900">3%</span>
                </li>
                <li className="flex flex-col">
                  <span className="text-gray-500 text-[12px]">기타</span>
                  <span className="font-medium text-gray-900">2%</span>
                </li>
              </ul>
            </div>

            {/* 순자산 추이 */}
            <div className="col-span-1 xl:col-span-2 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">순자산 추이</h2>
                  <p className="text-[12px] text-gray-500">
                    최근 30일 동안의 순자산 변동입니다.
                  </p>
                </div>
                <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  자세히 보기
                </button>
              </div>

              <PlaceholderChart label="라인 차트 (순자산 추이)" height="h-52" />
            </div>
          </div>

          {/* 예금/적금 & 대출 요약 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 예금 · 적금 */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">예금 · 적금</h3>
                <div className="text-[12px] text-gray-500 -mt-1">
                  가장 잔액이 큰 순으로 정렬했습니다.
                </div>
              </div>

              <ul className="divide-y divide-gray-200 text-sm">
                <li className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">e-UM 자유입출금</div>
                    <div className="text-[12px] text-gray-500">111-2222-333333</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">28,450,000원</div>
                    <div className="text-[12px] text-blue-600 font-medium">
                      전일 대비 +30,000원
                    </div>
                  </div>
                </li>

                <li className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">e-UM 고정적금</div>
                    <div className="text-[12px] text-gray-500">12개월 만기 · 4.2%</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">12,000,000원</div>
                    <div className="text-[12px] text-gray-500">
                      월 납입 1,000,000원
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            {/* 대출 현황 */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">대출 현황</h3>
                <div className="text-[12px] text-gray-500 -mt-1">
                  금리와 상환 일정을 한눈에 확인하세요.
                </div>
              </div>

              <ul className="divide-y divide-gray-200 text-sm">
                <li className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">주택담보대출</div>
                    <div className="text-[12px] text-gray-500">
                      변동금리 3.21% · 남은 기간 17년 2개월
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">44,480,000원</div>
                    <div className="text-[12px] text-gray-500">
                      월 상환 420,000원
                    </div>
                  </div>
                </li>
              </ul>

              <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-gray-50 border-blue-200 text-blue-700">
                금리 낮은 대출로 갈아타기
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
