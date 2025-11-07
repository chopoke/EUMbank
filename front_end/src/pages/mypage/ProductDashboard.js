import React, { useMemo } from "react";

/** 숫자 → 퍼센트(0~100) 안전 변환 */
const toPct = (num) => {
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
};

/** 예금 진행률: (1) 기간 기반(경과/전체 개월) 우선, (2) 없으면 잔액/목표금액 */
const calcDepositProgress = (d) => {
  const term = Number(d?.termMonths ?? 0);
  const elapsed = Number(d?.elapsedMonths ?? 0);
  if (term > 0) return toPct((elapsed / term) * 100);

  const goal = Number(d?.goalAmount ?? 0);
  const bal = Number(d?.balance ?? 0);
  if (goal > 0) return toPct((bal / goal) * 100);

  return 0;
};

/** 적금 진행률: 납입회차/전체회차 */
const calcSavingProgress = (s) => {
  const tot = Number(s?.totalInstallments ?? 0);
  const paid = Number(s?.paidInstallments ?? 0);
  if (tot > 0) return toPct((paid / tot) * 100);
  return 0;
};

export default function ProductDashboard({ deposits = [], savings = [] }) {
  // 예금: 가장 최근 1건 기준으로 게이지 하나만 보여주고 싶으면 아래처럼 pick
  const latestDeposit = useMemo(() => deposits[0], [deposits]);
  const latestSaving = useMemo(() => savings[0], [savings]);

  const depositPct = latestDeposit ? calcDepositProgress(latestDeposit) : null;
  const savingPct = latestSaving ? calcSavingProgress(latestSaving) : null;

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">예‧적금 대시보드</h2>

      {/* 적금 진행률 카드 */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        <div className="px-5 py-4 border-b border-gray-100 text-sm font-medium text-gray-700">
          적금 진행률
        </div>
        <div className="p-5">
          {latestSaving ? (
            <div className="flex items-center gap-6">
              {/* 아주 심플한 도넛 스타일 */}
              <div className="w-16 h-16 rounded-full border-8 border-gray-200 relative">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    clipPath: "inset(0 0 0 0)",
                    background:
                      `conic-gradient(#6366f1 ${savingPct}%, #e5e7eb 0)`,
                    mask: "radial-gradient(#0000 65%, #000 66%)",
                    WebkitMask: "radial-gradient(#0000 65%, #000 66%)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                  {savingPct}%
                </div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{latestSaving.productName}</div>
                <div className="text-gray-500">
                  납입 {latestSaving.paidInstallments ?? 0} / {latestSaving.totalInstallments ?? 0} 회
                  {latestSaving.nextDueDate ? ` · 다음 납입 ${latestSaving.nextDueDate}` : ""}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">가입된 적금이 없습니다.</div>
          )}
        </div>
      </div>

      {/* 예금 달성률 카드 */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        <div className="px-5 py-4 border-b border-gray-100 text-sm font-medium text-gray-700">
          예금 달성률
        </div>
        <div className="p-5">
          {latestDeposit ? (
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full border-8 border-gray-200 relative">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    clipPath: "inset(0 0 0 0)",
                    background:
                      `conic-gradient(#10b981 ${depositPct}%, #e5e7eb 0)`,
                    mask: "radial-gradient(#0000 65%, #000 66%)",
                    WebkitMask: "radial-gradient(#0000 65%, #000 66%)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                  {depositPct}%
                </div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">{latestDeposit.productName}</div>
                <div className="text-gray-500">
                  잔액 {Number(latestDeposit.balance ?? 0).toLocaleString()}원
                  {latestDeposit.goalAmount
                    ? ` / 목표 ${Number(latestDeposit.goalAmount).toLocaleString()}원`
                    : ""}
                </div>
                {latestDeposit.openedAt && latestDeposit.maturityAt && (
                  <div className="text-gray-500">
                    {latestDeposit.openedAt} ~ {latestDeposit.maturityAt} ({latestDeposit.elapsedMonths ?? 0} / {latestDeposit.termMonths ?? 0}개월)
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">가입된 예금이 없습니다.</div>
          )}
        </div>
      </div>
    </section>
  );
}
