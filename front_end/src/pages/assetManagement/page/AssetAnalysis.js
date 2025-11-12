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
  const [chartPeriod, setChartPeriod] = useState("MONTHLY"); // 월별 변화 추이 기간: MINUTELY, HOURLY, DAILY, WEEKLY, MONTHLY
  const [chartDataTypes, setChartDataTypes] = useState({
    income: true,
    expense: true,
  });
  const [chartSlice, setChartSlice] = useState(12); // 최근 N개 구간 표시

  // period별 기본값과 최대값
  const getDefaultCount = (period) => {
    // 모든 기간에서 기본값 4로 통일
    return 4;
  };

  const getMaxCount = (period) => {
    // 일별만 최대 7일, 나머지는 5개로 제한
    if (period === "DAILY") {
      return 7; // 1주일
    }
    return 5;
  };

  // chartPeriod별 기본 데이터 개수 (드래그/줌으로 탐색 가능하도록 충분히 가져옴)
  const getChartDefaultCount = (period) => {
    switch (period) {
      case "MINUTELY":
        return 1440; // 최대 24시간 (1440분)
      case "HOURLY":
        return 720;  // 최대 30일 (720시간)
      case "DAILY":
        return 365;  // 최대 1년 (365일)
      case "WEEKLY":
        return 104;  // 최대 2년 (104주)
      case "MONTHLY":
        return 24;   // 최대 2년 (24개월)
      default:
        return 12;
    }
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const defaultChartCount = getChartDefaultCount(chartPeriod);
        const sliceCount = chartSlice || defaultChartCount;
        const data = await getAssetAnalysis(period, count, chartPeriod, sliceCount);
        setAnalysisData(data);
      } catch (err) {
        console.error("자산 분석 조회 실패:", err);
        setError(err.response?.data || "자산 분석 조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [period, count, chartPeriod, chartSlice]);

  // 차트 기간 변경 시 데이터 다시 조회
  useEffect(() => {
    const fetchChartData = async () => {
      if (!analysisData) return; // 초기 로딩 중이면 스킵
      
      try {
        // 차트 기간에 따라 데이터 조회 (기존 period는 유지하고 chartPeriod만 변경)
        const defaultChartCount = getChartDefaultCount(chartPeriod);
        const sliceCount = chartSlice || defaultChartCount;
        const data = await getAssetAnalysis(period, count, chartPeriod, sliceCount);
        setAnalysisData(prev => ({
          ...prev,
          monthlyTrends: data.monthlyTrends, // 차트 데이터만 업데이트
        }));
      } catch (err) {
        console.error("차트 데이터 조회 실패:", err);
      }
    };

    fetchChartData();
  }, [chartPeriod, period, count, chartSlice]);

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
          const defaultChartCount = getChartDefaultCount(chartPeriod);
          const sliceCount = chartSlice || defaultChartCount;
          const data = await getAssetAnalysis(period, count, chartPeriod, sliceCount);
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
  const nextMonthSpending = analysisData.nextMonthSpending;
  const deltaSummary = analysisData.deltaSummary;
  const monthlyTrends = analysisData.monthlyTrends;

  const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("ko-KR").format(Math.max(0, Number(value) || 0));

  const formatDateLabel = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const upcomingItems = nextMonthSpending?.items || [];
  const upcomingTotalAmount = nextMonthSpending?.totalAmount || 0;
  const upcomingTotalCount = nextMonthSpending?.totalPaymentCount || 0;
  const upcomingRangeText =
    nextMonthSpending?.rangeStart && nextMonthSpending?.rangeEnd
      ? `${formatDateLabel(nextMonthSpending.rangeStart)} ~ ${formatDateLabel(nextMonthSpending.rangeEnd)}`
      : "";

  const isUpcomingEmpty = !upcomingItems.length || upcomingTotalAmount <= 0;

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
  const maxCount = getMaxCount(period);
  const defaultCount = getDefaultCount(period);
  const requestedCount = count || defaultCount;
  
  // 요청한 개수만큼만 사용 (백엔드에서 더 많이 반환할 수 있으므로 제한)
  const limitedDeltas = weeklyDeltas.slice(0, Math.min(requestedCount, maxCount));
  
  const weeklyDeltaData = limitedDeltas.length > 0 
    ? limitedDeltas.map(w => Number(w.deltaAmount) || 0)
    : Array(requestedCount).fill(0); // 데이터가 없으면 요청한 개수만큼 0으로 채움
  const weeklyDeltaLabels = limitedDeltas.length > 0
    ? limitedDeltas.map(w => w.weekLabel)
    : Array(requestedCount).fill(0).map((_, i) => {
        if (period === "DAILY") return `${i + 1}일`;
        if (period === "WEEKLY") return `${i + 1}주`;
        return `${i + 1}개월`;
      });

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

            {/* 다음달 예정 지출 */}
            <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">다음달 예정 지출</h2>
                  <p className="text-[12px] text-gray-500">
                    자동·예약 이체로 확정된 지출을 미리 확인하세요.
                    {upcomingRangeText && (
                      <span className="ml-1 text-blue-500">{upcomingRangeText}</span>
                    )}
                  </p>
                </div>
                <Link
                  to="/transfer/manage"
                  className="inline-flex items-center rounded-md border border-blue-500 bg-white px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                >
                  예약이체 관리
                </Link>
              </div>

              <div className="rounded-md border border-blue-100 bg-white px-4 py-3">
                <div className="text-[12px] text-blue-500 font-medium">다음달 확정 지출 총액</div>
                <div className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatCurrency(upcomingTotalAmount)}원
                </div>
                <div className="mt-1 text-[12px] text-gray-500">
                  예정 건수 {upcomingTotalCount || 0}건
                </div>
              </div>

              {isUpcomingEmpty ? (
                <div className="flex h-full min-h-[120px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-white text-sm text-gray-500">
                  다음달에 예정된 자동·예약 이체가 없습니다.
                </div>
              ) : (
                <ul className="space-y-3">
                  {upcomingItems.map((item, index) => {
                    const percent = Math.max(0, Math.min(100, Number(item.percentage) || 0));
                    const amount = item.amount || 0;
                    const dateLabel = item.firstScheduledDate ? formatDateLabel(item.firstScheduledDate) : "";
                    return (
                      <li
                        key={`${item.category || "unknown"}-${index}`}
                        className="rounded-md border border-gray-200 bg-white px-3 py-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium text-gray-900">{item.category || "기타 예약 이체"}</div>
                          <div className="text-gray-900 font-semibold">{formatCurrency(amount)}원</div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="relative h-2 w-full rounded-full bg-gray-100">
                            <span
                              className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-blue-600">{percent.toFixed(1)}%</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                          <span>{item.paymentCount || 0}건 예정</span>
                          {dateLabel && <span>{dateLabel} 예정</span>}
                          {item.memoSample && (
                            <span className="max-w-[60%] truncate text-gray-400">메모: {item.memoSample}</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
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
          <div className="flex flex-col gap-4 rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">자산 변화 추이</h2>
                <p className="text-[12px] text-gray-500">기간별 수익(입금)과 소비(출금) 내역입니다.</p>
              </div>
              <button className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                CSV 다운로드
              </button>
            </div>

            {/* 기간 선택 및 데이터 타입 선택 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 기간 선택 */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">기간:</label>
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MINUTELY">분별</option>
                  <option value="HOURLY">시간별</option>
                  <option value="DAILY">일별</option>
                  <option value="WEEKLY">주간</option>
                  <option value="MONTHLY">월간</option>
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">최근 구간:</label>
                  <select
                    value={chartSlice}
                    onChange={(e) => setChartSlice(Number(e.target.value))}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={6}>최근 6개</option>
                    <option value={12}>최근 12개</option>
                    <option value={24}>최근 24개</option>
                    <option value={48}>최근 48개</option>
                  </select>
                </div>
              </div>

              {/* 데이터 타입 선택 */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">표시:</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chartDataTypes.income}
                      onChange={(e) => setChartDataTypes({ ...chartDataTypes, income: e.target.checked })}
                      className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">수익</span>
                  </label>
                  <label className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chartDataTypes.expense}
                      onChange={(e) => setChartDataTypes({ ...chartDataTypes, expense: e.target.checked })}
                      className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700">소비</span>
                  </label>
                </div>
              </div>
            </div>

            <CompactMonthlyChart
              data={monthlyTrends?.map(t => ({
                m: t.month,
                periodStartDate: t.periodStartDate,
                income: chartDataTypes.income ? (t.income ? Number(t.income) : 0) : 0,
                expense: chartDataTypes.expense ? (t.expense ? Number(t.expense) : 0) : 0,
              })) || []}
               height={420}
               yUnitLabel="만"
               yTicks={4}
               showIncome={chartDataTypes.income}
               showExpense={chartDataTypes.expense}
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
                <div className="text-[12px] text-gray-500">30일간 총 수익</div>
                <div className="font-semibold text-gray-900">
                  {deltaSummary?.incomeTotal ? new Intl.NumberFormat('ko-KR').format(Number(deltaSummary.incomeTotal) * 10000) : 0}원
                </div>
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-200 p-4">
                <div className="text-[12px] text-gray-500">30일간 총 소비</div>
                <div className="font-semibold text-gray-900">
                  {deltaSummary?.expenseTotal ? new Intl.NumberFormat('ko-KR').format(Number(deltaSummary.expenseTotal) * 10000) : 0}원
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
