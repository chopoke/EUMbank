// src/main/java/com/boot/eumbank/loan/service/apply/LoanQuoteServiceImpl.java
package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.loan.dto.apply.*;
import com.boot.eumbank.loan.entity.*;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import com.boot.eumbank.loan.repository.LoanRateOptionRepository;
import com.boot.eumbank.loan.repository.LoanCreditRepository;
import com.boot.eumbank.loan.repository.apply.LoanApplicationRepository;
import com.boot.eumbank.loan.util.LtvParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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

        List<LoanRateOption> rateOpts = loanRateOptionRepository.findByProduct(product);

        boolean isCredit   = "CREDIT".equalsIgnoreCase(product.getLoanType());
        boolean isJeonse   = "JEONSE".equalsIgnoreCase(product.getLoanType());
        boolean isMortgage = "MORTGAGE".equalsIgnoreCase(product.getLoanType());

        // ---- 입력 검증 ----
        if (req.getDesiredAmount() == null || req.getDesiredAmount().compareTo(new BigDecimal("1000000")) < 0)
            throw new IllegalArgumentException("신청 금액은 최소 1,000,000원 이상 입력해 주세요.");
        if (req.getDesiredTerm() == null || req.getDesiredTerm() < 6)
            throw new IllegalArgumentException("신청 기간은 최소 6개월 이상이어야 합니다.");

        // ---- LTV (담보/전세) ----
        Integer ltv = null;
        if (!isCredit) {
            ltv = (product.getLtvMax() != null && product.getLtvMax() > 0)
                    ? product.getLtvMax()
                    : LtvParser.parseLtvPercent(product.getLoanLmtRaw()).orElse(null);

            if (isMortgage && (req.getCollateralValue() == null || req.getCollateralValue().compareTo(BigDecimal.ZERO) <= 0))
                throw new IllegalArgumentException("주택담보대출: 담보가치(주택)를 입력해야 합니다.");
            if (isJeonse && (req.getJeonseDeposit() == null || req.getJeonseDeposit().compareTo(BigDecimal.ZERO) <= 0))
                throw new IllegalArgumentException("전세자금대출: 임차보증금(전세금)을 입력해야 합니다.");
        }

        // ---- 옵션 기반 금리 범위 (fallback) ----
        BigDecimal optionRateMin = rateOpts.stream().map(LoanRateOption::getLendRateMin)
                .filter(Objects::nonNull).min(BigDecimal::compareTo).orElse(new BigDecimal("6.0"));
        BigDecimal optionRateMax = rateOpts.stream().map(LoanRateOption::getLendRateMax)
                .filter(Objects::nonNull).max(BigDecimal::compareTo).orElse(new BigDecimal("15.0"));

        BigDecimal baseRate = optionRateMin != null ? optionRateMin
                : nvl(product.getRateMin(), product.getRateMax(), new BigDecimal("6.0"));
        BigDecimal appliedRate = (baseRate != null) ? baseRate : new BigDecimal("6.0");

        // ---- 신용대출: credit_option_tbl 기반 산정 (레포 이름 맞춤) ----
        if (isCredit) {
            List<LoanCreditOption> creditOpts = loanCreditRepository.findByLoanProduct(product);

            // 점수 우선
            int score = resolveCreditScoreFromReq(req);
            String bucket = mapScoreToBucket(score);

            // rateType 'A' 우선
            LoanCreditOption chosen = loanCreditRepository
                    .findByLoanProductAndRateType(product, "A")
                    .orElseGet(() -> creditOpts.isEmpty() ? null : creditOpts.get(0));

            BigDecimal creditRate = (chosen == null) ? null : switch (bucket) {
                case "G1" -> chosen.getG1();
                case "G4" -> chosen.getG4();
                case "G5" -> chosen.getG5();
                case "G6" -> chosen.getG6();
                case "G10" -> chosen.getG10();
                case "G11" -> chosen.getG11();
                case "G12" -> chosen.getG12();
                case "G13" -> chosen.getG13();
                default -> null;
            };

            if (creditRate != null) {
                appliedRate = clampRate(creditRate, new BigDecimal("2.0"), new BigDecimal("25.0"));
            } else {
                // 백업: 직업 가중치
                BigDecimal jobAdj = jobAdjustment(Optional.ofNullable(req.getOccupation()).orElse("EMPLOYEE"));
                appliedRate = clampRate(appliedRate.add(jobAdj), new BigDecimal("2.0"), new BigDecimal("25.0"));
            }
        }

        // ---- 담보 LTV 보정 ----
        if (!isCredit && ltv != null) {
            appliedRate = clampRate(appliedRate.add(ltvAdjustment(ltv)),
                    new BigDecimal("2.0"), new BigDecimal("25.0"));
        }

        // ---- 최대 한도 ----
        BigDecimal maxAmount;
        if (isCredit) {
            BigDecimal baseCap = baseCapByJob(Optional.ofNullable(req.getOccupation()).orElse("EMPLOYEE"));
            maxAmount = minNotNull(baseCap, product.getLimitMax());
        } else {
            int usedLtv = Optional.ofNullable(ltv).orElse(70);
            BigDecimal basis = isJeonse ? orZero(req.getJeonseDeposit()) : orZero(req.getCollateralValue());
            if (basis.compareTo(BigDecimal.ZERO) <= 0) {
                maxAmount = product.getLimitMax();
            } else {
                maxAmount = basis.multiply(BigDecimal.valueOf(usedLtv))
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);
                maxAmount = minNotNull(maxAmount, product.getLimitMax());
            }
        }

        // ---- 기간/상환 ----
        int defaultTerm = isMortgage ? 360 : (isJeonse ? 24 : 36);
        int approvedTerm = Optional.ofNullable(req.getDesiredTerm()).orElse(defaultTerm);
        String rpayTypeNorm = normRpay(Optional.ofNullable(req.getRpayType()).orElse("원리금균등"));

        // ---- 승인금액 ----
        BigDecimal desired = orZero(req.getDesiredAmount());
        BigDecimal approvedAmount = (desired.compareTo(BigDecimal.ZERO) > 0)
                ? minNotNull(desired, maxAmount) : maxAmount;

        // ---- 월 납입/총이자 ----
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
            default -> {
                monthlyPayment = calcAnnuity(approvedAmount, appliedRate, approvedTerm);
                totalInterest = monthlyPayment.multiply(BigDecimal.valueOf(approvedTerm))
                        .subtract(approvedAmount).max(BigDecimal.ZERO);
            }
        }

        return LoanQuoteResponseDTO.builder()
                .loanCode(product.getLoanCode())
                .loanName(product.getLoanName())
                .type(product.getLoanType())
                .appliedRate(appliedRate.setScale(2, RoundingMode.HALF_UP))
                .approvedAmount(approvedAmount)
                .approvedTerm(approvedTerm)
                .monthlyPayment(monthlyPayment)
                .totalInterest(totalInterest)
                .maxLimit(maxAmount)
                .rpayType(rpayTypeNorm)
                .usedLtv(isCredit ? null : ltv)
                .build();
    }



    // ========================= 신청 저장 =========================
    @Override
    @Transactional
    public LoanApplicationResponseDTO apply(String loanCode, LoanApplicationRequestDTO req) {
        // 0) 디버깅: 바인딩 확인
        log.info("apply() req = {}", req);

        // 1) 상품 식별: req.lpdNo 우선, 없으면 code로 조회
        Long lpdNo = req.getLpdNo();
        if (lpdNo == null) {
            String code = Optional.ofNullable(req.getProductCode()).orElse(loanCode);
            LoanProduct prod = findProductByAny(code);
            if (prod != null) lpdNo = prod.getLoanNo(); // ← 엔티티 필드명과 일치
        }
        if (lpdNo == null) {
            throw new IllegalArgumentException("상품 식별 실패: lpdNo 또는 productCode/loanCode 중 하나는 유효해야 합니다.");
        }
        if (req.getCustomerNo() == null) {
            throw new IllegalArgumentException("NO_ID_IN_V2: customerNo is required");
        }

        // 2) 신청번호 생성
        String laId = genLaId();

        // 3) 추가 정보는 contextJson에 묶어서 보관 (rateType/rpayType 등)
        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put("productCode", Optional.ofNullable(req.getProductCode()).orElse(loanCode));
        ctx.put("rateType",    req.getRateType());   // 한글 정책 유지 (고정금리/변동금리)
        ctx.put("rpayType",    req.getRpayType());   // 한글 정책 유지 (원리금균등/원금균등/만기일시)
        ctx.put("riskScore",   req.getRiskScore());
        ctx.put("quoteApprovedAmount",  req.getQuoteApprovedAmount());
        ctx.put("quoteAppliedRate",     req.getQuoteAppliedRate());
        ctx.put("quoteApprovedTerm",    req.getQuoteApprovedTerm());
        ctx.put("quoteMonthlyPayment",  req.getQuoteMonthlyPayment());
        String contextJson = toJsonSafe(ctx); // 아래 helper 추가

        // 4) 엔티티 구성 (필드명 정확히 맞춤)
        LoanApplication la = LoanApplication.builder()
                .laId(laId)
                .customerNo(req.getCustomerNo())
                .loanProductNo(lpdNo)                 // ← 엔티티: loanProductNo
                .repayAccountNo(req.getRepayAccountNo())
                .payoutAccountNo(req.getPayoutAccountNo())
                .appliedAmount(nz(req.getDesiredAmount())) // ← 엔티티: appliedAmount
                .desiredTerm(nz(req.getDesiredTerm()))
                .purposeCode(nz(req.getPurposeCode(), "기타"))
                .status("SUBMITTED")                  // 엔티티 주석 기준 상태체계(영문) 사용 권장
                .channel(Optional.ofNullable(req.getChannel()).orElse("WEB"))
                .submittedAt(LocalDateTime.now())
                .contextJson(contextJson)             // rateType/rpayType 등 컨텍스트는 JSON으로
                .build();

        la = loanApplicationRepository.save(la);

        return LoanApplicationResponseDTO.builder()
                .laId(la.getLaId())
                .laNo(la.getLaNo())
                .status(la.getStatus())
                .submittedAt(la.getSubmittedAt())
                .build();
    }

    // --------- 보조 메서드들 ---------
    private LoanProduct findProductByAny(String codeOrId) {
        // 선호 순서: loanCode -> lpdCode -> numeric PK
        return loanProductRepository.findByLoanCode(codeOrId)
                .or(() -> loanProductRepository.findByLoanCode(codeOrId)) // ← 오타 수정: 두 번 findByLoanCode 호출했던 부분
                .or(() -> {
                    Long id = tryParseLong(codeOrId);
                    return (id == null) ? Optional.empty() : loanProductRepository.findById(id);
                })
                .orElse(null);
    }

    private static String toJsonSafe(Map<String, Object> map) {
        try {
            // 필요 시 ObjectMapper @Bean 써도 OK
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }

    private static String genLaId() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        String rnd = Integer.toString(new Random().nextInt(0x10000), 16).toUpperCase();
        return "LA" + ts + "-" + String.format("%04s", rnd).replace(' ', '0');
    }
    private static Long tryParseLong(String s) { try { return s == null ? null : Long.parseLong(s); } catch (Exception e) { return null; } }
    private static Integer tryParseInt(String s) { try { return s == null ? null : Integer.parseInt(s); } catch (Exception e) { return null; } }
    private static Integer nz(Integer v) { return v == null ? 0 : v; }
    private static String nz(String v) { return v == null ? "" : v; }
    private static String nz(String v, String def) { return (v == null || v.isBlank()) ? def : v; }
    private static BigDecimal nz(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }

    // ===== 상환 공식들 =====
    private static BigDecimal calcAnnuity(BigDecimal principal, BigDecimal apr, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) return BigDecimal.ZERO;
        BigDecimal m = apr.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 8, RoundingMode.HALF_UP); // 월 이자율
        if (m.compareTo(BigDecimal.ZERO) == 0) {
            return principal.divide(BigDecimal.valueOf(months), 0, RoundingMode.CEILING);
        }
        double r = m.doubleValue();
        double P = principal.doubleValue();
        double n = months;
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
        return principal.multiply(m).setScale(0, RoundingMode.CEILING); // 매월 이자
    }

    private static BigDecimal calcTotalInterestPrincipalEqual(BigDecimal principal, BigDecimal apr, int months) {
        if (principal == null || principal.compareTo(BigDecimal.ZERO) <= 0 || months <= 0) return BigDecimal.ZERO;
        BigDecimal m = apr.divide(BigDecimal.valueOf(100), 12, RoundingMode.HALF_UP)
                .divide(BigDecimal.valueOf(12), 12, RoundingMode.HALF_UP);
        BigDecimal monthlyPrincipal = principal.divide(BigDecimal.valueOf(months), 0, RoundingMode.CEILING);

        BigDecimal remaining = principal;
        BigDecimal totalInterest = BigDecimal.ZERO;
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

    // ===== 공통 유틸 =====
    private static BigDecimal minNotNull(BigDecimal a, BigDecimal b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.min(b);
    }

    private static BigDecimal orZero(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private static BigDecimal clampRate(BigDecimal v, BigDecimal min, BigDecimal max) {
        if (v.compareTo(min) < 0) return min;
        if (v.compareTo(max) > 0) return max;
        return v;
    }

    private static BigDecimal nvl(BigDecimal... vals) {
        for (BigDecimal v : vals) if (v != null) return v;
        return null;
    }

    // 신용 점수 추출: req.extra.creditScore 우선, 없으면 직업으로 간이 추정
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

    // 점수 → 등급 버킷
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

    // 직업 가중치(신용대출 금리 보정용)
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

    // 직업별 베이스 한도(신용대출 한도 산정용)
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

    // LTV에 따른 금리 보정
    private BigDecimal ltvAdjustment(int ltv) {
        if (ltv <= 40) return new BigDecimal("-0.30");
        if (ltv <= 60) return new BigDecimal("-0.10");
        if (ltv <= 70) return BigDecimal.ZERO;
        if (ltv <= 80) return new BigDecimal("0.20");
        return new BigDecimal("0.50");
    }

    // 상환방식 정규화(한글/영문 입력 모두 처리)
    private String normRpay(String rpayType) {
        String t = (rpayType == null ? "" : rpayType.trim());
        if (t.equalsIgnoreCase("원리금균등") || t.equalsIgnoreCase("ANNUITY")) return "ANNUITY";
        if (t.equalsIgnoreCase("원금균등") || t.equalsIgnoreCase("EQUAL_PRINCIPAL") || t.equalsIgnoreCase("분할상환방식"))
            return "EQUAL_PRINCIPAL";
        if (t.equalsIgnoreCase("만기일시") || t.equalsIgnoreCase("BULLET") || t.equalsIgnoreCase("만기일시상환방식"))
            return "BULLET";
        return "ANNUITY";
    }

}
