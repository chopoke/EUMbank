// src/pages/bills/components/GasRateChart.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { fetchGasRates } from "../../../api/rates";

export default function GasRateChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    (async () => {
      const { rows } = await fetchGasRates();
      const r0 = rows?.[0] || {};
      const base = Number(r0.base_charge ?? r0.gr_base_charge ?? r0.baseCharge ?? 0);
      const unit = Number(r0.unit_price ?? r0.gr_unit_price ?? r0.unitPrice ?? 0);

      // 10~120㎥ 구간별 예상요금 계산
      const list = Array.from({ length: 12 }, (_, i) => {
        const usage = (i + 1) * 10;
        const total = base + usage * unit;
        return { usage, total };
      });
      setData(list);
    })();
  }, []);

  return (
    <div className="mt-4 border rounded-xl shadow-sm p-4 bg-white">
      <h3 className="font-semibold mb-2">사용량별 예상 요금</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="usage"
            label={{ value: "사용량(㎥)", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            label={{ value: "요금(원)", angle: -90, position: "insideLeft" }}
            tickFormatter={(v) => `${v.toLocaleString()}`}
          />
          <Tooltip formatter={(v) => `${v.toLocaleString()} 원`} />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#2563eb"  // 주황 계열
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
