// src/pages/bills/components/InvoiceTable.jsx
import { useEffect, useState } from "react";
import api from "../../../api/axios";
import { ArrowDownTrayIcon, BanknotesIcon } from "@heroicons/react/24/outline";
import PinVerifyModal from "./PinVerifyModal";

export default function InvoiceTable({ ubNo, aNo, pageSize = 5 }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(null); // biNo
  const [downloading, setDownloading] = useState(null);

  // PIN 모달 상태
  const [pinOpen, setPinOpen] = useState(false);
  const [pinTargetBiNo, setPinTargetBiNo] = useState(null);
  const [pinSubmitting, setPinSubmitting] = useState(false);

  const load = async (off = 0) => {
    if (!ubNo) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/bills/${ubNo}/invoices`, {
        params: { offset: off, size: pageSize, statuses: "READY,PAID" },
      });
      const list = Array.isArray(data?.rows) ? data.rows : [];
      setRows((prev) => (off === 0 ? list : [...prev, ...list]));
      setTotal(Number(data?.total ?? list.length));
      setOffset(off);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRows([]);
    setTotal(0);
    setOffset(0);
    if (ubNo) load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ubNo]);

  const hasMore = rows.length < total;

  // "바로 납부" 버튼 클릭 시: PIN 모달 열기
  const handleClickPay = (biNo) => {
    if (!aNo) {
      alert("결제 계좌를 먼저 선택하세요.");
      return;
    }
    setPinTargetBiNo(biNo);
    setPinOpen(true);
  };

  // PIN 모달에서 PIN 입력 완료 시
  const handlePinConfirm = async (pin) => {
    if (!pinTargetBiNo) return;
    setPinSubmitting(true);
    setPaying(pinTargetBiNo);
    try {
      await api.post(
        `/api/bills/${ubNo}/pay-now`,
        null,
        {
          params: { biNo: pinTargetBiNo, aNo, pin }, // @RequestParam biNo, aNo, pin
        }
      );
      await load(0); // 목록 리프레시
      setPinOpen(false);
      setPinTargetBiNo(null);
    } catch (e) {
      console.error(e);
      if (e.response?.status === 401) {
        alert("PIN 번호가 올바르지 않습니다.");
        throw e; // PinPadModal 에서 digits 리셋
      } else {
        alert("납부에 실패했습니다.");
        throw e;
      }
    } finally {
      setPaying(null);
      setPinSubmitting(false);
    }
  };

  const handlePinClose = () => {
    if (pinSubmitting) return;
    setPinOpen(false);
    setPinTargetBiNo(null);
  };

  // === 영수증 다운로드 ===
  const downloadReceipt = async (biNo) => {
    setDownloading(biNo);
    try {
      const res = await api.get(`/api/bills/invoices/${biNo}/receipt`, {
        responseType: "blob",
      });

      const dispo = res.headers?.["content-disposition"] || "";
      const m = dispo.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
      const name = decodeURIComponent(m?.[1] || m?.[2] || `receipt-${biNo}.pdf`);

      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name.endsWith(".pdf") ? name : `${name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("영수증을 다운로드할 수 없습니다.");
    } finally {
      setDownloading(null);
    }
  };
  // =====================

  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg text-gray-800">청구서 내역</h3>
        <span className="text-sm text-gray-500">
          총 {total.toLocaleString()}건
        </span>
      </div>

      <table className="w-full text-sm border-t border-b border-gray-200">
        <thead className="bg-gray-50 text-gray-700">
          <tr>
            <th className="text-left p-2 w-20">년월</th>
            <th className="text-right p-2 w-24">사용량</th>
            <th className="text-right p-2 w-28">금액</th>
            <th className="text-center p-2 w-20">상태</th>
            <th className="text-center p-2 w-32">납부</th>
            <th className="text-center p-2 w-36">영수증</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.biNo}
              className="border-t hover:bg-gray-50 transition-colors"
            >
              <td className="p-2 font-medium text-gray-800">
                {r.biYear}-{String(r.biMonth).padStart(2, "0")}
              </td>
              <td className="p-2 text-right text-gray-600">
                {Number(r.biUsage ?? 0).toLocaleString()}
              </td>
              <td className="p-2 text-right text-gray-800 font-semibold">
                {Number(r.biAmount ?? 0).toLocaleString()} 원
              </td>
              <td
                className={`p-2 text-center font-semibold ${
                  r.biStatus === "PAID"
                    ? "text-emerald-600"
                    : r.biStatus === "READY"
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {r.biStatus}
              </td>
              <td className="p-2 text-center">
                {r.biStatus === "READY" ? (
                  <button
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-60 mx-auto"
                    disabled={paying === r.biNo}
                    onClick={() => handleClickPay(r.biNo)}
                  >
                    <BanknotesIcon className="w-4 h-4" />
                    {paying === r.biNo ? "처리 중..." : "바로 납부"}
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </td>
              <td className="p-2 text-center">
                {r.biStatus === "PAID" ? (
                  <button
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-60 mx-auto"
                    disabled={downloading === r.biNo}
                    onClick={() => downloadReceipt(r.biNo)}
                    title="PDF 다운로드"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    {downloading === r.biNo ? "다운로드 중..." : "영수증"}
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && !loading && (
            <tr>
              <td
                className="p-4 text-center text-gray-500 bg-gray-50"
                colSpan={6}
              >
                데이터 없음
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-4 text-center">
        {hasMore && (
          <button
            className="px-5 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-60"
            onClick={() => load(offset + pageSize)}
            disabled={loading}
          >
            {loading ? "로딩 중..." : `더 보기 (${pageSize}개)`}
          </button>
        )}
      </div>

      {/* PIN 모달 */}
      <PinVerifyModal
        open={pinOpen}
        title="공과금 바로 납부"
        description="선택한 청구서를 출금하기 위해 결제 PIN 번호를 입력해주세요."
        loading={pinSubmitting}
        onConfirm={handlePinConfirm}
        onClose={handlePinClose}
      />
    </div>
  );
}
