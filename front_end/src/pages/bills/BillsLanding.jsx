// src/pages/bills/BillsLanding.jsx
import React, { useMemo, useState } from "react";
// import api from "../../api/axios"; // 실제 연동 시 해제

/**
 * 공과금 첫 화면 (Landing)
 * - 카테고리 선택 → 식별값 입력 → 조회 → 납부
 * - TODO 지점에 API 연동 추가
 */
export default function BillsLanding() {
  const categories = useMemo(
    () => [
      { key: "electric", label: "전기", icon: "⚡" },
      { key: "water", label: "수도", icon: "💧" },
      { key: "gas", label: "가스", icon: "🔥" },
      { key: "telco", label: "통신", icon: "📶" },
      { key: "nat_tax", label: "국세", icon: "🏛️" },
      { key: "loc_tax", label: "지방세", icon: "🏙️" },
    ],
    []
  );

  const [type, setType] = useState("electric");
  const [form, setForm] = useState({ subscriberNo: "", customerNo: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState(null); // { orgName, billMonth, dueDate, amount, autoPay }
  const [account, setAccount] = useState("");
  const [history, setHistory] = useState(() => mockHistory());

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function lookup() {
    setMsg("");
    setLoading(true);
    setResult(null);
    try {
      // TODO: 실제 API 연동
      // const { data } = await api.get(`/api/bill/${type}/lookup`, { params: form });
      // setResult(data);
      await delay(400);
      setResult(mockLookup(type, form));
    } catch (e) {
      setMsg("조회 실패. 입력값을 확인하세요.");
    } finally {
      setLoading(false);
    }
  }

  async function payNow() {
    if (!result || !account) return;
    setMsg("");
    setLoading(true);
    try {
      // TODO: 실제 결제 API 연동
      // await api.post(`/api/bill/pay`, { type, ...form, accountNo: account });
      await delay(500);

      const paid = {
        id: Math.random().toString(36).slice(2),
        date: new Date().toISOString().slice(0, 10),
        item: `${labelOf(type)} ${result.billMonth}`,
        amount: result.amount,
        status: "완료",
      };
      setHistory((h) => [paid, ...h].slice(0, 10));
      setResult(null);
      setAccount("");
      alert("납부가 완료되었습니다.");
    } catch (e) {
      setMsg("납부 실패. 다시 시도하세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">공과금 납부</h1>
        <p className="text-gray-500 mt-1">전기·수도·가스·통신·세금을 한 곳에서 납부하세요.</p>
      </header>

      {/* 카테고리 */}
      <nav className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6">
        {categories.map((c) => {
          const active = c.key === type;
          return (
            <button
              key={c.key}
              onClick={() => {
                setType(c.key);
                setResult(null);
                setMsg("");
              }}
              className={
                "group flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition " +
                (active
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50")
              }
            >
              <span aria-hidden>{c.icon}</span>
              <span className="hidden sm:inline">{c.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 조회 카드 */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-4">요금 조회</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">납부자 번호</label>
            <input
              type="text"
              name="subscriberNo"
              value={form.subscriberNo}
              onChange={onChange}
              placeholder="예: 1234-5678-90"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">고객번호/계약번호</label>
            <input
              type="text"
              name="customerNo"
              value={form.customerNo}
              onChange={onChange}
              placeholder="기관 청구서의 고객번호"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={lookup}
              disabled={loading || !form.subscriberNo || !form.customerNo}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {loading ? "조회 중" : "조회"}
            </button>
          </div>
        </div>

        {msg && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {msg}
          </p>
        )}

        {/* 조회 결과 */}
        {result && (
          <div className="mt-6 rounded-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <KV label="납부기관" value={result.orgName} />
              <KV label="청구월" value={result.billMonth} />
              <KV label="납기일" value={result.dueDate} />
              <KV label="금액" value={formatKRW(result.amount)} strong />
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">결제 계좌</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                >
                  <option value="">계좌 선택</option>
                  {/* TODO: 실제 보유계좌 목록으로 치환 */}
                  <option value="110-123-456789">입출금통장 110-123-456789</option>
                  <option value="3333-01-9876543">자유예금 3333-01-9876543</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={payNow}
                  disabled={loading || !account}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {loading ? "처리 중" : "납부하기"}
                </button>
              </div>
            </div>

            {result.autoPay && (
              <p className="mt-3 text-xs text-gray-500">이 청구서는 자동이체 등록 상태입니다.</p>
            )}
          </div>
        )}
      </section>

      {/* 납부 이력 */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-medium text-gray-900">최근 납부 내역</h3>
          <button className="text-sm text-blue-600 hover:underline">전체 보기</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TH>날짜</TH>
                <TH>항목</TH>
                <TH align="right">금액</TH>
                <TH>상태</TH>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {history.map((h) => (
                <tr key={h.id}>
                  <TD>{h.date}</TD>
                  <TD>{h.item}</TD>
                  <TD align="right">{formatKRW(h.amount)}</TD>
                  <TD>
                    <span
                      className={
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                        (h.status === "완료"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-yellow-50 text-yellow-700 border border-yellow-200")
                      }
                    >
                      {h.status}
                    </span>
                  </TD>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                    최근 납부 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ───────── sub components ───────── */

function KV({ label, value, strong }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={(strong ? "text-xl font-semibold " : "text-base font-medium ") + "text-gray-900"}>
        {value}
      </p>
    </div>
  );
}

function TH({ children, align = "left" }) {
  return (
    <th
      className={
        "px-4 py-2 text-xs font-medium text-gray-500 " + (align === "right" ? "text-right" : "text-left")
      }
    >
      {children}
    </th>
  );
}

function TD({ children, align = "left" }) {
  return (
    <td className={"px-4 py-2 text-sm text-gray-700 " + (align === "right" ? "text-right" : "text-left")}>
      {children}
    </td>
  );
}

/* ───────── utils & mocks ───────── */

function formatKRW(n) {
  const v = Number(n || 0);
  return v.toLocaleString("ko-KR") + "원";
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function labelOf(key) {
  switch (key) {
    case "electric":
      return "전기";
    case "water":
      return "수도";
    case "gas":
      return "가스";
    case "telco":
      return "통신";
    case "nat_tax":
      return "국세";
    case "loc_tax":
      return "지방세";
    default:
      return key;
  }
}

function mockLookup(type, form) {
  return {
    orgName: `${labelOf(type)} 공사`,
    billMonth: "2025-10",
    dueDate: "2025-11-10",
    amount: Math.floor(20000 + Math.random() * 70000),
    autoPay: Math.random() < 0.3,
    key: `${type}:${form.subscriberNo}:${form.customerNo}`,
  };
}

function mockHistory() {
  return [
    { id: "h1", date: "2025-10-05", item: "전기 2025-09", amount: 63800, status: "완료" },
    { id: "h2", date: "2025-09-10", item: "수도 2025-08", amount: 24100, status: "완료" },
    { id: "h3", date: "2025-08-10", item: "가스 2025-07", amount: 51400, status: "완료" },
  ];
}
