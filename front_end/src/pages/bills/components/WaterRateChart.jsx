// src/pages/bills/components/WaterRateChart.jsx
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function WaterRateChart({ maxUsage=120 }) {
  const data = useMemo(() => {
    const base = 7000, unit = 164;
    return Array.from({length: Math.floor(maxUsage/10)}, (_,i)=>{
      const usage = (i+1)*10;
      const total = base + usage*unit;
      return { usage, total };
    });
  }, [maxUsage]);

  return (
    <div className="border rounded-xl p-4 bg-white">
      <h3 className="font-semibold mb-2">수도 요금(기본 7,000 + 164×사용량)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="usage" label={{ value:"사용량(㎥)", position:"insideBottom", offset:-5 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
