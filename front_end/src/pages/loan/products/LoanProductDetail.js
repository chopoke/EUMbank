import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { fetchLoanProductDetail } from "../../../api/accounts";
import {ScrollText,ShieldCheck, Wallet2,Building2,Percent,Tags,ArrowLeft,} from "lucide-react";   // 아이콘들
import { loadFlow, saveFlow } from "../apply/ApplyStorage";
import {InlineCalculator as Calculator} from "../apply/components/Calculator"

export default function LoanProductDetailPage() {
  // URL 파라미터의 상품 코드
  const { code } = useParams();

  // 이전 페이지에서 state로 전달된 product가 있으면 초깃값으로 사용
  const location = useLocation();
  const stateProduct = location.state?.product || null;

  const navigate = useNavigate();

  // ---------- 상태 ----------
  const [product, setProduct] = React.useState(stateProduct); // 상품 상세
  const [loading, setLoading] = React.useState(!stateProduct); // 초기 로딩 여부
  const [error, setError] = React.useState(null);              // 에러 메시지
  const [carType, setCarType] = React.useState("NEW");        // 자동차 대출의 경우 (신차/중고차)

  // 마운트/코드 변경 시 상품 상세 조회
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

  // ---------- 파생값/헬퍼
  const won = (n) => Number(n || 0).toLocaleString("ko-KR");

  // 신용/담보 여부 판별
  const isCredit = React.useMemo(() => {
    const t = (product?.type || "").toLowerCase();
    return t.includes("신용");
  }, [product]);
  const isSecured = !isCredit;

  // 자동차 대출인지 판별
  const isAuto = React.useMemo(() => {
    const t = String(product?.type || "");
    return t.includes("자동차") || t.toUpperCase().includes("AUTO");
  }, [product]);

  // 전세자금대출인지
  const isJeonse = React.useMemo(()=>{
    const j = String(product?.type  || "");
    return j.includes("전세자금");
  }, [product]);

  // 기간/기본금리 리스트
  const terms = React.useMemo(() => {
    if (!product) return [];
    const base = Number(product.rateMin ?? 0);
    const list =
      product.termMonths && product.termMonths.length > 0
        ? product.termMonths
        : isCredit
        ? [12, 24, 36] // 신용대출은 표기용 기본 구간
        : [];
    return list.map((m) => ({ months: m, rate: base }));
  }, [product, isCredit]);

  // ---------- 계산기 상태 ----------
  const amount = 50_000_000; 
  const [term, setTerm] = React.useState(() => terms[0]?.months || 36); // 선택 기간
  const preferential = 0;          // 우대금리 미적용

  // terms 변경 시 현재 term이 목록에 없으면 첫 항목으로 보정
  React.useEffect(() => {
    if (terms.length > 0 && !terms.find((t) => t.months === term)) {
      setTerm(terms[0].months);
    }
  }, [terms, term]);

  // 선택 기간의 기본금리
  const selectedTermRate = React.useMemo(() => {
    const t = terms.find((t) => t.months === term);
    return t ? t.rate : Number(product?.rateMin ?? 0);
  }, [terms, term, product]);

  // 실제 적용(예시) 금리 = 기본금리 - 우대금리(현재 0)
  const effectiveRate = React.useMemo(() => {
    const total = Math.max(0, selectedTermRate - preferential);
    return total;
  }, [selectedTermRate, preferential]);

  // 월 상환액(원리금균등)
  const monthlyPayment = React.useMemo(() => {
    const r = effectiveRate / 100 / 12;
    const n = term || 0;
    const P = amount || 0;
    if (n === 0) return 0;
    if (r === 0) return Math.ceil(P / n);
    const M = P * (r / (1 - Math.pow(1 + r, -n)));
    return Math.ceil(M);
  }, [amount, effectiveRate, term]);

  // const totalPayment = monthlyPayment * (term || 0);    // 총상환액

  // (상단 요약의 상품설명에 표시할 문구를 유추)
  const displaySummary = React.useMemo(() => {
    const s = (product?.summary || "").trim();
    const d = (product?.description || "").trim();
    if (s) return s;
    if (d) return d;
    const t = (product?.type || "").toLowerCase();
    if (t.includes("전세")) return "내집마련을 위한 전세자금대출";
    if (t.includes("담보") || t.includes("주택")) return "밑거름 삼아 발돋움하는 주택담보대출";
    if (t.includes("자동차")) return "드림카 마련을 위한 자동차 담보 대출"; 
    return "-";
  }, [product]);

  // 상품 상세 스펙 테이블
  const SpecTable = () => {
    const isAutoLocal =
      (product?.type || "").includes("자동차") ||
      (product?.type || "").toUpperCase().includes("AUTO");
    const opts = product?.options || [];
    const rpayList = Array.from(new Set(opts.map((o) => o.rpayTypeNm).filter(Boolean)));

    const termText = product?.termMonths?.length
      ? `${Math.min(...product.termMonths)} ~ ${Math.max(...product.termMonths)}개월`
      : "-";

    const collateralText = isCredit
      ? "담보/보증 없음"
      : `담보/보증 필요${(!isAutoLocal && product?.ltvMax != null) ? ` (최대 LTV ${product.ltvMax}%)` : ""}`;

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

  // 작은 배지용
  const Pill = ({ children }) => (
    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-100">
      {children}
    </span>
  );

  // ---------- 로딩/에러/스켈레톤 ----------
  if (loading) return <div className="p-8">로딩중…</div>;
  if (error) return <div className="p-8 text-red-600">에러: {error}</div>;
  if (!product) return <div className="p-8">상품 정보를 찾을 수 없습니다.</div>;

  // ---------- 본문 = =============================
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
            {/* 상단 배지/타이틀 */}
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

            {/* 핵심 지표 카드 */}
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
                  {product?.limitMax ? <>{won(product.limitMax)} 원</> : "-"}
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Tags className="h-4 w-4 text-gray-400" /> 유형/LTV
                </div>
                <div className="text-lg font-semibold mt-1">
                  {product.type}
                  {!isAuto && isSecured && product?.ltvMax != null ? ` · LTV ${product.ltvMax}%` : ""}
                </div>
              </div>
            </div>

            {/* 태그들 */}
            <div className="mt-2 flex flex-wrap gap-2">
              {product.tags?.map((t, i) => (
                <span key={i} className="px-2 py-1 rounded-full border text-xs text-gray-700">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* 우측 요약 카드 */}
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
              {!isAuto && isJeonse && product?.ltvMax != null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">최대 LTV</span>
                  <span className="font-medium">{product.ltvMax}%</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">{/* 우측 CTA 붙일 자리 */}</div>
          </aside>
        </section>


        {/* 액션 버튼 */}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-white"
          >
            목록으로
          </button>

          {/* 항상 활성화된 신청하기 버튼 */}
          <button
            type="button"
            onClick={() => {
              if (product) {
                // 플로우 저장: Step1(agree)부터 시작하도록
                const prev = loadFlow(product.id) || {};
                const next = {
                  ...prev,
                  step: 1,
                  slug:"agree",
                  form: {
                    ...(prev.form || {}),
                    carType: isAuto? carType: undefined,    // 자동차 대출이면 신차인지 아닌지 저장, 아니면 지움
                  },
                };
                saveFlow(product.id, next);
              }
              // 약관 동의 페이지로 이동 (약관에서 batchKey 생성/동의 저장 -> 제출 페이지로 진행)
              navigate(`/loan/apply/${product.id}/agree`);
            }}
            className="px-4 py-2 rounded-xl text-white transition bg-blue-700 hover:bg-blue-800"
          >
            신청하기
          </button>
        </div>

        <Calculator product={product} isAuto={isAuto} carType={carType} onCarTypeChange={setCarType}/>

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
