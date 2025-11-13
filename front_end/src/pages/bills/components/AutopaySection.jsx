// src/pages/bills/components/AutopaySection.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../../../api/axios";

/** 계좌 마스킹: ***-***-1234 형태 */
const maskAccount = (n) => String(n || "").replace(/\d(?=(?:\D*\d){4})/g, "*");

/**
 * UI 자동이체 섹션
 * - 목록 조회:   GET    /api/bills/:ubNo/autopay
 * - 신규 등록:   POST   /api/bills/:ubNo/autopay        { aNo, payDay, payTime, memo }
 * - 상태 토글:   PATCH  /api/bills/autopay/:baNo        { active }
 * - 정보 수정:   PATCH  /api/bills/autopay/:baNo        { payDay?, payTime?, memo? }
 * - 삭제:       DELETE /api/bills/autopay/:baNo
 */
export default function AutopaySection({ ubNo, aNo, accounts = [] }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const list = Array.isArray(accounts) ? accounts : [];

  // 셀 표기를 위한 라벨(이미 마스킹된 acc.label 우선)
  const labelFor = (num) => {
    const hit = list.find((acc) => Number(acc.aNo) === Number(num));
    if (!hit) return num ? `aNo=${num}` : "-";
    return hit.label || maskAccount(hit.accountNo);
  };

  const [form, setForm] = useState({ payDay: "", payTime: "09:00:00", memo: "" });

  const dayOptions = useMemo(() => Array.from({ length: 28 }, (_, i) => i + 1), []);

  const load = useCallback(async () => {
    if (!ubNo) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/bills/${ubNo}/autopay`);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      alert("자동이체 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [ubNo]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e) {
    e.preventDefault();
    if (!aNo) {
      alert("결제 계좌를 먼저 선택하세요.");
      return;
    }
    const payDay = Number(form.payDay);
    if (!Number.isInteger(payDay) || payDay < 1 || payDay > 28) {
      alert("이체일은 1~28 사이여야 합니다.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/api/bills/${ubNo}/autopay`, {
        aNo: Number(aNo),
        payDay,
        payTime: form.payTime || "09:00:00",
        memo: form.memo?.trim() || "",
      });
      setForm({ payDay: "", payTime: "09:00:00", memo: "" });
      await load();
    } catch {
      alert("자동이체 등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(baNo, cur) {
    try {
      await api.patch(`/api/bills/autopay/${baNo}`, { active: cur === "Y" ? "N" : "Y" });
      await load();
    } catch {
      alert("상태 변경에 실패했습니다.");
    }
  }

  async function updateRow(baNo, patch) {
    try {
      await api.patch(`/api/bills/autopay/${baNo}`, patch);
      await load();
    } catch {
      alert("수정에 실패했습니다.");
    }
  }

  async function removeRow(baNo) {
    if (!window.confirm("해당 자동이체를 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/bills/autopay/${baNo}`);
      await load();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <section className="border rounded-xl shadow-sm p-5 bg-white">
      <h2 className="font-semibold mb-3">자동이체</h2>

      <p className="text-sm text-gray-600 mb-3">
        {aNo ? (
          <>
            현재 결제 계좌:&nbsp;
            <span className="font-medium text-gray-800">
              {/* 기존: ({accountInfo?.accountNo}) → 마스킹으로 교체 */}
              {labelFor(aNo)}
            </span>
          </>
        ) : (
          <span className="text-red-600">미선택 — 상단 ‘결제 계좌’에서 선택하세요.</span>
        )}
      </p>

      {/* 등록 폼 */}
      <form onSubmit={onCreate} className="grid gap-2 sm:grid-cols-5 items-end">
        <div className="sm:col-span-1">
          <label className="block text-sm text-gray-600 mb-1">이체일(1~28)</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={form.payDay}
            onChange={(e) => setForm((f) => ({ ...f, payDay: e.target.value }))}
            required
          >
            <option value="">선택</option>
            {dayOptions.map((d) => (
              <option key={d} value={d}>
                {d}일
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1">
          <label className="block text-sm text-gray-600 mb-1">이체시각</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1"
            placeholder="09:00:00"
            value={form.payTime}
            onChange={(e) => setForm((f) => ({ ...f, payTime: e.target.value }))}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">메모</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1"
            placeholder="예: 매월 전기요금"
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
          />
        </div>

        <div className="sm:col-span-1">
          <button
            type="submit"
            disabled={saving || !aNo}
            className={`w-full px-3 py-2 rounded-lg text-white ${
              !aNo ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700"
            }`}
            title={!aNo ? "결제 계좌 선택 필요" : "등록"}
          >
            {saving ? "등록중..." : "등록"}
          </button>
        </div>
      </form>

      {/* 목록 */}
      <div className="mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2 pr-4">상태</th>
                <th className="py-2 pr-4">이체일</th>
                <th className="py-2 pr-4">시각</th>
                <th className="py-2 pr-4">계좌</th>
                <th className="py-2 pr-4">메모</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={6}>
                    불러오는 중…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="py-3 text-gray-500" colSpan={6}>
                    등록된 자동이체가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.baNo} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <button
                        onClick={() => toggleActive(r.baNo, r.baActive)}
                        className={`px-2 py-1 rounded ${
                          r.baActive === "Y"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                        title="활성/비활성 전환"
                      >
                        {r.baActive === "Y" ? "활성" : "비활성"}
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      <select
                        className="border rounded px-2 py-1"
                        value={r.baPayDay ?? ""}
                        onChange={(e) => updateRow(r.baNo, { payDay: Number(e.target.value) })}
                      >
                        {dayOptions.map((d) => (
                          <option key={d} value={d}>
                            {d}일
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        className="border rounded px-2 py-1 w-32"
                        defaultValue={r.baPayTime ?? "09:00:00"}
                        onBlur={(e) => {
                          const v = (e.target.value || "09:00:00").trim();
                          if (v !== r.baPayTime) updateRow(r.baNo, { payTime: v });
                        }}
                      />
                    </td>
                    <td className="py-2 pr-4">{labelFor(r.aNo ?? aNo)}</td>
                    <td className="py-2 pr-4">
                      <input
                        className="border rounded px-2 py-1 w-56"
                        defaultValue={r.baMemo ?? ""}
                        onBlur={(e) => {
                          const v = (e.target.value || "").trim();
                          if (v !== (r.baMemo ?? "")) updateRow(r.baNo, { memo: v });
                        }}
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <button onClick={() => removeRow(r.baNo)} className="text-red-600 hover:underline">
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
