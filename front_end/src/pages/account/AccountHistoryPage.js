import React from "react";
import { fetchAccountDetail, fetchAccountTransactions, updateAccountAlias } from "../../api/accounts";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ===================== 통화 유틸
// 각 통화의 소수 자릿수(대표값). 없으면 2
const CURRENCY_DECIMALS = {
  KRW: 0, JPY: 0, VND: 0,
  USD: 2, EUR: 2, GBP: 2, CNY: 2, HKD: 2, SGD: 2, AUD: 2, CAD: 2, CHF: 2,
};


function formatNumber(n, fractionDigits = 2) {
  return Number(n).toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });
}
// 1,234.56 같은 형태로 포맷 (소수 자릿수 지정)
function formatCurrencyRaw(amount, currency = 'KRW') {
  const code = String(currency || 'KRW').toUpperCase();
  const dec = CURRENCY_DECIMALS[code] ?? 2;
  const sign = Number(amount) < 0 ? '-' : '';
  const abs = Math.abs(Number(amount) || 0);

  if (code === 'KRW') {
    return `${sign}${formatNumber(abs, 0)}원`;
  }
  return `${sign}${code} ${formatNumber(abs, dec)}`;
}


// 계좌 헤더/잔액에서 사용
const formatAccountBalance = (amt, currency) => formatCurrencyRaw(amt, currency);

// 날짜 유틸
const parseTs = (v) => {
  if (!v) return null;
  const s = typeof v === 'number' ? v : String(v).replace(' ', 'T');
  const d = new Date(s);
  return isNaN(d) ? null : d;
};
function addDays(date, delta) { const d = new Date(date); d.setDate(d.getDate() + delta); return d; }
function toISODate(d) {
  if (!(d instanceof Date) || isNaN(d)) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/* ===================== 메인 컴포넌트 ===================== */
function AccountHistoryPage() {
  const { a_no } = useParams();
  const [account, setAccounts] = React.useState(null);
  const [changeAlias, setChangeAlias] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  // 필터
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [kinds, setKinds] = React.useState(new Set());
  const [minAmt, setMinAmt] = React.useState("");
  const [maxAmt, setMaxAmt] = React.useState("");
  const [memoQuery, setMemoQuery] = React.useState("");
  const [memoQv, setMemoQv] = React.useState(0);
  const [sortKey, setSortKey] = React.useState("latest");

  // 페이지네이션 & 데이터
  const navigate = useNavigate();
  const [page, setPage] = React.useState(0);
  const pageSize = 10;
  const [rows, setRows] = React.useState([]);
  const [totalElements, setTotalElements] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  // PDF 폰트 캐시
  const fontCache = React.useRef({ regular: "" });
  async function loadFontBase64(url) {
    if (!url) return "";
    const result = await fetch(url);
    const buffers = await result.arrayBuffer();
    let binary = "";
    const byt = new Uint8Array(buffers);
    const chunk = 0x8000;
    for (let i = 0; i < byt.length; i += chunk) {
      binary += String.fromCharCode(...byt.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  // 계좌 요약/상세
  React.useEffect(() => {
    fetchAccountDetail(Number(a_no))
      .then((res) => {
        const d = res.data;
        const cur = (d.a_currency ?? d.currency ?? 'KRW').toUpperCase();
        setAccounts({
          nickname: d.a_nickname || "",
          alias: d.a_account_no,
          bank: "EumBank",
          number: d.a_account_no,
          type: d.a_account_type,
          currency: cur,                    // ★ 통화 저장
          balance: Number(d.a_balance || 0),
          openAt: parseTs(d.a_opened_at ?? d.a_open_at ?? d.openAt ?? d.open_at),
          rate: d.a_rate,
        });
        setChangeAlias(d.a_nickname || "");
      })
      .catch(console.error);
  }, [a_no]);

  // 별명 저장
  async function saveAlias() {
    if (!account) return;
    const nextAlias = changeAlias.trim();
    if (!nextAlias) { alert("공백은 별명일 수 없습니다."); return; }
    try {
      setSaving(true);
      await updateAccountAlias(Number(a_no), nextAlias);
      setAccounts(prev => prev ? ({ ...prev, nickname: nextAlias }) : prev);
    } catch (e) {
      console.error(e);
      alert("별명 저장 중 오류가 발생했습니다.");
    } finally { setSaving(false); }
  }

  React.useEffect(() => { if (a_no) localStorage.setItem('last_a_no', String(a_no)); }, [a_no]);

  // 거래내역
  React.useEffect(() => {
    const type = kinds.size === 1 ? Array.from(kinds)[0] : undefined;
    fetchAccountTransactions(Number(a_no), {
      type,
      from: dateFrom ? `${dateFrom}T00:00:00` : undefined,
      to: dateTo ? `${dateTo}T23:59:59` : undefined,
      page,
      size: pageSize
    })
      .then(res => {
        const p = res.data;

        const mapped = (p.content || []).map((r) => {
          const tp = String(r.th_transfer_type || '').toUpperCase(); // FX_IN / FX_OUT / 입금 / 출금 등
          const base = Number(r.th_amount ?? r.th_account_in ?? r.th_account_out ?? 0);
          const isIn = tp.endsWith('_IN') || tp === '입금' || tp === 'DEPOSIT' || tp === 'IN';
          const isOut = tp.endsWith('_OUT') || tp === '출금' || tp === 'WITHDRAWAL' || tp === 'OUT';
          const signed = isOut ? -Math.abs(base) : Math.abs(base);
          const displayType = isIn ? '입금' : isOut ? '출금' : (r.th_transfer_type || '-');

          // ★ 거래 통화(있으면 우선), 없으면 계좌 통화 사용
          const rowCurrency = String(r.th_currency ?? r.currency ?? account?.currency ?? 'KRW').toUpperCase();

          return {
            id: r.th_transfer_no,
            ts: parseTs(r.th_transfer_at),
            time: r.th_transfer_at ? new Date(r.th_transfer_at).toLocaleTimeString('ko-KR', { hour12: false }) : '',
            type: displayType,
            counterparty: r.th_other_bank || '-',
            memo: r.th_memo || '-',
            amount: signed,
            balance: Number(r.th_after_balance ?? 0),
            tsType: r.th_transaction_type,
            currency: rowCurrency,                  // ★ 행별 통화
          };
        });

        setRows(mapped);
        setTotalElements(p.totalElements ?? mapped.length);
        setTotalPages(p.totalPages ?? (p.totalElements ? p.totalPages : 1));
      })
      .catch(console.error);
  }, [a_no, kinds, dateFrom, dateTo, page, pageSize, memoQv, sortKey, account?.currency]);

  // Chip
  const Chip = ({ active, children, onClick }) => (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-xs border transition " +
        (active ? "bg-blue-50 text-blue-700 border-blue-300" : "hover:bg-gray-50")
      }
    >
      {children}
    </button>
  );

  // 화면 표시용 필터
  const displayFilter = React.useMemo(() => {
    const inDateRange = (ts) => {
      if (!ts) return true;
      const t = ts.getTime();
      if (dateFrom) {
        const f = new Date(`${dateFrom}T00:00:00`).getTime();
        if (t < f) return false;
      }
      if (dateTo) {
        const u = new Date(`${dateTo}T23:59:59.999`).getTime();
        if (t > u) return false;
      }
      return true;
    };
    const inKind = (typeText) => {
      if (kinds.size === 0) return true;
      return kinds.has(String(typeText ?? ''));
    };

    let outErr = rows.filter(r => String(r.tsType ?? '').toUpperCase() !== 'OUT');
    outErr = outErr.filter((r) => {
      if (!inDateRange(r.ts)) return false;
      if (!inKind(r.type)) return false;
      if (minAmt !== "" && Math.abs(r.amount) < Number(minAmt)) return false;
      if (maxAmt !== "" && Math.abs(r.amount) > Number(maxAmt)) return false;
      if (memoQuery.trim()) {
        const q = memoQuery.trim().toLowerCase();
        if (!(`${r.memo}${r.counterparty}`.toLowerCase().includes(q))) return false;
      }
      return true;
    });

    if (sortKey === "amount") {
      outErr = [...outErr].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else {
      outErr = [...outErr].sort((a, b) => b.ts - a.ts);
    }
    return outErr;
  }, [rows, dateFrom, dateTo, kinds, minAmt, maxAmt, memoQuery, sortKey]);

  // 필터 리셋/토글
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
  function toggleKind(k) {
    const next = new Set(kinds);
    next.has(k) ? next.delete(k) : next.add(k);
    setKinds(next);
    setPage(0);
  }
  function quickRange(days) {
    setDateFrom(toISODate(addDays(new Date(), -days + 1)));
    setDateTo(toISODate(new Date()));
    setPage(0);
  }

  // CSV/PDF 내보내기 
  function downloadCsv(list) {
    const header = ["일시", "구분", "상대", "메모", "금액(±)", "잔액"];
    const body = list.map((r) => [
      `${toISODate(r.ts)} ${r.time}`,
      r.type,
      r.counterparty,
      r.memo,
      formatCurrencyRaw(r.amount, r.currency || account.currency || 'KRW'),                              
      formatCurrencyRaw(r.balance, account.currency || 'KRW'),             
    ]);
    const csv = [header, ...body]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transfer_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // pdf 로 내보내가ㅣ
  async function downloadPdf(list) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    if (!fontCache.current.regular) {
      fontCache.current.regular = await loadFontBase64("/font/NotoSansKR.ttf");
    }
    doc.addFileToVFS("NotoSansKR.ttf", fontCache.current.regular);
    doc.addFont("NotoSansKR.ttf", "NotoSansKR", "normal");
    doc.setFont("NotoSansKR", "normal");

    doc.setFontSize(15);
    doc.text("이체 내역", 40, 40);
    doc.setFontSize(10);
    doc.text(`출력일 : ${new Date().toLocaleString('ko-KR')}`, 40, 58);

    const head = [["일시", "구분", "상대", "메모", "금액(±)", "잔액"]];
    const body = list.map((r) => [
      `${toISODate(r.ts)} ${r.time}`,
      r.type,
      r.counterparty,
      r.memo,
      formatCurrencyRaw(r.amount, r.currency || account.currency || 'KRW'),                              
      formatCurrencyRaw(r.balance, account.currency || 'KRW'),             
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 76,
      styles: { font: "NotoSansKR", fontSize: 9, cellPadding: 6, fontStyle: "normal" },
      headStyles: { font: "NotoSansKR", fontStyle: "normal", fillColor: [242, 242, 242], textColor: 20 },
      columnStyles: {
        4: { halign: "right", cellWidth: 120 },
        5: { halign: "right", cellWidth: 120 },
      },
      didDrawPage: (data) => {
        const pageCnt = doc.getNumberOfPages();
        const str = `Page ${data.pageNumber} / ${pageCnt}`;
        doc.setFontSize(9);
        doc.text(
          str,
          doc.internal.pageSize.getWidth() - 80,
          doc.internal.pageSize.getHeight() - 20
        );
      },
    });
    doc.save(`TransferHistory-${Date.now()}.pdf`);
  }

  if (!account) return <div className="p-6">로딩 중…</div>;
  const backBtn = () => { navigate(-1); };

  return (
    <div className="bg-gray-50">
      {/* 타이틀 */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-screen-xl px-6 py-6">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">내 계좌 상세</h1>
          <p className="text-sm text-gray-600 mt-1">선택한 계좌의 정보와 거래내역을 함께 확인하세요.</p>
        </div>
      </section>

      {/* 계정정보 / 필터 */}
      <section>
        <div className="mx-auto max-w-screen-xl px-6 py-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
              <div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="mx-auto">{account.bank}</div>
                  ·
                  <input
                    value={changeAlias}
                    onChange={(e) => setChangeAlias(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveAlias(); }}
                    maxLength={10}
                    placeholder="계좌 별칭"
                    className="rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    onClick={saveAlias}
                    disabled={saving || !changeAlias.trim() || changeAlias.trim() === (account.nickname || "")}
                    className={"rounded-lg px-3 py-2 text-sm text-white " + (saving ? "bg-gray-400" : "bg-blue-700 hover:bg-blue-800")}
                  >
                    {saving ? "저장중..." : "저장"}
                  </button>
                </div>
                <div className="text-lg font-semibold text-gray-900">{account.alias}</div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <div className="text-xs text-gray-900 py-1.5">
                    개설: {account.openAt ? toISODate(account.openAt) : '-'}
                  </div>
                  <div className="text-xs text-gray-900 py-1.5 pl-3">
                    이율: {account.rate ? account.rate : '-'}
                  </div>
                  <div className="text-xs text-gray-900 py-1.5 pl-3">
                    계좌유형: {account.type ? account.type : '-'}
                  </div>
                  <div className="text-xs text-gray-900 py-1.5 pl-3">
                    통화: {account.currency}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">현재 잔액</div>
                <div className="text-3xl font-bold">
                  {formatCurrencyRaw(account.balance, account.currency || 'KRW')}
                </div>
              </div>
            </div>
          </div>

          {/* 빠른날짜필터 */}
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="text-sm font-medium text-gray-800 mb-2">빠른 필터</div>
              <div className="flex flex-wrap gap-2">
                <Chip onClick={() => quickRange(1)}>오늘</Chip>
                <Chip onClick={() => quickRange(3)}>3일</Chip>
                <Chip onClick={() => quickRange(7)}>7일</Chip>
                <Chip onClick={() => quickRange(30)}>한달</Chip>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-100">이체</button>
                <button onClick={backBtn} className="rounded-full border px-3 py-1.5 text-xs hover:bg-gray-100">계좌목록</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 필터 및 내용 */}
      <section className="pb-10">
        <div className="mx-auto max-w-screen-xl px-6 grid grid-cols-12 gap-6">
          {/* 필터 */}
          <aside className="col-span-12 md:col-span-3">
            <div className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">검색 / 필터</h2>
                <button onClick={resetFilters} className="text-xs text-gray-500 hover:underline">초기화</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">시작일</label>
                  <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">종료일</label>
                  <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} className="w-full rounded-lg border px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-600 mb-1">거래 구분</div>
                <div className="flex flex-wrap gap-2">
                  {["입금", "출금"].map((k) => (
                    <Chip key={k} active={kinds.has(k)} onClick={() => toggleKind(k)}>{k}</Chip>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs text-gray-600 mb-1">금액 범위</div>
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
                <button onClick={() => { setPage(0); setMemoQv(v => v + 1); }}
                  className="w-full rounded-lg bg-blue-700 text-white py-2.5 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  조회
                </button>
              </div>
            </div>
          </aside>

          {/* 본문 */}
          <section className="col-span-12 md:col-span-9">
            <div className="rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
              {/* 상단 컨트롤 */}
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
                  <button onClick={() => downloadCsv(displayFilter)} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
                    CSV 다운로드
                  </button>
                  <button onClick={() => downloadPdf(displayFilter)} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
                    PDF 다운로드
                  </button>
                  <button onClick={() => { window.location.reload(); }} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">새로고침</button>
                </div>
              </div>

              {/* 테이블 */}
              <div className="mt-4 overflow-auto">
                <table className="min-w-[820px] w-full text-sm">
                  <thead className="text-gray-600">
                    <tr className="border-b bg-gray-50">
                      <th className="text-left font-medium px-3 py-2">일시</th>
                      <th className="text-left font-medium px-3 py-2">구분</th>
                      <th className="text-left font-medium px-3 py-2">상대</th>
                      <th className="text-right font-medium px-3 py-2">금액(±)</th>
                      <th className="text-right font-medium px-3 py-2">잔액</th>
                      <th className="text-left font-medium px-3 py-2">내용</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {displayFilter.length === 0 ? (
                      <tr><td colSpan={6} className="px-3 py-10 text-center text-gray-500">조건에 맞는 내역이 없습니다.</td></tr>
                    ) : displayFilter.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 whitespace-nowrap">{r.ts ? `${toISODate(r.ts)} ${r.time}` : '-'}</td>
                        <td className="px-3 py-3">{r.type}</td>
                        <td className="px-3 py-3">{r.counterparty}</td>
                        <td className={"px-3 py-3 text-right " + (r.amount < 0 ? "text-red-600" : "text-emerald-700")}>
                           {formatCurrencyRaw(r.amount, r.currency || account.currency || 'KRW')}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatCurrencyRaw(r.balance, account.currency || 'KRW')}
                        </td>
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
