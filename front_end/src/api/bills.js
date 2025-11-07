import api from "./axios";

// 유틸: 멱등키 생성
function idem() {
  return crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
}

/** 청구서 목록
 * GET /api/bill/{ubNo}/invoices?status=READY
 * return: [{ biNo, ym, amount, dueAt, status }]
 */
export async function listInvoices(ubNo, { status } = {}) {
  const { data } = await api.get(`/api/bill/${ubNo}/invoices`, { params: { status } });
  return Array.isArray(data) ? data : [];
}

/** 납부 실행
 * POST /api/bill/invoices/{biNo}/pay
 * body: { aNo }
 * headers: Idempotency-Key
 * return: { status, bpNo, paidAt }
 */
export async function payInvoice(biNo, { aNo }) {
  const { data } = await api.post(
    `/api/bill/invoices/${biNo}/pay`,
    { aNo },
    { headers: { "Idempotency-Key": idem() } }
  );
  return data;
}

/** 자동이체 등록
 * POST /api/bill/{ubNo}/autopay
 * body: { aNo, payDay, payTime, startDate, endDate?, memo? }
 * return: { baNo, aNo, payDay, payTime, startedAt, endedAt }
 */
export async function createAutopay(ubNo, payload) {
  const { data } = await api.post(
    `/api/bill/${ubNo}/autopay`,
    payload,
    { headers: { "Idempotency-Key": idem() } }
  );
  return data;
}

/** 로그인 사용자 공과금 목록 */
export async function listMyUtilityBills() {
  const { data } = await api.get("/api/bill/my/ub");
  return Array.isArray(data) ? data : [];
}
