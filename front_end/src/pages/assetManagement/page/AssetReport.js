// src/pages/assetManagement/page/AssetReport.js
import { useState, useEffect, useMemo } from "react";
import AssetPageHeader from "../components/AssetPageHeader";
import AssetCashflowCalendar from "./AssetCashflowCalendar";
import { CategoryBarsStatic } from "../components/StaticCharts";
import { Link } from "react-router-dom";
import { getMonthlyReport, getDailyTransactions } from "../../../api/assetApi";
import TransactionDetailModal from "./TransactionDetailModal";
import AssetHubNav from "../components/AssetHubNav";

/**
 * 월간 리포트 페이지
 * 캘린더에 일별 증감을 표시하고, 날짜 클릭 시 상세 거래 내역 모달 표시
 */
export default function AssetReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyTransactions, setDailyTransactions] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // 월별 리포트 데이터 로드
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMonthlyReport(currentYear, currentMonth);
        setReportData(data);
      } catch (err) {
        console.error("월별 리포트 조회 실패:", err);
        // 에러 메시지를 문자열로 변환
        const errorData = err.response?.data;
        let errorMessage = "월별 리포트 조회 중 오류가 발생했습니다.";

        if (errorData) {
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [currentYear, currentMonth]);

  // 일별 거래 내역 로드 (모달용)
  useEffect(() => {
    if (!selectedDate) {
      setDailyTransactions(null);
      return;
    }

    const fetchDailyTransactions = async () => {
      try {
        setModalLoading(true);
        const dateStr = selectedDate.toISOString().split('T')[0];
        const data = await getDailyTransactions(dateStr);
        setDailyTransactions(data);
      } catch (err) {
        console.error("일별 거래 상세 조회 실패:", err);
        setDailyTransactions(null);
      } finally {
        setModalLoading(false);
      }
    };

    fetchDailyTransactions();
  }, [selectedDate]);

  // 캘린더용 거래 데이터 변환
  const calendarTransactions = useMemo(() => {
    if (!reportData?.dailySummaries) return [];

    return reportData.dailySummaries.flatMap(daily => {
      const transactions = [];

      if (daily.income > 0) {
        transactions.push({
          date: daily.date,
          type: "income",
          amount: daily.income,
          title: `수입 ${fmt(daily.income)}원`,
        });
      }

      if (daily.expense > 0) {
        transactions.push({
          date: daily.date,
          type: "expense",
          amount: daily.expense,
          title: `지출 ${fmt(daily.expense)}원`,
        });
      }

      return transactions;
    });
  }, [reportData]);

  // 월간 합계
  const income = reportData?.totalIncome || 0;
  const expense = reportData?.totalExpense || 0;
  const net = reportData?.netChange || 0;

  // 지출 카테고리 데이터 변환
  const spendCategories = useMemo(() => {
    if (!reportData?.categorySummaries) return [];

    return reportData.categorySummaries.map(cat => ({
      label: cat.label,
      value: cat.percentage || 0,
    }));
  }, [reportData]);

  // 월간 네비게이션
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // CSV 다운로드
  const handleDownloadCSV = () => {
    if (!reportData?.dailySummaries) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }

    const csvContent = [
      ["날짜", "수입", "지출", "순변동", "거래건수"],
      ...reportData.dailySummaries.map(daily => [
        daily.date,
        daily.income || 0,
        daily.expense || 0,
        daily.netChange || 0,
        daily.transactionCount || 0,
      ]),
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `월간리포트_${currentYear}-${String(currentMonth).padStart(2, '0')}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 날짜 클릭 핸들러
  const handleDayClick = (dateStr) => {
    const date = new Date(dateStr);
    setSelectedDate(date);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setSelectedDate(null);
    setDailyTransactions(null);
  };

  // 디자인 일관화를 위한 공통 클래스
  const card = "rounded-2xl border border-gray-100 bg-white shadow-sm";
  const subtle = "text-[12px] text-gray-500";

  // 로딩 상태
  if (loading) {
    return (
      <main className="bg-gray-50 text-gray-900 min-h-screen">
        <AssetPageHeader
          title="월간 리포트"
          desc="데이터를 불러오는 중..."
          current="report"
        />
        <section className="content-container max-w-7xl mx-auto px-6 pt-0 pb-16 md:pb-20">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">데이터를 불러오는 중...</div>
          </div>
        </section>
      </main>
    );
  }

  // 에러 상태
  if (error || !reportData) {
    // 에러 메시지가 문자열인지 확인
    const errorDisplay = typeof error === 'string'
      ? error
      : (error?.message || error?.detail || JSON.stringify(error) || "데이터를 불러올 수 없습니다.");

    return (
      <main className="bg-gray-50 text-gray-900 min-h-screen">
        <AssetPageHeader
          title="월간 리포트"
          desc="데이터 조회 실패"
          current="report"
        />
        <section className="content-container max-w-7xl mx-auto px-6 pt-0 pb-16 md:pb-20">
          <div className="flex items-center justify-center py-20">
            <div className="text-red-500">{errorDisplay}</div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 text-gray-900 min-h-screen">
      {/* 상단 타이틀 영역 */}
      <header className="content-container px-6 pt-8 md:pt-10 pb-4">
        <h1 className="text-xl font-semibold text-gray-900">월간 리포트</h1>
        <p className="text-sm text-gray-500 mt-1">
          이번 달 수입·지출 캘린더와 지출 카테고리를 한눈에 확인하세요.
        </p>
      </header>

      <section className="content-container max-w-7xl mx-auto px-6 pt-0 pb-16 md:pb-20">
        <AssetHubNav />

        <div className={`${card} p-5 md:p-6`}>
          {/* 상단 툴바: 월 네비게이션 + 범례 + 내보내기 */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* 월 네비게이션 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition"
                aria-label="이전 달"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {currentYear}년 {currentMonth}월
              </span>
              <button
                onClick={handleNextMonth}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition"
                aria-label="다음 달"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                <LegendDot color="bg-emerald-500" label="수입" />
                <LegendDot color="bg-red-500" label="지출" />
              </div>

              {/* CSV 다운로드 버튼 */}
              <button
                onClick={handleDownloadCSV}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-70">
                  <path fill="currentColor" d="M5 20h14v-8h2v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9h2zM12 3l5 5h-3v6h-4V8H7l5-5z"/>
                </svg>
                CSV 다운로드
              </button>
            </div>
          </div>

          {/* 본문: 좌(달력) 2, 우(카테고리) 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 캘린더 */}
            <div className="lg:col-span-2">
              <div className={`${card} p-4 md:p-5`}>
                <AssetCashflowCalendar
                  month={`${currentYear}-${String(currentMonth).padStart(2, '0')}`}
                  transactions={calendarTransactions}
                  onDayClick={handleDayClick}
                  onEventClick={(e) => {
                    // 거래 클릭 시에도 해당 날짜의 모달 표시
                    if (e.date) {
                      handleDayClick(e.date);
                    }
                  }}
                  tagClassMap={{
                    income: "inline-flex items-center gap-1 text-xs font-medium text-emerald-600 cursor-pointer hover:underline",
                    expense: "inline-flex items-center gap-1 text-xs font-medium text-red-600 cursor-pointer hover:underline",
                    auto: "inline-flex items-center gap-1 text-xs font-medium text-blue-600 cursor-pointer hover:underline",
                  }}
                />
              </div>

              {/* 월간 합계 박스 */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard label="수입 합계" value={fmt(income) + "원"} tone="emerald" />
                <StatCard label="지출 합계" value={fmt(expense) + "원"} tone="red" />
                <StatCard
                  label="이번 달 순변동"
                  value={`${net >= 0 ? "+" : ""}${fmt(net)}원`}
                  tone={net >= 0 ? "blue" : "red"}
                />
              </div>
            </div>

            {/* 지출 카테고리(우측 패널은 sticky + 화이트 카드) */}
            <aside className="lg:col-span-1 lg:sticky lg:top-24 self-start">
              <div className={`${card} p-4`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-gray-900">지출 카테고리</h2>
                  <span className={subtle}>이번 달</span>
                </div>

                {spendCategories.length > 0 ? (
                  <>
                    <CategoryBarsStatic items={spendCategories} unit="%" />
                    <ul className="mt-3 text-[12px] text-gray-500 space-y-1">
                      {spendCategories.length > 0 && (
                        <li>
                          가장 큰 지출: <b>{spendCategories[0].label}</b> ({spendCategories[0].value.toFixed(1)}%)
                        </li>
                      )}
                    </ul>
                  </>
                ) : (
                  <div className="text-[12px] text-gray-400 py-4">지출 데이터가 없습니다.</div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* 거래 상세 모달 */}
      {selectedDate && (
        <TransactionDetailModal
          date={selectedDate}
          transactions={dailyTransactions}
          loading={modalLoading}
          onClose={handleCloseModal}
        />
      )}
    </main>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function StatCard({ label, value, tone = "gray" }) {
  const tones = {
    gray: "text-gray-900",
    red: "text-red-600",
    blue: "text-blue-700",
    emerald: "text-emerald-600",
  };
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="text-[12px] text-gray-500">{label}</div>
      <div className={`font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  );
}

function fmt(n) {
  return (n ?? 0).toLocaleString();
}
