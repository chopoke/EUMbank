// src/pages/bills/components/GasRateChart.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function GasRateChart({ maxUsage=120 }) {
  const base=2000, unit=19.5;
  const data = Array.from({length: Math.floor(maxUsage/10)}, (_,i)=>{
    const usage=(i+1)*10; const total = base + usage*unit;
    return { usage, total };
  });

  return (
    <div className="border rounded-xl p-4 bg-white">
      <h3 className="font-semibold mb-2">가스 요금(기본 2,000 + 19.5×사용량)</h3>
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
