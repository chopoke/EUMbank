// src/main/java/com/boot/eumbank/loan/service/apply/LoanQuoteServiceImpl.java
package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.loan.dto.apply.LoanQuoteRequestDTO;
import com.boot.eumbank.loan.dto.apply.LoanQuoteResponseDTO;
import com.boot.eumbank.loan.entity.LoanCreditOption;
import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanRateOption;
import com.boot.eumbank.loan.repository.LoanCreditRepository;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import com.boot.eumbank.loan.repository.LoanRateOptionRepository;
import com.boot.eumbank.loan.repository.apply.LoanApplicationRepository;
import com.boot.eumbank.loan.util.LoanLimitParser;
import com.boot.eumbank.loan.util.LtvParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class LoanQuoteServiceImpl implements LoanQuoteService {

    private final LoanProductRepository loanProductRepository;
    private final LoanRateOptionRepository loanRateOptionRepository;
    private final LoanCreditRepository loanCreditRepository;
    private final LoanApplicationRepository loanApplicationRepository;

    @Override
    @Transactional(readOnly = true)
    public LoanQuoteResponseDTO quote(String loanCode, LoanQuoteRequestDTO req, Customer customer) {
        LoanProduct product = loanProductRepository.findByLoanCode(loanCode)
                .orElseThrow(() -> new NoSuchElementException("상품을 찾을 수 없습니다. 상품코드 : " + loanCode));

        final boolean isCredit   = "CREDIT".equalsIgnoreCase(product.getLoanType());
        final boolean isJeonse   = "JEONSE".equalsIgnoreCase(product.getLoanType());
        final boolean isMortgage = "MORTGAGE".equalsIgnoreCase(product.getLoanType());

        // ---- 기본 검증
        if (req.getDesiredAmount() == null || req.getDesiredAmount().compareTo(new BigDecimal("1000000")) < 0)
            throw new IllegalArgumentException("신청 금액은 최소 1,000,000원 이상 입력해 주세요.");
        if (req.getDesiredTerm() == null || req.getDesiredTerm() < 6)
            throw new IllegalArgumentException("신청 기간은 최소 6개월 이상이어야 합니다.");

        // ---- 금리유형 정규화
        final String rateKind = toRateKind(Optional.ofNullable(req.getRateType()).orElse(""));
        final String rateKo   = "VARIABLE".equals(rateKind) ? "변동금리" : "고정금리";

        // ---- 원문 한도/LTV 파싱
        final String rawLimit = product.getLoanLmtRaw(); // e.g. "LTV 70% 이내, 최대 10억원"
        final Integer ltvPctFromRaw = LtvParser.parseLtvPercent(rawLimit).orElse(null);  // % 있을 때만
        final BigDecimal absLimit = LoanLimitParser.parseAbsoluteWon(rawLimit)
                .map(BigDecimal::valueOf)
                .orElse(null); // 억/백만/만/원 → 절대한도(원)

        // ---- 담보계열 필수값
        if (!isCredit) {
            if (isMortgage && (req.getCollateralValue() == null || req.getCollateralValue().compareTo(BigDecimal.ZERO) <= 0))
                throw new IllegalArgumentException("주택담보대출: 담보가치(주택)을 입력해야 합니다.");
            if (isJeonse && (req.getJeonseDeposit() == null || req.getJeonseDeposit().compareTo(BigDecimal.ZERO) <= 0))
                throw new IllegalArgumentException("전세자금대출: 임차보증금(전세금)을 입력해야 합니다.");
        }

        // ---- 옵션 집계
        List<LoanRateOption> allRateOpts = loanRateOptionRepository.findByProduct(product);
        BigDecimal optionMinAll = minDec(allRateOpts, "getLroLendRateMin", "getLendRateMin");
        BigDecimal optionMaxAll = maxDec(allRateOpts, "getLroLendRateMax", "getLendRateMax");
        BigDecimal avgAll       = averageRate(allRateOpts);
        BigDecimal productBase  = firstNonNull(product.getRateMin(), product.getRateMax());

        // ---- 적용 금리 산정
        BigDecimal appliedRate;
        if (isCredit) {
            appliedRate = pickCreditRate(product, req);
            if (appliedRate == null) {
                appliedRate = firstNonNull(productBase, optionMinAll, new BigDecimal("6.00"));
                BigDecimal jobAdj = jobAdjustment(Optional.ofNullable(req.getOccupation()).orElse("EMPLOYEE"));
                appliedRate = appliedRate.add(jobAdj);
            }
        } else {
            String rpayNorm = normRpay(Optional.ofNullable(req.getRpayType()).orElse("원리금균등"));
            appliedRate = pickCollateralRate(allRateOpts, rateKind, rpayNorm, req.getDesiredTerm());
            if (appliedRate == null) {
                BigDecimal avgByKind = averageRate(filterByRateKind(allRateOpts, rateKind));
                appliedRate = firstNonNull(avgByKind, avgAll, productBase, optionMinAll, new BigDecimal("6.00"));
            }
        }
        if ("VARIABLE".equals(rateKind)) {
            appliedRate = appliedRate.add(new BigDecimal("0.10"));
        }

        // ---- 승인 한도: capByLtv ∩ absLimit ∩ product.limitMax
        BigDecimal basis = isJeonse ? orZero(req.getJeonseDeposit()) : orZero(req.getCollateralValue());

        // usedLtv 우선순위: DB(product.ltvMax) > 원문 % > 기본 70
        Integer usedLtv = null;
        if (!isCredit) {
            if (product.getLtvMax() != null && product.getLtvMax() > 0) {
                usedLtv = product.getLtvMax();
            } else if (ltvPctFromRaw != null) {
                usedLtv = ltvPctFromRaw;
            } else {
                usedLtv = 70; // fallback
            }
        }

        // LTV 캡 (basis 있을 때만 계산)
        BigDecimal capByLtv = null;
        if (!isCredit && basis.compareTo(BigDecimal.ZERO) > 0 && usedLtv != null) {
            capByLtv = basis.multiply(BigDecimal.valueOf(usedLtv))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);
        }

        // 절대한도/상품한도와 교집합
        BigDecimal hardLimit = minNotNull(
                minNotNull(capByLtv, absLimit),
                product.getLimitMax()
        );
        if (hardLimit == null) {
            // 정보 없을 때 보수적으로
            hardLimit = firstNonNull(product.getLimitMax(), orZero(req.getDesiredAmount()));
        }

        int defaultTerm = isMortgage ? 360 : (isJeonse ? 24 : 36);
        int approvedTerm = Optional.ofNullable(req.getDesiredTerm()).orElse(defaultTerm);
        String rpayTypeNorm = normRpay(Optional.ofNullable(req.getRpayType()).orElse("원리금균등"));

        BigDecimal desired = orZero(req.getDesiredAmount());
        BigDecimal approvedAmount = (desired.compareTo(BigDecimal.ZERO) > 0)
                ? minNotNull(desired, hardLimit) : hardLimit;

        // ---- 실효 LTV(표시/금리가감용): 승인금액 기준
        Integer effLtv = null;
        if (!isCredit && basis.compareTo(BigDecimal.ZERO) > 0 && approvedAmount.compareTo(BigDecimal.ZERO) > 0) {
            effLtv = approvedAmount.multiply(BigDecimal.valueOf(100))
                    .divide(basis, 0, RoundingMode.HALF_UP).intValue();
            effLtv = Math.max(0, Math.min(120, effLtv)); // 표시 가드
        }
        if (!isCredit && effLtv != null) {
            appliedRate = appliedRate.add(ltvAdjustment(effLtv));
        }

        // 최종 금리 가드
        appliedRate = clampRate(appliedRate, new BigDecimal("2.00"), new BigDecimal("25.00"));

        // ---- 월 납입/총이자
        BigDecimal monthlyPayment, totalInterest;
        switch (rpayTypeNorm) {
            case "EQUAL_PRINCIPAL" -> {
                monthlyPayment = calcPrincipalEqual(approvedAmount, appliedRate, approvedTerm);
                totalInterest = calcTotalInterestPrincipalEqual(approvedAmount, appliedRate, approvedTerm);
            }
            case "BULLET" -> {
                monthlyPayment = calcBullet(approvedAmount, appliedRate, approvedTerm);
                totalInterest = calcTotalInterestBullet(approvedAmount, appliedRate, approvedTerm);
            }
            default -> { // ANNUITY
                monthlyPayment = calcAnnuity(approvedAmount, appliedRate, approvedTerm);
                totalInterest = monthlyPayment.multiply(BigDecimal.valueOf(approvedTerm))
                        .subtract(approvedAmount).max(BigDecimal.ZERO);
            }
        }

        Map<String, String> trace = new LinkedHashMap<>();
        trace.put("raw_limit", String.valueOf(rawLimit));
        trace.put("abs_limit_won", n2s(absLimit));
        trace.put("ltv_pct_from_raw", String.valueOf(ltvPctFromRaw));
        trace.put("usedLtv_cap", String.valueOf(usedLtv));   // ✅ 실제 적용 LTV 캡
        trace.put("basis", n2s(basis));
        trace.put("effLtv", String.valueOf(effLtv));
        trace.put("avgAll", n2s(avgAll));
        trace.put("productBase", n2s(productBase));
        trace.put("optionMinAll", n2s(optionMinAll));

        log.info("[QUOTE] code={}, type={}, rate={}, rpay={}, raw='{}', absLimit={}, ltvPctRaw={}, usedLtvCap={}, desired={}, basis={}, productLimitMax={}, " +
                        "appliedRate={}, approvedAmount={}, approvedTerm={}, monthly={}, totalInt={}",
                product.getLoanCode(), product.getLoanType(), rateKo, rpayTypeNorm, rawLimit, absLimit, ltvPctFromRaw, usedLtv,
                req.getDesiredAmount(), basis, product.getLimitMax(),
                appliedRate, approvedAmount, approvedTerm, monthlyPayment, totalInterest);

        return LoanQuoteResponseDTO.builder()
                .loanCode(product.getLoanCode())
                .loanName(product.getLoanName())
                .type(product.getLoanType())
                .rateType(rateKo)
                .rpayType(rpayTypeNorm)
                .appliedRate(appliedRate.setScale(2, RoundingMode.HALF_UP))
                .approvedAmount(approvedAmount)
                .approvedTerm(approvedTerm)
                .monthlyPayment(monthlyPayment)
                .totalInterest(totalInterest)
                .maxLimit(hardLimit)
                .usedLtv(isCredit ? null : effLtv)
                .calcTrace(trace)
                .build();
    }

    // ========================= 금리 선택/보조 =========================
    private BigDecimal pickCreditRate(LoanProduct product, LoanQuoteRequestDTO req) {
        Optional<LoanCreditOption> optA = loanCreditRepository.findFirstByLoanProductAndRateType(product, "A");
        int score = resolveCreditScoreFromReq(req);

        if (optA.isPresent()) return resolveCreditBucketRate(optA.get(), score);

        Optional<LoanCreditOption> optB = loanCreditRepository.findFirstByLoanProductAndRateType(product, "B");
        Optional<LoanCreditOption> optC = loanCreditRepository.findFirstByLoanProductAndRateType(product, "C");

        BigDecimal b = optB.map(o -> resolveCreditBucketRate(o, score)).orElse(BigDecimal.ZERO);
        BigDecimal c = optC.map(o -> resolveCreditBucketRate(o, score)).orElse(BigDecimal.ZERO);
        BigDecimal sum = b.add(c);
        return sum.compareTo(BigDecimal.ZERO) > 0 ? sum : null;
    }

    private BigDecimal pickCollateralRate(List<LoanRateOption> options, String rateKind, String rpayNorm, Integer desiredTerm) {
        if (options == null || options.isEmpty()) return null;

        final String mustKo = "VARIABLE".equals(rateKind) ? "변동" : "고정";
        List<LoanRateOption> byRate = new ArrayList<>();
        for (LoanRateOption op : options) {
            String nm = getStr(op, "getLroLendRateTypeNm", "getLendRateTypeNm", "getRateTypeNm", "getTypeNm");
            if (nm != null && nm.contains(mustKo)) byRate.add(op);
        }
        if (byRate.isEmpty()) byRate = options;

        List<LoanRateOption> byRpay = new ArrayList<>();
        for (LoanRateOption op : byRate) {
            String r = getStr(op, "getLroRpayTypeNm", "getRpayTypeNm", "getRepayTypeNm");
            if (rpayMatches(r, rpayNorm)) byRpay.add(op);
        }
        if (byRpay.isEmpty()) byRpay = byRate;

        List<LoanRateOption> pool = byRpay;
        if (desiredTerm != null && desiredTerm > 0) {
            int target = desiredTerm;
            pool = byRpay.stream()
                    .sorted(Comparator.comparingInt(op -> distance(termOf(op), target)))
                    .limit(3)
                    .toList();
        }

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

    private static boolean rpayMatches(String rawKo, String norm) {
        if (rawKo == null) return false;
        return switch (norm) {
            case "ANNUITY" -> rawKo.contains("원리금");
            case "EQUAL_PRINCIPAL" -> rawKo.contains("원금") || rawKo.contains("분할상환");
            case "BULLET" -> rawKo.contains("만기일시");
            default -> false;
        };
    }

    private static int distance(Integer v, int target) {
        if (v == null) return Integer.MAX_VALUE / 2;
        return Math.abs(v - target);
    }

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

    /** 신용 버킷별 금리 추출 (게터 이름 불일치 대비) */
    private BigDecimal resolveCreditBucketRate(LoanCreditOption row, int score) {
        String bucket = mapScoreToBucket(score);
        BigDecimal picked = switch (bucket) {
            case "G1"  -> getDec(row, "getG1",  "getGrad1",  "getLcoGrad1",  "getLco_grad_1");
            case "G4"  -> getDec(row, "getG4",  "getGrad4",  "getLcoGrad4",  "getLco_grad_4");
            case "G5"  -> getDec(row, "getG5",  "getGrad5",  "getLcoGrad5",  "getLco_grad_5");
            case "G6"  -> getDec(row, "getG6",  "getGrad6",  "getLcoGrad6",  "getLco_grad_6");
            case "G10" -> getDec(row, "getG10", "getGrad10", "getLcoGrad10", "getLco_grad_10");
            case "G11" -> getDec(row, "getG11", "getGrad11", "getLcoGrad11", "getLco_grad_11");
            case "G12" -> getDec(row, "getG12", "getGrad12", "getLcoGrad12", "getLco_grad_12");
            case "G13" -> getDec(row, "getG13", "getGrad13", "getLcoGrad13", "getLco_grad_13");
            default    -> null;
        };
        if (picked != null) return picked;

        BigDecimal avg = getDec(row, "getAvg", "getGradAvg", "getLcoGradAvg", "getLco_grad_avg");
        if (avg != null) return avg;

        BigDecimal sum = BigDecimal.ZERO; int cnt = 0;
        for (String m : List.of("getG1","getG4","getG5","getG6","getG10","getG11","getG12","getG13",
                "getGrad1","getGrad4","getGrad5","getGrad6","getGrad10","getGrad11","getGrad12","getGrad13")) {
            BigDecimal v = getDec(row, m);
            if (v != null) { sum = sum.add(v); cnt++; }
        }
        return cnt == 0 ? null : sum.divide(BigDecimal.valueOf(cnt), 4, RoundingMode.HALF_UP);
    }

    // ====== 공통 유틸 ======
    private static String n2s(BigDecimal v) { return v == null ? "null" : v.toPlainString(); }
    private static String toRateKind(String koOrEn) {
        if (koOrEn == null) return "FIXED";
        String s = koOrEn.trim().toUpperCase();
        if (s.contains("VARIABLE") || s.contains("변동")) return "VARIABLE";
        return "FIXED";
    }
    private static BigDecimal firstNonNull(BigDecimal... xs) { for (BigDecimal x : xs) if (x != null) return x; return null; }
    private static BigDecimal minNotNull(BigDecimal a, BigDecimal b) { if (a == null) return b; if (b == null) return a; return a.min(b); }
    private static BigDecimal orZero(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
    private static BigDecimal clampRate(BigDecimal v, BigDecimal min, BigDecimal max) {
        if (v.compareTo(min) < 0) return min; if (v.compareTo(max) > 0) return max; return v;
    }
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
    private static BigDecimal calcPrincipalEqual(BigDecimal principal, BigDecimal apr, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) return BigDecimal.ZERO;
        BigDecimal monthlyPrincipal = principal.divide(BigDecimal.valueOf(months), 0, RoundingMode.CEILING);
        BigDecimal m = apr.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);
        BigDecimal firstInterest = principal.multiply(m).setScale(0, RoundingMode.FLOOR);
        return monthlyPrincipal.add(firstInterest);
    }
    private static BigDecimal calcBullet(BigDecimal principal, BigDecimal apr, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) return BigDecimal.ZERO;
        BigDecimal m = apr.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP);
        return principal.multiply(m).setScale(0, RoundingMode.CEILING);
    }
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
    private static BigDecimal calcTotalInterestBullet(BigDecimal principal, BigDecimal apr, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) return BigDecimal.ZERO;
        BigDecimal m = apr.divide(BigDecimal.valueOf(100), 12, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 12, RoundingMode.HALF_UP);
        BigDecimal monthlyInterest = principal.multiply(m);
        return monthlyInterest.multiply(BigDecimal.valueOf(months)).setScale(0, RoundingMode.CEILING);
    }

    // ===== 점수/버킷/직업/상환유형
    private int resolveCreditScoreFromReq(LoanQuoteRequestDTO req) {
        try {
            Map<String, Object> extra = req.getExtra();
            if (extra != null) {
                Object v = extra.get("creditScore");
                if (v != null) {
                    int s = Integer.parseInt(String.valueOf(v));
                    return Math.max(300, Math.min(900, s));
                }
            }
        } catch (Exception ignore) {}
        String job = Optional.ofNullable(req.getOccupation()).orElse("EMPLOYEE").toUpperCase();
        return switch (job) {
            case "PUBLIC" -> 820;
            case "EMPLOYEE" -> 760;
            case "SELF_EMPLOYED" -> 700;
            case "STUDENT" -> 680;
            case "UNEMPLOYED" -> 620;
            default -> 700;
        };
    }
    private String mapScoreToBucket(int score) {
        if (score >= 900) return "G1";
        if (score >= 820) return "G4";
        if (score >= 760) return "G5";
        if (score >= 720) return "G6";
        if (score >= 680) return "G10";
        if (score >= 640) return "G11";
        if (score >= 600) return "G12";
        return "G13";
    }
    private BigDecimal jobAdjustment(String jobRaw) {
        String job = jobRaw == null ? "EMPLOYEE" : jobRaw.toUpperCase();
        return switch (job) {
            case "PUBLIC" -> new BigDecimal("-0.50");
            case "EMPLOYEE" -> new BigDecimal("-0.20");
            case "SELF_EMPLOYED" -> new BigDecimal("0.30");
            case "STUDENT" -> new BigDecimal("0.10");
            case "UNEMPLOYED" -> new BigDecimal("1.00");
            default -> BigDecimal.ZERO;
        };
    }
    private BigDecimal baseCapByJob(String jobRaw) {
        String job = jobRaw == null ? "EMPLOYEE" : jobRaw.toUpperCase();
        return switch (job) {
            case "PUBLIC" -> new BigDecimal("80000000");
            case "EMPLOYEE" -> new BigDecimal("50000000");
            case "SELF_EMPLOYED" -> new BigDecimal("40000000");
            case "STUDENT" -> new BigDecimal("20000000");
            case "UNEMPLOYED" -> new BigDecimal("10000000");
            default -> new BigDecimal("30000000");
        };
    }
    private BigDecimal ltvAdjustment(int ltv) {
        if (ltv <= 40) return new BigDecimal("-0.30");
        if (ltv <= 60) return new BigDecimal("-0.10");
        if (ltv <= 70) return BigDecimal.ZERO;
        if (ltv <= 80) return new BigDecimal("0.20");
        return new BigDecimal("0.50");
    }
    private String normRpay(String rpayType) {
        String t = (rpayType == null ? "" : rpayType.trim());
        if (t.equalsIgnoreCase("원리금균등") || t.equalsIgnoreCase("ANNUITY")) return "ANNUITY";
        if (t.equalsIgnoreCase("원금균등") || t.equalsIgnoreCase("EQUAL_PRINCIPAL") || t.equalsIgnoreCase("분할상환방식"))
            return "EQUAL_PRINCIPAL";
        if (t.equalsIgnoreCase("만기일시") || t.equalsIgnoreCase("BULLET") || t.equalsIgnoreCase("만기일시상환방식"))
            return "BULLET";
        return "ANNUITY";
    }

    // ===== 리플렉션 유틸
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
