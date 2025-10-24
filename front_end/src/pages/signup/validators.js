// 아이디/비번/폰/이메일/생년월일 정규식 유틸
// 아이디: 영문+숫자 조합 6~20자(둘 다 포함)
export const validUsername = (u) =>
  /^[A-Za-z0-9]{6,20}$/.test(u) && /[A-Za-z]/.test(u) && /\d/.test(u);

// 비밀번호: 8~32자, 영문/숫자/특문 중 2종 이상
export const validPassword = (p) => {
  if (!p || p.length < 8 || p.length > 32) return false;
  const kinds = [/[A-Za-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
  return kinds >= 2;
};

// 휴대폰(하이픈 선택)
export const validPhone = (ph) => /^01[0-9]-?\d{3,4}-?\d{4}$/.test(ph);

// 이메일
export const validEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);

// 생년월일 yyyy-mm-dd, 과거 날짜
export const validBirth = (b) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b)) return false;
  const d = new Date(b), t = new Date();
  return !Number.isNaN(d.getTime()) && d < t && d.getFullYear() >= 1900;
};
