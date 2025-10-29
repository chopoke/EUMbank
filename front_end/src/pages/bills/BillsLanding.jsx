// src/pages/bills/BillsLanding.jsx
import React, { useMemo, useState } from "react";
// import api from "../../api/axios";

const theme = {
  primary: "bg-blue-600 hover:bg-blue-700",
  accent: "bg-teal-600 hover:bg-teal-700",
  tabActive: "border-blue-600 text-blue-700",
  chip: {
    electric: "bg-yellow-100 text-yellow-800",
    water: "bg-blue-100 text-blue-800",
    gas: "bg-red-100 text-red-800",
    telco: "bg-purple-100 text-purple-800",
    nat_tax: "bg-emerald-100 text-emerald-800",
    loc_tax: "bg-indigo-100 text-indigo-800",
  },
};

export default function BillsLanding() {
  const categories = useMemo(
    () => [
      { key: "electric", label: "전기", icon: "ri-flashlight-line" },
      { key: "water", label: "수도", icon: "ri-drop-line" },
      { key: "gas", label: "가스", icon: "ri-fire-line" },
      { key: "telco", label: "통신", icon: "ri-smartphone-line" },
      { key: "nat_tax", label: "국세", icon: "ri-government-line" },
      { key: "loc_tax", label: "지방세", icon: "ri-building-2-line" },
    ],
    []
  );

  const [type, setType] = useState("electric");
  const [form, setForm] = useState({ subscriberNo: "", customerNo: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState(null);
  const [account, setAccount] = useState("");
  const [history, setHistory] = useState(() => mockHistory());

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function lookup() {
    setMsg(""); setLoading(true); setResult(null);
    try {
      // const { data } = await api.get(`/api/bill/${type}/lookup`, { params: form });
      // setResult(data);
      await delay(400);
      setResult(mockLookup(type, form));
    } catch {
      setMsg("조회 실패. 입력값을 확인하세요.");
    } finally { setLoading(false); }
  }

  async function payNow() {
    if (!result || !account) return;
    setMsg(""); setLoading(true);
    try {
      // await api.post(`/api/bill/pay`, { type, ...form, accountNo: account });
      await delay(500);
      const paid = {
        id: Math.random().toString(36).slice(2),
        date: new Date().toISOString().slice(0, 10),
        item: `${labelOf(type)} ${result.billMonth}`,
        amount: result.amount,
        status: "납부완료",
      };
      setHistory((h) => [paid, ...h].slice(0, 10));
      setResult(null); setAccount("");
      alert("납부가 완료되었습니다.");
    } catch {
      setMsg("납부 실패. 다시 시도하세요.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto px-4 py-10 max-w-6xl">
        {/* 헤더 */}
        <div className="bg-white text-gray-800 rounded-2xl p-6 shadow-sm mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">공과금 납부</h1>
              <p className="text-gray-500 mt-1 text-sm">
                전기·수도·가스·통신·세금 청구서를 한 번에 조회하고 납부하세요.
              </p>
            </div>
            <i className="ri-bill-line text-3xl text-gray-400 hidden md:block" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          {/* 탭 */}
          <nav className="border-b border-gray-200 bg-gray-50">
            <div className="flex overflow-x-auto">
              {categories.map((c) => {
                const active = c.key === type;
                return (
                  <button
                    key={c.key}
                    onClick={() => { setType(c.key); setResult(null); setMsg(""); }}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      active ? `${theme.tabActive} bg-white` : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <i className={`${c.icon} text-lg`} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="flex flex-col lg:flex-row">
            {/* 좌측 */}
            <div className="flex-1 p-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="ri-search-line text-blue-600 mr-2"></i>요금 조회
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="납부자 번호">
                    <input name="subscriberNo" value={form.subscriberNo} onChange={onChange}
                      placeholder="예: 1234-5678-90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent" />
                  </Field>
                  <Field label="고객번호/계약번호">
                    <input name="customerNo" value={form.customerNo} onChange={onChange}
                      placeholder="기관 청구서의 고객번호"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent" />
                  </Field>
                  <div className="flex items-end">
                    <button onClick={lookup} disabled={loading || !form.subscriberNo || !form.customerNo}
                      className={`w-full px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${theme.primary}`}>
                      {loading ? "조회 중" : "조회"}
                    </button>
                  </div>
                </div>
                {msg && <div className="mt-3 text-sm text-red-600" role="alert">{msg}</div>}
              </div>

              {result && (
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <i className="ri-bill-line text-gray-700" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">납부기관</div>
                        <div className="text-base font-semibold text-gray-900">{result.orgName}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${chipOf(type)}`}>{labelOf(type)}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KV label="청구월" value={result.billMonth} />
                    <KV label="납기일" value={result.dueDate} />
                    <KV label="금액" value={formatKRW(result.amount)} strong />
                    <KV label="자동이체" value={result.autoPay ? "등록" : "미등록"} />
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">결제 계좌</label>
                      <select value={account} onChange={(e) => setAccount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent">
                        <option value="">계좌 선택</option>
                        <option value="110-123-456789">입출금통장 110-123-456789</option>
                        <option value="3333-01-9876543">자유예금 3333-01-9876543</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={payNow} disabled={loading || !account}
                        className={`w-full px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${theme.accent}`}>
                        {loading ? "처리 중" : "납부하기"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 납부 이력 */}
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <i className="ri-history-line text-blue-600 mr-2"></i>최근 납부 내역
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <TH>날짜</TH><TH>항목</TH><TH align="right">금액</TH><TH>상태</TH>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {history.map((h) => (
                        <tr key={h.id}>
                          <TD>{h.date}</TD>
                          <TD>{h.item}</TD>
                          <TD align="right">{formatKRW(h.amount)}</TD>
                          <TD><span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{h.status}</span></TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 하단 바로가기 */}
              <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">자주 쓰는 바로가기</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: "ri-flashlight-line", label: "전기 자동이체", to: "#" },
                    { icon: "ri-drop-line",       label: "수도 자동이체", to: "#" },
                    { icon: "ri-fire-line",       label: "가스 자동이체", to: "#" },
                    { icon: "ri-file-download-line", label: "영수증 다운로드", to: "#" },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.to}
                      className="group flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-gray-800">
                        <i className={`${s.icon} text-gray-500 group-hover:text-blue-600 transition-colors`} />
                        {s.label}
                      </span>
                      <i className="ri-arrow-right-s-line text-gray-400 group-hover:text-blue-600 transition-colors"></i>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* 우측 안내 패널 */}
            <aside className="w-full lg:w-80 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 p-6">
              <div className="space-y-6">
                <Card title="이용 안내" icon="ri-information-line" iconColor="text-blue-600">
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 일부 기관은 납부 마감 23:00에 종료</li>
                    <li>• 납부 후 영수증은 이력에서 출력 가능</li>
                    <li>• 자동이체는 기관별 처리일 상이</li>
                  </ul>
                </Card>
                <Card title="보안 안내" icon="ri-shield-check-line" iconColor="text-teal-600">
                  <p className="text-sm text-gray-600">카드·계좌 비밀번호, OTP 등은 누구에게도 공유하지 마십시오.</p>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─ sub components ─ */

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Card({ title, icon, children, iconColor = "text-gray-600" }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
        <i className={`${icon} ${iconColor} mr-2 text-lg`}></i>{title}
      </h4>
      {children}
    </div>
  );
}

function KV({ label, value, strong }) {
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={(strong ? "text-xl font-semibold " : "text-base font-medium ") + "text-gray-900"}>{value}</div>
    </div>
  );
}

function TH({ children, align = "left" }) {
  return (
    <th className={`px-4 py-2 text-xs font-medium text-gray-500 ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function TD({ children, align = "left" }) {
  return (
    <td className={`px-4 py-2 text-sm text-gray-700 ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </td>
  );
}

/* ─ utils & mocks ─ */

function chipOf(k) {
  const m = theme.chip;
  return m[k] || "bg-gray-100 text-gray-800";
}

function formatKRW(n) {
  const v = Number(n || 0);
  return v.toLocaleString("ko-KR") + "원";
}
function delay(ms) { return new Promise((res) => setTimeout(res, ms)); }
function labelOf(key) {
  switch (key) {
    case "electric": return "전기";
    case "water": return "수도";
    case "gas": return "가스";
    case "telco": return "통신";
    case "nat_tax": return "국세";
    case "loc_tax": return "지방세";
    default: return key;
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
    { id: "h1", date: "2025-10-05", item: "전기 2025-09", amount: 63800, status: "납부완료" },
    { id: "h2", date: "2025-09-10", item: "수도 2025-08", amount: 24100, status: "납부완료" },
    { id: "h3", date: "2025-08-10", item: "가스 2025-07", amount: 51400, status: "납부완료" },
  ];
}
