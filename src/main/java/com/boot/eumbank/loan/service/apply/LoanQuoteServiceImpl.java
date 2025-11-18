package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.loan.dto.apply.LoanQuoteRequestDTO;
import com.boot.eumbank.loan.dto.apply.LoanQuoteResponseDTO;
import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanRateOption;
import com.boot.eumbank.loan.util.FeeTextParser;
//import com.boot.eumbank.loan.repository.LoanCreditRepository;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import com.boot.eumbank.loan.repository.LoanRateOptionRepository;
import com.boot.eumbank.loan.repository.apply.LoanApplicationRepository;
import com.boot.eumbank.loan.util.DelinqRateParser;
import com.boot.eumbank.loan.util.EarlyRepayTextParser;
import com.boot.eumbank.loan.util.LoanLimitParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * 대출 견적(한도/금리/월납입 등)을 산출하는 서비스 구현체
 *
 * 핵심 규칙 요약:
 *  - 금리유형: 고정/변동(내부에선 FIXED/VARIABLE로 정규화, 응답은 한글 라벨도 함께 제공)
 *  - 상환방식:
 *      ANNUITY(원리금균등): 매월 동일한 금액(원금+이자)
 *      EQUAL_PRINCIPAL(원금균등/분할상환): 매월 동일한 원금 + 잔액 기준 이자
 *      BULLET(만기일시): ① 매월(지정일) 이자만 납부, ② 마지막 달에 원금 + 마지막 달 이자 납부
 *
 * 계산 결과 필드 의미:
 *  - monthlyPayment:
 *      ANNUITY        → 월 납입액(원금+이자)
 *      EQUAL_PRINCIPAL→ 첫 달 기준 월 납입액(원금 균등 + 첫 달 이자) [UI에서 "최대 월납입"으로 안내 권장]
 *      BULLET         → 매월 납부하는 "이자액"(원금 제외)
 *  - totalInterest: 전체 기간 동안 지불하는 "총 이자액"
 *      BULLET의 경우 월 이자 × 개월 수 (마지막 달에 원금 + 월이자를 함께 납부)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class LoanQuoteServiceImpl implements LoanQuoteService {

    private final LoanProductRepository loanProductRepository;
    private final LoanRateOptionRepository loanRateOptionRepository;
//    private final LoanCreditRepository loanCreditRepository;
    private final LoanApplicationRepository loanApplicationRepository; // (향후 신청 이력 참조 시 사용 가능)

    @Override
    @Transactional(readOnly = true)
    public LoanQuoteResponseDTO quote(String loanCode, LoanQuoteRequestDTO req, Customer customer) {
        // 1) 상품 조회
        LoanProduct product = loanProductRepository.findByLoanCode(loanCode)
                .orElseThrow(() -> new NoSuchElementException("상품을 찾을 수 없습니다. 상품코드 : " + loanCode));

//        final boolean isCredit   = "CREDIT".equalsIgnoreCase(product.getLoanType());
        final boolean isJeonse   = "JEONSE".equalsIgnoreCase(product.getLoanType());        // 전세자금
        final boolean isMortgage = "MORTGAGE".equalsIgnoreCase(product.getLoanType());      // 주담대
        final boolean isAuto = "AUTO".equalsIgnoreCase(product.getLoanType());              // 자동차담보

        // 2) 입력 검증 (최소 금액/기간)
        if (req.getDesiredAmount() == null || req.getDesiredAmount().compareTo(new BigDecimal("1000000")) < 0)
            throw new IllegalArgumentException("신청 금액은 최소 1,000,000원 이상 입력해 주세요.");
        if (req.getDesiredTerm() == null || req.getDesiredTerm() < 6)
            throw new IllegalArgumentException("신청 기간은 최소 6개월 이상이어야 합니다.");

        // 3) 금리유형 정규화 (FIXED 고정금리 / VARIABLE 변동금리) 한글라벨
        final String rateKind = toRateKind(Optional.ofNullable(req.getRateType()).orElse(""));
        final String rateKo   = "VARIABLE".equals(rateKind) ? "변동금리" : "고정금리";      // UI표기를 위한 라벨링

        // 4) 한도/LTV 원문 파싱 ex) ltv70% 이내, 최대 10억까지  ==> 승인한도 상환 계싼에 사용
        final String rawLimit = product.getLoanLmtRaw();
        final Integer ltvPctFromRaw = LoanLimitParser.parseLtvPercent(rawLimit).orElse(null);
        final BigDecimal absLimit = LoanLimitParser.parseAbsoluteWon(rawLimit)
                .map(BigDecimal::valueOf).orElse(null);

        // (A) 원문 전체 파싱 결과
        final Map<String,Object> limitAll = LoanLimitParser.parseAll(rawLimit);

        // 최대 LTV, 시나리오별 한도까지 있으면 교집합에 포함
        Integer ltvMaxFromAll = Optional.ofNullable((Number)limitAll.get("ltvMaxPct")).map(Number::intValue).orElse(null);
        List<Map<String,Object>> scenarioCaps = (List<Map<String,Object>>) limitAll.getOrDefault("scenarioCaps", List.of());
        BigDecimal scenarioMax = scenarioCaps.stream()
                .map(m -> new BigDecimal(((Number)m.get("capWon")).longValue()))
                .max(BigDecimal::compareTo)
                .orElse(null);


        
        // 5) 유형별 필수 입력해야하는거
        if (isMortgage && (req.getCollateralValue() == null || req.getCollateralValue().compareTo(BigDecimal.ZERO) <= 0))
            throw new IllegalArgumentException("주택담보대출: 담보가치(주택)을 입력해야 합니다.");
        if (isJeonse && (req.getJeonseDeposit() == null || req.getJeonseDeposit().compareTo(BigDecimal.ZERO) <= 0))
            throw new IllegalArgumentException("전세자금대출: 임차보증금(전세금)을 입력해야 합니다.");
        if (isAuto && vehiclePriceFromReq(req).compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("자동차대출: 차량가격(담보가치)을 입력해야 합니다.");

        
        // 6) 옵션 집계(상품별 금리옵션 취합)
        List<LoanRateOption> allRateOpts = loanRateOptionRepository.findByProduct(product);
        // 모든 상환옵션 중 최저금리
        BigDecimal optionMinAll = minDec(allRateOpts, "getLroLendRateMin", "getLendRateMin");
        // 모든 상환옵션중 최고금리
        BigDecimal optionMaxAll = maxDec(allRateOpts, "getLroLendRateMax", "getLendRateMax");
        // 모든옵션 평균값
        BigDecimal avgAll       = averageRate(allRateOpts);
        BigDecimal productBase  = firstNonNull(product.getRateMin(), product.getRateMax());

        // 7) 적용 금리 산정!  가장 중요~~~~~~~~~~~~~~~~~~~~~
        // ANNUITY 원리금 균등 / EQUAL_PRINCIPAL원금균등(분할상환) / 만기일시 BULLET
        BigDecimal appliedRate = null;
        String rpayNorm = normRpay(Optional.ofNullable(req.getRpayType()).orElse("원리금균등"));
        appliedRate = pickCollateralRate(allRateOpts, rateKind, rpayNorm, req.getDesiredTerm());
        if (appliedRate == null) {
            BigDecimal avgByKind = averageRate(filterByRateKind(allRateOpts, rateKind));
            // 방어 폴백 만들기(avgByKind 없으면 avgAll 없으면 productBase...
            appliedRate = firstNonNull(avgByKind, avgAll, productBase, optionMinAll, new BigDecimal("6.00"));
        }

        // 변동금리 가산= +0.3%
        if ("VARIABLE".equals(rateKind)) appliedRate = appliedRate.add(new BigDecimal("0.30"));

        // 자동차인 경우 중고차는 기존금리 + 0.7% 적용
        if (isAuto) {
            String carKind = resolveCarKind(req); // NEW / USED
            if ("USED".equals(carKind)) appliedRate = appliedRate.add(new BigDecimal("0.70"));
        }

        // 8) 승인 한도 계산: LTV 캡 + 원문 절대한도 + DB 상품한도
        BigDecimal basis;
        if (isJeonse) basis = orZero(req.getJeonseDeposit());       // 전세자금 한도기준금액
        else if (isMortgage) basis = orZero(req.getCollateralValue());  // 주담대 한도 기준 금액
        else if (isAuto) basis = vehiclePriceFromReq(req);            // 자동차 한도 기준 금액
        else basis = orZero(req.getCollateralValue());                  // 그외가 들어올 경우 기준금액

        // usedLtv 산정 시 우선순위: DB > parseAll > parseLtvPercent > 70
        Integer usedLtv;
        if (isAuto) {
            usedLtv = 80;  // 자동차는 차량가의 80%까지만
        } else {        // DB에 적용된 LTV 없으면 기본 80%(주담대, 전세자금은 70%)
            usedLtv = (product.getLtvMax() != null && product.getLtvMax() > 0) ? product.getLtvMax()
                    : (ltvMaxFromAll != null ? ltvMaxFromAll
                    : (ltvPctFromRaw != null ? ltvPctFromRaw : 70));
        }


        // LTV 캡  ==> 원단위 버리기
        BigDecimal capByLtv = null;
        capByLtv = basis.multiply(BigDecimal.valueOf(usedLtv))
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);

        // 절대한도와 DB상품한도 교집합
        BigDecimal hardLimit = minNotNull(      // 최대한도는 여러 한도들의 최솟값으로
                minNotNull(capByLtv, absLimit),
                minNotNull(product.getLimitMax(), scenarioMax)
        );
        if (hardLimit == null) {
            // 없다면 limitMax나 desiredAmount로 폴백방어
            hardLimit = firstNonNull(product.getLimitMax(), orZero(req.getDesiredAmount()));
        }


        // 기간 기본값(상품 유형별 관행치)
        int defaultTerm = isMortgage ? 360 : (isJeonse ? 24 : 36);
        int approvedTerm = Optional.ofNullable(req.getDesiredTerm()).orElse(defaultTerm);
        String rpayTypeNorm = normRpay(Optional.ofNullable(req.getRpayType()).orElse("원리금균등"));

        // 승인금액 = min(신청금액, hardLimit) (신청금액 없으면 hardLimit)
        BigDecimal desired = orZero(req.getDesiredAmount());
        BigDecimal approvedAmount = (desired.compareTo(BigDecimal.ZERO) > 0)
                ? minNotNull(desired, hardLimit) : hardLimit;

        // 9) LTV 기반 금리 추가 보정
        // 담보액이 클 수록 금리 우대, 높은 LTV일 수록 가산금리
        Integer effLtv = null;
        // basis가 0 또는 null이면 나눗셈 방지 가드
        if (basis != null && basis.compareTo(BigDecimal.ZERO) > 0) {
            effLtv = approvedAmount.multiply(BigDecimal.valueOf(100))
                    .divide(basis, 0, RoundingMode.HALF_UP).intValue();
            effLtv = Math.max(0, Math.min(120, effLtv)); // 100~120% 사이로 표시용 가드레일
            // LTV가 높을수록 가산금리 적용
            appliedRate = appliedRate.add(ltvAdjustment(effLtv));       // 금리 표 가져오기
        } else {
            // basis가 없으면 LTV 가산은 생략하고, effLtv는 null 유지
            log.debug("@@@@@@@@ [QUOTE] 기본금이 없어서 가산 생략 @@@@@@@@");
        }
        // 금리 범위 가드(2~25%)
        appliedRate = clampRate(appliedRate, new BigDecimal("2.00"), new BigDecimal("25.00"));

        
        // 10) 월 납입/총이자 계산
        BigDecimal monthlyPayment, totalInterest;
        switch (rpayTypeNorm) {
            case "EQUAL_PRINCIPAL" -> {
                // 원금균등: "첫 달" 월 납입액을 대표치로 제공(원금균등의 경우 월 납입액이 점차 감소)
                monthlyPayment = calcPrincipalEqual(approvedAmount, appliedRate, approvedTerm);
                totalInterest = calcTotalInterestPrincipalEqual(approvedAmount, appliedRate, approvedTerm);
            }
            case "BULLET" -> {
                // 만기일시: 매월 이자만 납부(=monthlyPayment), 마지막 달에 (원금 + 마지막 달 이자) 납부
                monthlyPayment = calcBullet(approvedAmount, appliedRate, approvedTerm); // == 월 이자
                totalInterest = calcTotalInterestBullet(approvedAmount, appliedRate, approvedTerm); // 월이자×개월수
            }
            default -> { // ANNUITY(원리금균등)
                monthlyPayment = calcAnnuity(approvedAmount, appliedRate, approvedTerm);
                totalInterest = monthlyPayment.multiply(BigDecimal.valueOf(approvedTerm))
                        .subtract(approvedAmount).max(BigDecimal.ZERO);
            }
        }

        // 계산결과 관리용 트레이스
        Map<String, String> trace = new LinkedHashMap<>();
        trace.put("rateKind", rateKind);          // FIXED / VARIABLE
        trace.put("rpayType", rpayTypeNorm);      // ANNUITY / EQUAL_PRINCIPAL / BULLET
        trace.put("appliedRate.final", n2s(appliedRate));

        trace.put("raw_limit", String.valueOf(rawLimit));
        trace.put("abs_limit_won", n2s(absLimit));
        trace.put("ltv_pct_from_raw", String.valueOf(ltvPctFromRaw));
        trace.put("usedLtv_cap", String.valueOf(usedLtv));
        trace.put("basis", n2s(basis));
        trace.put("effLtv", String.valueOf(effLtv));
        trace.put("hardLimit", n2s(hardLimit));
        trace.put("approvedAmount", n2s(approvedAmount));
        trace.put("approvedTerm", String.valueOf(approvedTerm));
        
        trace.put("avgAll", n2s(avgAll));
        trace.put("productBase", n2s(productBase));
        trace.put("optionMinAll", n2s(optionMinAll));
        if (isAuto) trace.put("auto.kind", resolveCarKind(req));            // 신차인지 중고인지


//        // ====== 연체부분 미적용..
//        String dlyRaw = getStr(product, "getDlyRateRaw","getLpdDlyRate","getDelinqRateRaw","getDlyRate");
//        if (dlyRaw != null && !dlyRaw.isBlank()) {
//            Map<String,Object> d = DelinqRateParser.parseAll(dlyRaw);
//            Object add = d.get("addPct");
//            Object cap = d.get("capMaxPct");
//            if (add != null) trace.put("dly.addPct", String.valueOf(add));
//            if (cap != null) trace.put("dly.capMaxPct", String.valueOf(cap));
//        }
//        if ("BULLET".equals(rpayTypeNorm)) {
//            trace.put("bullet_monthly_interest", n2s(monthlyPayment));
//        }

        // 12) 로그
        log.info("@@@@@@@@ [QUOTE] code={}, type={}, rate={}, rpay={}, raw='{}', absLimit={}, ltvPctRaw={}, usedLtvCap={}, desired={}, basis={}, productLimitMax={}, " +
                        "appliedRate={}, approvedAmount={}, approvedTerm={}, monthly={}, totalInt={} @@@@@@@@@",
                product.getLoanCode(), product.getLoanType(), rateKo, rpayTypeNorm, rawLimit, absLimit, ltvPctFromRaw, usedLtv,
                req.getDesiredAmount(), basis, product.getLimitMax(),
                appliedRate, approvedAmount, approvedTerm, monthlyPayment, totalInterest);

        // 13) 응답 빌드
        return LoanQuoteResponseDTO.builder()
                .loanCode(product.getLoanCode())
                .loanName(product.getLoanName())
                .type(product.getLoanType())
                .rateType(rateKo)                 // 한글 라벨(고정금리/변동금리)
                .rpayType(rpayTypeNorm)           // ANNUITY / EQUAL_PRINCIPAL / BULLET
                .appliedRate(appliedRate.setScale(2, RoundingMode.HALF_UP))
                .approvedAmount(approvedAmount)
                .approvedTerm(approvedTerm)
                .monthlyPayment(monthlyPayment)   //  BULLET은 (월이자)를 말함
                .totalInterest(totalInterest)
                .maxLimit(hardLimit)
                .usedLtv(effLtv)
                .calcTrace(trace)
                .build();
    }

    // ========================= 금리 선택/보조

    /**
     * 담보/전세 금리 산출(금리유형/상환방식/기간 근접 옵션 평균 → 중간값 → 최소/최대 순)
     */
    private BigDecimal pickCollateralRate(List<LoanRateOption> options, String rateKind, String rpayNorm, Integer desiredTerm) {
        if (options == null || options.isEmpty()) return null;

        final String mustKo = "VARIABLE".equals(rateKind) ? "변동" : "고정";
        // 1) 금리유형 필터
        List<LoanRateOption> byRate = new ArrayList<>();
        for (LoanRateOption op : options) {
            String nm = getStr(op, "getLroLendRateTypeNm", "getLendRateTypeNm", "getRateTypeNm", "getTypeNm");
            if (nm != null && nm.contains(mustKo)) byRate.add(op);
        }
        if (byRate.isEmpty()) byRate = options;

        // 2) 상환방식 필터
        List<LoanRateOption> byRpay = new ArrayList<>();
        for (LoanRateOption op : byRate) {
            String r = getStr(op, "getLroRpayTypeNm", "getRpayTypeNm", "getRepayTypeNm");
            if (rpayMatches(r, rpayNorm)) byRpay.add(op);
        }
        if (byRpay.isEmpty()) byRpay = byRate;

        // 3) 기간 근접 상위 3개 추림
        List<LoanRateOption> pool = byRpay;
        if (desiredTerm != null && desiredTerm > 0) {
            int target = desiredTerm;
            pool = byRpay.stream()
                    .sorted(Comparator.comparingInt(op -> distance(termOf(op), target)))
                    .limit(3)
                    .toList();
        }

        // 4) 평균 --> (미존재 시) min/max의 중간값 → min → max
        BigDecimal avg = averageRate(pool);
        if (avg != null) return avg;

        BigDecimal mid = midOfMinMax(pool);
        if (mid != null) return mid;

        BigDecimal minOnly = minDec(pool, "getLroLendRateMin", "getLendRateMin");
        if (minOnly != null) return minOnly;

        BigDecimal maxOnly = maxDec(pool, "getLroLendRateMax", "getLendRateMax");
        return maxOnly;
    }

    private List<LoanRateOption> filterByRateKind(List<LoanRateOption> src, String rateKind) {
        if (src == null) return List.of();
        final String mustKo = "VARIABLE".equals(rateKind) ? "변동" : "고정";
        List<LoanRateOption> out = new ArrayList<>();
        for (LoanRateOption op : src) {
            String nm = getStr(op, "getLroLendRateTypeNm", "getLendRateTypeNm", "getRateTypeNm", "getTypeNm");
            if (nm != null && nm.contains(mustKo)) out.add(op);
        }
        return out;
    }

    /**
     * 옵션의 한글 상환방식 라벨이 정규화 코드와 매칭되는지 여부
     * - "원리금", "원금/분할상환", "만기일시/만기일시상환" 등 다양한 표기 감지
     */
    private static boolean rpayMatches(String rawKo, String norm) {
        if (rawKo == null) return false;
        return switch (norm) {
            case "ANNUITY" -> rawKo.contains("원리금");
            case "EQUAL_PRINCIPAL" -> rawKo.contains("원금") || rawKo.contains("분할상환");
            case "BULLET" -> rawKo.contains("만기일시"); //  만기일시상환 포함
            default -> false;
        };
    }

    /**
     * 신차인지 중고차인지 판단
     */
    private String resolveCarKind(LoanQuoteRequestDTO req) {
        try {
            Map<String,Object> extra = req.getExtra();
            if (extra != null) {
                Object v = extra.get("carType");
                if (v != null) {
                    String s = String.valueOf(v).trim().toUpperCase();
                    if (s.contains("USED") || s.contains("중고")) return "USED";
                    if (s.contains("NEW")  || s.contains("신차")) return "NEW";
                }
            }
        } catch (Exception ignore) {}
        return "NEW";                           // 디폴트 = 신차
    }

    /**
     * 자동차 담보 가격: req.collateralValue 우선, 없으면 extra.vehiclePrice
     */
    private BigDecimal vehiclePriceFromReq(LoanQuoteRequestDTO req) {
        if (req.getCollateralValue() != null) return req.getCollateralValue();
        try {
            Map<String,Object> extra = req.getExtra();
            if (extra != null) {
                Object v = extra.get("vehiclePrice");
                if (v != null) return new BigDecimal(String.valueOf(v).replaceAll("[^0-9.]", ""));
            }
        } catch (Exception ignore) {}
        return BigDecimal.ZERO;
    }

    private static int distance(Integer v, int target) {
        if (v == null) return Integer.MAX_VALUE / 2;
        return Math.abs(v - target);
    }

    /** 리스트의 평균 금리 추정(평균  (없으면)min/max로 유추) */
    private static BigDecimal averageRate(List<LoanRateOption> list) {
        if (list == null || list.isEmpty()) return null;
        BigDecimal sum = BigDecimal.ZERO;
        int cnt = 0;
        for (LoanRateOption op : list) {
            BigDecimal v = getDec(op, "getLroLendRateAvg", "getLendRateAvg");
            if (v == null) {
                BigDecimal min = getDec(op, "getLroLendRateMin", "getLendRateMin");
                BigDecimal max = getDec(op, "getLroLendRateMax", "getLendRateMax");
                if (min != null && max != null)
                    v = min.add(max).divide(BigDecimal.valueOf(2), 4, RoundingMode.HALF_UP);
                else if (min != null) v = min;
                else if (max != null) v = max;
            }
            if (v != null) { sum = sum.add(v); cnt++; }
        }
        return cnt == 0 ? null : sum.divide(BigDecimal.valueOf(cnt), 4, RoundingMode.HALF_UP);
    }

    private static BigDecimal midOfMinMax(List<LoanRateOption> list) {
        BigDecimal min = minDec(list, "getLroLendRateMin", "getLendRateMin");
        BigDecimal max = maxDec(list, "getLroLendRateMax", "getLendRateMax");
        if (min == null && max == null) return null;
        if (min != null && max != null)
            return min.add(max).divide(BigDecimal.valueOf(2), 4, RoundingMode.HALF_UP);
        return firstNonNull(min, max);
    }


    // ====== 공통 유틸 ======
    private static String n2s(BigDecimal v) { return v == null ? "null" : v.toPlainString(); }

    /** 한글/영문 혼합 입력을 FIXED/VARIABLE로 정규화 */
    private static String toRateKind(String koOrEn) {
        if (koOrEn == null) return "FIXED";
        String s = koOrEn.trim().toUpperCase();
        if (s.contains("VARIABLE") || s.contains("변동")) return "VARIABLE";
        return "FIXED";
    }


    private static BigDecimal firstNonNull(BigDecimal... xs) {
        for (BigDecimal x : xs) if (x != null) return x; return null;
    }
    private static BigDecimal minNotNull(BigDecimal a, BigDecimal b) {
        if (a == null) return b; if (b == null) return a; return a.min(b);
    }
    private static BigDecimal orZero(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static BigDecimal clampRate(BigDecimal v, BigDecimal min, BigDecimal max) {
        if (v.compareTo(min) < 0) return min;
        if (v.compareTo(max) > 0) return max;
        return v;
    }

    /** 원리금균등 월 납입액(소수점 올림) */
    private static BigDecimal calcAnnuity(BigDecimal principal, BigDecimal apr, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) return BigDecimal.ZERO;
        BigDecimal m = apr.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);
        if (m.compareTo(BigDecimal.ZERO) == 0)
            return principal.divide(BigDecimal.valueOf(months), 0, RoundingMode.CEILING);
        double r = m.doubleValue(), P = principal.doubleValue(), n = months;
        double M = P * (r / (1 - Math.pow(1 + r, -n)));
        return BigDecimal.valueOf(Math.ceil(M)).setScale(0, RoundingMode.UNNECESSARY);
    }

    /** 원금균등: "첫 달" 월 납입액(= 월 원금 + 첫달 이자) */
    private static BigDecimal calcPrincipalEqual(BigDecimal principal, BigDecimal apr, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) return BigDecimal.ZERO;
        BigDecimal monthlyPrincipal = principal.divide(BigDecimal.valueOf(months), 0, RoundingMode.CEILING);
        BigDecimal m = apr.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);
        BigDecimal firstInterest = principal.multiply(m).setScale(0, RoundingMode.FLOOR);
        return monthlyPrincipal.add(firstInterest);
    }

    /**
     * 만기일시(이자만): 월 이자액
     *  - 매월(지정일) 이 금액만 납부
     *  - 마지막 달에는 (원금 + 이 월 이자) 납부
     */
    private static BigDecimal calcBullet(BigDecimal principal, BigDecimal apr, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) return BigDecimal.ZERO;
        BigDecimal m = apr.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);
        return principal.multiply(m).setScale(0, RoundingMode.CEILING); // == 월 이자
    }

    /** 원금균등 총 이자액(월별 이자 합) */
    private static BigDecimal calcTotalInterestPrincipalEqual(BigDecimal principal, BigDecimal apr, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) return BigDecimal.ZERO;
        BigDecimal m = apr.divide(BigDecimal.valueOf(100), 12, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 12, RoundingMode.HALF_UP);
        BigDecimal monthlyPrincipal = principal.divide(BigDecimal.valueOf(months), 0, RoundingMode.CEILING);
        BigDecimal remaining = principal, totalInterest = BigDecimal.ZERO;
        for (int i = 1; i <= months; i++) {
            BigDecimal interest = remaining.multiply(m);
            totalInterest = totalInterest.add(interest);
            remaining = remaining.subtract(monthlyPrincipal);
            if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;
        }
        return totalInterest.setScale(0, RoundingMode.CEILING);
    }

    /**
     * 만기일시 총 이자액 = 월 이자 × 개월 수
     *  - 매월 동일 이자 납부 가정(단리 가정)
     *  - 마지막 달에는 (원금 + 마지막 달 이자) 납부
     */
    private static BigDecimal calcTotalInterestBullet(BigDecimal principal, BigDecimal apr, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) return BigDecimal.ZERO;
        BigDecimal m = apr.divide(BigDecimal.valueOf(100), 12, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 12, RoundingMode.HALF_UP);
        BigDecimal monthlyInterest = principal.multiply(m);
        return monthlyInterest.multiply(BigDecimal.valueOf(months)).setScale(0, RoundingMode.CEILING);
    }

    /** LTV 구간별 금리 가감 */
    private BigDecimal ltvAdjustment(int ltv) {
        if (ltv <= 40) return new BigDecimal("-0.30");
        if (ltv <= 60) return new BigDecimal("-0.10");
        if (ltv <= 70) return BigDecimal.ZERO;
        if (ltv <= 80) return new BigDecimal("0.20");
        return new BigDecimal("0.50");
    }

    /**
     * 상환방식 정규화:
     *  - "원리금균등" → ANNUITY
     *  - "원금균등/분할상환" → EQUAL_PRINCIPAL
     *  - "만기일시/만기일시상환" → BULLET
     */
    private String normRpay(String rpayType) {
        String t = (rpayType == null ? "" : rpayType.trim());
        if (t.equalsIgnoreCase("원리금균등") || t.equalsIgnoreCase("ANNUITY")) return "ANNUITY";
        if (t.equalsIgnoreCase("원금균등") || t.equalsIgnoreCase("EQUAL_PRINCIPAL") || t.equalsIgnoreCase("분할상환방식") || t.equalsIgnoreCase("분할상환"))
            return "EQUAL_PRINCIPAL";
        if (t.equalsIgnoreCase("만기일시") || t.equalsIgnoreCase("BULLET") || t.equalsIgnoreCase("만기일시상환") || t.equalsIgnoreCase("만기일시상환방식"))
            return "BULLET";
        return "ANNUITY";
    }

    // ===== 리플렉션 유틸(게터 이름 편차 흡수) =====
    private static String getStr(Object o, String... methods) {
        for (String m : methods) {
            try { Method mm = o.getClass().getMethod(m); Object v = mm.invoke(o); if (v != null) return String.valueOf(v); }
            catch (Exception ignore) {}
        }
        return null;
    }
    private static BigDecimal getDec(Object o, String... methods) {
        for (String m : methods) {
            try { Method mm = o.getClass().getMethod(m); Object v = mm.invoke(o); if (v instanceof BigDecimal bd) return bd; }
            catch (Exception ignore) {}
        }
        return null;
    }
    private static Integer getInt(Object o, String... methods) {
        for (String m : methods) {
            try { Method mm = o.getClass().getMethod(m); Object v = mm.invoke(o); if (v != null) return (Integer) v; }
            catch (Exception ignore) {}
        }
        return null;
    }
    private static BigDecimal minDec(List<LoanRateOption> list, String... getterNames) {
        BigDecimal best = null;
        for (LoanRateOption op : list) {
            BigDecimal v = getDec(op, getterNames);
            if (v != null) best = (best == null) ? v : best.min(v);
        }
        return best;
    }
    private static BigDecimal maxDec(List<LoanRateOption> list, String... getterNames) {
        BigDecimal best = null;
        for (LoanRateOption op : list) {
            BigDecimal v = getDec(op, getterNames);
            if (v != null) best = (best == null) ? v : best.max(v);
        }
        return best;
    }
    private static Integer termOf(LoanRateOption op) {
        if (op == null) return null;
        Integer v;
        if ((v = getInt(op, "getTermMonth")) != null) return v;
        if ((v = getInt(op, "getTermMonths")) != null) return v;
        if ((v = getInt(op, "getTerm")) != null) return v;
        if ((v = getInt(op, "getLroTermMonth")) != null) return v;
        if ((v = getInt(op, "getLro_term_month")) != null) return v;
        return null;
    }
}
