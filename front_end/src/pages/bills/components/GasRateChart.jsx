// GasRateChart.jsx
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
export default function GasRateChart({ base=2000, unit=19.5 }) {
  const data = Array.from({ length: 12 }, (_, i) => {
    const usage = (i + 1) * 10;
    return { usage, total: base + usage * unit };
  });
  return (
    <div className="mt-4 border rounded-xl shadow-sm p-4 bg-white">
      <h3 className="font-semibold mb-2">가스 요금(기본 {base.toLocaleString()} + {unit}×사용량)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="usage" label={{ value: "사용량(㎥)", position: "insideBottom", offset: -5 }}/>
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="total" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
