// src/pages/bills/components/InvoiceTable.jsx  — 5개씩 더보기
import { useEffect, useState } from "react";
import api from "../../../api/axios";

export default function InvoiceTable({ ubNo }) {
  const [rows, setRows] = useState([]); const [total,setTotal]=useState(0);
  const [offset,setOffset]=useState(0); const size=5;

  const load = async (off=0) => {
    const { data } = await api.get(`/api/bills/${ubNo}/invoices`, { params:{ offset:off, size } });
    setRows(off===0 ? data.rows : [...rows, ...data.rows]); setTotal(data.total); setOffset(off);
  };

  useEffect(()=>{ setRows([]); setOffset(0); load(0); },[ubNo]);

  return (
    <div className="border rounded-xl p-4 bg-white">
      <h3 className="font-semibold mb-2">청구서</h3>
      <table className="w-full text-sm">
        <thead><tr className="border-b">
          <th className="text-left p-2">년월</th>
          <th className="text-right p-2">사용량</th>
          <th className="text-right p-2">금액</th>
          <th className="text-center p-2">상태</th>
          <th className="text-center p-2">납부</th>
        </tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.biNo} className="border-b">
              <td className="p-2">{r.biYear}-{String(r.biMonth).padStart(2,"0")}</td>
              <td className="p-2 text-right">{Number(r.biUsage).toLocaleString()}</td>
              <td className="p-2 text-right">{Number(r.biAmount).toLocaleString()}</td>
              <td className="p-2 text-center">{r.biStatus}</td>
              <td className="p-2 text-center">
                {r.biStatus==="READY" &&
                  <button className="px-3 py-1 rounded bg-blue-600 text-white"
                    onClick={()=>api.post(`/api/bills/${ubNo}/pay-now`, null, { params:{ biNo:r.biNo, aNo:r.aNo }})
                      .then(()=>load(0))}>
                    바로 납부
                  </button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(offset+rows.length) < total &&
        <div className="mt-3 text-center">
          <button className="px-4 py-2 rounded border" onClick={()=>load(offset+size)}>더 보기 5개</button>
        </div>}
    </div>
  );
}
