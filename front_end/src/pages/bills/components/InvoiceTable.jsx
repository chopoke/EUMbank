// src/pages/bills/components/InvoiceTable.jsx
import { useEffect, useState } from "react";
import api from "../../../api/axios";

export default function InvoiceTable({ ubNo, aNo, pageSize = 5 }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(null); // biNo

  const load = async (off = 0) => {
    if (!ubNo) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/bills/${ubNo}/invoices`, {
        params: { offset: off, size: pageSize, statuses: "READY,PAID" },
      });
      const list = Array.isArray(data?.rows) ? data.rows : [];
      setRows(prev => (off === 0 ? list : [...prev, ...list]));
      setTotal(Number(data?.total ?? list.length));
      setOffset(off);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRows([]); setTotal(0); setOffset(0);
    if (ubNo) load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ubNo]);

  const hasMore = rows.length < total;

  const pay = async (biNo) => {
    if (!aNo) { alert("결제 계좌를 먼저 선택하세요."); return; }
    setPaying(biNo);
    try {
      await api.post(`/api/bills/${ubNo}/pay-now`, null, { params: { biNo, aNo } });
      await load(0); // 목록 리프레시
    } catch (e) {
      console.error(e);
      alert("납부에 실패했습니다.");
    } finally {
      setPaying(null);
    }
  };

  return (
    <div className="border rounded-xl p-4 bg-white">
      <h3 className="font-semibold mb-2">청구서</h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2">년월</th>
            <th className="text-right p-2">사용량</th>
            <th className="text-right p-2">금액</th>
            <th className="text-center p-2">상태</th>
            <th className="text-center p-2">납부</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.biNo} className="border-b">
              <td className="p-2">{r.biYear}-{String(r.biMonth).padStart(2, "0")}</td>
              <td className="p-2 text-right">{Number(r.biUsage ?? 0).toLocaleString()}</td>
              <td className="p-2 text-right">{Number(r.biAmount ?? 0).toLocaleString()}</td>
              <td className="p-2 text-center">{r.biStatus}</td>
              <td className="p-2 text-center">
                {r.biStatus === "READY" ? (
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60"
                    disabled={paying === r.biNo}
                    onClick={() => pay(r.biNo)}
                  >
                    {paying === r.biNo ? "처리 중..." : "바로 납부"}
                  </button>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && !loading && (
            <tr><td className="p-3 text-center text-gray-500" colSpan={5}>데이터 없음</td></tr>
          )}
        </tbody>
      </table>

      <div className="mt-3 text-center">
        {hasMore && (
          <button
            className="px-4 py-2 rounded border disabled:opacity-60"
            onClick={() => load(offset + pageSize)}
            disabled={loading}
          >
            {loading ? "로딩..." : `더 보기 ${pageSize}개`}
          </button>
        )}
      </div>
    </div>
  );
}
