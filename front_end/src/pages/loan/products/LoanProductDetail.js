import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { fetchLoanProductDetail } from "../../../api/accounts";
import {
  ScrollText,
  ShieldCheck,
  Wallet2,
  Building2,
  Percent,
  Gauge,
  Tags,
  ArrowLeft,
  Calculator as CalcIcon,
  Banknote,
} from "lucide-react";
import { saveFlow } from "../apply/ApplyStorage";

export default function LoanProductDetailPage() {
  const { code } = useParams();
  const location = useLocation();
  const stateProduct = location.state?.product || null;

  const navigate = useNavigate();
  const agreeRef = React.useRef(null);
  const scrollToChkbox = () => {
    agreeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      try {
        agreeRef.current?.focus?.();
        agreeRef.current?.classList?.add("ring-2", "ring-blue-500", "ring-offset-2");
        window.setTimeout(() => {
          agreeRef.current?.classList?.remove("ring-2", "ring-blue-500", "ring-offset-2");
        }, 1200);
      } catch (e) {}
    }, 350);
  };

  // ---------- 상태 ----------
  const [product, setProduct] = React.useState(stateProduct);
  const [loading, setLoading] = React.useState(!stateProduct);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (stateProduct) setProduct(stateProduct);
    setLoading(!stateProduct);

    fetchLoanProductDetail(code)
      .then((res) => {
        if (!res?.data) throw new Error("상품을 찾을 수 없습니다.");
        setProduct(res.data);
      })
      .catch((e) => setError(e.message || "조회 실패"))
      .finally(() => setLoading(false));
  }, [code, stateProduct]);

  // ---------- 파생값/헬퍼 ----------
  const won = (n) => Number(n || 0).toLocaleString("ko-KR");
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // 기존 상태/계산 로직은 그대로 유지 (우대 슬라이더 UI만 제거)
  const maxPreferential = 1.0; // %p (미표시)
  const preferentialGuide = ["급여/자동이체 이용 시 -0.30%p", "우량등급 우대 -0.40%p", "모바일 신규 -0.30%p"]; // (미표시)

  const isCredit = React.useMemo(() => {
    const t = (product?.type || "").toLowerCase();
    return t.includes("신용");
  }, [product]);
  const isSecured = !isCredit;

  const terms = React.useMemo(() => {
    if (!product) return [];
    const base = Number(product.rateMin ?? 0);
    const list =
      product.termMonths && product.termMonths.length > 0
        ? product.termMonths
        : isCredit
        ? [12, 24, 36]
        : [];
    return list.map((m) => ({ months: m, rate: base }));
  }, [product, isCredit]);

  // ---------- 계산기 상태 ----------
  const [amount, setAmount] = React.useState(50_000_000);
  const [term, setTerm] = React.useState(() => terms[0]?.months || 36);
  const [preferential, setPreferential] = React.useState(0); // 값은 그대로 두되 UI는 숨김
  const [agree, setAgree] = React.useState(false);

  React.useEffect(() => {
    if (terms.length > 0 && !terms.find((t) => t.months === term)) {
      setTerm(terms[0].months);
    }
  }, [terms, term]);

  const selectedTermRate = React.useMemo(() => {
    const t = terms.find((t) => t.months === term);
    return t ? t.rate : Number(product?.rateMin ?? 0);
  }, [terms, term, product]);

  const effectiveRate = React.useMemo(() => {
    const total = Math.max(0, selectedTermRate - preferential); // preferential=0 이므로 우대 미적용 상태
    return total;
  }, [selectedTermRate, preferential]);

  const monthlyPayment = React.useMemo(() => {
    const r = effectiveRate / 100 / 12;
    const n = term || 0;
    const P = amount || 0;
    if (n === 0) return 0;
    if (r === 0) return Math.ceil(P / n);
    const M = P * (r / (1 - Math.pow(1 + r, -n)));
    return Math.ceil(M);
  }, [amount, effectiveRate, term]);

  const totalPayment = monthlyPayment * (term || 0);
  const totalInterest = totalPayment - (amount || 0);

  const fmt = (n) => Number(n || 0).toLocaleString("ko-KR");

  const schedule = React.useMemo(() => {
    const rows = [];
    if (!amount || !term) return rows;
    let remaining = amount;
    const r = effectiveRate / 100 / 12;
    for (let i = 1; i <= Math.min(term, 6); i++) {
      const interest = r === 0 ? 0 : Math.floor(remaining * r);
      const principal = Math.min(monthlyPayment - interest, remaining);
      const remainAfter = Math.max(0, remaining - principal);
      rows.push({ no: i, interest, principal, remain: remainAfter });
      remaining = remainAfter;
    }
    return rows;
  }, [amount, term, effectiveRate, monthlyPayment]);

  const displaySummary = React.useMemo(() => {
    const s = (product?.summary || "").trim();
    const d = (product?.description || "").trim();
    if (s) return s;
    if (d) return d;
    const t = (product?.type || "").toLowerCase();
    if (t.includes("신용")) return "직장인을 위한 신용대출";
    if (t.includes("전세")) return "내집마련을 위한 전세자금대출";
    if (t.includes("담보") || t.includes("주택")) return "밑거름 삼아 발돋움하는 주택담보대출";
    return "-";
  }, [product]);

  const SpecTable = () => {
    const isCredit = (product?.type || "").includes("신용");
    const opts = product?.options || [];
    const rpayList = Array.from(new Set(opts.map((o) => o.rpayTypeNm).filter(Boolean)));

    const termText = product?.termMonths?.length
      ? `${Math.min(...product.termMonths)} ~ ${Math.max(...product.termMonths)}개월`
      : isCredit
      ? "12 ~ 36개월(표시값)"
      : "-";

    const collateralText = isCredit
      ? "담보/보증 없음"
      : `담보/보증 필요${product?.ltvMax != null ? ` (최대 LTV ${product.ltvMax}%)` : ""}`;

    const rows = [
      ["상품특징", displaySummary],
      ["대출대상", "당사 심사기준 충족 고객"],
      ["대출기간", termText],
      ["대출한도", product?.limitMax ? `최대 ₩ ${won(product.limitMax)}` : "-"],
      ["상환방법", rpayList.length ? rpayList.join(", ") : "-"],
      ["원리금/이자 상환", rpayList.length ? `${rpayList.join(", ")} 방식에 따라 월별 상환` : "-"],
      [
        "연체이자",
        product?.dlyRate ||
          "이자/분할상환금을 기일 내 상환하지 않으면 다음날부터 지연배상금이 부과됩니다. 최대 15% 한도.",
      ],
      ["담보/보증", collateralText],
      ["필요서류", "재직/소득 증빙 서류"],
      ["중도상환해약금", product?.erlyRpayFee || "-"],
      [
        "유의사항",
        product?.etcNote ||
          "대출조건은 신용평가 및 내부정책에 따라 변동될 수 있습니다. 가입 전 상품설명서 및 약관을 확인하세요.",
      ],
    ];

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[160px]" />
            <col />
          </colgroup>
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={i} className="border-t border-gray-100">
              <th className="py-3 px-4 text-gray-600 font-medium text-left align-top bg-gray-50">{label}</th>
              <td className="py-3 px-4 align-top">
                <div className="pl-6 border-l border-gray-200 whitespace-pre-line break-words">{value || "-"}</div>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    );
  };

  // ---------- 서브 컴포넌트 ----------
  const Pill = ({ children }) => (
    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-100">
      {children}
    </span>
  );

  const RateTable = () => {
    const opts = product?.options || [];

    if (isCredit) {
      return (
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/60">
              <tr className="text-left text-gray-500">
                <th className="py-3 px-4">유형</th>
                <th className="py-3 px-4">평균금리</th>
                <th className="py-3 px-4">범위(최저~최고)</th>
                <th className="py-3 px-4">공시월</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {opts.map((o, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="py-3 px-4">{o.lendRateTypeNm || "대출금리"}</td>
                  <td className="py-3 px-4">{(o.lendRateAvg ?? 0).toFixed(2)}%</td>
                  <td className="py-3 px-4">
                    {(o.lendRateMin ?? product.rateMin ?? 0).toFixed(2)}% ~ {(o.lendRateMax ?? product.rateMax ?? 0).toFixed(2)}%
                  </td>
                  <td className="py-3 px-4">{o.dclsMonth || product.dclsMonth || "-"}</td>
                </tr>
              ))}
              {opts.length === 0 && (
                <tr className="border-t border-gray-100">
                  <td className="py-3 px-4 text-gray-500" colSpan={4}>
                    금리 옵션 정보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="py-3 px-4">금리유형</th>
              <th className="py-3 px-4">상환방식</th>
              <th className="py-3 px-4">기간(개월)</th>
              <th className="py-3 px-4">최저~최고</th>
              <th className="py-3 px-4">평균</th>
            </tr>
          </thead>
          <tbody>
            {opts.map((o, idx) => (
              <tr key={idx} className="border border-gray-100">
                <td className="py-3 px-4">{o.lendRateTypeNm || "-"}</td>
                <td className="py-3 px-4">{o.rpayTypeNm || "-"}</td>
                <td className="py-3 px-4">{o.termMonth ?? "-"}</td>
                <td className="py-3 px-4">
                  {(o.lendRateMin ?? product.rateMin ?? 0).toFixed(2)}% ~ {(o.lendRateMax ?? product.rateMax ?? 0).toFixed(2)}%
                </td>
                <td className="py-3 px-4">{(o.lendRateAvg ?? 0).toFixed(2)}%</td>
              </tr>
            ))}
            {opts.length === 0 && (
              <tr className="border-t border-gray-100">
                <td className="py-3 px-4 text-gray-500" colSpan={5}>
                  금리 옵션 정보가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // 🔁 기존 파일 안에서 Calculator 컴포넌트만 이 코드로 교체
const Calculator = () => {
  const [schedOpen, setSchedOpen] = React.useState(false);

  // 전체 스케줄(모달용) - 기존 계산은 그대로 두고, 여기서만 풀로 계산
  const fullSchedule = React.useMemo(() => {
    const out = [];
    if (!amount || !term) return out;
    let remaining = amount;
    const r = effectiveRate / 100 / 12;
    for (let i = 1; i <= term; i++) {
      const interest = r === 0 ? 0 : Math.floor(remaining * r);
      const principal = Math.min(monthlyPayment - interest, remaining);
      const remainAfter = Math.max(0, remaining - principal);
      out.push({ no: i, interest, principal, remain: remainAfter });
      remaining = remainAfter;
    }
    return out;
  }, [amount, term, effectiveRate, monthlyPayment]);

  return (
    <div className="rounded-2xl border border-gray-100 p-4 lg:p-6 bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-indigo-50 rounded-xl px-3 py-2">
          <CalcIcon className="h-5 w-5 text-indigo-700" />
          <h3 className="font-semibold text-indigo-800">대출 상환 계산기 (원리금균등)</h3>
        </div>
        <button
          type="button"
          onClick={() => setSchedOpen(true)}
          className="hidden md:inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"
        >
          전체 스케줄 보기
        </button>
      </div>

      {/* 좌 입력 / 우 결과 2컬럼 */}
      <div className="grid lg:grid-cols-2 gap-6 mt-4">
        {/* 입력 */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-gray-600">대출금액 (원)</span>
            <input
              type="number"
              value={amount}
              min={1_000_000}
              max={product?.limitMax || 1_000_000_000}
              onChange={(e) =>
                setAmount(
                  clamp(parseInt(e.target.value || "0", 10), 1_000_000, product?.limitMax || 1_000_000_000)
                )
              }
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
              onChange={(e) => setTerm(parseInt(e.target.value, 10))}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {terms.map((t) => (
                <option key={t.months} value={t.months}>
                  {t.months}개월 (기본 {t.rate.toFixed(2)}%)
                </option>
              ))}
            </select>
          </label>

          {isCredit && (
            <p className="text-xs text-gray-500">
              신용대출은 신용등급/소득/부채 등에 따라 금리가 결정됩니다.
            </p>
          )}

          <label className="flex items-start gap-2 mt-2">
            <input
              ref={agreeRef}
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-gray-600">
              예시 계산 결과가 실제와 다를 수 있음을 이해했습니다.
            </span>
          </label>
        </div>

        {/* 결과 카드 2×2 */}
        <div className="grid sm:grid-cols-2 gap-3 content-start">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">적용금리(연)</div>
            <div className="text-xl font-semibold mt-1">{effectiveRate.toFixed(2)}%</div>
            <div className="mt-1 text-[11px] text-gray-500">※ 우대금리 미적용 기준</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">월 상환액(예상)</div>
            <div className="text-xl font-semibold mt-1 whitespace">{fmt(monthlyPayment)} 원</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">총 상환액(예상)</div>
            <div className="text-lg font-semibold mt-1 whitespace">{fmt(totalPayment)} 원</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-xs text-gray-500">총 이자(예상)</div>
            <div className="text-lg font-semibold mt-1 whitespace-nowrap">{fmt(totalInterest)} 원</div>
          </div>
        </div>
      </div>

      {/* 전체 스케줄 모달 */}
      {schedOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSchedOpen(false)} />
          <div className="absolute inset-x-0 top-10 mx-auto w-[min(900px,92%)] rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">전체 상환스케줄 (총 {term}회)</h3>
              <button
                onClick={() => setSchedOpen(false)}
                className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto">
              <table className="min-w-[680px] w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">회차</th>
                    <th className="text-right font-medium px-3 py-2">이자</th>
                    <th className="text-right font-medium px-3 py-2">원금</th>
                    <th className="text-right font-medium px-3 py-2">잔액</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fullSchedule.map((r) => (
                    <tr key={r.no} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{r.no}</td>
                      <td className="px-3 py-2 text-right">{fmt(r.interest)} 원</td>
                      <td className="px-3 py-2 text-right">{fmt(r.principal)} 원</td>
                      <td className="px-3 py-2 text-right">{fmt(r.remain)} 원</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 행동영역 */}
      
    </div>
  );
};


  // ---------- 로딩/에러/스켈레톤 ----------
  if (loading) return <div className="p-8">로딩중…</div>;
  if (error) return <div className="p-8 text-red-600">에러: {error}</div>;
  if (!product) return <div className="p-8">상품 정보를 찾을 수 없습니다.</div>;

  // ---------- 본문 ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-gray-900">
      {/* 상단 바 */}
      <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/loan/products" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:underline">
            <ArrowLeft className="h-4 w-4" /> 대출 목록
          </a>
          <div className="text-xs text-gray-500">상품코드 [{product.id}]</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-16 bg-white mt-2 rounded-xl shadow-sm">
        {/* Hero */}
        <section className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 text-emerald-700 px-2.5 py-1 text-xs">
                <ShieldCheck className="h-3.5 w-3.5" /> 이음은행 보증
              </span>
              {product.badges?.map((b, i) => (
                <Pill key={i}>{b}</Pill>
              ))}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              {product.name}
            </h1>
            <p className="text-gray-600 max-w-2xl">{product.desc}</p>

            {/* 핵심 지표 3-Up 카드 */}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Percent className="h-4 w-4 text-gray-400" /> 금리(최저~최고)
                </div>
                <div className="text-lg font-semibold mt-1">
                  {(product.rateMin ?? 0).toFixed(2)}% ~ {(product.rateMax ?? 0).toFixed(2)}%
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Wallet2 className="h-4 w-4 text-gray-400" /> 최대한도
                </div>
                <div className="text-lg font-semibold mt-1">
                  {product?.limitMax ? <>₩ {won(product.limitMax)}</> : "-"}
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Tags className="h-4 w-4 text-gray-400" /> 유형/LTV
                </div>
                <div className="text-lg font-semibold mt-1">
                  {product.type}
                  {isSecured && product?.ltvMax != null ? ` · LTV ${product.ltvMax}%` : ""}
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {product.tags?.map((t, i) => (
                <span key={i} className="px-2 py-1 rounded-full border text-xs text-gray-700">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* 요약 카드 */}
          <aside className="w-full lg:w-[380px] rounded-2xl border border-gray-100 p-5 bg-white shadow-sm">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              요약
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">상품ID</span>
                <span className="font-medium">{product.id}</span>
              </div>
              {product?.limitMax && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">대출한도</span>
                  <span className="font-medium">최대 ₩ {won(product.limitMax)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">최저금리</span>
                <span className="font-medium">{(product.rateMin ?? 0).toFixed(2)}%</span>
              </div>
              {!!terms.length && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">최장기간</span>
                  <span className="font-medium">{Math.max(...terms.map((t) => t.months))}개월</span>
                </div>
              )}
              {isSecured && product?.ltvMax != null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">최대 LTV</span>
                  <span className="font-medium">{product.ltvMax}%</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
            </div>
          </aside>
        </section>

        {/* 신청 전 유의사항 & 동의 */}
        <label className="flex items-start gap-2 mt-4">
          <input
            ref={agreeRef}
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-gray-800">
            위 유의사항을 확인했으며 이에 동의합니다.
          </span>
        </label>

        {/* 액션 버튼 */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-white"
          >
            목록으로
          </button>

          <button
            type="button"
            disabled={!agree}
            onClick={() => {
              if (product) {
                saveFlow(product.id, { step: 1, slug: "agree", product });
              }
              navigate(`/loan/apply/${product.id}/agree`);
            }}
            className={`px-4 py-2 rounded-xl text-white transition ${
              agree ? "bg-blue-700 hover:bg-blue-800" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            신청하기
          </button>
        </div>

        {/* 상품설명 */}
        {(product.joinWay || product.erlyRpayFee || product.dlyRate || product.etcNote) && (
          <section className="mt-10">
            <h3 className="font-semibold mb-3 text-xl flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-gray-600" />
              상품설명
            </h3>
            <SpecTable />
          </section>
        )}
      </main>
    </div>
  );
}
