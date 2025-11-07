// src/pages/bills/components/ElectricRateTable.jsx
import { useEffect, useState } from "react";
import { fetchElectricRates } from "../../../api/rates";

function numLike(v) {
  if (v === null || v === undefined) return "";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString() : String(v);
}

// 한글 컬럼 라벨 매핑
const LABEL = {
  year: "연도",
  month: "월",
  metro: "지역",
  city: "시군구",
  cntr: "용도",
  svcKindNm: "용도",
  custCnt: "고객수",
  powerUsage: "전력사용량(kWh)",
  cntrPwr: "계약전력(kW)",
  bill: "청구금액(원)",
  unitCost: "단가(원/kWh)",
  basePrc: "기본요금(원)",
  vat: "부가세",
  elecFund: "전력기반기금",
  totalPrc: "합계",
  usageSection: "구간",
  usageMin: "최소사용량",
  usageMax: "최대사용량",
};

const SVC_KIND = { "1": "주택", "2": "일반" };
const PREFERRED_ORDER = [
  "year",
  "month",
  "metro",
  "city",
  "cntr",
  "svcKindNm",
  "custCnt",
  "powerUsage",
  "bill",
  "unitCost",
  "cntrPwr",
  "usageSection",
  "usageMin",
  "usageMax",
  "basePrc",
  "vat",
  "elecFund",
  "totalPrc",
];

const INITIAL_ROWS = 6;
const STEP = 5;

export default function ElectricRateTable({
  year,
  month,
  metroCd = "11",
  svcKindCd = "1",
}) {
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const [visibleCount, setVisibleCount] = useState(INITIAL_ROWS);

  useEffect(() => {
    let off = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const { rows } = await fetchElectricRates({ year, month, metroCd, svcKindCd });
        if (!off) {
          setState({ loading: false, error: null, rows });
          setVisibleCount(INITIAL_ROWS); // 파라미터 바뀌면 초기화
        }
      } catch {
        if (!off) setState({ loading: false, error: "오류가 발생했습니다", rows: [] });
      }
    })();
    return () => {
      off = true;
    };
  }, [year, month, metroCd, svcKindCd]);

  const rawCols = state.rows[0] ? Object.keys(state.rows[0]) : [];
  const cols =
    rawCols.length === 0
      ? []
      : [
          ...PREFERRED_ORDER.filter((k) => rawCols.includes(k)),
          ...rawCols.filter((k) => !PREFERRED_ORDER.includes(k)),
        ];

  if (state.loading) return <div className="text-sm text-gray-500">요금표 불러오는 중</div>;
  if (state.error) return <div className="text-sm text-red-600">{state.error}</div>;
  if (!state.rows.length) return <div className="text-sm text-gray-500">데이터 없음</div>;

  const total = state.rows.length;
  const end = Math.min(visibleCount, total);
  const canMore = end < total;
  const visibleRows = state.rows.slice(0, end);

  function onMore() {
    setVisibleCount((c) => Math.min(c + STEP, total));
  }
  function onCollapse() {
    setVisibleCount(INITIAL_ROWS);
  }

  return (
    <div className="border rounded-lg p-3">
      <div className="font-medium mb-2">
        전기 요금표 {year}.{String(month).padStart(2, "0")} · 지역 {metroCd} · 용도{" "}
        {SVC_KIND[String(svcKindCd)] ?? svcKindCd}
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              {cols.map((c) => (
                <th key={c} className="py-2 pr-4 whitespace-nowrap">
                  {LABEL[c] ?? c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r, i) => (
              <tr key={i} className="border-b last:border-0">
                {cols.map((c) => (
                  <td key={c} className="py-1 pr-4 whitespace-nowrap">
                    {numLike(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 더보기/접기 */}
      {total > INITIAL_ROWS && (
        <div className="flex justify-center mt-3">
          {canMore ? (
            <button
              onClick={onMore}
              className="px-4 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition"
            >
              더보기 {Math.min(STEP, total - end)}개
            </button>
          ) : (
            <button
              onClick={onCollapse}
              className="px-4 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition"
            >
              접기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
