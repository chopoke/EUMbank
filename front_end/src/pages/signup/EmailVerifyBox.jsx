// src/pages/signup/EmailVerifyBox.jsx
import { useState, useRef } from "react";

export default function EmailVerifyBox({ value, onChange, onVerified }) {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const timerRef = useRef(null);

  // 프록시 사용 시 빈 문자열, 프록시 미사용 시 "http://localhost:8081"
  const baseUrl = "";

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
        const msg = await res.text().catch(() => "");
        if (msg.includes("USED_EMAIL")) {
          alert("이미 인증을 완료한 이메일입니다. 다른 이메일을 사용해 주세요.");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      alert("인증코드를 전송했습니다. 메일을 확인하세요.");
      setCooldown(60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCooldown((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
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
      
      // 재사용 차단: 서버에서 false 또는 4xx가 올 수 있음
      let ok = false;
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        ok = !!data?.verified || data === true; // 기존 형태 유지
      } else {
        const msg = await res.text().catch(() => "");
        if (msg.includes("USED_EMAIL")) {
          alert("이미 인증된 이메일입니다.");
          return;
        }
      }

      if (ok) {
        setVerified(true);
        onVerified?.(true);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        setCooldown(0);
        alert("이메일 인증이 완료되었습니다.");
      } else {
        alert("코드가 올바르지 않거나 만료되었습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("인증 실패: " + (e.message ?? "알 수 없는 오류"));
    }
  };

  return (
    <div className="mt-2">
      {/* 라벨 */}
      <label className="block text-sm font-medium text-gray-700 mb-2">
        이메일 <span className="text-red-500">*</span>
      </label>

      {/* 이메일 입력 + 인증코드 발송 버튼 (한 줄) */}
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e)=>onChange?.(e.target.value)}
          placeholder="example@email.com"
          disabled={verified}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        {!verified && (
          <button
            onClick={sendCode}
            disabled={sending || cooldown>0}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap leading-tight"
          >
            {cooldown>0 ? `재전송(${cooldown}s)` : "인증코드 발송"}
          </button>
        )}
      </div>

      {/* 코드 입력 + 확인 버튼 (한 줄) */}
      <div className="flex items-center gap-2 mt-2">
        <input
          value={code}
          onChange={(e)=>setCode(e.target.value)}
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

      {verified && (
        <p className="text-green-600 mt-2 text-sm"> 이메일 인증이 완료되었습니다.</p>
      )}
    </div>
  );
}
