// src/pages/bills/components/ElectricAvgSection.jsx
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { fetchElectricAvg } from "../../../api/bills";

const METROS = [
  ["11","서울"],["26","부산"],["27","대구"],["28","인천"],["29","광주"],["30","대전"],["31","울산"],
  ["36","세종"],["41","경기"],["42","강원"],["43","충북"],["44","충남"],["45","전북"],["46","전남"],
  ["47","경북"],["48","경남"],["50","제주"]
];

export default function ElectricAvgSection({ year, month }) {
  const [rows, setRows] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const y = Number(year), m = Number(month);

  useEffect(() => {
    if (!Number.isFinite(y) || !Number.isFinite(m)) return;
    let cancel = false;
    (async () => {
      const list = await Promise.all(
        METROS.map(async ([cd, name]) => {
          try {
            const r = await fetchElectricAvg({ year: y, month: m, areaCd: cd }); // [{year,month,areaCd,unit}]
            const unit = Number(r?.[0]?.unit ?? 0);
            return { areaCd: cd, area: name, unit };
          } catch {
            return { areaCd: cd, area: name, unit: 0 };
          }
        })
      );
      if (!cancel) setRows(list.filter(d => d.unit > 0));
    })();
    return () => { cancel = true; };
  }, [y, m]);

  const visible = showAll ? rows : rows.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* 차트 */}
      <div className="border rounded-xl p-4 bg-white">
        <div className="flex items-end justify-between mb-2">
          <h3 className="font-semibold">{y}-{String(m).padStart(2,"0")} 지역별 평균 전기 단가</h3>
          <span className="text-xs text-gray-500">단위: 원/kWh</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" />
                <YAxis
                    tickFormatter={(v)=>v.toFixed ? v.toFixed(0) : v}
                    label={{ value:"원/kWh", angle:-90, position:"insideLeft" }}
                />
                <Tooltip formatter={(v)=>`${Number(v).toFixed(1)} 원/kWh`} />
                <Bar dataKey="unit" fill="#3B82F6" radius={[4,4,0,0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 표 */}
      <div className="border rounded-xl shadow-sm p-4 bg-white">
        <h3 className="font-semibold mb-2">지역별 평균단가 표</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="text-left py-2">지역</th>
              <th className="text-right">평균단가(원/kWh)</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.areaCd} className="border-b hover:bg-gray-50">
                <td className="py-2">{r.area}</td>
                <td className="text-right font-medium">{r.unit.toFixed(1)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={2} className="text-center py-4 text-gray-500">데이터 없음</td></tr>
            )}
          </tbody>
        </table>

        {rows.length > 4 && (
          <div className="text-center mt-3">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 text-sm hover:underline"
            >
              {showAll ? "접기" : "더보기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
