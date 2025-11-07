import api from "./axios";

export async function fetchElectricRates({ year, month, metroCd = "11", svcKindCd = "1" }){
  const { data } = await api.get("/api/rates/electric", {
    params: { year, month, metroCd, svcKindCd }
  });
  // KEPCO 원본은 data.data / data.items / data.list 중 하나에 배열로 올 수 있음
  const raw = data?.data || {};
  const rows = Array.isArray(raw.data) ? raw.data
            : Array.isArray(raw.items) ? raw.items
            : Array.isArray(raw.list) ? raw.list
            : Array.isArray(raw)      ? raw
            : [];
  return { rows, raw };
}

/** 수도 요금표: 단일 행 */
export async function fetchWaterRates() {
  const { data } = await api.get("/api/rates/water");
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  return { rows, raw: data };
}

/** 가스 요금표: 단일 행 */
export async function fetchGasRates() {
  const { data } = await api.get("/api/rates/gas");
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  return { rows, raw: data };
}
