// src/pages/assetManagement/page/Analysis.js
import { useState, useEffect } from "react";
import AssetPageHeader from "../components/AssetPageHeader";
import { Link } from "react-router-dom";
import { CompactMonthlyChart, GoalGaugeStatic, WeeklyDeltaBarsStatic } from "../components/StaticCharts";
import { getAssetAnalysis, setAssetGoal } from "../../../api/assetApi";

export default function AssetAnalysis() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [period, setPeriod] = useState("WEEKLY"); // DAILY, WEEKLY, MONTHLY
  const [count, setCount] = useState(null); // null이면 기본값 사용

  // period별 기본값과 최대값
  const getDefaultCount = (period) => {
    switch (period) {
      case "DAILY": return 7;
      case "WEEKLY": return 4;
      case "MONTHLY": return 6;
      default: return 4;
    }
  };

  const getMaxCount = (period) => {
    // 모든 기간에서 최대 5개로 제한 (카드 크기 고려)
    return 5;
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const data = await getAssetAnalysis(period, count);
        setAnalysisData(data);
      } catch (err) {
        console.error("자산 분석 조회 실패:", err);
        setError(err.response?.data || "자산 분석 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [period, count]);

  // 목표 설정 제출 핸들러
  const handleGoalSubmit = async () => {
    if (!goalInput || isNaN(Number(goalInput)) || Number(goalInput) <= 0) {
      alert("올바른 금액을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await setAssetGoal({
        targetAmount: Number(goalInput),
        targetDate: null
      });
      alert("목표가 설정되었습니다.");
      setShowGoalModal(false);
      setGoalInput("");
      
      // 데이터 새로고침
      const fetchAnalysis = async () => {
        try {
          const data = await getAssetAnalysis(period, count);
          setAnalysisData(data);
        } catch (err) {
          console.error("자산 분석 조회 실패:", err);
        }
      };
      fetchAnalysis();
    } catch (err) {
      console.error("목표 설정 실패:", err);
      alert(err.response?.data || "목표 설정 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <main className="bg-gray-50 text-gray-900 min-h-screen">
        <AssetPageHeader title="자산 분석" desc="데이터를 불러오는 중..." current="analysis" />
        <section className="content-container px-6 pb-16 md:pb-20">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">데이터를 불러오는 중...</div>
          </div>
        </section>
      </main>
    );
  }

  // 에러 상태
  if (error || !analysisData) {
    return (
      <main className="bg-gray-50 text-gray-900 min-h-screen">
        <AssetPageHeader title="자산 분석" desc="데이터 조회 실패" current="analysis" />
        <section className="content-container px-6 pb-16 md:pb-20">
          <div className="flex items-center justify-center py-20">
            <div className="text-red-500">{error || "데이터를 불러올 수 없습니다."}</div>
          </div>
        </section>
      </main>
    );
  }

  // 데이터 가공
  const goal = analysisData.goal;
  const distribution = analysisData.distribution;
  const deltaSummary = analysisData.deltaSummary;
  const monthlyTrends = analysisData.monthlyTrends;

  // 달성률 퍼센트 계산
  const achievementRate = goal?.achievementRate ? Number(goal.achievementRate) : 68;
  
  // 예상 달성 시점 포맷팅
  const expectedDate = goal?.expectedAchievementDate 
    ? goal.expectedAchievementDate.toString().split('-')
    : null;
  const expectedDateFormatted = expectedDate 
    ? `${expectedDate[0]}년 ${parseInt(expectedDate[1])}월`
    : "2027년 5월";

  // 주차별 증감 데이터 변환 (천원 단위)
  // 데이터가 없으면 빈 배열 대신 0으로 채운 배열 사용
  const weeklyDeltas = deltaSummary?.weeklyDeltas || [];
  const weeklyDeltaData = weeklyDeltas.length > 0 
    ? weeklyDeltas.map(w => Number(w.deltaAmount) || 0)
    : [0, 0, 0, 0]; // 데이터가 없으면 모두 0
  const weeklyDeltaLabels = weeklyDeltas.length > 0
    ? weeklyDeltas.map(w => w.weekLabel)
    : ["1주", "2주", "3주", "4주"];

  // 30일 증감 (원 단위로 받아서 표시)
  const totalDelta30 = deltaSummary?.totalDelta30Days 
    ? Number(deltaSummary.totalDelta30Days)
    : 0;

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

              <div className="border border-gray-200 bg-white rounded-md p-2">
                <GoalGaugeStatic value={achievementRate} />
              </div>

              <div className="text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-[12px] text-gray-500">현재 순자산</span>
                  <span className="font-medium text-gray-900">
                    {goal?.currentNetWorth ? new Intl.NumberFormat('ko-KR').format(Number(goal.currentNetWorth)) : '0'}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-gray-500">목표 순자산</span>
                  <span className="font-medium text-gray-900">
                    {goal?.targetNetWorth ? new Intl.NumberFormat('ko-KR').format(Number(goal.targetNetWorth)) : '0'}원
                  </span>
                </div>
                <div className="mt-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-[12px] text-blue-700 font-medium">
                  예상 달성 시점: {expectedDateFormatted}
                </div>
              </div>
              
              <button
                onClick={() => setShowGoalModal(true)}
                className="w-full rounded-md border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                목표 설정
              </button>
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
                  <span className="font-medium text-gray-900">
                    {distribution?.cashPercentage ? distribution.cashPercentage.toFixed(0) : 0}%
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[12px] text-gray-500">예금 자산 비중</span>
                  <span className="font-medium text-gray-900">
                    {distribution?.depositPercentage ? distribution.depositPercentage.toFixed(0) : 0}%
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[12px] text-gray-500">투자 자산 비중</span>
                  <span className="font-medium text-gray-900">
                    {distribution?.investmentPercentage ? distribution.investmentPercentage.toFixed(0) : 0}%
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-[12px] text-gray-500">외화 비중</span>
                  <span className="font-medium text-gray-900">
                    {distribution?.foreignPercentage ? distribution.foreignPercentage.toFixed(0) : 0}%
                  </span>
                </li>
              </ul>

              <div className="rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-[12px] text-yellow-800 font-medium">
                {distribution?.recommendation || "자산 분석 중..."}
              </div>
            </div>

            {/* 자산 증감 상태 */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold text-gray-900">자산 증감 상태</h2>
                  <div className="flex items-center gap-2">
                    {/* 기간 선택 */}
                    <select
                      value={period}
                      onChange={(e) => {
                        setPeriod(e.target.value);
                        setCount(null); // period 변경 시 count 초기화
                      }}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="DAILY">일간</option>
                      <option value="WEEKLY">주간</option>
                      <option value="MONTHLY">월간</option>
                    </select>
                    {/* 개수 선택 */}
                    <select
                      value={count || getDefaultCount(period)}
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value);
                        setCount(newCount === getDefaultCount(period) ? null : newCount);
                      }}
                      className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: getMaxCount(period) }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num}{period === "DAILY" ? "일" : period === "WEEKLY" ? "주" : "개월"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-[12px] text-gray-500">
                  {period === "DAILY" 
                    ? "일별 자산 증감 변화입니다." 
                    : period === "WEEKLY"
                    ? "주간별 자산 증감 변화입니다."
                    : "월별 자산 증감 변화입니다."}
                </p>
              </div>

              <WeeklyDeltaBarsStatic
                data={weeklyDeltaData}
                labels={weeklyDeltaLabels}
              />

              <div className="text-sm">
                <div className="text-gray-900 font-semibold text-base">
                  {period === "DAILY" 
                    ? `최근 ${count || getDefaultCount(period)}일 동안 `
                    : period === "WEEKLY"
                    ? `최근 ${count || getDefaultCount(period)}주 동안 `
                    : `최근 ${count || getDefaultCount(period)}개월 동안 `}
                  {totalDelta30 >= 0 ? '+' : ''}{new Intl.NumberFormat('ko-KR').format(totalDelta30)}원 {totalDelta30 >= 0 ? '증가' : '감소'}
                </div>
                <div className="text-[12px] text-gray-500 mt-1">
                  {deltaSummary?.trendDescription || "자산 변화 분석 중..."}
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

            <CompactMonthlyChart
              data={monthlyTrends?.map(t => ({
                m: t.month,
                save: t.savingAmount ? Number(t.savingAmount) : 0,
                invest: t.investmentAmount ? Number(t.investmentAmount) : 0,
                net: t.netAssetChange ? Number(t.netAssetChange) : 0
              })) || [
                {m : "7월", save:350, invest:120, net:420},
                { m: "8월",  save: 300, invest: 140, net: 360 },
                { m: "9월",  save: 320, invest:  90, net: 280 },
                { m: "10월", save: 330, invest: 110, net: 410 },
              ]}
               height={420}
               yMode="bar"
               yUnitLabel="만"
               yTicks={4}
            />
            {/* <StackedBarMonthlyStatic /> */}
            {/* <PlaceholderChart label="누적 막대 + 라인 복합 차트" height="h-64" /> */}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <div className="text-[12px] text-gray-500">순자산 증감</div>
                <div className="font-semibold text-gray-900">
                  {totalDelta30 >= 0 ? '+' : ''}{new Intl.NumberFormat('ko-KR').format(totalDelta30)}원
                </div>
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <div className="text-[12px] text-gray-500">적금 납입 합계</div>
                <div className="font-semibold text-gray-900">
                  {deltaSummary?.savingTotal ? new Intl.NumberFormat('ko-KR').format(Number(deltaSummary.savingTotal) * 10000) : 0}원
                </div>
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <div className="text-[12px] text-gray-500">투자 매수 금액</div>
                <div className="font-semibold text-gray-900">
                  {deltaSummary?.investmentTotal ? new Intl.NumberFormat('ko-KR').format(Number(deltaSummary.investmentTotal) * 10000) : 0}원
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 목표 설정 모달 */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">목표 순자산 설정</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                목표 금액 (원)
              </label>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="예: 100000000"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                현재 순자산: {goal?.currentNetWorth ? new Intl.NumberFormat('ko-KR').format(Number(goal.currentNetWorth)) : '0'}원
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowGoalModal(false);
                  setGoalInput("");
                }}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                취소
              </button>
              <button
                onClick={handleGoalSubmit}
                className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                disabled={submitting}
              >
                {submitting ? "설정 중..." : "설정 완료"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
