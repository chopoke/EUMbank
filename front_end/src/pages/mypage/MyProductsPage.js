// src/pages/mypage/MyProductsPage.js
import React, { useEffect, useMemo, useState } from "react";
import { fetchMyDeposits, fetchMySavings, fetchMyLoans } from "../../api/products";
import DepositDashboard from "./DepositDashboard";

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
        const results = await Promise.allSettled([
                 fetchMyDeposits(),
                 fetchMySavings(),
                 fetchMyLoans(),
               ]);
               const [d, s, l] = results.map(r => r.status === "fulfilled" ? r.value : []);
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
    const depBal = deposits.reduce((t, d) => t + Number(d.balance ?? d.d_principal_bal ?? 0), 0);

    const nextDue =
      savings
        .map((s) => s.nextDueDate)
        .filter(Boolean)
        .sort()?.[0] || "-";

    return { depCnt, savCnt, loanCnt, depBal, nextDue };
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

  // 아이콘 통일: 예금/적금 모두 같은 아이콘 사용
  const ICON_DEPOSIT = "ri-safe-2-line";
  const ICON_SAVING  = "ri-safe-2-line"; // ← 여기!

  return (
    <main className="w-full">
      {/* 배경 패턴 */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1200px_500px_at_20%_-10%,#f0f9ff_0%,transparent_60%),radial-gradient(1200px_500px_at_80%_-10%,#ecfdf5_0%,transparent_60%)]" />

      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white/70 backdrop-blur shadow-sm">
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-200 to-teal-200 opacity-60 blur-2xl" />
          <div className="relative p-6 md:p-8">
            <div className="flex items-center gap-3">
              <i className="ri-bank-card-2-line text-2xl text-indigo-600" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
                내 상품
              </h2>
            </div>
            <p className="mt-2 text-gray-600">
              예·적금, 대출 현황을 한 눈에 확인하세요.
            </p>
          </div>
        </section>

        {/* KPI */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard icon={ICON_DEPOSIT} label="예금 개수" value={`${kpis.depCnt}개`} />
          <KpiCard icon={ICON_SAVING}  label="적금 개수" value={`${kpis.savCnt}개`} />
          <KpiCard icon="ri-hand-coin-line" label="대출 개수" value={`${kpis.loanCnt}개`} />
          <KpiCard
            icon="ri-coins-line"
            label="예금 잔액 합계"
            value={`₩${Number(kpis.depBal).toLocaleString()}`}
          />
        </section>

        {/* 대시보드 */}
        <section className="rounded-3xl border border-gray-100 bg-white/80 backdrop-blur p-6 shadow-sm">
          <DepositDashboard deposits={deposits} savings={savings} />
        </section>

        {/* 적금 */}
        <ProductSection
          title="적금 상품"
          icon={ICON_SAVING} // ← 섹션 헤더 아이콘도 동일 아이콘로 통일
          items={savings}
          emptyText="가입된 적금이 없습니다."
          renderItem={(s) => (
            <>
              <div>
                <div className="font-medium text-gray-900">{s.productName}</div>
                <div className="text-xs text-gray-500">
                  납입 {s.paidInstallments ?? 0} / {s.totalInstallments ?? 0} 회
                  {s.nextDueDate && <> · 다음 납입 {s.nextDueDate}</>}
                </div>
              </div>
              <button className="px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800">
                상세 보기
              </button>
            </>
          )}
        />

        {/* 예금 */}
        <ProductSection
          title="예금 상품"
          icon={ICON_DEPOSIT}
          items={deposits}
          emptyText="가입된 예금이 없습니다."
          renderItem={(d) => (
            <>
              <div>
                <div className="font-medium text-gray-900">{d.productName}</div>
                <div className="text-xs text-gray-500">
                  잔액 {Number(d.balance ?? d.d_principal_bal ?? 0).toLocaleString()}원
                  {d.maturityAt && <> · 만기 {d.maturityAt}</>}
                </div>
              </div>
              <button className="px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800">
                상세 보기
              </button>
            </>
          )}
        />

        {/* 대출 */}
        <ProductSection
          title="대출 상품"
          icon="ri-hand-coin-line"
          items={loans}
          emptyText="가입된 대출이 없습니다."
          renderItem={(l) => (
            <>
              <div>
                <div className="font-medium text-gray-900">{l.productName}</div>
                <div className="text-xs text-gray-500">
                  대출잔액 {Number(l.balance ?? 0).toLocaleString()}원
                  {typeof l.rate === "number" && <> · 금리 {l.rate}%</>}
                </div>
              </div>
              <button className="px-3 py-2 text-sm rounded-lg bg-gray-900 text-white hover:bg-gray-800">
                상환 내역
              </button>
            </>
          )}
        />
      </div>
    </main>
  );
}

/* ---------- 작은 구성요소들 ---------- */

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

function ProductSection({ title, icon, items, emptyText, renderItem }) {
  const isEmpty = !items || items.length === 0;
  return (
    <section className="rounded-3xl border border-gray-100 bg-white/80 backdrop-blur shadow-sm">
      <div className="px-6 py-4 border-b flex items-center gap-2">
        <i className={`${icon} text-indigo-600`} />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      {isEmpty ? (
        <div className="p-10 flex items-center justify-center">
          <EmptyIllustration text={emptyText} />
        </div>
      ) : (
        <div className="p-6 grid gap-3">
          {items.map((it, idx) => (
            <div
              key={it.id ?? idx}
              className="p-4 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50/60 transition flex items-center justify-between"
            >
              {renderItem(it)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyIllustration({ text }) {
  return (
    <div className="text-center text-gray-500">
      <svg width="120" height="80" viewBox="0 0 120 80" className="mx-auto mb-3">
        <g fill="none" stroke="#cbd5e1" strokeWidth="2">
          <rect x="10" y="20" width="100" height="50" rx="8" />
          <circle cx="35" cy="45" r="8" />
          <circle cx="85" cy="45" r="8" />
          <path d="M50 45h20" />
        </g>
      </svg>
      <div className="text-sm">{text}</div>
    </div>
  );
}
