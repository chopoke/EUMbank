// src/pages/foreign/ForeignExchangePage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import { RefreshCw, Calculator, Send, List } from 'lucide-react';

const API_BASE_URL = '/api/foreign/exchange';
const RATES_URL    = '/api/foreign/rates';
const ME_URLS      = ['/api/foreign/me', '/api/foreign/open/me'];
const ACCOUNT_URLS = ['/api/account/list', '/api/accounts', '/api/accounts/me'];

/* ========== 공통 유틸 ========== */
const normalizeNumber = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.replaceAll(',', '').trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/** 통화코드 정규화: 'JPY(100)' -> 'JPY', 'IDR(100)' -> 'IDR' */
const normalizeCurUnitCode = (s) => {
  const m = String(s ?? '').toUpperCase().match(/[A-Z]{3}/);
  return m ? m[0] : String(s ?? '').toUpperCase();
};

/** 자주 쓰는 ISO 통화 -> 한국어 명(국가/통화) 기본표 */
const ISO_KO = {
  KRW: '대한민국 원',
  USD: '미국 달러',
  EUR: '유로',
  JPY: '일본 엔',
  CNY: '중국 위안',
  HKD: '홍콩 달러',
  SGD: '싱가포르 달러',
  GBP: '영국 파운드',
  AUD: '호주 달러',
  CAD: '캐나다 달러',
  CHF: '스위스 프랑',
  BND: '브루나이 달러',
  BHD: '바레인 디나르',
  JPY100: '일본 엔(100)',
};

/** 응답 안 어디에 있어도 계좌 배열을 뽑아내기 */
function extractAccountsFromAny(obj) {
  if (!obj) return [];
  const buckets = [];
  if (Array.isArray(obj)) buckets.push(obj);
  if (Array.isArray(obj.accounts))     buckets.push(obj.accounts);
  if (Array.isArray(obj.accountList))  buckets.push(obj.accountList);
  if (Array.isArray(obj.rows))         buckets.push(obj.rows);
  if (Array.isArray(obj.items))        buckets.push(obj.items);
  if (Array.isArray(obj.content))      buckets.push(obj.content);
  if (Array.isArray(obj.data))         buckets.push(obj.data);
  return buckets.flat().filter(Boolean);
}

/** DB/백엔드 응답을 화면에서 쓰기 좋게 변환 */
function normalizeAccounts(raw = []) {
  const guessCur = (s = '') => {
    const C = String(s).toUpperCase();
    if (C.includes('USD')) return 'USD';
    if (C.includes('EUR')) return 'EUR';
    if (C.includes('JPY')) return 'JPY';
    if (C.includes('CNY')) return 'CNY';
    if (C.includes('GBP')) return 'GBP';
    if (C.includes('AUD')) return 'AUD';
    if (C.includes('CAD')) return 'CAD';
    if (C.includes('CHF')) return 'CHF';
    if (C.includes('HKD')) return 'HKD';
    if (C.includes('SGD')) return 'SGD';
    if (C.includes('BND')) return 'BND';
    if (C.includes('BHD')) return 'BHD';
    return 'KRW';
  };

  const list = raw
    .map((x) => {
      const accountNo =
        x.accountNo || x.a_account_no || x.aNo || x.a_no || x.number || '';

      const typeRaw = String(
        x.type || x.a_account_type || x.category || x.aAccountType || ''
      ).trim();

      const curRaw =
        x.currency || x.a_currency || x.cur || x.curUnit || x.fxCurCode || x.a_fx_cur || '';

      const productStr =
        x.a_product_code || x.productCode || x.name || x.productName || '';

      const currency = normalizeCurUnitCode(curRaw || guessCur(productStr));

      let kind = '';
      if (/^fx$/i.test(typeRaw) || typeRaw === '외환' || /FX/.test(typeRaw)) {
        kind = 'FX';
      } else if (/KRW|원화|입출금/.test(typeRaw)) {
        kind = 'KRW';
      } else {
        kind = currency === 'KRW' ? 'KRW' : 'FX';
      }

      const name =
        x.name || x.nickname || x.a_product_code || x.productName || '';
      const balance =
        x.balance ?? x.availableBalance ?? x.a_balance ?? x.bal ?? null;

      return { accountNo, kind, currency, name, balance };
    })
    .filter((a) => a.accountNo);

  return list;
}

export default function ForeignExchangePage() {
  const [activeTab, setActiveTab] = useState('exchange');

  const [myPreferentialRate, setMyPreferentialRate] = useState(0);
  const [rateData, setRateData] = useState([]);
  const [cNo, setCNo] = useState(null);

  const [krwAccounts, setKrwAccounts] = useState([]);
  const [fxAccounts, setFxAccounts]   = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [historyVersion, setHistoryVersion] = useState(0);

  const [form, setForm] = useState({
    transactionType: 'BUY',   // BUY: KRW -> FX, SELL: FX -> KRW
    fromKrwAccountNo: '',
    fromFxAccountNo:  '',
    toKrwAccountNo:   '',
    toFxAccountNo:    '',
    fxAmount: '',
    memo: '',
  });

  const isBuy = form.transactionType === 'BUY';

  /* 환율표를 코드->국가명 맵으로 가공 */
  const rateNameMap = useMemo(() => {
    const m = {};
    (rateData || []).forEach(r => {
      const code = normalizeCurUnitCode(r?.curUnit ?? r?.cur_unit);
      const nm = r?.curNm ?? r?.cur_nm;
      if (code && nm) m[code] = nm;
    });
    return m;
  }, [rateData]);

  const getCurName = useCallback((code) => {
    if (!code) return '';
    return rateNameMap[code] || ISO_KO[code] || '';
  }, [rateNameMap]);

  /* ========== 초기 로드 ========== */
  useEffect(() => {
    (async () => {
      try {
        const rateRes = await api.get(RATES_URL, { validateStatus: () => true });
        if (rateRes.status === 200) {
          const rows = Array.isArray(rateRes.data)
            ? rateRes.data
            : Array.isArray(rateRes.data?.rows) ? rateRes.data.rows : [];
          setRateData(rows);
        }

        // me
        let meRes;
        for (const url of ME_URLS) {
          // eslint-disable-next-line no-await-in-loop
          const r = await api.get(url, { validateStatus: () => true });
          if (r.status === 200) { meRes = r; break; }
        }
        if (!meRes) { setMessage('고객 정보를 불러오지 못했습니다.'); return; }
        const me = meRes.data || {};
        const meCNo = me.cNo ?? me.c_no ?? me.customerId ?? me.id ?? null;
        setCNo(meCNo);
        setMyPreferentialRate(Number(me.preferentialRate ?? me.prefRate ?? 0));

        // accounts
        let rawAccs = extractAccountsFromAny(me);
        if (!rawAccs.length) {
          for (const url of ACCOUNT_URLS) {
            // eslint-disable-next-line no-await-in-loop
            const r = await api.get(url, {
              params: meCNo ? { cNo: meCNo } : undefined,
              validateStatus: () => true
            });
            if (r.status === 200) {
              rawAccs = extractAccountsFromAny(r.data);
              if (rawAccs.length) break;
            }
          }
        }

        const all = normalizeAccounts(rawAccs);
        const onlyKrw = all.filter(a => a.kind === 'KRW');
        const onlyFx  = all.filter(a => a.kind === 'FX');

        setKrwAccounts(onlyKrw);
        setFxAccounts(onlyFx);

        setForm(prev => ({
          ...prev,
          fromKrwAccountNo: onlyKrw[0]?.accountNo || '',
          toKrwAccountNo:   onlyKrw[0]?.accountNo || '',
          fromFxAccountNo:  onlyFx[0]?.accountNo || '',
          toFxAccountNo:    onlyFx[0]?.accountNo || '',
        }));

        if (!onlyKrw.length && !onlyFx.length) {
          setMessage('계좌를 찾지 못했습니다. (계좌생성 필요)');
        }
      } catch (e) {
        console.error(e);
        setMessage('초기 정보를 불러오지 못했습니다.');
        setRateData([]);
        setCNo(null);
        setKrwAccounts([]);
        setFxAccounts([]);
      }
    })();
  }, []);

  /* 선택된 외화 통화코드: 외화계좌 선택에 따라 자동 결정 */
  const selectedFx = useMemo(() => {
    const fxAccNo = isBuy ? form.toFxAccountNo : form.fromFxAccountNo;
    const acc = fxAccounts.find(a => a.accountNo === fxAccNo);
    return acc?.currency || fxAccounts[0]?.currency || 'USD';
  }, [isBuy, form.toFxAccountNo, form.fromFxAccountNo, fxAccounts]);

  /* 현재 환율 */
  const currentRate = useMemo(() => {
    if (!Array.isArray(rateData)) return null;
    return rateData.find(r => normalizeCurUnitCode(r?.curUnit ?? r?.cur_unit) === selectedFx) || null;
  }, [rateData, selectedFx]);

  const [calculationResult, setCalculationResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setMessage('');
    setCalculationResult(null);
  };

  // payload
  const makePayload = () => {
    const fxAmount = parseFloat(form.fxAmount);
    if (!Number.isFinite(fxAmount) || fxAmount <= 0) {
      throw new Error('환전 금액을 올바르게 입력해 주세요.');
    }

    if (isBuy) {
      if (!form.fromKrwAccountNo) throw new Error('출금(원화) 계좌를 선택해 주세요.');
      if (!form.toFxAccountNo)    throw new Error('입금(외화) 계좌를 선택해 주세요.');
      return {
        cNo,
        transactionType: 'BUY',
        fromAccountNo: form.fromKrwAccountNo,
        toAccountNo:   form.toFxAccountNo,
        fromCurUnit:   'KRW',
        toCurUnit:     selectedFx,
        fxAmount,
        memo: form.memo,
        exchangeType: '송금',                 // ✅ UI 고정
        commissionRate: myPreferentialRate,
      };
    }

    if (!form.fromFxAccountNo) throw new Error('출금(외화) 계좌를 선택해 주세요.');
    if (!form.toKrwAccountNo)  throw new Error('입금(원화) 계좌를 선택해 주세요.');
    return {
      cNo,
      transactionType: 'SELL',
      fromAccountNo: form.fromFxAccountNo,
      toAccountNo:   form.toKrwAccountNo,
      fromCurUnit:   selectedFx,
      toCurUnit:     'KRW',
      fxAmount,
      memo: form.memo,
      exchangeType: '송금',                 // ✅ UI 고정
      commissionRate: myPreferentialRate,
    };
  };

  /* 계산 */
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
      const errMsg = error.response?.data?.message || '환율 계산 중 오류가 발생했습니다.';
      setMessage(`오류: ${errMsg}`);
      setCalculationResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [cNo, form, currentRate, myPreferentialRate, selectedFx]);

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
      setActiveTab('history');
      setHistoryVersion(v => v + 1);
      setForm(prev => ({ ...prev, fxAmount: '', memo: '' }));
      setCalculationResult(null);
    } catch (error) {
      const errMsg = error.response?.data?.message || '환전 신청 중 오류가 발생했습니다.';
      setMessage(`오류: ${errMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  /* ========== 히스토리 ========== */
  const ExchangeHistory = ({ version = 0 }) => {
    const [history, setHistory] = useState([]);
       const [historyLoading, setHistoryLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
      if (!cNo) return;
      setHistoryLoading(true);
      try {
        const r = await api.get(`${API_BASE_URL}/history`, {
          params: { cNo },
          validateStatus: () => true,
        });
        const rows = Array.isArray(r.data) ? r.data : (
          r.data?.rows ?? r.data?.content ?? r.data?.items ?? []
        );
        const normalized = (Array.isArray(rows) ? rows : []).map((r, idx) => ([
          r.exId ?? r.feId ?? r.fhExId ?? idx,
          r.eventType ?? r.feSide ?? r.fhEventType ?? 'SELL',
          r.curCode ?? r.feCurCode ?? r.fhFxCurCode ?? '',
          normalizeNumber(r.fxAmt ?? r.feAmtFc ?? r.fhFxAmtFc),
          normalizeNumber(r.amtKrw ?? r.feAmtKrw ?? r.fhAmtKrw),
          normalizeNumber(r.rate ?? r.feRateApplied ?? r.fhFxRateApplied),
          r.status ?? r.feStatus ?? r.fhStatus ?? '-',
          r.orderedAt ?? r.feOrderedAt ?? r.fhOrderedAt ?? null,
        ])).map((a) => ({
          id: a[0], side: a[1], curCode: a[2], amtFc: a[3], amtKrw: a[4],
          rate: a[5], status: a[6], orderedAt: a[7]
        }));
        setHistory(normalized);
      } catch (e) {
        setMessage('환전 내역 조회 중 오류가 발생했습니다.');
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    }, [cNo]);

    useEffect(() => {
      if (activeTab === 'history' && cNo) fetchHistory();
    }, [activeTab, cNo, fetchHistory]);

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
                  const sideLabel = tx.side === 'BUY' ? '사실 때' : '파실 때';
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

  /* ========== 화면 ========== */
  // 왼쪽은 항상 KRW, 오른쪽은 항상 FX
  const leftLabel  = isBuy ? '출금 계좌 (KRW)' : '입금 계좌 (KRW)';
  const rightLabel = isBuy ? '입금 계좌 (외화)' : '출금 계좌 (외화)';

  const leftName   = isBuy ? 'fromKrwAccountNo' : 'toKrwAccountNo';
  const rightName  = isBuy ? 'toFxAccountNo'    : 'fromFxAccountNo';

  const leftValue  = isBuy ? form.fromKrwAccountNo : form.toKrwAccountNo;
  const rightValue = isBuy ? form.toFxAccountNo    : form.fromFxAccountNo;

  const onLeftChange  = (e) => handleChange({ target: { name: leftName, value: e.target.value }});
  const onRightChange = (e) => handleChange({ target: { name: rightName, value: e.target.value }});

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* ▶ 가운데 고정폭 래퍼 */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">
          <span className="text-indigo-600">환전 신청</span> / 환전 내역
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
            {/* 좌측 입력 (KRW) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-800">환전 신청 / 실시간 환율 계산기</h2>

              {/* 거래유형 토글 */}
              <div className="mb-6">
                <div className="inline-flex rounded-lg overflow-hidden border">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ ...prev, transactionType: 'BUY' }));
                      setCalculationResult(null);
                      setMessage('');
                    }}
                    className={`px-4 py-2 text-sm font-medium ${isBuy ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    사실 때
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ ...prev, transactionType: 'SELL' }));
                      setCalculationResult(null);
                      setMessage('');
                    }}
                    className={`px-4 py-2 text-sm font-medium ${!isBuy ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    파실 때
                  </button>
                </div>
              </div>

              {/* 계좌 선택 - 왼쪽 KRW / 오른쪽 FX */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{leftLabel}</span>
                  <select
                    name={leftName}
                    value={leftValue}
                    onChange={onLeftChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {krwAccounts.length === 0 ? (
                      <option value="">선택 가능한 계좌가 없습니다</option>
                    ) : krwAccounts.map(a => (
                      <option key={a.accountNo} value={a.accountNo}>
                        {a.accountNo}{a.name ? ` · ${a.name}` : ''} (KRW) / 잔액: {a.balance?.toLocaleString?.() ?? a.balance ?? '-'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{rightLabel}</span>
                  <select
                    name={rightName}
                    value={rightValue}
                    onChange={onRightChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    {fxAccounts.length === 0 ? (
                      <option value="">선택 가능한 계좌가 없습니다</option>
                    ) : fxAccounts.map(a => (
                      <option key={a.accountNo} value={a.accountNo}>
                        {a.accountNo}{a.name ? ` · ${a.name}` : ''} ({a.currency} · {getCurName(a.currency)}) / 잔액: {a.balance?.toLocaleString?.() ?? a.balance ?? '-'}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    선택한 외화계좌의 통화로 자동 적용됩니다.
                  </p>
                </label>
              </div>

              {/* 선택 통화 안내 */}
              <div className="mb-4 text-sm text-gray-600">
                선택된 외화: <span className="font-semibold text-gray-900">{selectedFx}</span> <span className="text-gray-500">({getCurName(selectedFx)})</span>
              </div>

              {/* 금액 */}
              <div className="mb-6">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    환전 금액 ({isBuy ? 'KRW 기준' : `${selectedFx} 기준`})
                  </span>
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

              {/* 우대율/메모 */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="block">
                  <span className="text-sm font-medium text-gray-700">우대율 (%)</span>
                  <div className="mt-1 inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold bg-indigo-50 text-indigo-700">
                    {myPreferentialRate}% 적용
                  </div>
                  <span className="ml-2 text-xs text-gray-500">(서버 정책에 따라 자동 적용)</span>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">메모 (선택)</span>
                  <input
                    type="text"
                    name="memo"
                    value={form.memo}
                    onChange={handleChange}
                    placeholder="예: 여행 경비"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    maxLength={60}
                  />
                </label>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-4">
                <button
                  onClick={handleCalculate}
                  disabled={isLoading || !form.fxAmount || !currentRate}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  {isLoading ? '계산 중...' : '환율 계산하기'}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !calculationResult}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150"
                >
                  <Send className="w-5 h-5 mr-2" />
                   환전하기
                </button>
              </div>
            </div>

            {/* 우측 요약 */}
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-xl font-bold mb-6 text-gray-800">환전 정보 및 결과 요약</h2>

              <dl className="space-y-4">
                {/* 매매기준율 */}
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-sm font-medium text-gray-500">매매 기준율 (1 {selectedFx} → KRW)</dt>
                  <dd className="text-lg font-bold text-gray-900">
                    {currentRate ? Number(normalizeNumber(currentRate.dealBasR ?? currentRate.dealBas)).toFixed(2) : '-'}
                  </dd>
                </div>

                {/* 거래 기준 환율 (TTS/TTB) */}
                <div className="flex justify-between border-b pb-2">
                  <dt className="text-sm font-medium text-gray-500">
                    {isBuy
                      ? `거래 기준 환율 (은행이 ${selectedFx}를 팔 때 - TTS)`
                      : `거래 기준 환율 (은행이 ${selectedFx}를 살 때 - TTB)`}
                  </dt>
                  <dd className="text-md font-semibold text-gray-700">
                    {currentRate
                      ? Number(
                          normalizeNumber(
                            isBuy ? (currentRate.tts ?? currentRate.ttsR) : (currentRate.ttb ?? currentRate.ttbR)
                          )
                        ).toFixed(2)
                      : '-'}
                  </dd>
                </div>

                {/* 우대율 */}
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">우대율</dt>
                  <dd className="text-md font-semibold text-gray-700">{myPreferentialRate}%</dd>
                </div>

                {/* 결과 섹션 */}
                <div className="pt-4 border-t border-indigo-200 space-y-3">
                  {/* 환전 원/외화 금액 */}
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

                  {/* 적용 환율 */}
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">적용 환율</dt>
                    <dd className="text-md font-semibold text-gray-700">
                      {calculationResult
                        ? Number(normalizeNumber(calculationResult.finalExchangeRate)).toFixed(6)
                        : '-'}
                    </dd>
                  </div>

                  {/* 수수료 */}
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">수수료 (KRW 환산)</dt>
                    <dd className="text-md font-semibold text-red-600">
                      {calculationResult
                        ? `${Number(normalizeNumber(calculationResult.expectedCommission)).toFixed(0)} KRW`
                        : '-'}
                    </dd>
                  </div>

                  {/* 최종 수취 */}
                  <div className="flex justify-between pt-2 border-t mt-3">
                    <dt className="text-base font-bold text-gray-900">
                      {isBuy ? `최종 수취 외화 금액 (${selectedFx})` : '최종 수취 원화 금액 (KRW)'}
                    </dt>
                    <dd className="text-xl font-extrabold text-indigo-600">
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
    </div>
  );
}
