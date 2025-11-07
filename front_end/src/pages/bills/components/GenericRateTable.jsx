// src/pages/bills/components/GenericRateTable.jsx
import React, { useEffect, useState } from "react";

const num = (v, suf = "") =>
  v === null || v === undefined || v === "" ? "-" : `${Number(v).toLocaleString()}${suf}`;

export default function GenericRateTable({ title, fetcher, params = {} }) {
  const [row, setRow] = useState(null);
  const [cols, setCols] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetcher(params);     // { rows, raw }
        const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;

        if (!alive) return;

        // 백엔드 키 표준화: base_charge, unit_price
        const base =
          r0?.base_charge ?? r0?.wr_base_charge ?? r0?.baseCharge ?? r0?.base ?? null;
        const unit =
          r0?.unit_price ?? r0?.wr_unit_price ?? r0?.unitPrice ?? r0?.unit ?? null;

        setRow({ base, unit });
        setCols(Array.isArray(res?.raw?.columns) ? res.raw.columns : ["기본요금", "단가(원/㎥)"]);
      } catch {
        if (alive) setErr("요금표 로드 실패");
      }
    })();
    return () => { alive = false; };
  }, [fetcher, params]);

  return (
    <div className="border rounded-xl shadow-sm p-6 bg-white">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {err && <p className="text-sm text-red-600 mb-2">{err}</p>}

      <table className="w-full text-sm">
        <tbody>
          <tr>
            <th className="text-left p-2 w-28 text-gray-600">{cols[1] || "기본요금"}</th>
            <td className="p-2">{num(row?.base, " 원")}</td>
          </tr>
          <tr>
            <th className="text-left p-2 text-gray-600">{cols[2] || "단가(원/㎥)"}</th>
            <td className="p-2">{num(row?.unit, " 원/㎥")}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-6 text-sm text-gray-700">
        <h3 className="font-semibold mb-2">산정 방식</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>요금 = 기본요금 + (사용량 × 단가)</li>
          <li>사용량에 따른 추가 구간 없음</li>
          <li>1㎥ 이상 전체 동일 단가 적용</li>
        </ul>
      </div>
    </div>
  );
}

