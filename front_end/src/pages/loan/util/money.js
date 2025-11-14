export const won = (n) => Number(n || 0).toLocaleString("ko-KR");
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const onlyDigits = (s = "") => s.replace(/[^\d]/g, "");
export const toNum = (s = "") => {
  const clean = onlyDigits(String(s));
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
};
export const fmtKO = (n) => Number(n || 0).toLocaleString("ko-KR");

export function numberToKorean(n, { money = true, omitIl = true } = {}) {
  if (n == null) return "";
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  if (num === 0) return money ? "영원" : "영";

  const small = ["", "십", "백", "천"];
  const digit = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
  const big = ["", "만", "억", "조", "경"];

  const parts = [];
  let rest = Math.abs(Math.trunc(num));
  let bigIdx = 0;

  while (rest > 0 && bigIdx < big.length) {
    const chunk = rest % 10000;
    rest = Math.floor(rest / 10000);
    if (chunk) {
      let chunkStr = "";
      let temp = chunk;
      for (let i = 0; i < 4; i++) {
        const d = temp % 10;
        if (d) {
          const dKo = (omitIl && d === 1 && i > 0) ? "" : digit[d];
          chunkStr = dKo + small[i] + chunkStr;
        }
        temp = Math.floor(temp / 10);
        if (temp === 0) break;
      }
      parts.unshift(chunkStr + (bigIdx > 0 ? big[bigIdx] : ""));
    }
    bigIdx++;
  }

  const sign = num < 0 ? "마이너스 " : "";
  return sign + parts.join("");
}