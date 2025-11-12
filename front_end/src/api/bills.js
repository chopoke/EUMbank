// src/api/bills.js
import api from "./axios";

/** 내 공과금 목록 */
export async function listMyUtilityBills() {
  const { data } = await api.get("/api/bills/utility-bills"); 
  // 백엔드가 다른 경로면 여기만 바꾸면 됨.
  const rows = Array.isArray(data) ? data : (data?.rows || []);
  return rows.map(v => ({
    ubNo: v.ubNo ?? v.ub_no ?? v.ubno,
    provider: v.bpCode ?? v.bp_code ?? v.provider,
    holder: v.ubHolder ?? v.ub_holder ?? v.holder,
  }));
}

/** 청구서 전체 조회(READY,PAID). 서버 페이징 사용하지만 프론트는 한번에 받아서 필터링 */
export async function listInvoices(ubNo) {
  const params = { offset: 0, size: 999, statuses: "READY,PAID" };
  const { data } = await api.get(`/api/bills/${ubNo}/invoices`, { params });
  const rows = Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []);
  return rows.map(r => ({
    biNo: r.biNo ?? r.bi_no,
    ym: `${r.biYear ?? r.bi_year}-${String(r.biMonth ?? r.bi_month).padStart(2, "0")}`,
    amount: Number(r.biAmount ?? r.bi_amount ?? 0),
    dueAt: r.biDueAt ?? r.bi_due_at ?? null,
    status: r.biStatus ?? r.bi_status ?? "READY",
    paidAt: r.paidAt ?? r.bpPaidAt ?? r.bp_paid_at ?? null, // 없으면 null
  }));
}

/** 즉시 납부 */
export async function payInvoice(ubNo, biNo, { aNo }) {
  const { data } = await api.post(`/api/bills/${ubNo}/pay-now`, null, { params: { biNo, aNo } });
  // BillPayment 반환 표준화
  return {
    bpNo: data.bpNo ?? data.bp_no,
    status: data.bpStatus ?? data.bp_status ?? "COMPLETED",
    receiptNo: data.bpReceiptNo ?? data.bp_receipt_no,
    paidAt: data.bpPaidAt ?? data.bp_paid_at,
  };
}

/** 전기 평균단가 캐시 조회 */
export async function fetchElectricAvg({ year, month, areaCd }) {
  const { data } = await api.get("/api/bills/rates/electric/avg", { params: { year, month, areaCd } });
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  return rows.map(r => ({
    year: r.eaYear ?? year,
    month: r.eaMonth ?? month,
    areaCd: r.eaAreaCd ?? areaCd ?? "11",
    unit: Number(r.eaAvgUnit ?? r.unit ?? 0)
  }));
}

export async function fetchElectricContracts({ year, month, metroCd }) {
  const { data } = await api.get("/api/bills/rates/electric/contracts", { params: { year, month, metroCd } });
  const root = typeof data === "string" ? JSON.parse(data) : data;

  const arr = findArray(root);
  return arr.map((n) => ({
    cntr: n?.cntr ?? "-",
    custCnt: num(n?.custCnt),
    powerUsage: num(n?.powerUsage),
    bill: num(n?.bill),
    unitCost: num(n?.unitCost ?? n?.avgUnitPrice ?? n?.unitPrice),
  })).filter(row => row.unitCost > 0 || row.bill > 0 || row.powerUsage > 0);
}

function findArray(obj) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  if (typeof obj === "object") {
    for (const k of ["data", "totData", "items", "item", "list"]) {
      if (Array.isArray(obj[k])) return obj[k];
      if (obj[k] && Array.isArray(obj[k]?.item)) return obj[k].item;
    }
    for (const v of Object.values(obj)) {
      const a = findArray(v);
      if (a.length) return a;
    }
  }
  return [];
}
function num(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }

/** 수도/가스 요금표 (단일행 최신) */
export async function fetchWaterRates() {
  const { data } = await api.get("/api/bills/rates/water/latest");
  return { rows: Array.isArray(data?.rows) ? data.rows : [] };
}
export async function fetchGasRates() {
  const { data } = await api.get("/api/bills/rates/gas/latest");
  return { rows: Array.isArray(data?.rows) ? data.rows : [] };
}
