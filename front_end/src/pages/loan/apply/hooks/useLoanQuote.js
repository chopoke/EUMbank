import React from "react";
import { clamp } from "../../util/money"
import { toKoRateType, normalizeRpayKo } from "../../util/loan";
import { fetchLoanQuote } from "../../../../api/accounts";

// 디바운스 유틸
function useDebouncedEffect(effect, deps, delay = 300) {
  React.useEffect(() => {
    const h = setTimeout(effect, delay);
    return () => clearTimeout(h);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function useLoanQuote({ code, product, form, invalidCollateral, invalidJeonse }) {
  const [quote, setQuote] = React.useState(null);
  const [quoting, setQuoting] = React.useState(false);
  const [fieldErr, setFieldErr] = React.useState({});
  const lastReqRef = React.useRef("");

  const loanTypeRaw = String(product?.type || "");
  const loanType = loanTypeRaw.toUpperCase();
  const isAuto =
    loanType.includes("AUTO") ||
    loanTypeRaw.includes("자동차");

  const canRequote =
    !!form.desiredAmount && !!form.desiredTerm &&
    (!invalidCollateral) && (!invalidJeonse);

  // 상환 방식별 계산 ===============
  // 원리금 균등
  function calcEqualPayment(P, n, annualRate) {
    const r = (annualRate/100) / 12;
    if (!P || !n || !r) return { monthly: 0, schedule: [] };
    const A = P * r * Math.pow(1+r, n) / (Math.pow(1+r, n) - 1); // 원리금균등
    return {
      monthly: Math.ceil(A),
      schedule: Array.from({length: n}, (_,i)=>({
        month: i+1, payment: Math.ceil(A)
      }))
    };
  }

  // 원금균등
  function calcEqualPrincipal(P, n, annualRate) {
    const r = (annualRate/100) / 12;
    if (!P || !n) return { first:0, last:0, avg:0, schedule:[] };
    const principal = P / n;
    let remain = P;
    const sched = [];
    for (let i=1;i<=n;i++){
      const interest = remain * r;
      const pay = Math.ceil(principal + interest);
      sched.push({ month:i, payment: pay });
      remain -= principal;
    }
    const first = sched[0]?.payment || 0;
    const last  = sched[sched.length-1]?.payment || 0;
    const avg   = Math.ceil(sched.reduce((s,x)=>s+x.payment,0) / n);
    return { first, last, avg, schedule: sched };
  }

  // 만기일시
  function calcBullet(P, n, annualRate){
    const r = (annualRate/100) / 12;
    if (!P || !n) return { monthlyInterest: 0, totalAtMaturity: 0 };
    const monthlyInterest = Math.ceil(P * r);     // 매달 이자만
    const totalAtMaturity = Math.ceil(P + P*r*n); // 만기 일시원금+누적이자
    return { monthlyInterest, totalAtMaturity };
  }
    
  const onRequote = async () => {
    const nextErr = {};
    if (invalidCollateral) nextErr.collateralValue = "주택담보대출: 담보가치를 입력해야 합니다.";
    if (invalidJeonse) nextErr.jeonseDeposit = "전세자금대출: 임차보증금(전세금)을 입력해야 합니다.";
    if ((form.desiredAmount ?? 0) < 1_000_000) nextErr.desiredAmount = "신청금액은 최소 1,000,000원 이상입니다.";
    setFieldErr(nextErr);
    if (Object.keys(nextErr).length > 0) return;

    try {
      setQuoting(true);
      const limitMax = product?.limitMax ?? product?.limit_max;
      const reqAmount =
        limitMax != null
          ? clamp(Number(form.desiredAmount || 0), 1_000_000, Number(limitMax))
          : Number(form.desiredAmount || 0);

      const req = {
        occupation: form.occupation,
        desiredAmount: reqAmount,
        desiredTerm: Number(form.desiredTerm || 0),
        rateType: toKoRateType(form.rateType),
        rpayType: normalizeRpayKo(form.rpayType),
        annualIncome: Number(form.incomeAnnual || 0),
        collateralValue: form.collateralValue != null ? Number(form.collateralValue || 0) : undefined,
        jeonseDeposit: form.jeonseDeposit != null ? Number(form.jeonseDeposit || 0) : undefined,
        
      };

      // extra 구성: 신용점수 + 자동차 정보
       const extra = {};
       if (form.creditScore != null && form.creditScore !== "") {
         extra.creditScore = Number(form.creditScore);
       }
       if (isAuto) {
         extra.carType = form.carType === "USED" ? "USED" : "NEW";
         if (form.collateralValue != null) {
           extra.vehiclePrice = Number(form.collateralValue || 0);
         }
       }
       if (Object.keys(extra).length > 0) {
         req.extra = extra;
       }

      const sig = JSON.stringify({ code, ...req });
      if (lastReqRef.current === sig) {
        setQuoting(false);
        return;
      }
      lastReqRef.current = sig;

      const res = await fetchLoanQuote(code, req);
      setQuote(res?.data ?? res);
      setFieldErr({});
    } catch (e) {
      setFieldErr((prev) => ({ ...prev, _server: e?.response?.data?.message || e?.message || "견적 재조회 실패" }));
    } finally {
      setQuoting(false);
    }
  };

  // 자동 재조회
  useDebouncedEffect(() => {
    if (!product) return;
    if (!form.desiredAmount || !form.desiredTerm) return;
    if (invalidCollateral || invalidJeonse) return;
    onRequote();
  }, [
    product,
    form.desiredAmount, form.desiredTerm,
    form.rateType, form.rpayType,
    form.collateralValue, form.jeonseDeposit,
    form.incomeAnnual, form.creditScore,
    form.carType,
  ], 300);

  // 파생 계산
  const baseRateMin = product?.rateMin ?? product?.rate_min ?? null;
  const baseRateMax = product?.rateMax ?? product?.rate_max ?? null;
  const annualRate =
    quote?.appliedRate != null
      ? Number(quote.appliedRate)
      : baseRateMin != null && baseRateMax != null
      ? (Number(baseRateMin) + Number(baseRateMax)) / 2
      : 6;

  const P_req  = Number(form.desiredAmount || 0);
  const P_appr = Number(quote?.approvedAmount || 0);
  const n = Number(form.desiredTerm || 0);
  const r = Number(annualRate) / 100 / 12;

  // 상환 방식 분기
  const rpayKo = normalizeRpayKo(form.rpayType); // "원리금균등" | "원금균등" | "만기일시"

  let monthlyAppr = 0;
  let equalPrincipal = null;
  let totalAtMaturityAppr = 0;

  if (rpayKo === "원리금균등") {
    monthlyAppr = calcEqualPayment(P_appr, n, annualRate).monthly;
  } else if (rpayKo === "원금균등") {
    const eqp = calcEqualPrincipal(P_appr, n, annualRate);
    monthlyAppr = eqp.avg;                   // 카드 메인값은 '평균'
    equalPrincipal = { first: eqp.first, last: eqp.last, avg: eqp.avg };
  } else { // 만기일시
    const blt = calcBullet(P_appr, n, annualRate);
    monthlyAppr = blt.monthlyInterest;       // 매달 이자
    totalAtMaturityAppr = blt.totalAtMaturity; // 만기 총액(원금+이자)
  }


  return {
    quote, quoting, fieldErr, setFieldErr, onRequote, canRequote,
    derived: { 
      annualRate, P_req, P_appr, n, r, 
      monthlyAppr,            // 승인예쌍금액(요약카드 메인)
      equalPrincipal,       // 원금균등(첫달/마지막달/평균)
      totalAtMaturityAppr,    // 만기일시 총액
    },
  };
}