// 수도요금 차트
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

export default function WaterRateChart() {
  const data = Array.from({ length: 12 }, (_, i) => {
    const usage = (i + 1) * 10; // 10,20,...120㎥
    const base = 70;
    const unit = 163.7;
    const total = base + usage * unit;
    return { usage, total };
  });

  return (
    <div className="mt-4 border rounded-xl shadow-sm p-4 bg-white">
      <h3 className="font-semibold mb-2">사용량별 예상 요금</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="usage" label={{ value: "사용량(㎥)", position: "insideBottom", offset: -5 }} />
          <YAxis label={{ value: "요금(원)", angle: -90, position: "insideLeft" }} />
          <Tooltip formatter={(v) => `${v.toLocaleString()} 원`} />
          <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
