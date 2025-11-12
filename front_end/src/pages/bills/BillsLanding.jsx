// src/pages/bills/BillsLanding.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchAccounts } from "../../api/accounts";
import { listMyUtilityBills, fetchWaterRates, fetchGasRates } from "../../api/bills";

import WaterRateChart from "./components/WaterRateChart";
import GasRateChart from "./components/GasRateChart";
import InvoiceTable from "./components/InvoiceTable";
import GenericRateTable from "./components/GenericRateTable";
import ElectricAvgSection from "./components/ElectricAvgSection";

export default function BillsLanding() {
  const { ubNo: ubNoParam } = useParams();
  const ubNo = ubNoParam ? Number(ubNoParam) : null;
  const USE_API = Number.isInteger(ubNo);
  const navigate = useNavigate();

  useEffect(() => { document.title = "이음은행 | 공과금 납부"; }, []);

  const theme = useMemo(
    () => ({
      primary: "bg-blue-600 hover:bg-blue-700",
      tabActive: "border-blue-600 text-blue-700",
      chip: { electric: "bg-yellow-100 text-yellow-800", water: "bg-blue-100 text-blue-800", gas: "bg-red-100 text-red-800" },
    }),
    []
  );

  // provider 정규화
  const normProvider = (p) => {
    const s = String(p || "").toUpperCase();
    if (["ELEC", "KEPCO", "ELECTRIC"].includes(s)) return "KEPCO";
    if (["WATER", "K_WATER", "KWATER"].includes(s)) return "K_WATER";
    if (["GAS", "CITY_GAS", "CITYGAS"].includes(s)) return "GAS";
    return s;
  };

  // 내 공과금 목록
  const [myBills, setMyBills] = useState([]);
  const onceRef = useRef(false);

  // ubNo 없으면 전기 → 수도 → 가스 우선순위로 이동
  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;

    let alive = true;
    (async () => {
      try {
        const mine = await listMyUtilityBills(); // [{ubNo, provider?, bpCode?}]
        if (!alive) return;
        const rows = Array.isArray(mine)
          ? mine.map(b => ({
              ...b,
              provider: normProvider(b.provider ?? b.bpCode),
            }))
          : [];
        setMyBills(rows);

        if (!ubNoParam && rows.length) {
          const pick =
            rows.find(b => b.provider === "KEPCO") ||
            rows.find(b => b.provider === "K_WATER") ||
            rows.find(b => b.provider === "GAS") ||
            rows[0];
          navigate(`/bills/${pick.ubNo}`, { replace: true });
        }
        if (!rows.length && !ubNoParam) alert("등록된 공과금이 없습니다.");
      } catch {
        if (!ubNoParam) alert("공과금 정보를 불러오지 못했습니다.");
      }
    })();

    return () => { alive = false; };
  }, [ubNoParam, navigate]);

  // 탭
  const categories = useMemo(
    () => [
      { key: "electric", label: "전기", icon: "ri-flashlight-line", provider: "KEPCO" },
      { key: "water",   label: "수도", icon: "ri-drop-line",       provider: "K_WATER" },
      { key: "gas",     label: "가스", icon: "ri-fire-line",        provider: "GAS" },
    ],
    []
  );

  const [type, setType] = useState("electric");

  // URL의 ubNo가 바뀌면 해당 ubNo의 공급자에 맞게 탭 동기화
  useEffect(() => {
    if (!myBills?.length || !ubNo) return;
    const cur = myBills.find((b) => b.ubNo === ubNo);
    const pv = normProvider(cur?.provider ?? cur?.bpCode);
    if (pv === "KEPCO") setType("electric");
    else if (pv === "K_WATER") setType("water");
    else if (pv === "GAS") setType("gas");
  }, [myBills, ubNo]);

  // 탭 클릭 시 같은 공급자의 ubNo로 라우팅
  function onClickTab(k) {
    setType(k);
    const pvMap = { electric: "KEPCO", water: "K_WATER", gas: "GAS" };
    const pv = pvMap[k];
    const target = myBills.find((b) => normProvider(b.provider ?? b.bpCode) === pv);
    if (target && target.ubNo && target.ubNo !== ubNo) {
      navigate(`/bills/${target.ubNo}`, { replace: true });
    }
  }

  // 결제 계좌
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState(""); // a_no
  useEffect(() => {
    if (!USE_API) return;
    let alive = true;
    (async () => {
      try {
        const res = await fetchAccounts();
        const arr = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        const mapped = arr.map(mapAccountRow);
        if (!alive) return;
        setAccounts(mapped);
        if (mapped.length) setAccount(String(mapped[0].aNo));
      } catch {}
    })();
    return () => { alive = false; };
  }, [USE_API]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto px-4 py-10 max-w-6xl">
        {/* 헤더 */}
        <div className="bg-white text-gray-800 rounded-2xl p-6 shadow-sm mb-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">공과금 납부 {USE_API ? `(ubNo: ${ubNo})` : ""}</h1>
              <p className="text-gray-500 mt-1 text-sm">전기·수도·가스 청구서를 조회하고 납부하세요.</p>
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
              {/* 요금 차트 + 요금표 */}
              {type === "electric" && (
                <div className="mb-4">
                  <ElectricAvgSection year={2025} month={8} />
                </div>
              )}

              {type === "water" && (
                <>
                  <WaterRateChart key={`water-${ubNo}`} />
                  <div className="mt-4">
                    <GenericRateTable title="수도 요금표" fetcher={fetchWaterRates} params={{}} />
                  </div>
                </>
              )}

              {type === "gas" && (
                <>
                  <GasRateChart key={`gas-${ubNo}`} />
                  <div className="mt-4">
                    <GenericRateTable title="가스 요금표" fetcher={fetchGasRates} params={{}} />
                  </div>
                </>
              )}

              {/* 결제 계좌 + 청구서 목록 */}
              {USE_API && (
                <div className="mt-2 border rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">청구서 목록</h2>
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
                  </div>

                  {/* ubNo 변경 시 강제 리마운트로 이전 데이터 잔상 제거 */}
                  <InvoiceTable key={`inv-${ubNo}`} ubNo={ubNo} aNo={account ? Number(account) : null} />
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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
        <i className={`${icon} ${iconColor} mr-2 text-lg`} />
        {title}
      </h4>
      {children}
    </div>
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
    accountNo: String(accountNo || ""),
    name: String(name),
    label: `${name} ${maskAccountNo(accountNo || "")}`,
  };
}
function maskAccountNo(n) {
  if (!n) return "";
  const s = String(n);
  return s.replace(/\d(?=(?:\D*\d){4})/g, "*");
}
