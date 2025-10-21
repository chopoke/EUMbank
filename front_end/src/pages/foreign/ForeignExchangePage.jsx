// src/pages/foreign/ForeignExchangePage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import { RefreshCw, Calculator, Send, List } from 'lucide-react';

const API_BASE_URL = '/api/foreign/exchange';
const RATES_URL    = '/api/foreign/rates';
const ME_URL       = '/api/foreign/me';

const normalizeNumber = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replaceAll(',', '').trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

const ForeignExchangePage = () => {
  const [activeTab, setActiveTab] = useState('exchange');

  // 서버 우대율 (%)
  const [myPreferentialRate, setMyPreferentialRate] = useState(0);

  const [rateData, setRateData] = useState([]);
  const [cNo, setCNo] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 신청 후 히스토리 새로고침 트리거
  const [historyVersion, setHistoryVersion] = useState(0);

  const [form, setForm] = useState({
    fromCurUnit: 'USD',     // 왼쪽 셀렉트(항상 외화)
    toCurUnit: 'KRW',
    fxAmount: '',
    transactionType: 'BUY', // ★ 기본을 매입(사기)
    exchangeType: '송금',
    memo: '',
    fromAccountNo: '',
  });

  const isBuy = form.transactionType === 'BUY';
  const selectedFx = form.fromCurUnit;

  // ★ BUY/SELL에 따라 색상 톤 자동 전환
  const tone = useMemo(() => {
    return isBuy
      ? { // BUY = 파랑
          text: 'text-blue-600',
          textMuted: 'text-blue-700',
          bgSoft: 'bg-blue-50',
          ring: 'ring-blue-200',
          btn: 'bg-blue-600 hover:bg-blue-700',
          btnLight: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
          borderSoft: 'border-blue-200',
        }
      : { // SELL = 빨강(rose)
          text: 'text-rose-600',
          textMuted: 'text-rose-700',
          bgSoft: 'bg-rose-50',
          ring: 'ring-rose-200',
          btn: 'bg-rose-600 hover:bg-rose-700',
          btnLight: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
          borderSoft: 'border-rose-200',
        };
  }, [isBuy]);

  const [calculationResult, setCalculationResult] = useState(null);

  useEffect(() => {
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async () => {
    console.log('[DEBUG] axios baseURL =', api.defaults.baseURL,
                'withCredentials =', api.defaults.withCredentials);
    try {
      console.log('[DEBUG] calling /api/foreign/rates & /api/foreign/me ...');

      const [rateRes, meRes] = await Promise.all([
        api.get(RATES_URL, { validateStatus: () => true }),
        api.get(ME_URL,    { validateStatus: () => true }),
      ]);

      console.log('[DEBUG] rates status/data', rateRes.status, rateRes.data);
      console.log('[DEBUG] me status/data',    meRes.status,  meRes.data);

      // 환율
      if (rateRes.status !== 200) {
        console.error('GET /api/foreign/rates FAIL:', rateRes.status, rateRes.data);
        setRateData([]);
      } else {
        const rows = Array.isArray(rateRes.data)
          ? rateRes.data
          : Array.isArray(rateRes.data?.rows) ? rateRes.data.rows : [];
        setRateData(rows);
        if (!Array.isArray(rateRes.data) && !rateRes.data?.rows) {
          setMessage('환율 데이터 형식이 예상과 다릅니다.');
        }
      }

      // 고객
      if (meRes.status === 200) {
        const me = meRes.data || {};
        const accs = Array.isArray(me.accounts) ? me.accounts : [];
        setCNo(me.cNo ?? null);
        setAccounts(accs);
        const krw = accs.find(a => a.type === 'KRW' || a.currency === 'KRW');
        const picked = krw?.accountNo || accs[0]?.accountNo || '';
        setForm(prev => ({ ...prev, fromAccountNo: picked }));
        setMyPreferentialRate(Number(me.preferentialRate ?? 0));
      } else if (meRes.status === 401) {
        setMessage('로그인이 필요합니다. (우상단 로그인 버튼)');
        setCNo(null);
        setAccounts([]);
        setForm(prev => ({ ...prev, fromAccountNo: '' }));
      } else {
        console.error('GET /api/foreign/me FAIL:', meRes.status, meRes.data);
        setMessage('고객 정보를 불러오지 못했습니다.');
        setCNo(null);
        setAccounts([]);
        setForm(prev => ({ ...prev, fromAccountNo: '' }));
      }
    } catch (e) {
      console.error('초기 데이터 로드 실패:', e);
      setMessage('초기 환율/고객 정보를 불러오지 못했습니다.');
      setRateData([]);
      setCNo(null);
      setAccounts([]);
      setForm(prev => ({ ...prev, fromAccountNo: '' }));
    }
  };

  const currentRate = useMemo(() => {
    if (!Array.isArray(rateData)) return null;
    return rateData.find(r => r?.curUnit === selectedFx) || null;
  }, [rateData, selectedFx]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setCalculationResult(null);
    setMessage('');
  };

  // 서버 요청 payload 생성 (BUY/SELL에 맞춰 매핑)
  const makePayload = () => {
    const fxAmount = parseFloat(form.fxAmount);
    if (!Number.isFinite(fxAmount) || fxAmount <= 0) {
      throw new Error('환전 금액을 올바르게 입력해 주세요.');
    }
    if (!form.fromAccountNo) {
      throw new Error('출금(원화) 계좌를 선택해 주세요.');
    }

    if (isBuy) {
      // KRW → FX
      return {
        cNo,
        fromAccountNo: form.fromAccountNo,
        fromCurUnit: 'KRW',
        toCurUnit: selectedFx,
        fxAmount, // 입력 금액을 KRW로 해석
        transactionType: 'BUY',
        memo: form.memo,
        commissionRate: myPreferentialRate,
      };
    }
    // SELL: FX → KRW
    return {
      cNo,
      fromAccountNo: form.fromAccountNo,
      fromCurUnit: selectedFx,
      toCurUnit: 'KRW',
      fxAmount, // 입력 금액을 외화로 해석
      transactionType: 'SELL',
      memo: form.memo,
      commissionRate: myPreferentialRate,
    };
  };

  // 계산
  const handleCalculate = useCallback(async () => {
    if (!currentRate) {
      setMessage('선택된 통화의 환율 정보를 찾을 수 없습니다.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const payload = makePayload();
      const response = await api.post(`${API_BASE_URL}/calculate`, payload);

      setCalculationResult({
        fromAmount: normalizeNumber(response.data.fromAmount),
        expectedReceiveAmount: normalizeNumber(response.data.expectedReceiveAmount),
        finalExchangeRate: normalizeNumber(response.data.finalExchangeRate),
        expectedCommission: normalizeNumber(response.data.expectedCommission),
        baseRateToKrw: normalizeNumber(response.data.baseRateToKrw),
      });
      setMessage('환율 계산이 완료되었습니다. 신청을 진행해 주세요.');
    } catch (error) {
      console.error('환율 계산 실패:', error.response ? error.response.data : error.message);
      const errMsg = error.response?.data?.message || '환율 계산 중 오류가 발생했습니다.';
      setMessage(`오류: ${errMsg}`);
      setCalculationResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [cNo, form, currentRate, myPreferentialRate]);

  // 신청
  const handleSubmit = async () => {
    if (!calculationResult) {
      setMessage('먼저 계산하기 버튼을 눌러 환전 금액을 확인해 주세요.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const submissionData = makePayload();
      const response = await api.post(API_BASE_URL, submissionData);
      setMessage(`환전 신청이 완료되었습니다. 거래번호: ${response.data.transactionId}`);

      // 히스토리 자동 새로고침
      setActiveTab('history');
      setHistoryVersion(v => v + 1);

      setForm(prev => ({
        ...prev,
        fxAmount: '',
        memo: '',
      }));
      setCalculationResult(null);
    } catch (error) {
      console.error('환전 신청 실패:', error.response ? error.response.data : error.message);
      const errMsg = error.response?.data?.message || '환전 신청 중 오류가 발생했습니다.';
      setMessage(`오류: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // === 환전 내역 ===
  const ExchangeHistory = ({ version = 0 }) => {
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
      if (!cNo) {
        console.info('[HISTORY] skip: cNo not loaded yet');
        return;
      }
      setHistoryLoading(true);
      try {
        const r = await api.get(`${API_BASE_URL}/history`, {
          params: { cNo }, // 항상 cNo를 붙여 호출
          validateStatus: () => true,
        });
        const rows = Array.isArray(r.data) ? r.data : (
          r.data?.rows ?? r.data?.content ?? r.data?.items ?? []
        );

        const normalized = (Array.isArray(rows) ? rows : []).map((r, idx) => ({
          id:        r.exId ?? r.feId ?? r.fhExId ?? idx,
          side:      r.eventType ?? r.feSide ?? r.fhEventType ?? 'SELL',
          curCode:   r.curCode ?? r.feCurCode ?? r.fhFxCurCode ?? '',
          amtFc:     normalizeNumber(r.fxAmt ?? r.feAmtFc ?? r.fhFxAmtFc),
          amtKrw:    normalizeNumber(r.amtKrw ?? r.feAmtKrw ?? r.fhAmtKrw),
          rate:      normalizeNumber(r.rate ?? r.feRateApplied ?? r.fhFxRateApplied),
          status:    r.status ?? r.feStatus ?? r.fhStatus ?? '-',
          orderedAt: r.orderedAt ?? r.feOrderedAt ?? r.fhOrderedAt ?? null,
        }));

        setHistory(normalized);
      } catch (e) {
        console.error('내역 조회 실패:', e);
        setMessage('환전 내역 조회 중 오류가 발생했습니다.');
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }, [cNo]);

    useEffect(() => {
      if (activeTab === 'history' && cNo) fetchHistory();
    }, [activeTab, cNo, fetchHistory]);

    // 신청 후 강제 새로고침
    useEffect(() => {
      if (activeTab === 'history' && cNo) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [version]);

    const formatCurrency = (amount, currency) =>
      amount == null
        ? '-'
        : new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
          }).format(amount);

    // 상태 라벨/색 매핑
    const statusLabel = (s) =>
      ({
        COMMITTED: '승인대기',
        REQUESTED: '신청접수',
        APPROVED:  '승인완료',
        COMPLETED: '정산완료',
        REJECTED:  '반려',
        CANCELLED: '취소',
      }[s] ?? s);

    const getStatusColor = (s) => {
      const label = statusLabel(s);
      switch (label) {
        case '정산완료': return 'text-green-600 bg-green-100';
        case '승인완료':
        case '신청접수':
        case '승인대기': return 'text-yellow-700 bg-yellow-100';
        case '반려':
        case '취소':     return 'text-red-600 bg-red-100';
        default:         return 'text-gray-600 bg-gray-100';
      }
    };

    return (
      <div className="p-6 bg-white rounded-xl shadow-lg mt-6">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <List className="w-5 h-5 mr-2 text-indigo-600" /> 환전 내역 조회 ({history.length}건)
          <button onClick={fetchHistory} className="ml-4 text-sm text-indigo-500 hover:text-indigo-700">
            <RefreshCw className="w-4 h-4 inline mr-1" /> 새로고침
          </button>
        </h2>

        {!cNo ? (
          <div className="text-center py-8 text-gray-500">로그인 후 이용해 주세요.</div>
        ) : historyLoading ? (
          <div className="text-center py-8">로딩 중...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">조회된 환전 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주문일시</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">외화금액</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">원화금액</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">적용환율</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((tx) => {
                  const sideLabel = tx.side === 'BUY' ? '매수(사기)' : '매도(팔기)';
                  return (
                    <tr key={String(tx.id)} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sideLabel} ({tx.curCode} → KRW{tx.side === 'BUY' ? ` (수취 ${tx.curCode})` : ''})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tx.orderedAt ? new Date(tx.orderedAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                        {formatCurrency(tx.amtFc, tx.curCode || 'USD')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {formatCurrency(tx.amtKrw, 'KRW')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                        {tx.rate == null ? '-' : Number(tx.rate).toFixed(6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tx.status)}`}>
                          {statusLabel(tx.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
        <span className={`${tone.text}`}>환전 신청</span> / 환전 내역
      </h1>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('exchange')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'exchange' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <Calculator className="w-4 h-4 inline mr-2" /> 환전 신청 (실시간 계산)
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            <List className="w-4 h-4 inline mr-2" /> 환전 내역 조회
          </button>
        </nav>
      </div>

      {message && (
        <div className={`p-4 mb-4 rounded-lg text-sm font-medium ${message.startsWith('오류:') ? 'bg-red-100 text-red-700' : message.startsWith('환율 계산이 완료되었습니다') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          {message}
        </div>
      )}

      {activeTab === 'exchange' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 좌측 입력 */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">환전 신청 / 실시간 환율 계산기</h2>

            {/* 거래유형 토글 */}
            <div className="mb-4">
              <div className="inline-flex rounded-lg overflow-hidden border">
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, transactionType: 'BUY', toCurUnit: selectedFx }));
                    setCalculationResult(null);
                    setMessage('');
                  }}
                  className={`px-4 py-2 text-sm font-medium ${isBuy ? `${tone.btn} text-white` : 'bg-white text-gray-700'}`}
                >
                  매입(사기)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, transactionType: 'SELL', toCurUnit: 'KRW' }));
                    setCalculationResult(null);
                    setMessage('');
                  }}
                  className={`px-4 py-2 text-sm font-medium ${!isBuy ? `${tone.btn} text-white` : 'bg-white text-gray-700'}`}
                >
                  매도(팔기)
                </button>
              </div>
            </div>

            {/* From/To */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  {isBuy ? 'To 통화 (수취 통화)' : 'From 통화 (매도 통화)'}
                </span>
                <select
                  name="fromCurUnit"
                  value={form.fromCurUnit}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {rateData.map(rate => (
                    <option key={rate.curUnit} value={rate.curUnit}>
                      {rate.curUnit} ({rate.curNm})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {isBuy ? '선택한 외화로 받습니다 (KRW → 외화).' : '선택한 외화를 팝니다 (외화 → KRW).'}
                </p>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  {isBuy ? 'From 통화' : 'To 통화'}
                </span>
                <input
                  type="text"
                  value="KRW"
                  readOnly
                  className="mt-1 block w-full px-3 py-2 text-base bg-gray-100 border-gray-300 rounded-md"
                />
              </label>
            </div>

            {/* 출금 계좌 */}
            {accounts.length > 0 && (
              <div className="mb-6">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">출금 계좌 (KRW)</span>
                  <select
                    name="fromAccountNo"
                    value={form.fromAccountNo}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {accounts.map(a => (
                      <option key={a.accountNo} value={a.accountNo}>
                        {a.accountNo} {a.name ? `· ${a.name}` : ''} ({a.type}) / 잔액: {a.balance?.toLocaleString?.() ?? a.balance ?? '-'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {/* 금액 */}
            <div className="mb-6">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">환전 금액 ({isBuy ? 'KRW 기준' : `${selectedFx} 기준`})</span>
                <input
                  type="number"
                  name="fxAmount"
                  value={form.fxAmount}
                  onChange={handleChange}
                  placeholder={isBuy ? '예: 1,000 KRW' : `예: 1,000 ${selectedFx}`}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </label>
            </div>

            {/* 우대율/유형/메모 */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="block">
                <span className="text-sm font-medium text-gray-700">우대율 (%)</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold ${tone.bgSoft} ${tone.textMuted}`}>
                    {myPreferentialRate}% 적용
                  </span>
                  <span className="text-xs text-gray-500">(서버 정책에 따라 자동 적용)</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">거래 유형</span>
                  <select
                    name="exchangeType"
                    value={form.exchangeType}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="송금">송금 (Transfer)</option>
                    <option value="현찰">현찰 (Cash)</option>
                    <option value="여행자수표">여행자수표 (T/C)</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">메모 (선택)</span>
                  <input
                    type="text"
                    name="memo"
                    value={form.memo}
                    onChange={handleChange}
                    placeholder="예: 여행 경비"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </label>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex space-x-4">
              <button
                onClick={handleCalculate}
                disabled={isLoading || !form.fxAmount || !currentRate}
                className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${tone.btn} focus:outline-none focus:ring-2 focus:ring-offset-2 ${tone.ring} disabled:opacity-50 transition duration-150`}
              >
                <Calculator className="w-5 h-5 mr-2" />
                {isLoading ? '계산 중...' : '환율 계산하기'}
              </button>

              <button
                onClick={handleSubmit}
                disabled={isLoading || !calculationResult}
                className={`flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm ${tone.btnLight} focus:outline-none focus:ring-2 focus:ring-offset-2 ${tone.ring} disabled:opacity-50 transition duration-150`}
              >
                <Send className="w-5 h-5 mr-2" />
                신청 제출
              </button>
            </div>
          </div>

          {/* 우측 요약 */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">환전 정보 및 결과 요약</h2>
            <dl className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-sm font-medium text-gray-500">매매 기준율 (1 {selectedFx} → KRW)</dt>
                <dd className="text-lg font-bold text-gray-900">{currentRate ? Number(normalizeNumber(currentRate.dealBasR)).toFixed(2) : '-'}</dd>
              </div>

              <div className="flex justify-between border-b pb-2">
                <dt className="text-sm font-medium text-gray-500">
                  {isBuy
                    ? `거래 기준 환율 (은행이 ${selectedFx}를 팔 때 - TTS)`
                    : `거래 기준 환율 (은행이 ${selectedFx}를 살 때 - TTB)`}
                </dt>
                <dd className="text-md font-semibold">
                  <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${tone.bgSoft} ${tone.text}`}>
                    {isBuy ? 'TTS' : 'TTB'}
                  </span>
                  <span className={`${tone.text}`}>
                    {currentRate
                      ? Number(normalizeNumber(isBuy ? currentRate.tts : currentRate.ttb)).toFixed(2)
                      : '-'}
                  </span>
                </dd>
              </div>

              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">우대율</dt>
                <dd className="text-md font-semibold text-gray-700">{myPreferentialRate}%</dd>
              </div>

              <div className={`pt-4 border-t ${tone.borderSoft} space-y-3`}>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">
                    {isBuy ? '환전 원화 금액 (KRW)' : `환전 외화 금액 (${selectedFx})`}
                  </dt>
                  <dd className="text-md font-semibold text-gray-700">
                    {calculationResult
                      ? isBuy
                        ? `${normalizeNumber(calculationResult.fromAmount)?.toFixed(0)} KRW`
                        : `${normalizeNumber(calculationResult.fromAmount)?.toFixed(2)} ${selectedFx}`
                      : '-'}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">적용 환율</dt>
                  <dd className={`text-md font-semibold ${tone.text}`}>
                    {calculationResult ? Number(normalizeNumber(calculationResult.finalExchangeRate)).toFixed(6) : '-'}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">수수료 (KRW 환산)</dt>
                  <dd className="text-md font-semibold text-red-600">
                    {calculationResult ? `${Number(normalizeNumber(calculationResult.expectedCommission)).toFixed(0)} KRW` : '-'}
                  </dd>
                </div>

                <div className="flex justify-between pt-2 border-t mt-3">
                  <dt className="text-base font-bold text-gray-900">
                    {isBuy ? `최종 수취 외화 금액 (${selectedFx})` : '최종 수취 원화 금액 (KRW)'}
                  </dt>
                  <dd className={`text-xl font-extrabold ${tone.text}`}>
                    {calculationResult
                      ? isBuy
                        ? `${Number(normalizeNumber(calculationResult.expectedReceiveAmount)).toFixed(4)} ${selectedFx}`
                        : `${Number(normalizeNumber(calculationResult.expectedReceiveAmount)).toFixed(0)} KRW`
                      : '-'}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'history' && <ExchangeHistory version={historyVersion} />}
    </div>
  );
};

export default ForeignExchangePage;
