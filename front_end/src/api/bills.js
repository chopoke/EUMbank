import api from "./axios";

const idem = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export async function listInvoices(ubNo, { status } = {}) {
  const { data } = await api.get(`/api/bill/${ubNo}/invoices`, { params: { status } });
  return data; // [{biNo, ym, amount, dueAt, status}, ...]
}

export async function createAutopay(ubNo, payload) {
  const { data } = await api.post(`/api/bill/${ubNo}/autopay`, payload);
  return data; // {baNo, aNo, payDay, payTime, startedAt, endedAt}
}

export async function payInvoice(biNo, { aNo }) {
  const { data } = await api.post(
    `/api/bill/invoices/${biNo}/pay`,
    { aNo },
    { headers: { "Idempotency-Key": idem() } }
  );
  return data; // {bpNo, status, paidAt}
}
