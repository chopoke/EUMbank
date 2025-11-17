// src/pages/mypage/MyProductsPage.js
import React, { useEffect, useMemo, useState } from "react";
import { fetchMyDeposits, fetchMySavings, fetchMyLoans } from "../../api/products";
import DepositDashboard from "./DepositDashboard";
import LoanDashboard from "./LoanDashboard";

export default function MyProductsPage() {
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState([]);
  const [savings, setSavings] = useState([]);
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [d, s, l] = await Promise.all([
          fetchMyDeposits().catch(() => []),
          fetchMySavings().catch(() => []),
          fetchMyLoans().catch(() => []),
        ]);
        setDeposits(Array.isArray(d) ? d : []);
        setSavings(Array.isArray(s) ? s : []);
        setLoans(Array.isArray(l) ? l : []);
      } catch (e) {
        setError(e?.response?.data?.message || e.message || "목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const kpis = useMemo(() => {
    const depCnt = deposits.length;
    const savCnt = savings.length;
    const loanCnt = loans.length;
    const depBal = deposits.reduce((t, d) => t + Number(d.balance ?? 0), 0);
    return { depCnt, savCnt, loanCnt, depBal };
  }, [deposits, savings, loans]);

  if (loading) {
    return (
      <main className="w-full">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-40 rounded-2xl bg-gradient-to-r from-indigo-100 to-teal-100 animate-pulse" />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-10 text-red-600">
          에러: {String(error)}
        </div>
      </main>
    );
  }

  const ICON_DEPOSIT = "ri-safe-2-line";
  const ICON_SAVING = "ri-safe-2-line";

  return (
    <main className="w-full">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_20%_-10%,#f0f9ff_0%,transparent_60%),radial-gradient(1200px_500px_at_80%_-10%,#ecfdf5_0%,transparent_60%)]" />
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white/70 backdrop-blur shadow-sm">
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-200 to-teal-200 opacity-60 blur-2xl" />
          <div className="relative p-6 md:p-8">
            <div className="flex items-center gap-3">
              <i className="ri-bank-card-2-line text-2xl text-indigo-600" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">내 상품</h2>
            </div>
            <p className="mt-2 text-gray-600">예·적금, 대출 현황을 한 눈에 확인하세요.</p>
          </div>
        </section>

        {/* KPI */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard icon={ICON_DEPOSIT} label="예금 개수" value={`${kpis.depCnt}개`} />
          <KpiCard icon={ICON_SAVING} label="적금 개수" value={`${kpis.savCnt}개`} />
          <KpiCard icon="ri-hand-coin-line" label="대출 개수" value={`${kpis.loanCnt}개`} />
          <KpiCard icon="ri-coins-line" label="예금 잔액 합계" value={`₩${Number(kpis.depBal).toLocaleString()}`} />
        </section>

        {/* 예·적금 */}
        <section className="rounded-3xl border border-gray-100 bg-white/80 backdrop-blur p-6 shadow-sm">
          <DepositDashboard deposits={deposits} savings={savings} />
        </section>

        {/* 대출 */}
        <LoanDashboard loans={loans} />
      </div>
    </main>
  );
}

function KpiCard({ icon, label, value }) {
  return (
    <div className="relative rounded-2xl border border-gray-100 bg-white/80 backdrop-blur p-4 shadow-sm hover:shadow transition">
      <div className="absolute right-3 top-3 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-50 to-teal-50 blur-xl" />
      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white flex items-center justify-center shadow-sm">
          <i className={`${icon} text-lg`} />
        </div>
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-lg font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
}
