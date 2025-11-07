export function toKoRateType(v = "") {
  const s = String(v).trim().toUpperCase();
  if (s === "FIXED" || s === "고정" || s === "고정금리") return "고정금리";
  if (s === "VARIABLE" || s === "변동" || s === "변동금리") return "변동금리";
  return "고정금리";
}

export function normalizeRpayKo(v = "") {
  const s = String(v).trim();
  if (!s) return "원리금균등";
  if (/분할상환|원금균등/i.test(s)) return "원금균등";
  if (/만기일시/i.test(s)) return "만기일시";
  if (/원리금균등/i.test(s)) return "원리금균등";
  return "원리금균등";
}

export function computeVisibility(productType = "", rpayKo = "") {
  const t = String(productType).toUpperCase();
  const isMortgage = t.includes("MORTGAGE") || t.includes("담보");
  const isJeonse   = t.includes("JEONSE")   || t.includes("전세");
  const isAuto = t.includes("AUTO") || t.includes("자동차")
  const isBullet   = /만기일시/.test(String(rpayKo));
  return { isMortgage, isJeonse, isAuto, isBullet };
}

export function monthlyAnnuity(P, n, annualRate) {
  P = Number(P || 0);
  n = Number(n || 0);
  const r = Number(annualRate || 0) / 100 / 12;
  if (!P || !n) return 0;
  if (!r) return Math.ceil(P / n);
  const a = (P * r) / (1 - Math.pow(1 + r, -n));
  return Math.ceil(a);
}