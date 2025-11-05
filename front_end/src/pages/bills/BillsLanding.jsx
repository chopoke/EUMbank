// src/pages/bills/BillsLanding.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAccounts } from "../../api/accounts";
import ElectricRateTable from "./components/ElectricRateTable";

export default function BillsLanding() {
  const { ubNo: ubNoParam } = useParams();
  const ubNo = ubNoParam ? Number(ubNoParam) : null;
  const USE_API = Number.isInteger(ubNo);
  const navigate = useNavigate();

  // 한글 라벨
  const STATUS_LABEL = { READY: "대기", PAID: "완료", FAILED: "실패" };

  useEffect(() => {
    document.title = "이음은행 | 공과금 납부";
  }, []);

  const theme = useMemo(
    () => ({
      primary: "bg-blue-600 hover:bg-blue-700",
      tabActive: "border-blue-600 text-blue-700",
      chip: {
        electric: "bg-yellow-100 text-yellow-800",
        water: "bg-blue-100 text-blue-800",
        gas: "bg-red-100 text-red-800",
      },
    }),
    []
  );

  // 내 공과금 목록 보관 → 탭 전환 시 라우팅에 사용
  const [myBills, setMyBills] = useState([]);
  const onceRef = useRef(false);

  // ubNo 없으면 내 첫 공과금으로 이동 + 내 공과금 목록 캐싱
  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;

    let alive = true;
    (async () => {
      try {
        const mod = await import("../../api/bills");
        const mine = await mod.listMyUtilityBills();
        if (!alive) return;

        setMyBills(Array.isArray(mine) ? mine : []);

        if (!ubNoParam) {
          if (Array.isArray(mine) && mine.length > 0) {
            navigate(`/bills/${mine[0].ubNo}`, { replace: true });
          } else {
            alert("등록된 공과금이 없습니다.");
          }
        }
      } catch {
        if (!ubNoParam) alert("공과금 정보를 불러오지 못했습니다.");
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ubNoParam, navigate]);

  // 탭(카테고리) 3개
  const categories = useMemo(
    () => [
      { key: "electric", label: "전기", icon: "ri-flashlight-line", provider: "KEPCO" },
      { key: "water", label: "수도", icon: "ri-drop-line", provider: "K_WATER" },
      { key: "gas", label: "가스", icon: "ri-fire-line", provider: "GAS" },
    ],
    []
  );

  // 현재 ubNo의 provider → 탭 동기화
  const [type, setType] = useState("electric");
  useEffect(() => {
    if (!myBills?.length || !ubNo) return;
    const cur = myBills.find((b) => b.ubNo === ubNo);
    const pv = (cur?.provider || "").toUpperCase();
    if (pv === "KEPCO") setType("electric");
    else if (pv === "K_WATER") setType("water");
    else if (pv === "GAS") setType("gas");
  }, [myBills, ubNo]);

  // 탭 클릭 시 해당 provider의 첫 ubNo로 라우팅
  function onClickTab(k) {
    const pv = k === "electric" ? "KEPCO" : k === "water" ? "K_WATER" : "GAS";
    const target = myBills.find((b) => (b?.provider || "").toUpperCase() === pv);
    if (!target) {
      alert(`${labelOf(k)} 등록된 공과금이 없습니다.`);
      return;
    }
    if (target.ubNo !== ubNo) navigate(`/bills/${target.ubNo}`);
    setType(k);
  }

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
    return () => {
      alive = false;
    };
  }, []);

  // 계좌
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState(""); // a_no
  useEffect(() => {
    if (!USE_API) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await fetchAccounts();
        const mapped = Array.isArray(data) ? data.map(mapAccountRow) : [];
        if (!alive) return;
        setAccounts(mapped);
        if (mapped.length) setAccount(String(mapped[0].aNo));
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [USE_API]);

  // 인보이스
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState("READY");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!USE_API || !apis?.listInvoices) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const data = await apis.listInvoices(ubNo, {
          status: statusFilter || undefined,
        });
        if (alive) setInvoices(data);
      } catch {
        if (alive) setMsg("청구서 조회 실패");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [USE_API, apis, ubNo, statusFilter]);

  // 납부
  async function onPayInvoice(biNo) {
    if (!USE_API || !apis?.payInvoice) return;
    if (loading) return;
    const selectedANo = Number(account || 0);
    if (!selectedANo) {
      setMsg("결제 계좌를 선택하세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await apis.payInvoice(biNo, { aNo: selectedANo });
      alert(`결제 상태: ${STATUS_LABEL[res?.status] ?? "성공"}`);
      const data = await apis.listInvoices(ubNo, {
        status: statusFilter || undefined,
      });
      setInvoices(data);
    } catch (e) {
      const m = e?.response?.data?.message || e?.message || "납부 실패. 다시 시도하세요.";
      alert(m);
    } finally {
      setLoading(false);
    }
  }

  // 최근 납부완료(현재 표 데이터에서 추림)
  const recentPaid = useMemo(
    () =>
      invoices
        .filter((x) => x.status === "PAID")
        .sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || ""))
        .slice(0, 5),
    [invoices]
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto px-4 py-10 max-w-6xl">
        {/* 헤더 */}
        <div className="bg-white text-gray-800 rounded-2xl p-6 shadow-sm mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                공과금 납부 {USE_API ? `(ubNo: ${ubNo})` : ""}
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                전기·수도·가스 청구서를 조회하고 납부하세요.
              </p>
            </div>
            <i className="ri-bill-line text-3xl text-gray-400 hidden md:block" />
          </div>
        </div>

        {/* 카드 + 본문 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          {/* 탭 */}
          <nav className="border-b border-gray-200 bg-gray-50">
            <div className="flex overflow-x-auto">
              {categories.map((c) => {
                const active = c.key === type;
                return (
                  <button
                    key={c.key}
                    onClick={() => onClickTab(c.key)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      active
                        ? `${theme.tabActive} bg-white`
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
              {/* 요금표 패널 */}
              {type === "electric" ? (
                <ElectricRateTable year={2025} month={8} metroCd="11" svcKindCd="1" />
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-sm text-gray-500">
                  해당 카테고리 요금표는 준비 중
                </div>
              )}

              {/* 결제 계좌 + 청구서 목록 */}
              {USE_API && (
                <div className="mt-6 border rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">청구서 목록</h2>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-600">
                        결제 계좌&nbsp;
                        <select
                          className="border rounded px-2 py-1"
                          value={account}
                          onChange={(e) => setAccount(e.target.value)}
                        >
                          <option value="">선택</option>
                          {accounts.map((acc) => (
                            <option key={acc.aNo} value={String(acc.aNo)}>
                              {acc.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <select
                        className="border p-2 rounded"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        title="상태 필터"
                      >
                        <option value="READY">대기</option>
                        <option value="PAID">완료</option>
                        <option value="FAILED">실패</option>
                        <option value="">전체</option>
                      </select>
                    </div>
                  </div>
                  {msg && <div className="mb-2 text-sm text-red-600">{msg}</div>}
                  {loading ? (
                    <p>로딩 중…</p>
                  ) : (
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
                        {invoices.map((row) => (
                          <tr key={row.biNo} className="border-b">
                            <td className="py-2">{row.ym}</td>
                            <td className="text-right">
                              {Number(row.amount || 0).toLocaleString()}원
                            </td>
                            <td>
                              &nbsp;&nbsp;&nbsp;{" "}
                              {row.dueAt
                                ? row.dueAt.replace("T", " ").slice(0, 19)
                                : "-"}
                            </td>
                            <td>{STATUS_LABEL[row.status] ?? row.status}</td>
                            <td>
                              {row.status === "READY" ? (
                                <button
                                  className="px-3 py-1 rounded text-white bg-teal-600 hover:bg-teal-700"
                                  onClick={() => onPayInvoice(row.biNo)}
                                  disabled={loading || !account}
                                  title={!account ? "결제 계좌를 선택하세요." : ""}
                                >
                                  납부
                                </button>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {invoices.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-gray-500">
                              데이터 없음
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* 최근 납부완료 */}
              {USE_API && (
                <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200">
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <i className="ri-history-line text-blue-600 mr-2"></i>
                      최근 납부완료
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <TH>월</TH>
                          <TH>상태</TH>
                          <TH align="right">금액</TH>
                          <TH>완료시각</TH>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {recentPaid.map((h) => (
                          <tr key={h.biNo}>
                            <TD>{h.ym}</TD>
                            <TD>
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                완료
                              </span>
                            </TD>
                            <TD align="right">
                              {Number(h.amount || 0).toLocaleString()}원
                            </TD>
                            <TD>
                              {h.paidAt
                                ? String(h.paidAt).replace("T", " ").slice(0, 19)
                                : "-"}
                            </TD>
                          </tr>
                        ))}
                        {recentPaid.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-gray-500">
                              데이터 없음
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
function Card({ title, icon, children, iconColor = "text-gray-600" }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
        <i className={`${icon} ${iconColor} mr-2 text-lg`}></i>
        {title}
      </h4>
      {children}
    </div>
  );
}
function TH({ children, align = "left" }) {
  return (
    <th
      className={`px-4 py-2 text-xs font-medium text-gray-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
function TD({ children, align = "left" }) {
  return (
    <td
      className={`px-4 py-2 text-sm text-gray-700 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </td>
  );
}

/* utils */
function mapAccountRow(row) {
  const aNo = row?.aNo ?? row?.a_no ?? row?.ano;
  const accountNo = row?.accountNo ?? row?.a_account_no ?? row?.accountno;
  const name =
    row?.name ??
    row?.a_nickname ??
    row?.a_account_type ??
    row?.a_product_code ??
    "계좌";
  return {
    aNo: Number(aNo),
    accountNo: String(accountNo),
    name: String(name),
    label: `${name} ${maskAccountNo(accountNo)}`,
  };
}
function maskAccountNo(n) {
  if (!n) return "";
  const s = String(n);
  return s.replace(/\d(?=(?:\D*\d){4})/g, "*");
}
function labelOf(key) {
  switch (key) {
    case "electric":
      return "전기";
    case "water":
      return "수도";
    case "gas":
      return "가스";
    default:
      return key;
  }
}
