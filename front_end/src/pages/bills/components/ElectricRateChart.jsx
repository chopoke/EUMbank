// src/pages/bills/components/ElectricRateChart.jsx
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { fetchElectricRates } from "../../../api/rates";

const SVC_KIND = { "1": "주택", "2": "일반" };

export default function ElectricRateChart({
  year,
  month,
  metroCd = "11",
  svcKindCd = "1",
}) {
  const [state, setState] = useState({ loading: true, error: null, rows: [] });

  useEffect(() => {
    let off = false;
    (async () => {
      setState({ loading: true, error: null, rows: [] });
      try {
        const { rows } = await fetchElectricRates({ year, month, metroCd, svcKindCd });
        if (!off) setState({ loading: false, error: null, rows });
      } catch {
        if (!off) setState({ loading: false, error: "데이터 로딩 실패", rows: [] });
      }
    })();
    return () => {
      off = true;
    };
  }, [year, month, metroCd, svcKindCd]);

  const data = useMemo(() => {
    if (!state.rows?.length) return [];
    return state.rows
      .map((r, i) => {
        const sec =
          r.usageSection ??
          ((r.usageMin ?? r.minUsage ?? r.min) != null || (r.usageMax ?? r.maxUsage ?? r.max) != null
            ? `${r.usageMin ?? r.minUsage ?? r.min ?? "?"}~${r.usageMax ?? r.maxUsage ?? r.max ?? "?"}`
            : String(i + 1));
        return {
          section: String(sec),
          unitCost: toNum(r.unitCost ?? r.unit_price ?? r.pricePerKwh),
          basePrc: toNum(r.basePrc ?? r.basicFee ?? r.base_price),
        };
      })
      .sort((a, b) => {
        const aStart = parseInt(a.section.split(/[^\d]+/)[0] || "0", 10);
        const bStart = parseInt(b.section.split(/[^\d]+/)[0] || "0", 10);
        return aStart - bStart;
      });
  }, [state.rows]);

  if (state.loading) return <div className="text-sm text-gray-500">요금 차트 불러오는 중</div>;
  if (state.error) return <div className="text-sm text-red-600">{state.error}</div>;
  if (!data.length) return <div className="text-sm text-gray-500">차트 데이터 없음</div>;

  return (
    <div className="border rounded-lg p-3">
      <div className="font-medium mb-2 text-gray-800">
        전기 요금 구간별 단가 · {year}.{pad2(month)} · 지역 {metroCd} · 용도{" "}
        {SVC_KIND[String(svcKindCd)] ?? svcKindCd}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <XAxis dataKey="section" tick={{ fontSize: 12, fill: "#1e3a8a" }} />
            <YAxis
              tickFormatter={(v) => formatWon(v)}
              tick={{ fill: "#1e3a8a", fontSize: 12 }}
              width={56}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#f9fafb", borderColor: "#93c5fd" }}
              formatter={(v, n) => [formatWon(v), n === "unitCost" ? "단가(원/kWh)" : "기본요금(원)"]}
              labelStyle={{ color: "#1d4ed8" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 8 }}
              formatter={(v) => (
                <span style={{ color: "#1d4ed8", fontSize: 12 }}>{v}</span>
              )}
            />
            {/* 단가 */}
            <Bar dataKey="unitCost" name="단가(원/kWh)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            {/* 기본요금 */}
            <Bar dataKey="basePrc" name="기본요금(원)" fill="#60a5fa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        파랑 계열 강조. 단가(짙은 파랑) · 기본요금(밝은 파랑)
      </p>
    </div>
  );
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function pad2(m) {
  return String(m).padStart(2, "0");
}
function formatWon(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString();
}
