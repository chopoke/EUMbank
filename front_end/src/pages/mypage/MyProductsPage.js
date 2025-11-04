import React, { useEffect, useState } from "react";
import { fetchMyDeposits, fetchMySavings, fetchMyLoans } from "../../api/products";
import DepositDashboard from "./DepositDashboard";

export default function MyProductsPage() {
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState([]);
  const [savings, setSavings]   = useState([]);
  const [loans, setLoans]       = useState([]);
  const [error, setError]       = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [d, s, l] = await Promise.all([
          fetchMyDeposits(),
          fetchMySavings(),
          fetchMyLoans(),
        ]);
        setDeposits(d || []);
        setSavings(s || []);
        setLoans(l || []);
      } catch (e) {
        console.error("[MyProductsPage] load error:", e);
        setError(e?.response?.data?.message || e.message || "목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main className="w-full">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-6">로딩중…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-6 text-red-600">
          에러: {String(error)}
        </div>
      </main>
    );
  }

  return (
    <main className="w-full">
      {/* ✅ 다른 페이지와 동일한 폭/정렬 */}
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        <h2 className="text-2xl font-bold text-gray-800">내 상품</h2>

        {/* 예·적금 대시보드 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <DepositDashboard deposits={deposits} savings={savings} />
        </div>

        {/* 적금 목록 */}
        <section className="rounded-2xl border bg-white">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">적금 상품</h3>
          </div>
          <div className="p-6 grid gap-3">
            {savings.length === 0 && (
              <div className="text-sm text-gray-500">가입된 적금이 없습니다.</div>
            )}
            {savings.map((s) => (
              <div key={s.id} className="p-4 rounded-xl border flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.productName}</div>
                  <div className="text-xs text-gray-500">
                    납입 {s.paidInstallments ?? 0} / {s.totalInstallments ?? 0} 회
                    {s.nextDueDate && <> · 다음 납입 {s.nextDueDate}</>}
                  </div>
                </div>
                <button className="px-3 py-2 text-sm rounded-lg bg-gray-800 text-white">
                  상세 보기
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 예금 목록 */}
        <section className="rounded-2xl border bg-white">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">예금 상품</h3>
          </div>
          <div className="p-6 grid gap-3">
            {deposits.length === 0 && (
              <div className="text-sm text-gray-500">가입된 예금이 없습니다.</div>
            )}
            {deposits.map((d) => (
              <div key={d.id} className="p-4 rounded-xl border flex items-center justify-between">
                <div>
                  <div className="font-medium">{d.productName}</div>
                  <div className="text-xs text-gray-500">
                    잔액 {d.balance?.toLocaleString?.() ?? "-"}원
                    {d.maturityAt && <> · 만기 {d.maturityAt}</>}
                  </div>
                </div>
                <button className="px-3 py-2 text-sm rounded-lg bg-gray-800 text-white">
                  상세 보기
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 대출 목록 */}
        <section className="rounded-2xl border bg-white">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">대출 상품</h3>
          </div>
          <div className="p-6 grid gap-3">
            {loans.length === 0 && (
              <div className="text-sm text-gray-500">가입된 대출이 없습니다.</div>
            )}
            {loans.map((l) => (
              <div key={l.id} className="p-4 rounded-xl border flex items-center justify-between">
                <div>
                  <div className="font-medium">{l.productName}</div>
                  <div className="text-xs text-gray-500">
                    대출잔액 {Number(l.balance ?? 0).toLocaleString()}원
                    {typeof l.rate === "number" && <> · 금리 {l.rate}%</>}
                  </div>
                </div>
                <button className="px-3 py-2 text-sm rounded-lg bg-gray-800 text-white">
                  상환 내역
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
