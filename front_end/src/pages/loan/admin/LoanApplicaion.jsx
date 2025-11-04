import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { adminListApplications } from "../../../api/accounts";

function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

export default function LoanAdminListPage() {
  const [sp, setSp] = useSearchParams();

  // query state
  const [keyword, setKeyword] = React.useState(sp.get("q") || "");
  const [status, setStatus] = React.useState(sp.get("status") || "");
  const [page, setPage] = React.useState(Number(sp.get("page") || 0));
  const [size, setSize] = React.useState(Number(sp.get("size") || 20));
  const [sort, setSort] = React.useState(sp.get("sort") || "recent");

  const [data, setData] = React.useState({ content: [], totalElements: 0, totalPages: 0, number: 0 });
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminListApplications({ keyword, status, page, size, sort });
      const d = res?.data ?? res;
      setData(d);
      setErr(null);
      setSp((prev) => {
        const next = new URLSearchParams(prev);
        next.set("q", keyword);
        if (status) next.set("status", status); else next.delete("status");
        next.set("page", String(page));
        next.set("size", String(size));
        next.set("sort", sort);
        return next;
      }, { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }, [keyword, status, page, size, sort, setSp]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">대출 신청 관리</h1>
          <div className="text-sm text-gray-500">총 {data.totalElements?.toLocaleString()}건</div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 grid md:grid-cols-6 gap-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="신청ID/계좌번호 검색"
            className="md:col-span-2 rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-indigo-200/70"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2"
          >
            <option value="">전체 상태</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="FUNDED">FUNDED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <select value={sort} onChange={(e)=>setSort(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2">
            <option value="recent">최신순</option>
            <option value="amountDesc">금액 높은순</option>
            <option value="amountAsc">금액 낮은순</option>
          </select>
          <select value={size} onChange={(e)=>{setSize(Number(e.target.value)); setPage(0);}} className="rounded-xl border border-gray-200 px-3 py-2">
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
          </select>
          <button onClick={()=>{setPage(0); load();}} className="rounded-xl bg-gray-900 text-white px-4 py-2">검색</button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">신청ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">상품명</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">신청금액</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">기간</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">상태</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">제출일</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-gray-500">불러오는 중…</td></tr>
              )}
              {err && !loading && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-red-600">{err}</td></tr>
              )}
              {!loading && !err && data.content?.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-gray-500">데이터 없음</td></tr>
              )}
              {data.content?.map((row) => (
                <tr key={row.laId} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{row.laId}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{row.loanName || row.productName || "-"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">₩ {Number(row.applyAmount||0).toLocaleString("ko-KR")}</td>
                  <td className="px-4 py-3 text-center">{row.desiredTerm}개월</td>
                  <td className="px-4 py-3 text-center">
                    {row.applyStatus === "SUBMITTED" && <Badge className="bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200">SUBMITTED</Badge>}
                    {row.applyStatus === "UNDER_REVIEW" && <Badge className="bg-blue-50 text-blue-700 ring-1 ring-blue-200">UNDER_REVIEW</Badge>}
                    {row.applyStatus === "APPROVED" && <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">APPROVED</Badge>}
                    {row.applyStatus === "FUNDED" && <Badge className="bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">FUNDED</Badge>}
                    {row.applyStatus === "REJECTED" && <Badge className="bg-rose-50 text-rose-700 ring-1 ring-rose-200">REJECTED</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-gray-500">{row.submitDate?.replace("T"," ")}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/loan/applications/${encodeURIComponent(row.laId)}`} className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-black">
                      상세<i className="ri-arrow-right-s-line"/>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2">
          <button
            className="px-3 py-1 rounded-lg border bg-white"
            onClick={()=> setPage((p)=> Math.max(0, p-1))}
            disabled={page <= 0}
          >이전</button>
          <div className="text-sm text-gray-600">{page+1} / {Math.max(1, data.totalPages||1)}</div>
          <button
            className="px-3 py-1 rounded-lg border bg-white"
            onClick={()=> setPage((p)=> Math.min((data.totalPages||1)-1, p+1))}
            disabled={page >= (data.totalPages||1)-1}
          >다음</button>
        </div>
      </div>
    </div>
  );
}




// ============================================================
// Router wiring (예: App.js 또는 routes.js 일부에 추가)
// ============================================================
// import LoanAdminListPage from "./pages/admin/loan/LoanAdminListPage";
// import LoanAdminDetailPage from "./pages/admin/loan/LoanAdminDetailPage";
//
// <Route path="/admin/loan/applications" element={<LoanAdminListPage/>} />
// <Route path="/admin/loan/applications/:laId" element={<LoanAdminDetailPage/>} />
//
// ※ 관리자 권한 가드가 있다면 해당 라우트에 AdminGuard(HOC)로 감싸 주세요.
