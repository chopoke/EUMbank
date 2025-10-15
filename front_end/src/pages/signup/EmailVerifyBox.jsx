import { useState, useRef } from "react";

export default function EmailVerifyBox({ value, onChange, onVerified }) {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const timerRef = useRef(null);
  const baseUrl = ""; // 프록시 사용 시 빈 문자열

  const sendCode = async () => {
    if (!value) return alert("이메일을 입력하세요.");
    try {
      setSending(true);
      const res = await fetch(`${baseUrl}/api/v1/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) {
        if (res.status === 409) return alert("이미 가입된 이메일입니다.");
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
      }
      alert("인증코드를 전송했습니다. 메일을 확인하세요.");
      setCooldown(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCooldown((s) => {
          if (s <= 1) { clearInterval(timerRef.current); timerRef.current = null; return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (e) {
      console.error(e);
      alert("전송 실패: " + (e.message ?? "알 수 없는 오류"));
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!value || !code) return alert("이메일과 코드를 입력하세요.");
    try {
      const res = await fetch(`${baseUrl}/api/v1/email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data?.verified === true || data === true)) {
        setVerified(true);
        onVerified?.(true, code);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setCooldown(0);
        alert("이메일 인증이 완료되었습니다.");
      } else {
        alert(data?.message || "코드가 올바르지 않거나 만료되었습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("인증 실패: " + (e.message ?? "알 수 없는 오류"));
    }
  };

  return (
    <div className="mt-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        이메일 <span className="text-red-500">*</span>
      </label>

      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="example@email.com"
          disabled={verified}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        {!verified && (
          <button
            onClick={sendCode}
            disabled={sending || cooldown > 0}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap leading-tight"
          >
            {cooldown > 0 ? `재전송(${cooldown}s)` : "인증코드 발송"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="인증코드 6자리"
          disabled={verified}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <button
          onClick={verifyCode}
          disabled={verified}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap leading-tight"
        >
          코드 확인
        </button>
      </div>

      {verified && <p className="text-green-600 mt-2 text-sm">이메일 인증이 완료되었습니다.</p>}
    </div>
  );
}
