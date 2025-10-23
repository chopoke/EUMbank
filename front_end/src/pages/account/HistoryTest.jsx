
/**
 * File: AccountHistoryPage_NeoHeaderFooter.jsx
 * Description: 계좌 이체내역 / 상세 페이지 (NeoBank 헤더/푸터 포함 프리뷰)
 *
 * 사용법:
 *   import Preview, { AccountHistoryPage } from "./AccountHistoryPage_NeoHeaderFooter.jsx";
 *   // 빠른 미리보기
 *   //   <Preview />
 *   // 실제 라우팅
 *   //   <Route path="/accounts/:accountId" element={<AccountHistoryPage/>} />
 */

import React from "react";

/* -------------------- Neo Header / Footer -------------------- */
function NeoHeader({searchValue, onSearchChange}){
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b">
      <div className="hidden md:flex h-10 items-center justify-between px-6 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <a href="#" className="hover:underline">공지</a>
          <a href="#" className="hover:underline">접근성</a>
          <a href="#" className="hover:underline">고객센터</a>
        </div>
        <div className="flex items-center gap-4">
          <button className="hover:underline" aria-label="언어 전환">KO/EN</button>
          <button className="relative" aria-label="알림">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gray-700">
              <path d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none rounded-full px-1">3</span>
          </button>
        </div>
      </div>
      <div className="h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <a href="#" className="font-semibold text-xl text-blue-700 tracking-tight">NeoBank</a>
          <nav className="hidden lg:flex items-center gap-6 text-sm text-gray-700">
            <a className="hover:text-blue-700" href="#">개인</a>
            <a className="hover:text-blue-700" href="#">상품</a>
            <a className="hover:text-blue-700" href="#">펀드</a>
            <a className="hover:text-blue-700" href="#">자산관리</a>
            <a className="hover:text-blue-700" href="#">외환/환율</a>
            <a className="hover:text-blue-700" href="#">이벤트</a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative hidden md:block">
            <input
              value={searchValue}
              onChange={(e)=>onSearchChange?.(e.target.value)}
              className="peer w-64 rounded-full border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="메뉴/기능 검색"
            />
            <span className="absolute left-3 top-2.5 text-gray-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 21l-4.35-4.35M10 17a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </label>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="hidden sm:inline">안전한 접속중</span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-gray-700">보안</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function NeoFooter(){
  return (
    <footer className="bg-gray-50 border-t">
      <div className="mx-auto max-w-screen-xl px-6 py-10 text-sm text-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div className="font-medium text-gray-900 mb-2">NeoBank</div>
            <p>사업자등록번호 123-45-67890</p>
            <p>대표 ㈜네오뱅크</p>
          </div>
          <div>
            <div className="font-medium text-gray-900 mb-2">약관</div>
            <ul className="space-y-1">
              <li><a href="#tos" className="hover:underline">전자금융거래약관</a></li>
              <li><a href="#privacy" className="hover:underline">개인정보 처리방침</a></li>
              <li><a href="#disclosure" className="hover:underline">경영공시</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-gray-900 mb-2">고객지원</div>
            <ul className="space-y-1">
              <li><a href="#faq" className="hover:underline">FAQ</a></li>
              <li><a href="#branch" className="hover:underline">지점/ATM 찾기</a></li>
              <li><a href="#contact" className="hover:underline">문의하기</a></li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-gray-900 mb-2">인증</div>
            <p>ISMS · 개인정보보호 인증</p>
            <p className="mt-2 text-gray-500">© 2025 NeoBank</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* -------------------- Utils & Mocks -------------------- */
const won = (n)=> n.toLocaleString('ko-KR');
const formatCur = (amt)=> {
  const abs = Math.abs(amt);
  const sign = amt < 0 ? '-' : '';
  return `${sign}₩ ${won(abs)}`;
};
const maskAcc = (s)=> s.replace(/(\\d{2,4})-(\\d{2,4})-(\\d{2,6})/, (_ ,a,b,c)=> `${a}-${b}-` + c.replace(/\\d/g,'•'));

function addDays(date, delta){
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}
function toISODate(d){
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function useMockAccount(){
  const [account] = React.useState({
    id: 'acc1',
    alias: '월급통장',
    bank: 'MyBank',
    number: '3333-12-345678',
    type: '입출금',
    balance: 3820450
  });
  return account;
}

function useMockTransfers(){
  const today = new Date();
  const base = [
    {id:1, ts:addDays(today,-0),  time:"10:42", type:"입금",  counterparty:"회사",          memo:"9월 급여",      amount:+3000000, balance:3820450},
    {id:2, ts:addDays(today,-1),  time:"20:10", type:"출금",  counterparty:"편의점",        memo:"간식",          amount:-5500,    balance:820450},
    {id:3, ts:addDays(today,-1),  time:"11:05", type:"이체",  counterparty:"이동훈",        memo:"더치페이",      amount:-20000,   balance:825950},
    {id:4, ts:addDays(today,-2),  time:"08:30", type:"이체",  counterparty:"적금 12M",      memo:"자동이체",      amount:-200000,  balance:845950},
    {id:5, ts:addDays(today,-3),  time:"12:15", type:"입금",  counterparty:"토스",          memo:"받은 용돈",     amount:+50000,   balance:1045950},
    {id:6, ts:addDays(today,-3),  time:"18:40", type:"수수료",counterparty:"MyBank",        memo:"타행이체 수수료",amount:-500,     balance:1045450},
    {id:7, ts:addDays(today,-6),  time:"09:00", type:"출금",  counterparty:"스타벅스",      memo:"아이스라떼",    amount:-4800,    balance:1050250},
    {id:8, ts:addDays(today,-10), time:"14:18", type:"이체",  counterparty:"김가영",        memo:"점심",          amount:-12000,   balance:1055050},
    {id:9, ts:addDays(today,-20), time:"07:55", type:"입금",  counterparty:"국민연금",      memo:"환급",          amount:+24000,   balance:1067050},
    {id:10,ts:addDays(today,-28), time:"23:10", type:"출금",  counterparty:"GS주유소",      memo:"주유",          amount:-75000,   balance:1043050},
  ];
  base.sort((a,b)=> b.ts - a.ts || a.id - b.id);
  return base;
}

/* -------------------- Main Page -------------------- */
function AccountHistoryPage(){
  const account = useMockAccount();
  const allRows = useMockTransfers();

  // filters
  const [dateFrom, setDateFrom] = React.useState(toISODate(addDays(new Date(), -7)));
  const [dateTo, setDateTo] = React.useState(toISODate(new Date()));
  const [kinds, setKinds] = React.useState(new Set()); // 입금/출금/이체/수수료
  const [minAmt, setMinAmt] = React.useState("");
  const [maxAmt, setMaxAmt] = React.useState("");
  const [memoQuery, setMemoQuery] = React.useState("");
  const [sortKey, setSortKey] = React.useState("latest");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  function resetFilters(){
    setDateFrom(toISODate(addDays(new Date(), -7)));
    setDateTo(toISODate(new Date()));
    setKinds(new Set());
    setMinAmt(""); setMaxAmt("");
    setMemoQuery(""); setSortKey("latest");
    setPage(1);
  }
  function toggleKind(k){ const next=new Set(kinds); next.has(k)?next.delete(k):next.add(k); setKinds(next); setPage(1); }
  function quickRange(days){
    setDateFrom(toISODate(addDays(new Date(), -days+1)));
    setDateTo(toISODate(new Date()));
    setPage(1);
  }

  const filtered = React.useMemo(()=>{
    const from = new Date(dateFrom+"T00:00:00");
    const to = new Date(dateTo+"T23:59:59");
    return allRows.filter(r=>{
      if(!(r.ts>=from && r.ts<=to)) return false;
      if(kinds.size>0 && !kinds.has(r.type)) return false;
      if(minAmt !== "" && Math.abs(r.amount) < Number(minAmt)) return false;
      if(maxAmt !== "" && Math.abs(r.amount) > Number(maxAmt)) return false;
      if(memoQuery.trim() && !(`${r.memo}${r.counterparty}`.toLowerCase().includes(memoQuery.trim().toLowerCase()))) return false;
      return true;
    }).sort((a,b)=> sortKey==="latest" ? (b.ts - a.ts) : (Math.abs(b.amount)-Math.abs(a.amount)));
  }, [allRows, dateFrom, dateTo, kinds, minAmt, maxAmt, memoQuery, sortKey]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageRows = filtered.slice((page-1)*pageSize, page*pageSize);

  function downloadCsv(rows){
    const header = ["일시","구분","상대","메모","금액(±)","잔액"];
    const body = rows.map(r => [
      `${toISODate(r.ts)} ${r.time}`, r.type, r.counterparty, r.memo, r.amount, r.balance
    ]);
    const csv = [header, ...body].map(r=> r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\\n');
    const blob = new Blob(["\\uFEFF"+csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transfer_history.csv'; a.click(); URL.revokeObjectURL(url);
  }

  const Chip = ({active, children, onClick}) => (
    <button onClick={onClick} className={"px-3 py-1.5 rounded-full text-xs border transition " + (active?"bg-blue-50 text-blue-700 border-blue-300":"hover:bg-gray-50")}>{children}</button>
  );

  return (
    <div className="bg-gray-50">
      {/* Title */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-screen-xl px-6 py-6">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">계좌이체내역 조회</h1>
          <p className="text-sm text-gray-600 mt-1">선택한 계좌의 정보와 거래내역을 함께 확인하세요.</p>
        </div>
      </section>

      {/* Account Summary + Quick Filters */}
      <section>
        <div className="mx-auto max-w-screen-xl px-6 py-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{account.bank} · {account.type}</div>
                <div className="text-lg font-semibold text-gray-900">{account.alias}</div>
                <div className="text-sm text-gray-700 font-mono mt-1">{maskAcc(account.number)}</div>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-50">이체</button>
                  <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-50">계좌관리</button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">현재 잔액</div>
                <div className="text-2xl font-bold">₩ {won(account.balance)}</div>
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-gray-800 mb-2">빠른 필터</div>
              <div className="flex flex-wrap gap-2">
                <Chip onClick={()=>quickRange(1)}>오늘</Chip>
                <Chip onClick={()=>quickRange(3)}>3일</Chip>
                <Chip onClick={()=>quickRange(7)}>7일</Chip>
                <Chip onClick={()=>quickRange(30)}>한달</Chip>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters + Table */}
      <section className="pb-10">
        <div className="mx-auto max-w-screen-xl px-6 grid grid-cols-12 gap-6">
          {/* Filter Panel */}
          <aside className="col-span-12 md:col-span-3">
            <div className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">검색 / 필터</h2>
                <button onClick={resetFilters} className="text-xs text-gray-500 hover:underline">초기화</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">시작일</label>
                  <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">종료일</label>
                  <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm"/>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-600 mb-1">거래 구분</div>
                <div className="flex flex-wrap gap-2">
                  {["입금","출금","이체","수수료"].map(k => (
                    <Chip key={k} active={kinds.has(k)} onClick={()=>toggleKind(k)}>{k}</Chip>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-600 mb-1">금액 범위 (₩)</div>
                <div className="flex items-center gap-2">
                  <input value={minAmt} onChange={e=>setMinAmt(e.target.value)} type="number" placeholder="최소"
                         className="w-full rounded-lg border px-3 py-2 text-sm"/>
                  <span className="text-gray-400">~</span>
                  <input value={maxAmt} onChange={e=>setMaxAmt(e.target.value)} type="number" placeholder="최대"
                         className="w-full rounded-lg border px-3 py-2 text-sm"/>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs text-gray-600 mb-1">메모/상대 검색</label>
                <input value={memoQuery} onChange={e=>setMemoQuery(e.target.value)} type="text" placeholder="예) 급여, 편의점, 더치"
                       className="w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-400"/>
              </div>

              <div className="mt-5">
                <button className="w-full rounded-lg bg-blue-700 text-white py-2.5 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  조회
                </button>
              </div>
            </div>
          </aside>

          {/* Result Panel */}
          <section className="col-span-12 md:col-span-9">
            <div className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">총 <b className="text-gray-900">{total}</b>건</span>
                  <span className="hidden md:inline-block w-px h-4 bg-gray-200"></span>
                  <div className="flex items-center gap-2">
                    <label className="text-gray-600">정렬</label>
                    <select value={sortKey} onChange={e=>setSortKey(e.target.value)} className="rounded-md border px-2.5 py-1.5 text-sm">
                      <option value="latest">최신순</option>
                      <option value="amount">금액 큰순</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>downloadCsv(filtered)} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">CSV 다운로드</button>
                  <button onClick={()=>{location.reload()}} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">새로고침</button>
                </div>
              </div>

              {/* Table */}
              <div className="mt-4 overflow-auto">
                <table className="min-w-[760px] w-full text-sm">
                  <thead className="text-gray-600">
                    <tr className="border-b bg-gray-50">
                      <th className="text-left font-medium px-3 py-2">일시</th>
                      <th className="text-left font-medium px-3 py-2">구분</th>
                      <th className="text-left font-medium px-3 py-2">상대</th>
                      <th className="text-right font-medium px-3 py-2">금액</th>
                      <th className="text-right font-medium px-3 py-2">잔액</th>
                      <th className="text-left font-medium px-3 py-2">메모/ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pageRows.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-10 text-center text-gray-500">조건에 맞는 내역이 없습니다.</td></tr>
                    ) : pageRows.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap">{toISODate(r.ts)} {r.time}</td>
                        <td className="px-3 py-3">{r.type}</td>
                        <td className="px-3 py-3">{r.counterparty}</td>
                        <td className={"px-3 py-3 text-right " + (r.amount<0 ? "text-red-600" : "text-emerald-700")}>
                          {formatCur(r.amount)}
                        </td>
                        <td className="px-3 py-3 text-right">₩ {won(r.balance)}</td>
                        <td className="px-3 py-3">{r.memo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded-md border px-2 py-1 hover:bg-gray-50">〈</button>
                <span className="text-gray-600">{page} / {pages}</span>
                <button onClick={()=>setPage(p=>Math.min(pages,p+1))} className="rounded-md border px-2 py-1 hover:bg-gray-50">〉</button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

/* -------------------- Preview Shell (Default) -------------------- */
export default function PreviewShell(){
  const [search, setSearch] = React.useState("");
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-blue-700 text-white px-3 py-2 rounded">
        본문 바로가기
      </a>
      <NeoHeader searchValue={search} onSearchChange={setSearch} />
      <main id="main">
        <AccountHistoryPage />
      </main>
      <NeoFooter />
    </div>
  );
}

export { AccountHistoryPage, NeoHeader, NeoFooter };
