import React, { useEffect, useMemo, useState, useCallback } from 'react';
import api from '../../api/axios';
import { Calculator, Send, List } from 'lucide-react';

const RATES_URL = '/api/foreign/rates';
const ME_URL    = '/api/foreign/me';
const EX_API    = '/api/foreign/exchange';

const modes = [
  { key: 'SELL',  label: '외화 → KRW (파실 때)'  },
  { key: 'BUY',   label: 'KRW → 외화 (사실 때)' },
  { key: 'CROSS', label: '외화 → 외화 (교차)' },
];

export default function ForeignExchangeConvertPage() {
  const [mode, setMode] = useState('SELL');

  // ★ 서버가 내려주는 개인 우대율 (%)
  const [myPreferentialRate, setMyPreferentialRate] = useState(0);

  const [rateData, setRateData]   = useState([]); // [{curUnit, curNm, dealBasR, ttb, tts}]
  const [accounts, setAccounts]   = useState([]); // [{accountNo, name, type, balance}]
  const [cNo, setCNo]             = useState(null);
  const [msg, setMsg]             = useState('');
  const [loading, setLoading]     = useState(false);

  // 통화/금액 (우대율은 form에서 제거)
  const [form, setForm] = useState({
    fromCur: 'USD',
    toCur:   'KRW',
    amount:  '',           // 항상 From 통화 기준
    fromAccountNo: '',     // 출금 계좌 (KRW 계좌)
  });

  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          api.get(RATES_URL, { validateStatus: () => true }),
          api.get(ME_URL,    { validateStatus: () => true }),
        ]);

        // 환율
        const rows = Array.isArray(r1.data) ? r1.data
                    : Array.isArray(r1.data?.rows) ? r1.data.rows : [];
        setRateData(rows);

        // 내 정보
        if (r2.status === 200) {
          setCNo(r2.data?.cNo ?? null);
          const accs = Array.isArray(r2.data?.accounts) ? r2.data.accounts : [];
          setAccounts(accs);
          const krw = accs.find(a => a.type === 'KRW');
          setForm(prev => ({ ...prev, fromAccountNo: (krw?.accountNo || accs[0]?.accountNo || '') }));

          // ★ 서버 우대율(%) 수신
          setMyPreferentialRate(Number(r2.data?.preferentialRate ?? 0));
        } else {
          setMsg('로그인이 필요하거나 /me 로딩 실패');
        }
      } catch (e) {
        setMsg('초기 데이터 로드 실패');
      }
    })();
  }, []);

  /** 환율 맵 */
  const mapRates = useMemo(() => {
    const m = new Map();
    rateData.forEach(r => m.set(r.curUnit, r));
    if (!m.has('KRW')) m.set('KRW', { curUnit:'KRW', curNm:'대한민국 원', dealBasR:1, ttb:1, tts:1 });
    return m;
  }, [rateData]);

  const get = (cur) => mapRates.get(cur);

  /** 미리보기 계산 (우대율 = myPreferentialRate) */
  const preview = useCallback(() => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return setResult(null);

    const feeRate = Math.min(Math.max((Number(myPreferentialRate) || 0) / 100, 0), 0.9);

    const from = get(form.fromCur);
    const to   = get(form.toCur);
    if (!from || !to) return setResult(null);

    let finalRate = 0;
    let recv;
    let feeKRW = 0;

    if (mode === 'SELL') {
      // FX -> KRW (TTB)
      const ttb = Number(from.ttb);
      const krw = amt * ttb;
      const fee = krw * feeRate;
      const take = krw - fee;
      recv = take;
      finalRate = ttb * (1 - feeRate);
      feeKRW = fee;
    } else if (mode === 'BUY') {
      // KRW -> FX (TTS)
      const tts = Number(to.tts);
      const fx  = amt / tts;
      const fee = fx * feeRate;
      const take = fx - fee;
      recv = take;
      finalRate = tts * (1 + feeRate);
      feeKRW = fee * tts;
    } else {
      // CROSS (TTB -> TTS)
      const ttb1 = Number(from.ttb);
      const tts2 = Number(to.tts);
      const krw1 = amt * ttb1;
      const fee1 = krw1 * feeRate;
      const krw2 = krw1 - fee1;
      const fx2Base = krw2 / tts2;
      const fee2 = fx2Base * feeRate;
      const take = fx2Base - fee2;
      recv = take;
      finalRate = (krw2 / amt) / tts2;
      feeKRW = fee1 + fee2;
    }

    setResult({
      fromAmount: amt,
      toAmount: recv,
      finalRate,
      commissionKrw: feeKRW,
    });
  }, [form, mode, get, myPreferentialRate]);

  useEffect(() => { preview(); }, [preview]);

  /** 제출 (서버가 우대율 재검증) */
  const submit = async () => {
    if (!result) return;
    setLoading(true);
    setMsg('');
    try {
      const payload = {
        cNo,
        fromAccountNo: form.fromAccountNo,
        fromCurUnit: form.fromCur,
        toCurUnit: form.toCur,
        fxAmount: form.amount,
        transactionType: mode,        // 'SELL' | 'BUY' | 'CROSS'
        memo: '',
        // ★ 서버 기준으로만 사용/검증. 보내더라도 서버가 다시 계산해야 함.
        commissionRate: Number(myPreferentialRate || 0),
      };
      const r = await api.post(EX_API, payload);
      setMsg(`거래 완료: ${r.data?.transactionId || '성공'}`);
    } catch (e) {
      const m = e?.response?.data?.message || e.message || '제출 실패';
      setMsg(`오류: ${m}`);
    } finally {
      setLoading(false);
    }
  };

  /** 통화 옵션(KRW 포함) */
  const allCurrencies = useMemo(() => {
    const xs = [{ curUnit: 'KRW', curNm: '대한민국 원' }, ...rateData];
    return xs;
  }, [rateData]);

  /** 모드 전환 시 기본 to/from 설정 */
  useEffect(() => {
    setResult(null);
    if (mode === 'SELL') setForm(prev => ({ ...prev, toCur: 'KRW' }));
    if (mode === 'BUY')  setForm(prev => ({ ...prev, fromCur: 'KRW' }));
  }, [mode]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ▶ 가운데 고정폭 래퍼 */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">환전 (파실 때/사실 때/교차)</h1>

        {/* 모드 탭 */}
        <div className="flex gap-2 mb-6">
          {modes.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-4 py-2 rounded-md border ${mode === m.key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {msg && (
          <div className={`p-3 rounded-md mb-6 text-sm ${msg.startsWith('오류:') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측 폼 */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border">
            {/* 통화 선택 */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* From */}
              <label className="block">
                <span className="text-sm font-medium text-gray-700">From 통화</span>
                <select
                  name="fromCur"
                  value={form.fromCur}
                  onChange={e => setForm(p => ({ ...p, fromCur: e.target.value }))}
                  disabled={mode === 'BUY'} // BUY는 KRW 고정
                  className="mt-1 block w-full border-gray-300 rounded-md"
                >
                  {allCurrencies.map(r => (
                    <option key={r.curUnit} value={r.curUnit}>
                      {r.curUnit} ({r.curNm})
                    </option>
                  ))}
                </select>
              </label>

              {/* To */}
              <label className="block">
                <span className="text-sm font-medium text-gray-700">To 통화</span>
                <select
                  name="toCur"
                  value={form.toCur}
                  onChange={e => setForm(p => ({ ...p, toCur: e.target.value }))}
                  disabled={mode === 'SELL'} // SELL은 KRW 고정
                  className="mt-1 block w-full border-gray-300 rounded-md"
                >
                  {allCurrencies
                    .filter(r => r.curUnit !== form.fromCur)
                    .map(r => (
                      <option key={r.curUnit} value={r.curUnit}>
                        {r.curUnit} ({r.curNm})
                      </option>
                  ))}
                </select>
              </label>
            </div>

            {/* 출금 계좌 (KRW) */}
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">출금 계좌 (KRW)</span>
                <select
                  name="fromAccountNo"
                  value={form.fromAccountNo}
                  onChange={e => setForm(p => ({ ...p, fromAccountNo: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md"
                >
                  {accounts.map(a => (
                    <option key={a.accountNo} value={a.accountNo}>
                      {a.accountNo} {a.name ? `· ${a.name}` : ''} ({a.type}) / 잔액: {a.balance?.toLocaleString?.() ?? a.balance ?? '-'}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* 금액 + 우대율(읽기전용) */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">환전 금액 (From 통화 기준)</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder={`예: 1,000 ${form.fromCur}`}
                  className="mt-1 block w-full border-gray-300 rounded-md"
                />
              </label>

              {/* ★ 우대율은 표시만 */}
              <div className="block">
                <span className="text-sm font-medium text-gray-700">우대율 (%)</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-indigo-50 text-indigo-700">
                    {myPreferentialRate}% 적용
                  </span>
                  <span className="text-xs text-gray-500">(서버 정책에 따라 자동 적용)</span>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={preview}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md text-white bg-indigo-600"
              >
                <Calculator className="w-4 h-4 mr-2" />
                계산하기
              </button>

              <button
                onClick={submit}
                disabled={loading || !result}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-100 text-indigo-700 disabled:opacity-50"
                title={mode === 'SELL' ? '' : '백엔드가 BUY/CROSS를 지원해야 제출됩니다.'}
              >
                <Send className="w-4 h-4 mr-2" />
                신청 제출
              </button>
            </div>
          </div>

          {/* 우측 요약 */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border">
            <h2 className="text-lg font-bold mb-4">환전 정보 및 결과 요약</h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">모드</dt>
                <dd className="font-semibold">{modes.find(m => m.key === mode)?.label}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">From → To</dt>
                <dd className="font-semibold">
                  {form.fromCur} → {form.toCur}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">우대율</dt>
                <dd className="font-semibold">{myPreferentialRate}%</dd>
              </div>
              <hr />
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">From 금액</dt>
                <dd className="font-semibold">
                  {form.amount ? Number(form.amount).toLocaleString() : '-'} {form.fromCur}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">적용 환율(표시)</dt>
                <dd className="font-semibold">
                  {result ? result.finalRate.toFixed(6) : '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">수수료(KRW 환산)</dt>
                <dd className="font-semibold">{result ? Math.round(result.commissionKrw).toLocaleString() : '-'} KRW</dd>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <dt className="text-base font-bold">수취 금액</dt>
                <dd className="text-xl font-extrabold text-indigo-600">
                  {result ? `${result.toAmount.toFixed(4)} ${form.toCur}` : '-'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* (선택) 내역 섹션 */}
        <div className="mt-10 hidden">
          <h2 className="text-xl font-bold mb-3 flex items-center"><List className="w-4 h-4 mr-2" />환전 내역</h2>
        </div>
      </div>
    </div>
  );
}