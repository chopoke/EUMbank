// src/pages/bills/components/GenericRateTable.jsx
import { useEffect, useState } from "react";

export default function GenericRateTable({ title = "요금표", fetcher, params = {} }) {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState(5);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetcher(params);
        const list = res?.rows ?? [];
        setRows(Array.isArray(list) ? list : []);
      } catch {
        setRows([]);
      }
    })();
  }, [fetcher, JSON.stringify(params)]);

  const show = rows.slice(0, view);
  const more = () => setView((v) => Math.min(v + 5, rows.length));

  return (
    <div className="border rounded-xl shadow-sm p-4 bg-white">
      <h3 className="font-semibold mb-2">{title}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">구간</th>
            <th className="text-right">기본요금(원)</th>
            <th className="text-right">단가</th>
            <th className="text-left">비고</th>
          </tr>
        </thead>
        <tbody>
          {show.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{r.tier ?? r["구간"] ?? "-"}</td>
              <td className="text-right">
                {num(r.base_charge ?? r["기본요금(원)"] ?? 0)}
              </td>
              <td className="text-right">
                {num(r.unit_price ?? r["단가(원/㎥)"] ?? r["단가"] ?? 0)}
              </td>
              <td>{r.note ?? r["비고"] ?? ""}</td>
            </tr>
          ))}
          {show.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-500">
                데이터 없음
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {view < rows.length && (
        <div className="mt-3 text-center">
          <button
            onClick={more}
            className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
          >
            더보기 5
          </button>
        </div>
      )}
    </div>
  );
}

function num(v) {
  const n = Number(v || 0);
  return isFinite(n) ? n.toLocaleString() : "-";
}
