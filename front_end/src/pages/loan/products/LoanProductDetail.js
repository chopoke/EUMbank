import React from "react";
import { useParams, useLocation } from "react-router-dom";
// 백엔드에 디테일 API가 있으면 이걸 만들어 사용하세요.
import { fetchMortgageProducts /*, fetchMortgageProductDetail*/ } from "../../../api/accounts";

export default function LoanProductDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const stateProduct = location.state?.product || null;

  // ---------- 상태 ----------
  const [product, setProduct] = React.useState(stateProduct);
  const [loading, setLoading] = React.useState(!stateProduct);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (stateProduct) return; 
    setLoading(true);
    fetchMortgageProducts({ topFinGrpNo: "020000", pageNo: 1 })
      .then(res => {
        const items = Array.isArray(res.data) ? res.data : [];
        const found = items.find(x => String(x.id) === String(id));
        if (!found) throw new Error("상품을 찾을 수 없습니다.");
        setProduct(found);
      })
      .catch(e => setError(e.message || "조회 실패"))
      .finally(() => setLoading(false));
  }, [id, stateProduct]);

  // ---------- 파생값/헬퍼 ----------
  const won = (n)=> Number(n||0).toLocaleString('ko-KR');
  const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));

  // 우대 감면 가이드(예시값): 실제 정책 생기면 서버에서 주는게 BEST
  const maxPreferential = 1.0; // %p
  const preferentialGuide = [
    "급여/자동이체 이용 시 -0.30%p",
    "우량등급 우대 -0.40%p",
    "모바일 신규 -0.30%p",
  ];

  // 기본금리는 rateMin을 기준으로 표기  (실제는 옵션별 금리 필요)
  const terms = React.useMemo(()=>{
    if(!product) return [];
    const base = Number(product.rateMin ?? 0);
    return (product.termMonths || []).map(m => ({ months: m, rate: base }));
  }, [product]);

  // ---------- 계산기 상태 ----------
  const [amount, setAmount] = React.useState(50_000_000);
  const [term, setTerm] = React.useState(() => terms[0]?.months || 36);
  const [preferential, setPreferential] = React.useState(0);
  const [agree, setAgree] = React.useState(false);

  React.useEffect(()=> {
    if(terms.length>0 && !terms.find(t=>t.months===term)){
      setTerm(terms[0].months);
    }
  }, [terms, term]);

  const selectedTermRate = React.useMemo(()=>{
    const t = terms.find(t=>t.months===term);
    return t ? t.rate : Number(product?.rateMin ?? 0);
  }, [terms, term, product]);

  const effectiveRate = React.useMemo(()=>{
    const total = Math.max(0, selectedTermRate - preferential);
    return total;
  }, [selectedTermRate, preferential]);

  const monthlyPayment = React.useMemo(()=>{
    const r = (effectiveRate / 100) / 12;
    const n = term || 0;
    const P = amount || 0;
    if(n===0) return 0;
    if(r===0) return Math.ceil(P/n);
    const M = P * (r / (1 - Math.pow(1+r, -n)));
    return Math.ceil(M);
  }, [amount, effectiveRate, term]);

  const totalPayment = monthlyPayment * (term||0);
  const totalInterest = totalPayment - (amount||0);

  const fmt = (n) => Number(n||0).toLocaleString("ko-KR");

  const schedule = React.useMemo(()=>{
    const rows = [];
    if(!amount || !term) return rows;
    let remaining = amount;
    const r = (effectiveRate / 100) / 12;
    for(let i=1; i<=Math.min(term, 6); i++){
      const interest = r===0 ? 0 : Math.floor(remaining * r);
      const principal = Math.min(monthlyPayment - interest, remaining);
      const remainAfter = Math.max(0, remaining - principal);
      rows.push({ no:i, interest, principal, remain: remainAfter });
      remaining = remainAfter;
    }
    return rows;
  }, [amount, term, effectiveRate, monthlyPayment]);

  // ---------- 서브 컴포넌트 ----------
  const Pill = ({ children }) => (
    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-100">
      {children}
    </span>
  );

  const RateTable = () => (
    <div className="overflow-hidden rounded-2xl border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50/60">
          <tr className="text-left text-gray-500">
            <th className="py-3 px-4">기간</th>
            <th className="py-3 px-4">기본금리(연)</th>
            <th className="py-3 px-4">최대 우대 반영(연)</th>
          </tr>
        </thead>
        <tbody>
          {terms.map(t=>{
            const minRate = Math.max(0, t.rate - maxPreferential);
            const active = t.months === term;
            return (
              <tr key={t.months} className={`border-t border-gray-100 ${active ? "bg-blue-50/40" : ""}`}>
                <td className="py-3 px-4">{t.months}개월</td>
                <td className="py-3 px-4">{t.rate.toFixed(2)}%</td>
                <td className="py-3 px-4 font-medium text-gray-900">{minRate.toFixed(2)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const Calculator = () => (
    <div className="rounded-2xl border border-gray-100 p-4 lg:p-6 bg-white">
      <h3 className="font-semibold mb-4">대출 상환 계산기 (원리금균등)</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-gray-600">대출금액 (원)</span>
            <input
              type="number"
              value={amount}
              min={1_000_000}
              max={product?.limitMax || 1_000_000_000}
              onChange={(e)=> setAmount(clamp(parseInt(e.target.value||"0",10), 1_000_000, product?.limitMax || 1_000_000_000))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {product?.limitMax && (
              <div className="mt-1 text-xs text-gray-500">최대 {won(product.limitMax)}원</div>
            )}
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">기간</span>
            <select
              value={term}
              onChange={(e)=> setTerm(parseInt(e.target.value,10))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {terms.map(t => (
                <option key={t.months} value={t.months}>
                  {t.months}개월 (기본 {t.rate.toFixed(2)}%)
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">우대금리 감면 (최대 {maxPreferential.toFixed(2)}%p)</span>
              <span className="text-xs text-gray-500">현재: -{preferential.toFixed(2)}%p</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxPreferential}
              step={0.1}
              value={preferential}
              onChange={(e)=> setPreferential(parseFloat(e.target.value))}
              className="mt-2 w-full"
            />
            <div className="mt-1 flex flex-wrap gap-2">
              {preferentialGuide.map((g,i)=> <Pill key={i}>{g}</Pill>)}
            </div>
          </label>

          <label className="flex items-start gap-2 mt-2">
            <input type="checkbox" checked={agree} onChange={(e)=> setAgree(e.target.checked)} className="mt-1" />
            <span className="text-sm text-gray-600">예시 계산 결과가 실제와 다를 수 있음을 이해했습니다.</span>
          </label>
        </div>

        <div className="rounded-xl bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">적용금리(연)</span>
            <span className="font-semibold text-gray-900">{effectiveRate.toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">월 상환액(예상)</span>
            <span className="font-semibold">₩ {fmt(monthlyPayment)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">총 상환액(예상)</span>
            <span className="font-medium">₩ {fmt(totalPayment)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">총 이자(예상)</span>
            <span className="font-medium">₩ {fmt(totalInterest)}</span>
          </div>

          <div className="mt-3">
            <h4 className="text-sm font-medium mb-2">상환스케줄 미리보기 (상위 6회차)</h4>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="py-2 px-3 text-left">회차</th>
                    <th className="py-2 px-3 text-right">이자</th>
                    <th className="py-2 px-3 text-right">원금</th>
                    <th className="py-2 px-3 text-right">잔액</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map(row=>(
                    <tr key={row.no} className="border-t border-gray-100">
                      <td className="py-2 px-3">{row.no}</td>
                      <td className="py-2 px-3 text-right">₩ {fmt(row.interest)}</td>
                      <td className="py-2 px-3 text-right">₩ {fmt(row.principal)}</td>
                      <td className="py-2 px-3 text-right">₩ {fmt(row.remain)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">※ 실제 스케줄은 실행일·상환일·수수료 반영 등에 따라 달라질 수 있습니다.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          disabled={!agree}
          className={`px-4 py-2 rounded-xl text-white ${agree ? "bg-blue-700 hover:bg-blue-800" : "bg-gray-300 cursor-not-allowed"}`}
        >
          한도/금리 조회
        </button>
        <a href="#" className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">상담 신청</a>
      </div>
    </div>
  );

  // ---------- 로딩/에러/스켈레톤 ----------
  if (loading) return <div className="p-8">로딩중…</div>;
  if (error) return <div className="p-8 text-red-600">에러: {error}</div>;
  if (!product) return <div className="p-8">상품 정보를 찾을 수 없습니다.</div>;

  // ---------- 본문 ----------
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* 간단 헤더 대체 */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/loans" className="text-sm text-gray-600 hover:underline">← 대출 목록</a>
          <div className="text-sm text-gray-500">상품코드 {product.id}</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-16">
        {/* Hero */}
        <section className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {product.badges?.map((b,i)=> <Pill key={i}>{b}</Pill>)}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-gray-600 max-w-2xl">{product.desc}</p>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="text-gray-500">금리(최저~최고)</div>
                <div className="text-lg font-semibold">{(product.rateMin??0).toFixed(2)}% ~ {(product.rateMax??0).toFixed(2)}%</div>
              </div>
              <div>
                <div className="text-gray-500">최대한도</div>
                <div className="text-lg font-semibold">₩ {won(product.limitMax)}</div>
              </div>
              <div>
                <div className="text-gray-500">상품유형</div>
                <div className="text-lg font-semibold">{product.type}</div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.tags?.map((t,i)=> <span key={i} className="px-2 py-1 rounded-full border text-xs text-gray-700">#{t}</span>)}
            </div>
          </div>

          {/* 요약 */}
          <aside className="w-full lg:w-[380px] rounded-2xl border border-gray-100 p-5 bg-white shadow-sm">
            <h3 className="font-semibold mb-3">요약</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><span className="text-gray-600">상품ID</span><span className="font-medium">{product.id}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-600">대출한도</span><span className="font-medium">최대 ₩ {won(product.limitMax)}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-600">최저금리</span><span className="font-medium">{(product.rateMin??0).toFixed(2)}%</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-600">최장기간</span><span className="font-medium">{Math.max(...(product.termMonths||[0]))}개월</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <a href="#" className="flex-1 px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm text-center">한도/금리 조회</a>
              <a href="#" className="flex-1 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm text-center">필요서류</a>
            </div>
          </aside>
        </section>

        {/* 금리표 & 계산기 */}
        <section className="mt-10 grid lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">금리/기간 안내</h3>
            <RateTable />
          </div>
          <Calculator />
        </section>

        {/* 기타 섹션은 필요 시 확장 */}
      </main>
    </div>
  );
}
