import React from "react";
import { fetchLoanProducts } from "../../../api/accounts";
import { Link } from "react-router-dom";

export default function LoanProductsListPage(){

  // 기본
  const won = (n)=> Number(n||0).toLocaleString('ko-KR');
  const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));

  // 가져올 데이터셋
  const [PRODUCTS, setPRODUCTS] = React.useState([]);

  // ---------------- 상태 ----------------
  const [q, setQ] = React.useState('');
  const [type, setType] = React.useState('전체');
  const [rateRange, setRateRange] = React.useState([0, 10]);
  const [limitMin, setLimitMin] = React.useState(0);
  const [termMin, setTermMin] = React.useState(0); // 최소 개월 수
  const [sort, setSort] = React.useState('rateAsc');
  const [selected, setSelected] = React.useState([]); // 비교 선택 id 배열 (최대 3)
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 4;
  
  // UI 타입 -> API 타입 매핑
  const TYPE_TO_PARAM = {
    '주택담보': 'MORTGAGE',
    '전세자금': 'JEONSE',
    '신용대출': 'PERSONAL',
  };

  async function loadProductsFor(uiType){
    try {
      if (uiType === '전체') {
        const types = ['MORTGAGE','JEONSE','PERSONAL'];
        const resArr = await Promise.all(types.map(t => 
          fetchLoanProducts({ type: t, page: 0, size: 100 })));
        const merged = resArr.flatMap(res => {
          const d = res.data;
          return Array.isArray(d) ? d
               : Array.isArray(d?.items) ? d.items
               : Array.isArray(d?.content) ? d.content
               : [];
        });
        setPRODUCTS(merged);
      } else {
        const apiType = TYPE_TO_PARAM[uiType] || 'MORTGAGE';
        const res = await fetchLoanProducts({ type: apiType, page: 0, size: 100 });
        const d = res.data;
        const items = Array.isArray(d) ? d
                    : Array.isArray(d?.items) ? d.items
                    : Array.isArray(d?.content) ? d.content
                    : [];
        setPRODUCTS(items);
      }
    } catch (e) {
           console.error('대출상품 불러오기 실패', e);
      setPRODUCTS([]);
    }
  }

  React.useEffect(() => { loadProductsFor('전체'); }, []);
  React.useEffect(() => { loadProductsFor(type); setPage(1); }, [type]);    // 대출종류 변경시 1페이지로

  const TYPES = ['전체','신용대출','주택담보','전세자금'];
  const SORTS = [
    {id:'rateAsc', label:'금리 낮은순'},
    {id:'rateDesc', label:'금리 높은순'},
    {id:'limitDesc', label:'한도 높은순'},
    {id:'termDesc', label:'기간 긴순'},
  ];

  

  // 모달 상태
  const [showCompare, setShowCompare] = React.useState(false);    // 바교 모달
  const [showPrequal, setShowPrequal] = React.useState(false);    // 간편 비교

  // 간편조회(사전심사 모의) 입력값
  const [income, setIncome] = React.useState(40_000_000); // 연소득
  const [credit, setCredit] = React.useState(820);        // 신용점수(350~900)
  const CREDIT_MIN=350, CREDIT_MAX=999;


  // 파생 계산 ----------------
  const filterFn = (p)=>{
    // 타입필터
    if(type !== '전체' && p.type !== type) return false;   
    // 검색어 필터
    if(q && !(p.name+ p.desc + p.tags.join(',') + p.badges.join(',')).toLowerCase().includes(q.toLowerCase())) return false;
    // 금리필터
    const rateOk = p.rateMax >= rateRange[0] && p.rateMin <= rateRange[1];
    if(!rateOk) return false;
    // 한도 필터
    if(limitMin && p.limitMax < limitMin) return false;
    // 최장기간 필터
    if(termMin && Math.max(...p.termMonths) < termMin) return false;
    return true;
  };

  const sortFn = (a,b)=>{
    switch(sort){
      case 'rateAsc': return a.rateMin - b.rateMin;
      case 'rateDesc': return b.rateMax - a.rateMax;
      case 'limitDesc': return b.limitMax - a.limitMax;
      case 'termDesc': return Math.max(...b.termMonths) - Math.max(...a.termMonths);
      default: return 0;
    }
  };

  const filtered = React.useMemo(()=> 
    PRODUCTS.filter(filterFn).sort(sortFn), 
  [PRODUCTS, q, type, rateRange, limitMin, termMin, sort]);

  const visible = filtered.slice(0, PAGE_SIZE * page);

  const hasMore = visible.length < filtered.length;

  function toggleSelected(id){
    setSelected(prev=> prev.includes(id) ? prev.filter(x=>x!==id) : (prev.length>=3 ? prev : [...prev, id]));
  }

  // 비교/간편조회 버튼 활성화 조건
  const canCompare = selected.length >= 2;
  const canPrequal = selected.length >= 1;

  // 사전심사(모의) 산식 (간단 샘플)
  function computePrequalFor(p){
    // 신용점수 높을수록 금리 우대, 한도는 연소득의 4.5배 한도 내에서 상품 최대한도까지
    const limit = Math.min(p.limitMax, Math.round(income * 4.5 / 1_000_000) * 1_000_000);
    // 신용 900 → 가감 0%, 350 → +2.75%p (선형)
    const rateBump = ((CREDIT_MAX - credit) / (CREDIT_MAX - CREDIT_MIN)) * 2.75;
    const estRate = Math.max(p.rateMin, Math.min(p.rateMax, +(p.rateMin + rateBump).toFixed(2)));
    const maxTerm = Math.max(...p.termMonths);
    return { id:p.id, name:p.name, type:p.type, estRate, limit, maxTerm };
  }
  const prequalResults = React.useMemo(()=> selected.map(id=> computePrequalFor(PRODUCTS.find(p=>p.id===id))).filter(Boolean), [selected, income, credit]);


  // ---------------- 카드 ----------------
  function ProductCard({p}){
    
    const maxTerm = Math.max(...p.termMonths);  // 최장기간
    const checked = selected.includes(p.id);    // 체크 아이템들
    return (
      <div className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition ${checked? 'ring-2 ring-blue-600' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {p.badges.map((b,i)=> <span key={i} className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-100">{b}</span>)}
            </div>
            <h3 className="text-lg font-semibold tracking-tight">{p.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{p.desc}</p>
          </div>
          <label className="text-sm select-none">
            <input type="checkbox" checked={checked} onChange={()=>toggleSelected(p.id)} className="mr-1 align-middle"/> 비교
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
          <div><div className="text-gray-500">유형</div><div className="font-medium">{p.type}</div></div>
          <div><div className="text-gray-500">금리(연)</div><div className="font-semibold text-gray-900">{p.rateMin.toFixed(2)}% ~ {p.rateMax.toFixed(2)}%</div></div>
          <div><div className="text-gray-500">최장기간</div><div className="font-medium">{maxTerm}개월</div></div>
          <div><div className="text-gray-500">최대한도</div><div className="font-medium">₩ {won(p.limitMax)}</div></div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {p.tags.map((t,i)=> <span key={i} className="px-2 py-1 rounded-full border text-xs text-gray-700">#{t}</span>)}
        </div>

        <div className="mt-4 flex gap-2">
          <Link
          to={`/loans/product/${p.id}`}
          state={{ product: p }}   // 상세에 미리 전달
          className="px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm"
        >자세히 보기</Link>
          <button onClick={()=>{ if(!selected.includes(p.id)) toggleSelected(p.id); setShowPrequal(true); }} className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm">간편조회</button>
        </div>
      </div>
    );
  }

  // ---------------- 모달 
  function Modal({open, onClose, children, width="max-w-3xl"}){
    if(!open) return null;
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div className={`w-full ${width} rounded-2xl bg-white shadow-xl`}> 
          <div className="flex justify-end p-3"><button onClick={onClose} className="px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">닫기</button></div>
          <div className="px-5 pb-5">{children}</div>
        </div>
      </div>
    );
  }

  function CompareModal(){
    const items = selected.map(id=> PRODUCTS.find(p=>p.id===id)).filter(Boolean);
    return (
      <Modal open={showCompare} onClose={()=>setShowCompare(false)} width="max-w-5xl">
        <h3 className="text-xl font-semibold mb-3">상품 비교</h3>
        {items.length<2 ? (
          <p className="text-sm text-gray-600">비교할 상품을 2개 이상 선택하세요.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50/60 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">항목</th>
                  {items.map(p=> <th key={p.id} className="px-3 py-2 text-left">{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="px-3 py-2 text-gray-500">유형</td>{items.map(p=> <td key={p.id} className="px-3 py-2">{p.type}</td>)}</tr>
                <tr className="border-t"><td className="px-3 py-2 text-gray-500">금리(최저~최고)</td>{items.map(p=> <td key={p.id} className="px-3 py-2 font-medium">{p.rateMin.toFixed(2)}% ~ {p.rateMax.toFixed(2)}%</td>)}</tr>
                <tr className="border-t"><td className="px-3 py-2 text-gray-500">최장기간</td>{items.map(p=> <td key={p.id} className="px-3 py-2">{Math.max(...p.termMonths)}개월</td>)}</tr>
                <tr className="border-t"><td className="px-3 py-2 text-gray-500">최대한도</td>{items.map(p=> <td key={p.id} className="px-3 py-2">₩ {won(p.limitMax)}</td>)}</tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    );
  }

  function PrequalModal(){
    return (
      <Modal open={showPrequal} onClose={()=>setShowPrequal(false)}>
        <h3 className="text-xl font-semibold mb-3">간편 한도/금리 조회 (모의)</h3>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <label className="block">
            <span className="text-sm text-gray-600">연소득(원)</span>
            <input type="number" value={income} min={0} onChange={e=>setIncome(clamp(parseInt(e.target.value||'0',10),0,10_000_000_000))}
                   className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"/>
          </label>
          <label className="block">
            <div className="flex items-center justify-between"><span className="text-sm text-gray-600">신용점수</span><span className="text-xs text-gray-500">{credit}</span></div>
            <input type="range" min={CREDIT_MIN} max={CREDIT_MAX} step={1} value={credit} onChange={e=>setCredit(parseInt(e.target.value,10))} className="mt-1 w-full"/>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">선택 상품 수</span>
            <input disabled value={`${selected.length}개`} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 bg-gray-50"/>
          </label>
        </div>

        {selected.length===0 ? (
          <p className="text-sm text-gray-600">조회할 상품을 먼저 선택해 주세요.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50/60 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">상품</th>
                  <th className="px-3 py-2 text-left">예상금리(연)</th>
                  <th className="px-3 py-2 text-left">예상한도</th>
                  <th className="px-3 py-2 text-left">최장기간</th>
                </tr>
              </thead>
              <tbody>
                {prequalResults.map(r=> (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.name}</td>
                    <td className="px-3 py-2 font-medium">{r.estRate.toFixed(2)}%</td>
                    <td className="px-3 py-2">₩ {won(r.limit)}</td>
                    <td className="px-3 py-2">{r.maxTerm}개월</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-gray-500">※ 실제 심사 결과는 입력하신 정보 외 추가 요건에 따라 달라질 수 있습니다.</p>
          </div>
        )}
      </Modal>
    );
  }

  // ---------------- 렌더
  return (
    <div className="min-h-screen bg-white text-gray-900">
      

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-20">
        <div className="text-sm text-gray-500 mb-3">금융상품 <span className="mx-1">›</span> 대출</div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
          <i className="ri-hand-coin-line  text-4xl  text-lime-800 p-2"></i>
          대출 상품</h1>

        {/* Filters */}
        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 md:p-5 mb-6">
          <div className="grid lg:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-end">
            <label className="block">
              <span className="text-sm text-gray-600 ">검색</span>
              <input value={q} onChange={(e)=>{ setQ(e.target.value); setPage(1); }} placeholder="상품명/키워드"
                     className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"/>
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">유형</span>
              <select value={type} onChange={(e)=>{ setType(e.target.value); setPage(1); }}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600">
                {TYPES.map(t=> <option key={t} value={t}>{t}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">최소 기간(개월)</span>
              <input type="number" min={0} value={termMin} onChange={(e)=>{ setTermMin(clamp(parseInt(e.target.value||'0',10),0,480)); setPage(1); }}
                     className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"/>
            </label>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">금리 범위(연 %)</span>
                <span className="text-xs text-gray-500">{rateRange[0].toFixed(1)} ~ {rateRange[1].toFixed(1)}</span>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input type="range" min={0} max={15} step={0.1} value={rateRange[0]} onChange={(e)=> setRateRange([Math.min(parseFloat(e.target.value), rateRange[1]), rateRange[1]])} />
                <input type="range" min={0} max={15} step={0.1} value={rateRange[1]} onChange={(e)=> setRateRange([rateRange[0], Math.max(parseFloat(e.target.value), rateRange[0])])} />
              </div>
            </div>

            <label className="block">
              <span className="text-sm text-gray-600">최소 한도(원)</span>
              <input type="number" min={0} value={limitMin} onChange={(e)=>{ setLimitMin(clamp(parseInt(e.target.value||'0',10),0,1_000_000_000)); setPage(1); }}
                     className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600"/>
            </label>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">총 <b>{filtered.length}</b>개 상품</div>
            <label className="text-sm">정렬: {' '} 
              <select className="rounded-lg border border-gray-200 px-2 py-1" value={sort} onChange={(e)=> setSort(e.target.value)}>
                {SORTS.map(s=> <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>
        </section>

        {/* List */}
        <section className="grid md:grid-cols-2 gap-5">
          {visible.map(p=> <ProductCard key={p.id} p={p} />)}
        </section>

        <div className="mt-6 flex justify-center">
          {hasMore ? (
            <button onClick={()=> setPage(p=>p+1)} className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">더 보기</button>
          ) : (
            <div className="text-sm text-gray-500">더 이상 상품이 없습니다</div>
          )}
        </div>

        {/* 비교 선택 바 */}
        {selected.length>0 && (
          <div className="fixed bottom-0 left-0 right-0 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
              <div className="text-sm text-gray-700">비교 선택: {selected.length} / 3</div>
              <div className="flex gap-2 flex-wrap">
                {selected.map(id=>{
                  const p = PRODUCTS.find(x=>x.id===id);
                  return (
                    <span key={id} className="px-2 py-1 rounded-lg border text-sm">{p?.name}
                      <button className="ml-2 text-gray-500" onClick={()=> setSelected(prev=> prev.filter(x=>x!==id))}>✕</button>
                    </span>
                  );
                })}
              </div>
              <div className="ml-auto flex gap-2">
                <button disabled={!canCompare} onClick={()=>setShowCompare(true)}
                        className={`px-3 py-2 rounded-xl border text-sm ${canCompare? 'border-gray-200 hover:bg-gray-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`}>비교 보기</button>
                <button disabled={!canPrequal} onClick={()=>setShowPrequal(true)}
                        className={`px-3 py-2 rounded-xl ${canPrequal? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-300 text-white cursor-not-allowed'} text-sm`}>간편조회</button>
              </div>
            </div>
          </div>
        )}
      </main>
      

      {/* 모달 렌더 */}
      <CompareModal />
      <PrequalModal />
    </div>
  );
}

