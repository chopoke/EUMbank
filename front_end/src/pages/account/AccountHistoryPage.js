import React from "react";
import { fetchAccountDetail, fetchAccountTransactions } from "../../api/accounts";
import {  useNavigate, useParams } from "react-router-dom";


// 유틸부분 포맷 등
const won = (n)=> n.toLocaleString('ko-KR');    // 환율기준 포맷팅
const formatCur = (amt)=> {
  const abs = Math.abs(amt);          // 받은 값 절댓값으로 정리
  const sign = amt < 0 ? '-' : '';    // 원금이 음수라면 - 붙여주기
  return `${sign}₩ ${won(abs)}`;      // 포맷해서 정리
};

// 계좌번호 마스킹
const maskAcc = (s)=> s.replace(/(\d{2,4})-(\d{2,4})-(\d{2,6})/, (_ ,a,b,c)=> `${a}-${b}-` + c.replace(/\d/g,'•'));  

// 날짜 추가
function addDays(date, delta){
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

// 날짜 포맷
function toISODate(d){
  if (!(d instanceof Date) || isNaN(d)) return '';    // d의 값이 날짜가 아니거나 Null이라면 공백 반환
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');   // 개월 수가 총 2자리가 될때까지 0을 앞에 붙임
  const day = String(d.getDate()).padStart(2,'0');    // 일 수가 총 2자리가 될때까지 0을 앞에 붙임
  return `${y}-${m}-${day}`;
}



// ======================== 메인 페이지 ====================================
function AccountHistoryPage(){

  const {a_no} = useParams();   // URL로 넘어온 계좌번호
  const [account, setAccounts] = React.useState(null);

  // 필터상태
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [kinds, setKinds] = React.useState(new Set()); // 입금/출금/이체/수수료
  const [minAmt, setMinAmt] = React.useState("");
  const [maxAmt, setMaxAmt] = React.useState("");
  const [memoQuery, setMemoQuery] = React.useState("");
  const [memoQv, setMemoQv] = React.useState(0);
  const [sortKey, setSortKey] = React.useState("latest");

  const navigate = useNavigate();

  // 페이지네이션
  const [page, setPage] = React.useState(0);          // 백엔드에서 넘긴 값
  const pageSize = 10;
  const [rows, setRows] = React.useState([]);         // 백엔디 값
  const [totalElements, setTotalElements] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  

  // 계좌 요약/상세 불러오기
  React.useEffect(() => {
    // axios  ->  계좌 a_no에 따른 이체내역
    fetchAccountDetail(Number(a_no))
      .then((res) => {
        const d= res.data;
        setAccounts({
          alias:d.a_nickname || d.a_account_no,
          bank: "EumBank",
          number: d.a_account_no,
          type: d.a_account_type,
          balance: Number(d.a_balance || 0)
        });
      }).catch(console.error);
  }, [a_no]);

  React.useEffect(()=>{ 
    if (a_no) localStorage.setItem('last_a_no', String(a_no)); 
  }, [a_no]);
  
  React.useEffect(()=>{
    const type = kinds.size===1 ? Array.from(kinds)[0] : undefined; 

    fetchAccountTransactions(Number(a_no), {
      type,
      from:dateFrom ? `${dateFrom}T00:00:00` : undefined,
      to:   dateTo   ? `${dateTo}T23:59:59` : undefined,
      page,
      size:pageSize
    })
      .then(res=>{

        const p = res.data;   // 스프링 페이지 응답
        const parseTs = (v) => {
          if (!v) return null;

          // 숫자(Epoch)든 문자열이든 안전하게 Date 생성
          return new Date(typeof v === 'number' ? v : String(v).replace(' ', 'T'));
        };

        const mapped = (p.content || []).map(r=> ({
          id: r.th_transfer_no,
          ts: parseTs(r.th_transfer_at),
          time: r.th_transfer_at ? new Date(r.th_transfer_at).toLocaleTimeString('ko-KR', { hour12:false }) : "", 
          type: r.th_transfer_type || "-",   // 서버가 어떤 문자열로 주는지에 맞춰 표기
          counterparty: r.th_other_bank || "-",
          memo: r.th_memo || "-",
          amount: (r.th_transfer_type === "입금" ? +1 : -1) * (r.th_amount ?? 0),
          balance: Number(r.th_after_balance ?? 0),
        }));

        // 보조 필ㅓ링 부분 
        let clientFiltered = mapped.filter((r) => {
          if (minAmt !== "" && Math.abs(r.amount) < Number(minAmt)) return false;
          if (maxAmt !== "" && Math.abs(r.amount) > Number(maxAmt)) return false;
          if (memoQuery.trim() && !(`${r.memo}${r.counterparty}`.toLowerCase().includes(memoQuery.trim().toLowerCase()))) return false;
          return true;
        });

        if (sortKey === "amount") {
          clientFiltered = clientFiltered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
        } else {
          clientFiltered = clientFiltered.sort((a, b) => b.ts - a.ts);
        }

        setRows(clientFiltered);
        setTotalElements(p.totalElements ?? clientFiltered.length);
        setTotalPages(p.totalPages ?? (p.totalElements ? p.totalPages : 1));
      }).catch(console.error);

  }, [a_no, kinds, dateFrom, dateTo, page, pageSize, memoQv, sortKey]);

  
  // 필터 초기화
  function resetFilters() {
    setDateFrom("");
    setDateTo("");
    setKinds(new Set());
    setMinAmt("");
    setMaxAmt("");
    setMemoQuery("");
    setSortKey("latest");
    setPage(0);
  }

  // 종류 토글
  function toggleKind(k) {
    const next = new Set(kinds);
    next.has(k) ? next.delete(k) : next.add(k);
    setKinds(next);
    setPage(0);
  }
  // 날짜 설정 단축키
  function quickRange(days) {
    setDateFrom(toISODate(addDays(new Date(), -days + 1)));
    setDateTo(toISODate(new Date()));
    setPage(0);
  }
  // CSV 다운로드
  function downloadCsv(list) {
    const header = ["일시", "구분", "상대", "메모", "금액(±)", "잔액"];
    const body = list.map((r) => [`${toISODate(r.ts)} ${r.time}`, r.type, r.counterparty, r.memo, r.amount, r.balance]);
    const csv = [header, ...body].map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    // bomb:\uFEFF(utf-16)
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); 
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); 
    a.href = url;
    a.download = "transfer_history.csv";
    a.click();
    URL.revokeObjectURL(url);     // createObjectURL로 생긴 url 폐기
  }
  // 계좌 상태 필터링
  const Chip = ({ active, children, onClick }) => (
    <button onClick={onClick} className={"px-3 py-1.5 rounded-full text-xs border transition " + (active ? "bg-blue-50 text-blue-700 border-blue-300" : "hover:bg-gray-50")}>{children}</button>
  );

  // 계정 정보가 확인되지 않을 때
  if (!account) {
    return <div className="p-6">로딩 중…</div>;
  }

  // 뒤로가기
  const backBtn = () =>{
    navigate(-1);
  }

  return (
    <div className="bg-gray-50">
      {/* 타이틀 */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-screen-xl px-6 py-6">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">계좌이체내역 조회</h1>
          <p className="text-sm text-gray-600 mt-1">선택한 계좌의 정보와 거래내역을 함께 확인하세요.</p>
        </div>
      </section>

      {/* 계정정보 / 필터 */}
      <section>
        <div className="mx-auto max-w-screen-xl px-6 py-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">{account.bank} · {account.type}</div>
                <div className="text-lg font-semibold text-gray-900">{account.alias}</div>
                <div className="text-sm text-gray-700 font-mono mt-1">{maskAcc(account.number)}</div>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-100">이체</button>
                    <button onClick={backBtn}
                      className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-100">계좌목록</button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">현재 잔액</div>
                <div className="text-2xl font-bold">₩ {won(account.balance)}</div>
              </div>
            </div>
          </div>
          
          {/* 빠른날짜필터 */}
          <div className="col-span-12 lg:col-span-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-gray-800 mb-2">빠른 필터</div>
              <div className="flex flex-wrap gap-2">
                <Chip onClick={() => quickRange(1)}>오늘</Chip>
                <Chip onClick={() => quickRange(3)}>3일</Chip>
                <Chip onClick={() => quickRange(7)}>7일</Chip>
                <Chip onClick={() => quickRange(30)}>한달</Chip>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 필터 및 내용 */}
      <section className="pb-10">
        <div className="mx-auto max-w-screen-xl px-6 grid grid-cols-12 gap-6">
          {/* 필터부분 */}
          <aside className="col-span-12 md:col-span-3">
            <div className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">검색 / 필터</h2>
                <button onClick={resetFilters} className="text-xs text-gray-500 hover:underline">초기화</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">시작일</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">종료일</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-600 mb-1">거래 구분</div>
                <div className="flex flex-wrap gap-2">
                  {["입금", "출금", "이체", "수수료"].map((k) => (
                    <Chip key={k} active={kinds.has(k)} onClick={() => toggleKind(k)}>{k}</Chip>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-600 mb-1">금액 범위 (₩)</div>
                <div className="flex items-center gap-2">
                  <input value={minAmt} onChange={(e) => setMinAmt(e.target.value)} type="number" placeholder="최소"
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                  <span className="text-gray-400">~</span>
                  <input value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} type="number" placeholder="최대"
                    className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs text-gray-600 mb-1">메모/상대 검색</label>
                <input value={memoQuery} onChange={(e) => setMemoQuery(e.target.value)} type="text" placeholder="예) 급여, 편의점, 더치"
                  className="w-full rounded-lg border px-3 py-2 text-sm placeholder:text-gray-400" />
              </div>

              <div className="mt-5">
                <button onClick={() => {setPage(0); setMemoQv(v => v+1); }}
                  className="w-full rounded-lg bg-blue-700 text-white py-2.5 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  조회
                </button>
              </div>
            </div>
          </aside>

          {/* 본문 */}
          <section className="col-span-12 md:col-span-9">
            <div className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
              {/* 정렬필터 */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-600">총 <b className="text-gray-900">{totalElements}</b>건</span>
                  <span className="hidden md:inline-block w-px h-4 bg-gray-200"></span>
                  <div className="flex items-center gap-2">
                    <label className="text-gray-600">정렬</label>
                    <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="rounded-md border px-2.5 py-1.5 text-sm">
                      <option value="latest">최신순</option>
                      <option value="amount">금액 큰순</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => downloadCsv(rows)} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
                    CSV 다운로드 
                  </button>
                  <button onClick={() => { window.location.reload(); }} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">새로고침</button>
                </div>
              </div>

              {/* 결과 테이불 */}
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
                    {rows.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-10 text-center text-gray-500">조건에 맞는 내역이 없습니다.</td></tr>
                    ) : rows.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap">{r.ts ? `${toISODate(r.ts)} ${r.time}` : '-'}</td>
                        <td className="px-3 py-3">{r.type}</td>
                        <td className="px-3 py-3">{r.counterparty}</td>
                        <td className={"px-3 py-3 text-right " + (r.amount < 0 ? "text-red-600" : "text-emerald-700")}>
                          {formatCur(r.amount)}
                        </td>
                        <td className="px-3 py-3 text-right">₩ {won(r.balance)}</td>
                        <td className="px-3 py-3">{r.memo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} 
                  className="rounded-md border px-2 py-1 hover:bg-gray-50">〈</button>
                <span className="text-gray-600">{page + 1} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} 
                  className="rounded-md border px-2 py-1 hover:bg-gray-50">〉</button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}



export { AccountHistoryPage };
