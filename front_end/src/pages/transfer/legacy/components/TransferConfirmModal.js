import { useState, useEffect } from 'react';

export default function TransferConfirmModal({ isOpen, onClose, onConfirm, data }) {
  const [agree, setAgree] = useState(false);
  const [otp, setOtp] = useState('');

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setAgree(false);
      setOtp('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isButtonEnabled = agree && otp.replace(/\D/g, '').length >= 6;
  const formatKRW = (n) => `₩${(n || 0).toLocaleString('ko-KR')}`;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <section 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="dlg-title"
        className="w-full max-w-2xl rounded-2xl border bg-white shadow-xl"
      >
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <h1 id="dlg-title" className="text-lg font-semibold">이체 정보 확인</h1>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-gray-700">
            보안매체 필요
          </span>
        </header>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-500">보내는 계좌</div>
              <div className="text-lg font-semibold">{data.fromAccountDisplay}</div>
              <div className="text-sm text-gray-500 mt-4">받는 분</div>
              <div className="text-lg font-semibold">{data.recipient?.bank} · {data.recipient?.account}</div>
              <div className="text-sm text-gray-500">예금주</div>
              <div className="font-medium">{data.recipient?.name}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">금액</div>
              <div className="text-2xl font-bold font-mono">{formatKRW(data.amount)}</div>
              <div className="text-sm text-gray-500">수수료</div>
              <div className="font-medium font-mono">{formatKRW(data.fee)}</div>
              <div className="text-sm text-gray-500">메모</div>
              <div className="font-medium">{data.memo || '-'}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="checkbox" 
                className="h-4 w-4"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              이체 내역을 확인했으며, 전자금융거래 약관에 동의합니다.
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">OTP</span>
              <input 
                inputMode="numeric" 
                className="rounded border px-2 py-1 text-sm w-36" 
                placeholder="6자리" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl border bg-amber-50 border-amber-200 p-4 text-sm text-amber-900">
            스미싱/피싱이 의심되면 즉시 고객센터로 연락하세요.
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50">취소</button>
            <button 
              onClick={onConfirm}
              disabled={!isButtonEnabled}
              className="rounded-full bg-blue-700 text-white px-5 py-2 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            >
              이체 실행
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}