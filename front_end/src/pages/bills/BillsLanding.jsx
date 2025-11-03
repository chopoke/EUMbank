// src/pages/bills/BillsLanding.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAccounts } from "../../api/accounts";

export default function BillsLanding() {
  const { ubNo: ubNoParam } = useParams();
  const ubNo = ubNoParam ? Number(ubNoParam) : null;
  const USE_API = Number.isInteger(ubNo);
  const navigate = useNavigate();

  const theme = useMemo(() => ({
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
  }), []);

  // ubNo 없으면 로그인 사용자의 첫 번째 공과금으로 이동
  const onceRef = useRef(false);
  useEffect(() => {
    if (ubNoParam) return;           // 이미 /bills/:ubNo
    if (onceRef.current) return;     // 중복 방지(HMR 포함)
    onceRef.current = true;

    let alive = true;
    (async () => {
      try {
        const mod = await import("../../api/bills");
        const mine = await mod.listMyUtilityBills();
        if (!alive) return;

        if (Array.isArray(mine) && mine.length > 0) {
          navigate(`/bills/${mine[0].ubNo}`, { replace: true });
        } else {
          alert("등록된 공과금이 없습니다.");
        }
      } catch {
        if (alive) alert("공과금 정보를 불러오지 못했습니다.");
      }
    })();

    return () => { alive = false; };
  }, [ubNoParam, navigate]);

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

  // bills API 동적 import
  const [apis, setApis] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mod = await import("../../api/bills");
        if (alive) setApis(mod);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  const [type, setType] = useState("electric");
  const [form, setForm] = useState({ subscriberNo: "", customerNo: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState(null);

  // 계좌
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState(""); // a_no

  // API 모드 상태
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState("READY");
  const [autoForm, setAutoForm] = useState({
    aNo: "2",
    payDay: 25,
    payTime: "09:00:00",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    memo: "기본 자동이체",
  });

  function maskAccountNo(n) {
    if (!n) return "";
    const s = String(n);
    return s.replace(/\d(?=(?:\D*\d){4})/g, "*");
  }
  function mapAccountRow(row) {
    const aNo = row?.aNo ?? row?.a_no ?? row?.ano;
    const accountNo = row?.accountNo ?? row?.a_account_no ?? row?.accountno;
    const name =
      row?.name ?? row?.a_nickname ?? row?.a_account_type ?? row?.a_product_code ?? "계좌";
    return {
      aNo: Number(aNo),
      accountNo: String(accountNo),
      name: String(name),
      label: `${name} ${maskAccountNo(accountNo)}`,
    };
  }

  // 계좌 로드(초기값 1회 설정)
  useEffect(() => {
    if (!USE_API) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await fetchAccounts();
        const mapped = Array.isArray(data) ? data.map(mapAccountRow) : [];
        if (!alive) return;
        setAccounts(mapped);
        if (mapped.length) {
          setAccount(String(mapped[0].aNo));
          setAutoForm(f => ({ ...f, aNo: String(mapped[0].aNo) }));
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, [USE_API]);

  // 인보이스 로드
  useEffect(() => {
    if (!USE_API || !apis?.listInvoices) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const data = await apis.listInvoices(ubNo, { status: statusFilter || undefined });
        if (alive) setInvoices(data);
      } catch {
        if (alive) setMsg("청구서 조회 실패");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [USE_API, apis, ubNo, statusFilter]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function lookup() {
    if (loading) return;
    setMsg(""); setLoading(true); setResult(null);
    try {
      await delay(300);
      setResult(mockLookup(type, form));
    } catch {
      setMsg("조회 실패. 입력값을 확인하세요.");
    } finally { setLoading(false); }
  }

  // 조회 카드 → 납부
  async function payNow() {
    if (loading) return;
    if (!result) return;
    const selectedANo = Number(account || autoForm.aNo || 0);
    if (!selectedANo) { setMsg("결제 계좌를 선택하세요."); return; }

    setMsg(""); setLoading(true);
    try {
      if (USE_API && apis?.payInvoice && apis?.listInvoices) {
        const data = await apis.listInvoices(ubNo, { status: statusFilter || undefined });
        const target = data.find(d => d.ym === result.billMonth) || data.find(d => d.status === "READY");
        if (!target) throw new Error("해당 월 청구서가 없습니다.");
        const res = await apis.payInvoice(target.biNo, { aNo: selectedANo });
        alert(`결제 상태: ${res?.status ?? "SUCCESS"}`);
        const ref = await apis.listInvoices(ubNo, { status: statusFilter || undefined });
        setInvoices(ref);
      } else {
        await delay(400);
        alert("납부가 완료되었습니다.");
      }
      setResult(null);
    } catch (e) {
      const m = e?.response?.data?.message || e?.message || "납부 실패. 다시 시도하세요.";
      setMsg(m);
    } finally { setLoading(false); }
  }

  // 표에서 납부
  async function onPayInvoice(biNo) {
    if (!USE_API || !apis?.payInvoice) return;
    if (loading) return;
    const selectedANo = Number(account || autoForm.aNo || 0);
    if (!selectedANo) { setMsg("결제 계좌를 선택/입력하세요."); return; }

    setLoading(true);
    try {
      const res = await apis.payInvoice(biNo, { aNo: selectedANo });
      alert(`결제 상태: ${res?.status ?? "SUCCESS"}`);
      const data = await apis.listInvoices(ubNo, { status: statusFilter || undefined });
      setInvoices(data);
    } catch (e) {
      const m = e?.response?.data?.message || e?.message || "납부 실패. 다시 시도하세요.";
      alert(m);
    } finally { setLoading(false); }
  }

  // 자동이체 등록
  async function onCreateAutopay(e) {
    e?.preventDefault?.();
    if (!USE_API || !apis?.createAutopay) return;
    if (loading) return;
    setLoading(true);
    try {
      await apis.createAutopay(ubNo, {
        aNo: Number(autoForm.aNo),
        payDay: Number(autoForm.payDay),
        payTime: autoForm.payTime,
        startDate: autoForm.startDate,
        endDate: autoForm.endDate || null,
        memo: autoForm.memo || null,
      });
      alert("자동이체 스케줄 등록 완료");
    } catch (e) {
      const m = e?.response?.data?.message || "자동이체 등록 실패";
      alert(m);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto px-4 py-10 max-w-6xl">
        <div className="bg-white text-gray-800 rounded-2xl p-6 shadow-sm mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">공과금 납부 {USE_API ? `(ubNo: ${ubNo})` : ""}</h1>
              <p className="text-gray-500 mt-1 text-sm">전기·수도·가스·통신·세금 청구서를 한 번에 조회하고 납부하세요.</p>
            </div>
            <i className="ri-bill-line text-3xl text-gray-400 hidden md:block" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
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
            <div className="flex-1 p-6">
              {/* 조회 카드 */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <i className="ri-search-line text-blue-600 mr-2"></i>요금 조회
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="납부자 번호" id="subscriberNo">
                    <input id="subscriberNo" name="subscriberNo" value={form.subscriberNo} onChange={onChange}
                      placeholder="예: 1234-5678-90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent" />
                  </Field>
                  <Field label="고객번호/계약번호" id="customerNo">
                    <input id="customerNo" name="customerNo" value={form.customerNo} onChange={onChange}
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

              {/* 조회 결과 */}
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
                    <span className={`px-2 py-1 text-xs rounded-full ${chipOf(type, theme)}`}>{labelOf(type)}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KV label="청구월" value={result.billMonth} />
                    <KV label="납기일" value={result.dueDate} />
                    <KV label="금액" value={formatKRW(result.amount)} strong />
                    {!USE_API && <KV label="자동이체" value={Math.random() < 0.3 ? "등록" : "미등록"} />}
                  </div>

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label htmlFor="accountSelect" className="block text-sm font-medium text-gray-700 mb-1">결제 계좌</label>
                      <select id="accountSelect" value={account} onChange={(e) => setAccount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent">
                        <option value="">계좌 선택</option>
                        {accounts.length === 0 && (
                          <>
                            <option value="2">입출금통장 110-123-456789</option>
                            <option value="3">자유예금 3333-01-9876543</option>
                          </>
                        )}
                        {accounts.map(acc => (
                          <option key={acc.aNo} value={String(acc.aNo)}>
                            {acc.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button onClick={payNow} disabled={loading || !account}
                        className="w-full px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 bg-teal-600 hover:bg-teal-700">
                        {loading ? "처리 중" : USE_API ? "납부하기(실제)" : "납부하기(Mock)"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 목업 이력 */}
              {!USE_API && (
                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200">
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
                        {mockHistory().map((h) => (
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
              )}

              {/* API 전용: 자동이체 + 인보이스 표 */}
              {USE_API && (
                <>
                  <form onSubmit={onCreateAutopay} className="mt-6 p-5 border rounded-xl shadow-sm">
                    <h2 className="font-semibold mb-3">자동이체 등록</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <select className="border rounded p-2"
                        value={autoForm.aNo}
                        onChange={e => setAutoForm(f => ({ ...f, aNo: e.target.value }))}>
                        {accounts.map(acc => (
                          <option key={acc.aNo} value={String(acc.aNo)}>{acc.label}</option>
                        ))}
                        {accounts.length === 0 && (
                          <>
                            <option value="2">입출금통장 110-123-456789</option>
                            <option value="3">자유예금 3333-01-9876543</option>
                          </>
                        )}
                      </select>
                      <input className="border rounded p-2" value={autoForm.payDay}
                        onChange={e => setAutoForm(f => ({ ...f, payDay: e.target.value }))} placeholder="납부일(1~31)" />
                      <input className="border rounded p-2" value={autoForm.payTime}
                        onChange={e => setAutoForm(f => ({ ...f, payTime: e.target.value }))} placeholder="HH:MM:SS" />
                      <input className="border rounded p-2" value={autoForm.startDate}
                        onChange={e => setAutoForm(f => ({ ...f, startDate: e.target.value }))} placeholder="YYYY-MM-DD" />
                      <input className="border rounded p-2" value={autoForm.endDate}
                        onChange={e => setAutoForm(f => ({ ...f, endDate: e.target.value }))} placeholder="종료일(선택)" />
                      <input className="border rounded p-2 md:col-span-2" value={autoForm.memo}
                        onChange={e => setAutoForm(f => ({ ...f, memo: e.target.value }))} placeholder="메모" />
                    </div>
                    <button type="submit" className="mt-3 px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700" disabled={loading}>
                      {loading ? "처리 중" : "등록"}
                    </button>
                  </form>

                  <div className="mt-6 border rounded-xl shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-semibold">청구서 목록</h2>
                      <select className="border p-2 rounded"
                              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">전체</option>
                        <option value="READY">READY</option>
                        <option value="PAID">PAID</option>
                        <option value="FAILED">FAILED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                    {loading ? <p>로딩중...</p> : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">월</th>
                            <th className="text-right">금액</th>
                            <th>납기</th>
                            <th>상태</th>
                            <th>작업</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map(row => (
                            <tr key={row.biNo} className="border-b">
                              <td className="py-2">{row.ym}</td>
                              <td className="text-right">{Number(row.amount).toLocaleString()}</td>
                              <td>{row.dueAt ? row.dueAt.replace("T"," ").slice(0,19) : "-"}</td>
                              <td>{row.status}</td>
                              <td>
                                {row.status === "READY" ? (
                                  <button className="px-3 py-1 rounded text-white bg-teal-600 hover:bg-teal-700"
                                          onClick={() => onPayInvoice(row.biNo)}
                                          disabled={loading}>
                                    납부
                                  </button>
                                ) : <span>-</span>}
                              </td>
                            </tr>
                          ))}
                          {invoices.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-4 text-gray-500">데이터 없음</td></tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}

              {/* 바로가기 */}
              <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">자주 쓰는 바로가기</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: "ri-flashlight-line", label: "전기 자동이체", to: "#" },
                    { icon: "ri-drop-line",       label: "수도 자동이체", to: "#" },
                    { icon: "ri-fire-line",       label: "가스 자동이체", to: "#" },
                    { icon: "ri-file-download-line", label: "영수증 다운로드", to: "#" },
                  ].map((s) => (
                    <a key={s.label} href={s.to}
                       className="group flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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

            {/* 우측 안내 */}
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
                  <p className="text-sm text-gray-600">카드·계좌 비밀번호, OTP 등은 공유 금지.</p>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

/* sub components */
function Field({ label, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {React.cloneElement(children, { id })}
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

/* utils & mocks */
function mockLookup(type, form) {
  return {
    orgName: `${labelOf(type)} 공사`,
    billMonth: new Date().toISOString().slice(0, 7),
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    amount: Math.floor(20000 + Math.random() * 70000),
    autoPay: false,
    key: `${type}:${form?.subscriberNo ?? ""}:${form?.customerNo ?? ""}`,
  };
}
function chipOf(k, theme) {
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
function mockHistory() {
  return [
    { id: "h1", date: "2025-10-05", item: "전기 2025-09", amount: 63800, status: "납부완료" },
    { id: "h2", date: "2025-09-10", item: "수도 2025-08", amount: 24100, status: "납부완료" },
    { id: "h3", date: "2025-08-10", item: "가스 2025-07", amount: 51400, status: "납부완료" },
  ];
}
