import React from "react";
import { won } from "../../util/money";

export default function AccountPickers({ accounts, useSameAccount, setUseSameAccount, form, setForm }) {
  return (
    <div className="rounded-2xl border border-gray-100 shadow-sm bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
          <i className="ri-bank-line" />
        </span>
        <h3 className="font-semibold text-gray-800">지급/상환 계좌 (기본: 동일 계좌)</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="text-gray-600">지급 계좌 (자금 입금)</span>
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
            value={form.payoutAccountNo}
            onChange={(e) =>
              setForm((s) => {
                const nextPayout = e.target.value;
                const nextRepay = useSameAccount ? nextPayout : s.repayAccountNo;
                return { ...s, payoutAccountNo: nextPayout, repayAccountNo: nextRepay };
              })
            }
          >
            {accounts.map((a) => (
              <option key={a.a_no} value={a.a_no} disabled={a.a_no === form.repayAccountNo}>
                {a.a_account_no} · {a.a_nickname || a.a_account_type} · 잔액 {won(a.a_balance)}원
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2 mt-3">
          <input
            id="useSameAccount"
            type="checkbox"
            className="h-4 w-4"
            checked={!useSameAccount}   // 체크 = 다른 계좌 사용
            onChange={(e) => {
              const useDifferent = e.target.checked;
              setUseSameAccount(!useDifferent);
              setForm((prev) => {
                if (!useDifferent) return { ...prev, repayAccountNo: prev.payoutAccountNo };
                const alt = accounts.find(a => String(a.a_no) !== String(prev.payoutAccountNo));
                return { ...prev, repayAccountNo: alt ? alt.a_no : "" };
              });
            }}
          />
          <label htmlFor="useSameAccount" className="text-sm text-gray-700 select-none">
            다른 계좌로 상환하기
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-gray-600">상환 계좌 (매월 출금)</span>
          {useSameAccount ? (
            <div className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
              {(() => {
                const a = accounts.find(x => String(x.a_no) === String(form.payoutAccountNo));
                return a
                  ? `${a.a_account_no} · ${a.a_nickname || a.a_account_type} · 잔액 ${won(a.a_balance)}원`
                  : "선택된 지급 계좌와 동일";
              })()}
            </div>
          ) : (
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/70 outline-none px-3 py-2 transition"
              value={form.repayAccountNo}
              onChange={(e) => setForm((s) => ({ ...s, repayAccountNo: e.target.value }))}
            >
              {accounts.map((a) => (
                <option
                  key={a.a_no}
                  value={a.a_no}
                  disabled={String(a.a_no) === String(form.payoutAccountNo)}
                >
                  {a.a_account_no} · {a.a_nickname || a.a_account_type} · 잔액 {won(a.a_balance)}원
                </option>
              ))}
            </select>
          )}
        </label>
      </div>

      {!useSameAccount && accounts.length < 2 && (
        <div className="text-xs text-orange-600 mt-2">
          다른 계좌로 상환하려면 사용 가능한 계좌가 2개 이상 필요합니다.
        </div>
      )}
      {accounts.length < 2 && (
        <div className="text-xs text-orange-600 mt-2">
          사용 가능한 계좌가 2개 이상 있어야 서로 다른 지급/상환 계좌를 선택할 수 있습니다.
        </div>
      )}
    </div>
  );
}