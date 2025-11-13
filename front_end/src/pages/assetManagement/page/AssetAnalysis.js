// src/pages/assetManagement/page/Analysis.js
import { useState, useEffect, useMemo } from "react";
import AssetPageHeader from "../components/AssetPageHeader";
import { Link } from "react-router-dom";
import { CompactMonthlyChart, GoalGaugeStatic, WeeklyDeltaBarsStatic } from "../components/StaticCharts";
import { getAssetAnalysis, setAssetGoal } from "../../../api/assetApi";

const WON_FORMATTER = new Intl.NumberFormat("ko-KR");

const formatSignedWon = (value = 0) => WON_FORMATTER.format(Math.round(value));
const formatAbsoluteWon = (value = 0) => WON_FORMATTER.format(Math.round(Math.abs(value)));
const normalizeLabelKey = (value) => (value ?? "").toString().trim();

const toWonFromTenThousands = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.round(numeric * 10000);
};

const toWonFromThousands = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.round(numeric * 1000);
};

const isNumber = (value) => typeof value === "number" && !Number.isNaN(value);
const isNegligibleChange = (value) => !isNumber(value) || Math.abs(value) < 1000;

const getComparisonLabel = (periodType) => {
  switch (periodType) {
    case "DAILY":
      return "전일";
    case "WEEKLY":
      return "지난주";
    case "MONTHLY":
      return "지난달";
    case "HOURLY":
      return "직전 시간";
    case "MINUTELY":
      return "직전 분";
    default:
      return "이전 기간";
  }
};

const buildFlowNarrative = ({
  currentIncome,
  currentExpense,
  currentNet,
  previousIncome,
  previousExpense,
  previousNet,
  periodType,
}) => {
  const referenceLabel = getComparisonLabel(periodType);
  const hasPreviousNet = isNumber(previousNet);
  const hasIncomeComparison = isNumber(currentIncome) && isNumber(previousIncome);
  const hasExpenseComparison = isNumber(currentExpense) && isNumber(previousExpense);

  if (!hasPreviousNet) {
    const parts = [];
    if (isNumber(currentIncome)) {
      parts.push(`수익은 ${formatSignedWon(currentIncome)}원`);
    }
    if (isNumber(currentExpense)) {
      parts.push(`지출은 ${formatSignedWon(currentExpense)}원`);
    }
    const netSentence = `순증감은 ${formatSignedWon(currentNet ?? 0)}원입니다.`;
    const detail = parts.length ? `${parts.join(", ")}이며 ${netSentence}` : netSentence;
    return `처음 집계된 기간입니다. ${detail} 비교 정보는 다음 기간부터 제공됩니다.`;
  }

  if (!hasIncomeComparison && !hasExpenseComparison) {
    const netDiff = (currentNet ?? 0) - previousNet;
    if (isNegligibleChange(netDiff)) {
      return `${referenceLabel}와 비교해 순증감이 비슷한 수준을 유지했습니다.`;
    }
    const direction = netDiff > 0 ? "개선되었습니다" : "악화되었습니다";
    return `${referenceLabel}보다 순증감이 ${formatAbsoluteWon(netDiff)}원 ${direction}.`;
  }

  const segments = [];
  if (hasIncomeComparison) {
    const diff = (currentIncome ?? 0) - (previousIncome ?? 0);
    if (isNegligibleChange(diff)) {
      segments.push("수익은 큰 변화가 없습니다.");
    } else {
      const direction = diff > 0 ? "늘었습니다." : "줄었습니다.";
      segments.push(`수익이 ${formatAbsoluteWon(diff)}원 ${direction}`);
    }
  }

  if (hasExpenseComparison) {
    const diff = (currentExpense ?? 0) - (previousExpense ?? 0);
    if (isNegligibleChange(diff)) {
      segments.push("지출은 큰 변화가 없습니다.");
    } else {
      const direction = diff > 0 ? "늘었습니다." : "줄었습니다.";
      segments.push(`지출이 ${formatAbsoluteWon(diff)}원 ${direction}`);
    }
  }

  const netDiff = (currentNet ?? 0) - previousNet;
  let netSentence;
  if (isNegligibleChange(netDiff)) {
    netSentence = "순증감 흐름은 비슷한 수준을 유지했습니다.";
  } else {
    const direction = netDiff > 0 ? "개선되었습니다." : "악화되었습니다.";
    netSentence = `결과적으로 순증감이 ${formatAbsoluteWon(netDiff)}원 ${direction}`;
  }

  return `${referenceLabel} 대비 ${segments.join(" ")} ${netSentence}`.replace(/\s+/g, " ").trim();
};

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
  const [isDeltaDetailOpen, setDeltaDetailOpen] = useState(false);

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

  // 데이터 가공
  const goal = analysisData?.goal;
  const nextMonthSpending = analysisData?.nextMonthSpending;
  const deltaSummary = analysisData?.deltaSummary;
  const monthlyTrends = analysisData?.monthlyTrends;

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

  const trendLookup = useMemo(() => {
    const map = new Map();
    (monthlyTrends || []).forEach((entry) => {
      if (entry?.month) {
        map.set(normalizeLabelKey(entry.month), entry);
      }
    });
    return map;
  }, [monthlyTrends]);

  const deltaDetailRows = useMemo(() => {
    return limitedDeltas.map((delta, index) => {
      const label = delta?.weekLabel ?? `기간 ${index + 1}`;
      const labelKey = normalizeLabelKey(label);
      const trendEntry = trendLookup.get(labelKey);

      const rawAmount = toWonFromThousands(delta?.deltaAmount);
      const amountWon = isNumber(rawAmount) ? rawAmount : 0;

      const currentIncomeWon = trendEntry ? toWonFromTenThousands(trendEntry.income) : null;
      const currentExpenseWon = trendEntry ? toWonFromTenThousands(trendEntry.expense) : null;
      const currentTrendNetWon = trendEntry ? toWonFromTenThousands(trendEntry.net) : null;
      const currentNetWon = isNumber(currentTrendNetWon) ? currentTrendNetWon : amountWon;

      const previousDelta = index > 0 ? limitedDeltas[index - 1] : null;
      const previousLabel = previousDelta?.weekLabel ?? `기간 ${index}`;
      const previousTrendEntry = previousDelta ? trendLookup.get(normalizeLabelKey(previousLabel)) : null;
      const previousIncomeWon = previousTrendEntry ? toWonFromTenThousands(previousTrendEntry.income) : null;
      const previousExpenseWon = previousTrendEntry ? toWonFromTenThousands(previousTrendEntry.expense) : null;
      const previousTrendNetWon = previousTrendEntry ? toWonFromTenThousands(previousTrendEntry.net) : null;
      const previousNetFallback = previousDelta ? toWonFromThousands(previousDelta.deltaAmount) : null;
      const previousNetWon = isNumber(previousTrendNetWon) ? previousTrendNetWon : previousNetFallback;

      const impactDescription = buildFlowNarrative({
        currentIncome: currentIncomeWon ?? null,
        currentExpense: currentExpenseWon ?? null,
        currentNet: currentNetWon ?? amountWon,
        previousIncome: previousIncomeWon ?? null,
        previousExpense: previousExpenseWon ?? null,
        previousNet: previousNetWon,
        periodType: period,
      });

      const impactLabel =
        currentNetWon > 0 ? "순증감 개선" : currentNetWon < 0 ? "순증감 악화" : "변동 없음";

      return {
        id: `${label}-${index}`,
        label,
        netWon: currentNetWon ?? amountWon,
        impactLabel,
        impactDescription,
      };
    });
  }, [limitedDeltas, trendLookup, period]);

  const deltaDetailSummary = useMemo(() => {
    if (!deltaDetailRows.length) {
      return {
        total: 0,
        average: 0,
        positiveCount: 0,
        negativeCount: 0,
      };
    }
    const total = deltaDetailRows.reduce((sum, row) => sum + (row.netWon ?? 0), 0);
    const positiveCount = deltaDetailRows.filter((row) => (row.netWon ?? 0) > 0).length;
    const negativeCount = deltaDetailRows.filter((row) => (row.netWon ?? 0) < 0).length;
    const average = Math.round(total / deltaDetailRows.length);
    return { total, average, positiveCount, negativeCount };
  }, [deltaDetailRows]);

  const deltaSummaryText = useMemo(() => {
    if (!deltaDetailRows.length) {
      return "자산 변화 데이터를 분석 중입니다.";
    }
    return deltaDetailRows[deltaDetailRows.length - 1].impactDescription;
  }, [deltaDetailRows]);

  const trimmedMonthlyTrends = useMemo(() => {
    const source = monthlyTrends || [];
    const limit = chartSlice || getChartDefaultCount(chartPeriod);
    if (!source.length) {
      return [];
    }
    if (source.length <= limit) {
      return source;
    }
    return source.slice(source.length - limit);
  }, [monthlyTrends, chartSlice, chartPeriod]);

  const formatIsoDate = (isoString, withTime = false) => {
    if (!isoString) {
      return "-";
    }
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    if (withTime) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes()
      ).padStart(2, "0")}`;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  const resolvePeriodEndIso = (isoString, periodType) => {
    const start = new Date(isoString);
    if (Number.isNaN(start.getTime())) {
      return null;
    }
    const end = new Date(start.getTime());
    switch (periodType) {
      case "MINUTELY":
        end.setMinutes(end.getMinutes() + 1);
        break;
      case "HOURLY":
        end.setHours(end.getHours() + 1);
        break;
      case "DAILY":
        end.setDate(end.getDate() + 1);
        break;
      case "WEEKLY":
        end.setDate(end.getDate() + 7);
        break;
      case "MONTHLY":
      default:
        end.setMonth(end.getMonth() + 1);
        break;
    }
    end.setMilliseconds(end.getMilliseconds() - 1);
    return end.toISOString();
  };

  const buildCsvContent = () => {
    if (!trimmedMonthlyTrends.length) {
      return null;
    }
    const headers = [
      "기간",
      "시작일",
      "종료일",
      "수익(원)",
      "소비(원)",
      "순변동(원)",
      "순증감률(%)",
      "기간 말 순자산(원)",
      "설명",
    ];

    const rows = trimmedMonthlyTrends.map((trend, index) => {
      const incomeWonRaw = toWonFromTenThousands(trend?.income);
      const expenseWonRaw = toWonFromTenThousands(trend?.expense);
      const netWonRaw = toWonFromTenThousands(trend?.net);

      const incomeWon = isNumber(incomeWonRaw) ? incomeWonRaw : 0;
      const expenseWon = isNumber(expenseWonRaw) ? expenseWonRaw : 0;
      const netWon = isNumber(netWonRaw)
        ? netWonRaw
        : incomeWon - expenseWon;

      const netWorthWon = Math.round(Number(trend?.netWorth ?? 0));
      const baseline = netWorthWon - netWon;
      const ratio =
        baseline !== 0 ? ((netWon / Math.abs(baseline)) * 100).toFixed(2) : "0.00";
      const startIso = trend?.periodStartDate ?? "";
      const endIso = resolvePeriodEndIso(startIso, chartPeriod);

      const previousTrend = index > 0 ? trimmedMonthlyTrends[index - 1] : null;
      const prevIncomeRaw = previousTrend ? toWonFromTenThousands(previousTrend.income) : null;
      const prevExpenseRaw = previousTrend ? toWonFromTenThousands(previousTrend.expense) : null;
      const prevNetRaw = previousTrend ? toWonFromTenThousands(previousTrend.net) : null;

      const previousIncomeWon = isNumber(prevIncomeRaw) ? prevIncomeRaw : null;
      const previousExpenseWon = isNumber(prevExpenseRaw) ? prevExpenseRaw : null;
      const previousNetCandidate = isNumber(prevNetRaw)
        ? prevNetRaw
        : isNumber(prevIncomeRaw) && isNumber(prevExpenseRaw)
        ? (prevIncomeRaw ?? 0) - (prevExpenseRaw ?? 0)
        : null;

      const description = buildFlowNarrative({
        currentIncome: isNumber(incomeWonRaw) ? incomeWon : null,
        currentExpense: isNumber(expenseWonRaw) ? expenseWon : null,
        currentNet: netWon,
        previousIncome: previousIncomeWon,
        previousExpense: previousExpenseWon,
        previousNet: previousNetCandidate,
        periodType: chartPeriod,
      });

      return [
        trend?.month ?? "",
        formatIsoDate(startIso, chartPeriod === "MINUTELY" || chartPeriod === "HOURLY"),
        formatIsoDate(
          endIso,
          chartPeriod === "MINUTELY" || chartPeriod === "HOURLY"
        ),
        formatSignedWon(incomeWon),
        formatSignedWon(expenseWon),
        formatSignedWon(netWon),
        ratio,
        formatSignedWon(netWorthWon),
        description,
      ];
    });

    const escapeCsvCell = (value) => {
      if (value === null || value === undefined) {
        return "";
      }
      const stringValue = String(value);
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvLines = [headers, ...rows].map((line) =>
      line.map((cell) => escapeCsvCell(cell)).join(",")
    );
    return "\uFEFF" + csvLines.join("\r\n");
  };

  const handleCsvDownload = () => {
    const content = buildCsvContent();
    if (!content) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = URL.createObjectURL(blob);
    link.download = `asset-trend_${chartPeriod.toLowerCase()}_${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

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

  if (error) {
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

  if (!analysisData) {
    return (
      <main className="bg-gray-50 text-gray-900 min-h-screen">
        <AssetPageHeader title="자산 분석" desc="데이터가 없습니다." current="analysis" />
        <section className="content-container px-6 pb-16 md:pb-20">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">표시할 자산 분석 데이터가 없습니다.</div>
          </div>
        </section>
      </main>
    );
  }

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
                    const memoValue =
                      item.memoSample && item.memoSample !== item.category ? item.memoSample : null;
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
                          <span className="text-[11px] font-medium text-blue-600">
                            전체 대비 {percent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
                          <span>{item.paymentCount || 0}건 예정</span>
                          {dateLabel && <span>{dateLabel} 예정</span>}
                          {memoValue && (
                            <span className="max-w-[60%] truncate text-gray-400">메모: {memoValue}</span>
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
                  {deltaSummaryText}
                </div>
              </div>

              <div>
                <button
                  onClick={() => setDeltaDetailOpen(true)}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
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
              <button
                onClick={handleCsvDownload}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
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
              data={
                trimmedMonthlyTrends.map((t) => ({
                  m: t.month,
                  periodStartDate: t.periodStartDate,
                  income: chartDataTypes.income ? (t.income ? Number(t.income) : 0) : 0,
                  expense: chartDataTypes.expense ? (t.expense ? Number(t.expense) : 0) : 0,
                })) || []
              }
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

      {/* 자산 증감 상세 모달 */}
      {isDeltaDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">자산 증감 상세 내역</h3>
                <p className="mt-1 text-sm text-gray-500">
                  선택된 기간 동안 자산 변화의 흐름을 정리했습니다. 각 기간별 순증감과 코멘트를
                  확인하세요.
                </p>
              </div>
              <button
                onClick={() => setDeltaDetailOpen(false)}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs text-gray-500">순증감 합계</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {deltaDetailSummary.total >= 0 ? "+" : ""}
                  {formatSignedWon(deltaDetailSummary.total)}원
                </div>
              </div>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs text-gray-500">기간당 평균</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {deltaDetailSummary.average >= 0 ? "+" : ""}
                  {formatSignedWon(deltaDetailSummary.average)}원
                </div>
              </div>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs text-gray-500">증가 구간</div>
                <div className="mt-1 text-xl font-semibold text-emerald-600">
                  {deltaDetailSummary.positiveCount}건
                </div>
              </div>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs text-gray-500">감소 구간</div>
                <div className="mt-1 text-xl font-semibold text-rose-600">
                  {deltaDetailSummary.negativeCount}건
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left">
                      기간
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      순증감 (원)
                    </th>
                    <th scope="col" className="px-4 py-3 text-left">
                      해설
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {deltaDetailRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{row.label}</td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          (row.netWon ?? 0) > 0
                            ? "text-emerald-600"
                            : (row.netWon ?? 0) < 0
                            ? "text-rose-600"
                            : "text-gray-600"
                        }`}
                      >
                        {(row.netWon ?? 0) >= 0 ? "+" : ""}
                        {formatSignedWon(row.netWon ?? 0)}원
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="font-medium text-gray-800">{row.impactLabel}</div>
                        <div className="mt-1 text-xs text-gray-500">{row.impactDescription}</div>
                      </td>
                    </tr>
                  ))}
                  {!deltaDetailRows.length && (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                        표시할 자산 증감 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              {deltaSummaryText}
            </div>
          </div>
        </div>
      )}

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
