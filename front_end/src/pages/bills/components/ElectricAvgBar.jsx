// src/pages/bills/components/ElectricAvgBar.jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import api from "../../../api/axios";

export default function ElectricAvgBar({ year, month }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api.get("/api/bills/rates/electric/avg", { params:{ year, month }})
       .then(({data}) => setRows((data||[]).map(r=>({ area:r.eaAreaCd, unit:+r.eaAvgUnit }))))
       .catch(()=>setRows([]));
  }, [year, month]);

  return (
    <div className="border rounded-xl p-4 bg-white">
      <h3 className="font-semibold mb-2">지역별 평균 전기 단가</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="area" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="unit" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
