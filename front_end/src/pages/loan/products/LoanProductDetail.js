import React from "react";
import { useParams, useLocation, useNavigate} from "react-router-dom";
import { fetchLoanProductDetail } from "../../../api/accounts";
import {  ScrollText } from "lucide-react";
import { saveFlow } from "../apply/ApplyStorage";

export default function LoanProductDetailPage() {
  const { code } = useParams();
  const location = useLocation();
  const stateProduct = location.state?.product || null;

  const navigate = useNavigate();
  const agreeRef = React.useRef(null);    // 포커스를 위한 Ref  선언~
  // 체크박스로 스무스한 이동구현
  const scrollToChkbox = () => {
  // 계산기 섹션/체크박스로 스무스 스크롤
  agreeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  // 스크롤 후 포커스
  window.setTimeout(() => {
    try {
      agreeRef.current?.focus?.();
      agreeRef.current?.classList?.add("ring-2","ring-blue-500","ring-offset-2");
      window.setTimeout(() => {
        agreeRef.current?.classList?.remove("ring-2","ring-blue-500","ring-offset-2");
      }, 1200);
    } catch (e) {}
  }, 350);
};
  

  // ---------- 상태 ----------
  const [product, setProduct] = React.useState(stateProduct);
  const [loading, setLoading] = React.useState(!stateProduct);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // state로 넘어온 값이 있다면 즉시 표기
    if (stateProduct){
      setProduct(stateProduct);
    }
    setLoading(!stateProduct);    // 백엔드 항상 동기화

    fetchLoanProductDetail(code)
      .then(res => {
        console.log("[DETAIL PAYLOAD]", res.data); // 데이터 확인용
        if(!res?.data)throw new Error ("상품을 찾을 수 없습니다.");
        setProduct(res.data);    // 단일객체 그대로 전달
      })
      .catch(e => setError(e.message || "조회 실패"))
      .finally(() => setLoading(false));
  }, [code, stateProduct]);

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

  // 신용대출여부
  const isCredit = React.useMemo(() => {
    const t = (product?.type || "").toLowerCase();
    return t.includes("신용");
  }, [product]);

  const isSecured = !isCredit;

  // 기본금리는 rateMin을 기준으로 표기  (실제는 옵션별 금리 필요)
  const terms = React.useMemo(() => {
  if (!product) return [];
  const base = Number(product.rateMin ?? 0);
  const list = (product.termMonths && product.termMonths.length > 0)
    ? product.termMonths
    : (isCredit ? [12, 24, 36] : []); // 신용 기본 기간
  return list.map(m => ({ months: m, rate: base }));
}, [product, isCredit]);

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

  // 월 납입금액 계산
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
  
  // 표시용 요약/설명 (우선순위 적용)
  const displaySummary = React.useMemo(() => {
    const s = (product?.summary || "").trim();
    const d = (product?.description || "").trim();
    if (s) return s;
    if (d) return d;
    const t = (product?.type || "").toLowerCase();
    if (t.includes("신용"))   return "직장인을 위한 신용대출";
    if (t.includes("전세"))   return "내집마련을 위한 전세자금대출";
    if (t.includes("담보") || t.includes("주택")) return "밑거름 삼아 발돋움하는 주택담보대출";
    return "-";
  }, [product]);

  const SpecTable = () => {
    const isCredit = (product?.type || "").includes("신용");
    const opts = product?.options || [];
    const rpayList = Array.from(new Set(
      opts.map(o => o.rpayTypeNm).filter(Boolean)
    ));

    const termText = product?.termMonths?.length
      ? `${Math.min(...product.termMonths)} ~ ${Math.max(...product.termMonths)}개월`
      : (isCredit ? "12 ~ 36개월(표시값)" : "-");

    const collateralText = isCredit
      ? "담보/보증 없음"
      : `담보/보증 필요${product?.ltvMax != null ? ` (최대 LTV ${product.ltvMax}%)` : ""}`;

    const rows = [
      ["상품특징", displaySummary],
      ["대출대상", "당사 심사기준 충족 고객"],
      ["대출기간", termText],
      ["대출한도", product?.limitMax ? `최대 ₩ ${won(product.limitMax)}` : "-"],
      ["상환방법", rpayList.length ? rpayList.join(", ") : "-"],
      [
        "원금 또는 이자상환 안내",
        rpayList.length ? `${rpayList.join(", ")} 방식에 따라 월별 상환` : "-"
      ],
      ["원금 또는 이자상환의 제한사항", "대출 약정 방식에 따라 원금 및 이자의 상환시기와 방법이 상이할 수 있습니다."],
      ["연체이자 안내", product?.dlyRate || "이자, 분할상환금, 분할상환원리금을 기일 내에 상환하지 않은 경우 상환하여야 할 금액에 대하여 그 다음날부터 지연 배상금이 부과됩니다. \n대출기간 만료일에 채무를 이행하지 않거나, 은행여신거래기본약관에 의하여 기한의 이익을 상실했을 때는 그 다음날부터 대출금 잔액에 대한 지연배상금이 부과됩니다.\n지연배상금률은 연체기간에 관계 없이\n연체일수 x (채무자 대출금리 + 3%) ÷ 356\n단, 지연배상률이 15%를 초과하는 경우에는 15%로 적용됩니다."],
      ["담보 및 보증여부", collateralText],
      ["필요서류", "소득을 증명할 수 있는 서류\n 재직확인서류 | 소득확인서류"],
      ["고객부담비용(수수료/인지세)", "인지세 : 인지세법에 의해 대출 약정 체결 시 납부하는 세금으로 대출금액에 따라 차등 적용되며, 각 50%씩 고객님과 이음은행이 부담합니다.)\n-5천만원이하 : 비과세 / 5천만원초과 1억원 이하 : 7만원 / 1억원 초과 10억원 이하 : 15만원 / 10억원 초과 : 35만원\n※ 대출계약 철회권을 행사하는 경우 은행이 부담한 근저당권설정비용과 인지세 등 제세공과금, 보증료 또는 보험료는 은행여신거래기본약관 제4조의2에 의거하여 고객님이 반환하여야 합니다."],
      ["이자납입", "(대출 신규 시 원하는 날짜로 이체 일자를 지정하여 매월 후취납입합니다) \n 단, 신규일자가 아닌 날로 지정할 경우, 돌아오는 해당일에 바로 납입하게 됩니다. (신규일자 9/10, 이체일자 20일시 돌아오는 20일에 바로 납부) \n(대출이자는 매월 이자 납입일(휴일이면 다음 영업일)에 자동이체 계좌에서 자동 출금됩니다. \n지급 금액이 부족할 경우 연체이자가 부과될 수 있으므로 유의바랍니다."],
      ["중도상환해약금", product?.erlyRpayFee || "-"], // = 중도상환수수료
      ["거절사유", "- 금융기관 연체대출금 보유자, 신용도판단정보등록 고객 등 해당사유에 해당하는 경우 은행 내부심사 기준에 의하여 대출신청이 불가능합니다.\n- 금융사기 등 신고 등록 계좌 보유 고객이나 대출한도 연결계좌에 입금 또는 지급정지 등록 등 거래제한 사유에 해당하는 경우에는 신청이 불가능합니다."],
      ["유의사항", product?.etcNote || "대출관련 상담업무는 챗봇을 통해 가능합니다.\n신용결과 등에 따라 대출이 일부 제한될 수 있으며 대출한도는 신청인의 부채, 소득, 신용도에 따라 달라질 수 있습니다.\n정부 정책, 금융시장, 환경변화 및 고객의 신용평가 결과 등에 따라 대출 자격, 대출한도, 대출금리 등 대출 조건이 변경될 수 있습니다.\n금융소비자는 금소법 제19조제1항에 따른 설명을 받을수 있는 권리가 있습니다.\n금융상품을 가입하시기 전에 상품설명서 및 약관을 반드시 읽어보시기 바랍니다.\n상환능력에 비해 대출금액이 과도할 경우 개인신용평점이 하락할 수 있으며, 개인신용평점 하락으로 금융거래와 관련된 불이익이 발생할 수 있습니다.\n일정 기간 납부해야 할 원리금이 연체될 경우 대출 기한이 도래하기 전에 모든 원리금을 변제해야 할 의무가 발생할 수 있습니다."],
      ["계약해지안내", "[대출계약 철회권]\n계약 서류 수령일, 계약 체결일, 대출금 수령일 중 나중에 발생한 날부터 14일까지 철회의사를 표시하고 원금, 이자 및 부대비용을 전액 반환한 경우 대출 계약을 철회할 수 있습니다. "],
    ];

    return (
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <table className="w-full text-sm table-fixed">
          {/* 좌측 라벨 고정폭, 우측 가변폭 */}
          <colgroup>
            <col className="w-[180px]" />
            <col />
          </colgroup>
          <tbody>
            {rows.map(([label, value], i) => (
              <tr key={i} className="border-t border-gray-100">
                <th className="py-3 px-4 text-gray-600 font-semibold text-left align-top bg-blue-50">
                  {label}
                </th>
                {/* 우측 셀: 선을 기준으로 바짝 붙도록 패딩 + 보더 */}
                <td className="py-3 px-4 align-top">
                  <div className="pl-6 border-l border-gray-200 whitespace-pre-line break-words">
                    {value || "-"}
                  </div>
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
      // 신용: (A/B/C) 유형별 평균/범위
      return (
        <div className="overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-sm [border-spacing:0]" >
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
                <tr key={idx} className="border-t border-gray-100 ">
                  <td className="py-3 px-4">{o.lendRateTypeNm || "대출금리"}</td>
                  <td className="py-3 px-4">{(o.lendRateAvg ?? 0).toFixed(2)}%</td>
                  <td className="py-3 px-4">
                    {(o.lendRateMin ?? product.rateMin ?? 0).toFixed(2)}% ~{" "}
                    {(o.lendRateMax ?? product.rateMax ?? 0).toFixed(2)}%
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

    // 주담대+전세자금 -> 금리유형+상환방식+기간+금리
    return (
      <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 shadow-xs rounded-m">
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
                  {(o.lendRateMin ?? product.rateMin ?? 0).toFixed(2)}% ~{" "}
                  {(o.lendRateMax ?? product.rateMax ?? 0).toFixed(2)}%
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
  
  // 유형별 계산기
  const Calculator = () => (
    <div className="rounded-2xl border border-gray-100 p-4 lg:p-6 bg-white">
      <div className="flex justify-center items-center bg-indigo-100 rounded-2xl p-3 shadow-xs">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-indigo-800">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V13.5Zm0 2.25h.008v.008H8.25v-.008Zm0 2.25h.008v.008H8.25V18Zm2.498-6.75h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V13.5Zm0 2.25h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V18Zm2.504-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5Zm0 2.25h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V18Zm2.498-6.75h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V13.5ZM8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
        </svg>
        <h3 className="font-semibold ml-2  ">대출 상환 계산기 (원리금균등)</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-2">
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
                  clamp(
                    parseInt(e.target.value || "0", 10),
                    1_000_000,
                    product?.limitMax || 1_000_000_000
                  )
                )
              }
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {product?.limitMax && (
              <div className="mt-1 text-xs text-gray-500">
                최대 {won(product.limitMax)}원
              </div>
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

          {/* 우대감면: 담보형만 노출 */}
          {isSecured && (
            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  우대금리 감면 (최대 {maxPreferential.toFixed(2)}%p)
                </span>
                <span className="text-xs text-gray-500">
                  현재: -{preferential.toFixed(2)}%p
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={maxPreferential}
                step={0.1}
                value={preferential}
                onChange={(e) => setPreferential(parseFloat(e.target.value))}
                className="mt-2 w-full"
              />
              <div className="mt-1 flex flex-wrap gap-2">
                {preferentialGuide.map((g, i) => (
                  <Pill key={i}>{g}</Pill>
                ))}
              </div>
            </label>
          )}

          {/* 신용 안내 문구 */}
          {isCredit && (
            <p className="text-xs text-gray-500">
              신용대출은 신용등급/소득/부채 등에 따라 금리가 결정되며 우대감면 항목은
              상품별로 상이합니다.
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

        <div className="rounded-xl bg-gray-50 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">적용금리(연)</span>
            <span className="font-semibold text-gray-900">
              {effectiveRate.toFixed(2)}%
            </span>
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
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-gray-500 mt-10">
              <ScrollText className="w-4 h-4" />
              상환스케줄 미리보기 (상위 6회차)
            </h4>
            
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div
              className="overflow-x-auto rounded-xl border border-gray-200 bg-white"
              onWheel={(e) => {   {/* 가로로 스크롤하기 */}
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
                }}> 
                <table className="min-w-[560px] w-full text-sm table-fixed">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="py-1 px-3 text-left">회차</th>
                      <th className="py-2 px-3 text-left">이자</th>
                      <th className="py-2 px-3 text-left">원금</th>
                      <th className="py-2 px-3 text-left">잔액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.no} className="border-t border-gray-100">
                        <td className="py-2 px-3 text-left">{row.no}</td>
                        <td className="py-2 px-3 text-left whitespace-nowrap"> {fmt(row.interest)} 원</td>
                        <td className="py-2 px-3 text-left whitespace-nowrap"> {fmt(row.principal)} 원</td>
                        <td className="py-2 px-3 text-left whitespace-nowrap">{fmt(row.remain)} 원</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>  
            </div>
            <p className="mt-2 text-[11px] text-gray-500">
              ※ 실제 스케줄은 실행일·상환일·수수료 반영 등에 따라 달라질 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          disabled={!agree}
          onClick={() => {
            if (product) {
              saveFlow(product.id, { step: 1, slug: 'agree', product });
            }
            navigate(`/loan/apply/${product.id}/agree`);
          }}
          className={`px-4 py-2 rounded-xl text-white ${
            agree ? "bg-blue-700 hover:bg-blue-800" : "bg-gray-300 cursor-not-allowed"
          }`}>
          신청하기
        </button>
        {/* <a className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
          상담 신청
        </a> */}
      </div>
    </div>
  );

  // ---------- 로딩/에러/스켈레톤 ----------
  if (loading) return <div className="p-8">로딩중…</div>;
  if (error) return <div className="p-8 text-red-600">에러: {error}</div>;
  if (!product) return <div className="p-8">상품 정보를 찾을 수 없습니다.</div>;

  // ---------- 본문 ----------
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* 간단 헤더 대체 */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/loan/products" className="text-sm text-gray-600 hover:underline">
            ← 대출 목록
          </a>
          <div className="text-xs text-gray-500">상품코드 [{product.id}]</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 pb-16 bg-white mt-2 rounded-xl shadow-sm">
        {/* Hero */}
        <section className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {product.badges?.map((b, i) => (
                <Pill key={i}>{b}</Pill>
              ))}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {product.name}
            </h1>
            <p className="text-gray-600 max-w-2xl">{product.desc}</p>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="text-gray-500">금리(최저~최고)</div>
                <div className="text-lg font-semibold">
                  {(product.rateMin ?? 0).toFixed(2)}% ~{" "}
                  {(product.rateMax ?? 0).toFixed(2)}%
                </div>
              </div>
              {product?.limitMax && (
                <div>
                  <div className="text-gray-500">최대한도</div>
                  <div className="text-lg font-semibold">₩ {won(product.limitMax)}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500">상품유형</div>
                <div className="text-lg font-semibold">{product.type}</div>
              </div>
              {/* 주담/전세만 LTV 표시 */}
              {isSecured && product?.ltvMax != null && (
                <div>
                  <div className="text-gray-500">최대 LTV</div>
                  <div className="text-lg font-semibold">{product.ltvMax}%</div>
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.tags?.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-full border text-xs text-gray-700"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* 요약 */}
          <aside className="w-full lg:w-[380px] rounded-2xl border border-gray-100 p-5 bg-white shadow-sm">
            <h3 className="font-semibold mb-3">요약</h3>
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
                <span className="font-medium">
                  {(product.rateMin ?? 0).toFixed(2)}%
                </span>
              </div>
              {!!terms.length && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">최장기간</span>
                  <span className="font-medium">
                    {Math.max(...terms.map((t) => t.months))}개월
                  </span>
                </div>
              )}
              {/* 주담대/전세만 LTV 노출 */}
              {isSecured && product?.ltvMax != null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">최대 LTV</span>
                  <span className="font-medium">{product.ltvMax}%</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={scrollToChkbox}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm"
              >
                한도/금리 조회 계산하기
                </button>
              {/* <a
                href="#"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm text-center"
              >
                필요서류
              </a> */}
            </div>
          </aside>
        </section>

        {/* 금리표 & 계산기 */}
        <section className="mt-10 grid lg:grid-cols-2 gap-6 shadow-sm rounded-xl bg-white">
          <div className="m-2">
            <h3 className="font-semibold mb-3 flex items-center gap-1 m-2">
              금리/기간 안내</h3>
            <div className="rounded-2xl border border-gray-700 bg-white">
              <RateTable />
            </div>
          </div>
          <div>
            <Calculator className="w-4 h-4"/>
          </div>
        </section>

        {/*  원문 안내 섹션 */}
        {(product.joinWay || product.erlyRpayFee || product.dlyRate || product.etcNote) && (
            <section className="mt-10">
              <h3 className="font-semibold mb-3 text-xl">상품설명</h3>
              <SpecTable />
            </section>
          )}
      </main>
    </div>
  );
}
