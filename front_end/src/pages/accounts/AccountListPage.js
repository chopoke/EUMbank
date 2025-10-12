
import React, { useEffect } from "react";
import { fetchAccounts } from "../../api/accounts";
import { Link } from "react-router-dom";


function AccountListPage(){
  const[accounts, setAccounts] = React.useState([]);

  // 임시 고객 번호
  const c_no = 1;

  React.useEffect(()=>{
    // accounts.js -> axios
    fetchAccounts(c_no)
      .then(res=>{
        // 서버 : AccountSummaryDTO 
        const rows = res.data || [];

        // 값 매핑
        const mapped = rows.map(d=>({
          id: d.a_no,
          alias: d.a_nickname || d.a_account_no,
          accountName: d.a_account_type || "입출금",
          bank: "EumBank",                 // 임시
          number: d.a_account_no,
          type: d.a_account_type,
          balance: Number(d.a_balance),
          currency: d.a_currency || "KRW",
          status: d.a_status === "ACTIVE" ? "정상" : d.a_status,
          favorite: false,
          lastActivityTs: Date.now(),
          lastActivity: ""
        }));
        setAccounts(mapped);
      }).catch(console.error);
  }, [c_no]
);  

  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("전체");
  const [selectedBanks, setSelectedBanks] = React.useState(new Set());
  const [minBal, setMinBal] = React.useState("");
  const [maxBal, setMaxBal] = React.useState("");
  const [statuses, setStatuses] = React.useState(new Set());
  const [sortKey, setSortKey] = React.useState("recent");
  const [showalert, setShowalert] = React.useState(false);

  const bankOptions = ["MyBank","신한","KB국민","우리","하나","NH농협"];
  const typeOptions = ["전체","입출금","예금","적금", "대출","외화"];

  // 원화 스케일링
  const won = (n)=> n.toLocaleString('ko-KR');
  const formatCurrency = (amt, cur) => 
    cur === "USD"
      ? `$ ${amt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`: `₩ ${won(amt)}`;
    // 계좌번호 마스킹
    const maskAcc = (s) =>
      s.replace(/(\d{2,4})-(\d{2,4})-(\d{2,6})/, (_m, a, b, c) => `${a}-${b}-` + c.replace(/\d/g, "•"));
    // 원화 변환
    const toKRW = (a) => (a.currency === "KRW" ? a.balance : a.balance * 1350);


  // 은행 필터 토글
  function toggleBank(b) { const next = new Set(selectedBanks); next.has(b) ? next.delete(b) : next.add(b); setSelectedBanks(next); }
  // 상태 필터 토글
  function toggleStatus(s) { const next = new Set(statuses); next.has(s) ? next.delete(s) : next.add(s); setStatuses(next); }
  // 필터 초기화
  function resetFilters() { setSearch(""); setType("전체"); setSelectedBanks(new Set()); setMinBal(""); setMaxBal(""); setStatuses(new Set()); setSortKey("recent"); }
  // 복사시 알럿을 토스트형식으로
  useEffect(()=>{
    let timer;
    if(showalert){
      timer = setTimeout(()=>{
        setShowalert(false);
      }, 3000);
    }
    return ()=>clearTimeout(timer);
  }, [showalert]);

  // 복사
  function copyText(t) { 
    navigator.clipboard?.writeText(t);
    alert("복사되었습니다");
  }


  // csv 다운로드
  function downloadCsv(rows) {
    const header = ["별칭", "계좌명", "은행", "계좌번호", "유형", "잔액", "통화", "상태", "최근거래"];
    const body = rows.map((r) => [r.alias, r.accountName, r.bank, r.number, r.type, r.balance, r.currency, r.status, r.lastActivity]);
    const csv = [header, ...body].map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = "accounts.csv"; 
    a.click(); 
    URL.revokeObjectURL(url);
  }

  // 필터
  const filtered = React.useMemo(() => {    // Memoization 훅 활용  (계산값을 메모리에 저장해 재사용)
    return accounts
      .filter((a) => {
        const q = search.trim().toLowerCase();
        const okQ = !q || [a.alias, a.accountName, a.number].some((s) => s?.toLowerCase().includes(q));
        if (!okQ) return false;
        if (type !== "전체" && a.type !== type) return false;
        if (selectedBanks.size > 0 && !selectedBanks.has(a.bank)) return false;
        if (statuses.size > 0 && !statuses.has(a.status)) return false;
        const balKRW = a.currency === "KRW" ? a.balance : null;
        if (minBal !== "" && balKRW != null && balKRW < Number(minBal)) return false;
        if (maxBal !== "" && balKRW != null && balKRW > Number(maxBal)) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case "balDesc": return toKRW(b) - toKRW(a);
          case "balAsc": return toKRW(a) - toKRW(b);
          case "name": return (a.alias || a.accountName).localeCompare(b.alias || b.accountName, "ko");
          default: return b.lastActivityTs - a.lastActivityTs;
        }
      });
  }, [accounts, search, type, selectedBanks, minBal, maxBal, statuses, sortKey]);     // 인자값이 업뎃될때마다 메모리값 업뎃

  // 갯수 세팅
  const totalCount = filtered.length;

  // 상태 칩
  const Chip = ({ active, children, onClick }) => (
    <button onClick={onClick} className={"px-3 py-1.5 rounded-full text-xs border transition " + (active ? "bg-blue-50 text-blue-700 border-blue-300" : "hover:bg-gray-50")}>{children}</button>
  );

  return (
    <div className="bg-gray-50">
      {/* 타이틀 배너 */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-screen-xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight">계좌 목록 조회</h1>
              <p className="text-sm text-gray-600 mt-1">보유 중인 계좌를 한눈에 확인하고, 빠르게 이체/관리하세요.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">계좌개설</button>
              <button className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">이체하기</button>
            </div>
          </div>
        </div>
      </section>

      {/* 본문 */}
      <section>
        <div className="mx-auto max-w-screen-xl px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* 필터 */}
            <aside className="col-span-12 md:col-span-3">
              <div className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-800">검색 / 필터</h2>
                  <button onClick={resetFilters} className="text-xs text-gray-500 hover:underline">초기화</button>
                </div>

                {/* 검색 */}
                <label className="block text-xs text-gray-600 mb-1">계좌/별칭 검색</label>
                <input value={search} onChange={e=>setSearch(e.target.value)} type="text" placeholder="예) 월급통장, 3333-****"
                      className="w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"/>
                {/* 유형별 검색(버튼) */}
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-1">계좌 유형</div>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map(t=> (
                      <Chip key={t} active={type===t} onClick={()=>setType(t)}>{t}</Chip>
                    ))}
                  </div>
                </div>

                {/* 은행별검색(체크박스) */}
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-1">은행</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {bankOptions.map(b=> (
                      <label key={b} className="inline-flex items-center gap-2">
                        <input type="checkbox" className="rounded border-gray-300"
                               checked={selectedBanks.has(b)} onChange={()=>toggleBank(b)} /> {b}
                      </label>
                    ))}
                  </div>
                </div>

                {/* 금액별 검색 */}
                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-1">잔액 범위 (₩)</div>
                  <div className="flex items-center gap-2">
                    <input value={minBal} onChange={e=>setMinBal(e.target.value)} type="number" placeholder="최소"
                           className="w-full rounded-lg border px-3 py-2 text-sm"/>
                    <span className="text-gray-400">~</span>
                    <input value={maxBal} onChange={e=>setMaxBal(e.target.value)} type="number" placeholder="최대"
                           className="w-full rounded-lg border px-3 py-2 text-sm"/>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs text-gray-600 mb-1">상태</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['정상','휴면','해지예정'].map(s=> (
                      <Chip key={s} active={statuses.has(s)} onClick={()=>toggleStatus(s)}>{s}</Chip>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <button className="w-full rounded-lg bg-blue-700 text-white py-2.5 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">조회</button>
                </div>
              </div>
            </aside>

            {/* 결과-(내용) */}
            <section className="col-span-12 md:col-span-9">
              <div className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
                {/* 정렬 */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-600">총 <b className="text-gray-900">{totalCount}</b>개 계좌</span>
                    <span className="hidden md:inline-block w-px h-4 bg-gray-200"></span>
                    <div className="flex items-center gap-2">
                      <label className="text-gray-600">정렬</label>
                      <select value={sortKey} onChange={e=>setSortKey(e.target.value)} className="rounded-md border px-2.5 py-1.5 text-sm">
                        <option value="recent">최근 사용순</option>
                        <option value="balDesc">잔액 높은순</option>
                        <option value="balAsc">잔액 낮은순</option>
                        <option value="name">이름순</option>
                      </select>
                    </div>
                  </div>
                  {/* csv */}
                  <div className="flex items-center gap-2">
                    <button onClick={()=>downloadCsv(filtered)} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">CSV 다운로드</button>
                    <button onClick={()=>setAccounts(a=>[...a])} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">목록 새로고침</button>
                  </div>
                </div>

                {/* 이체 내역 결과 */}
                <div className="mt-4 overflow-auto hidden md:block">
                  <table className="min-w-[760px] w-full text-sm">
                    <thead className="text-gray-600">
                      <tr className="border-b bg-gray-50">
                        <th className="text-left font-medium px-3 py-2">별칭 / 계좌명</th>
                        <th className="text-left font-medium px-3 py-2">은행</th>
                        <th className="text-left font-medium px-3 py-2">계좌번호</th>
                        <th className="text-center font-medium px-3 py-2">잔액</th>
                        <th className="text-left font-medium px-3 py-2 whitespace-nowrap">최근 거래</th>
                        <th className="text-center font-medium px-3 py-2">상태</th>
                        {/* <th className="text-center font-medium px-3 py-2">즐겨찾기</th> */}
                        <th className="text-center font-medium px-3 py-2 ">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filtered.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          {/* 계좌이름/별칭 */}
                          <td className="px-3 py-3">
                            <div className="font-medium text-gray-900">{row.alias}</div>
                            <div className="text-gray-500 text-xs">{row.accountName} · {row.type}</div>
                          </td>
                          {/* 계좌번호 */}
                          <td className="px-3 py-3">{row.bank}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono tracking-wider">{maskAcc(row.number)}</span>
                              <button onClick={()=>copyText(row.number)} className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap underline">복사</button>
                            </div>
                          </td>
                          {/* 잔액 */}
                          <td className="px-3 py-3 text-right whitespace-nowrap">
                            <span className="font-medium">{formatCurrency(row.balance,row.currency)}</span>
                          </td>
                          {/* 상태 */}
                          <td className="px-3 py-3 text-gray-600">{row.lastActivity}</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <span className={"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium " + (row.status==="정상"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700")}>{row.status}</span>
                          </td>
                          {/* 즐겨찾기 */}
                          {/* <td className="px-3 py-3 text-center whitespace-nowrap w-[80px]">
                            <button  onClick={()=>setAccounts(list=>list.map(a=> a.id===row.id?{...a,favorite:!a.favorite}:a))} aria-label="즐겨찾기">
                              {row.favorite ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.402 8.168L12 18.897l-7.336 3.868 1.402-8.168L.132 9.211l8.2-1.193L12 .587z"/></svg>
                              ):(
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 17.75l-6.16 3.24 1.18-6.88L1 9.51l6.9-1 3.1-6.28 3.1 6.28 6.9 1-5.02 4.6 1.18 6.88L12 17.75z" stroke="#9ca3af" strokeWidth="1.5" fill="none"/></svg>
                              )}
                            </button>
                          </td> */}
                          {/* 부가기능 */}
                          <td className="px-3 py-3 text-center whitespace-nowrap w-[180px]">
                            <div className="flex justify-center gap-1.5">
                              <button className="px-2.5 py-1.5 rounded-md border text-xs hover:bg-gray-50">이체</button>
                              <button className="px-2.5 py-1.5 rounded-md border text-xs hover:bg-gray-50">상세</button>
                              <Link to={`/accounts/${row.id}`}>
                                <button className="px-2.5 py-1.5 rounded-md border text-xs hover:bg-gray-50">이체내역</button>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 모바일용카드 */}
                <div className="md:hidden space-y-3 mt-3">
                  {filtered.map(row=> (
                    <div key={row.id} className="rounded-xl border p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-gray-500">{row.bank} · {row.type}</div>
                          <div className="font-medium text-gray-900">{row.alias}</div>
                        </div>
                        <button onClick={()=>setAccounts(list=>list.map(a=> a.id===row.id?{...a,favorite:!a.favorite}:a))} aria-label="즐겨찾기">
                          {row.favorite ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.786 1.402 8.168L12 18.897l-7.336 3.868 1.402-8.168L.132 9.211l8.2-1.193L12 .587z"/></svg>
                          ):(
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 17.75l-6.16 3.24 1.18-6.88L1 9.51l6.9-1 3.1-6.28 3.1 6.28 6.9 1-5.02 4.6 1.18 6.88L12 17.75z" stroke="#9ca3af" strokeWidth="1.5" fill="none"/></svg>
                          )}
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{maskAcc(row.number)}</div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="font-semibold">{formatCurrency(row.balance,row.currency)}</div>
                        <button className="text-xs underline ">복사</button>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{row.lastActivity}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}

export { AccountListPage };
