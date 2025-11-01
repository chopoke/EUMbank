// src/main/java/com/boot/eumbank/loan/service/FinlifeUpsert.java
package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.FinlifeCreditResponseDTO;
import com.boot.eumbank.loan.entity.LoanCreditOption;
import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanRateOption;
import com.boot.eumbank.loan.repository.LoanCreditRepository;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import com.boot.eumbank.loan.repository.LoanRateOptionRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinlifeUpsert {

    private final LoanProductRepository productRepo;
    private final LoanRateOptionRepository rateOptRepo;
    private final LoanCreditRepository creditOptRepo;

    // =========================================
    // 로컬 PageResult (기존 FinlifeSaveSync.PageResult 대체)
    // =========================================
    @Data @AllArgsConstructor
    public static class PageResult {
        private int upserted;
        private Integer nowPageNo;
        private Integer maxPageNo;
    }

    /**
     * FSS 한 페이지 업서트 (상품 + 옵션)
     * 공통(주택담보+전세자금)
     * 옵션을 '상품코드'로 그룹핑!
     * @param loanType PERSONAL / MORTGAGE / JEONSE
     */
    @Transactional
    public <B,O> PageResult upsertOnePageGeneric(
            String loanType, int pageNo,
            List<B> baseList, List<O> optList,
            // ─ 상품(base) 추출자
            Function<B,String> b_finPrdtCd,
            Function<B,String> b_finPrdtNm,
            Function<B,String> b_korCoNm,
            Function<B,String> b_finCoNo,
            Function<B,String> b_dclsMonth,
            Function<B,String> b_joinWay,
            Function<B,String> b_dclsStrtDay,
            Function<B,String> b_dclsEndDay,
            Function<B, String> b_finCoSubmDay,
            Function<B,String> b_loanInciExpn,
            Function<B,String> b_erlyRpayFee,
            Function<B,String> b_dlyRate,
            Function<B,String> b_loanLmt,
            Function<B,String> b_etcNote,
            // ─ 옵션 필드
            Function<O,String>     o_finPrdtCd,
            Function<O,String>     o_mrtgTypeNm,
            Function<O,String>     o_rpayTypeNm,
            Function<O,String>     o_lendRateTypeNm,
            Function<O,BigDecimal> o_lendRateMin,
            Function<O,BigDecimal> o_lendRateMax,
            Function<O,BigDecimal> o_lendRateAvg,
            // 없으면 null
            Function<O,Integer>    o_termMonth,
            Function<O,String>     o_dclsMonth,
            Function<O,String>     o_note,
            Integer nowPageNo,
            Integer maxPageNo
    ) {
        // 옵션을 상품코드로 그룹핑
        Map<String, List<O>> optsByProduct = new HashMap<>();
        for (var o : optList) {
            String code = safe(o_finPrdtCd, o);
            if (code == null) continue;
            optsByProduct.computeIfAbsent(code, k -> new ArrayList<>()).add(o);
        }

        int upsertCount = 0;

        for (var b : baseList) {
            String finPrdtCd = safe(b_finPrdtCd, b);
            if (finPrdtCd == null || finPrdtCd.isBlank()) continue;

            List<O> opts = optsByProduct.getOrDefault(finPrdtCd, Collections.emptyList());

            // ─ 금리 집계
            BigDecimal rateMin = minFiltered(opts, o_lendRateMin);
            BigDecimal rateMax = maxFiltered(opts, o_lendRateMax);

            // ─ 한도/LTV 파싱
            String loanLmtRaw = safe(b_loanLmt, b);

            // ─ 상품 업서트
            LoanProduct product = productRepo.findByLoanCode(finPrdtCd).orElseGet(LoanProduct::new);
            boolean isNew = (product.getLoanNo() == null);

            if (isNew) {
                product.setLoanCode(finPrdtCd);
                product.setLoanType(loanType);
                product.setStatus("PUBLISHED");
                product.setIsActive(true);
                product.setSourceType("API");
            }

            product.setLoanName(safe(b_finPrdtNm, b));
            product.setBankName(safe(b_korCoNm, b));
            product.setFinCoNo(safe(b_finCoNo, b));
            product.setDclsMonth(safe(b_dclsMonth, b));
            product.setJoinWay(safe(b_joinWay, b));
            product.setDclsStartDay(safe(b_dclsStrtDay, b));
            product.setDclsEndDay(safe(b_dclsEndDay, b));
            product.setFinCoSubmDay(safe(b_finCoSubmDay, b));

            // 주담/전세 전용 베이스 원문들
            product.setLoanInciExpn(safe(b_loanInciExpn, b));
            product.setErlyRpayFee(safe(b_erlyRpayFee, b));
            product.setDlyRate(safe(b_dlyRate, b));

            // 한도/LTV(집계 및 원문)
            product.setLoanLmtRaw(loanLmtRaw);
            product.setLimitMax(extractMaxWon(loanLmtRaw));
            product.setLtvMax(extractMaxLtv(loanLmtRaw));

            // 금리 집계(옵션에서)
            product.setRateMin(rateMin);
            product.setRateMax(rateMax);

            product.setEtcNote(safe(b_etcNote, b));

            product = productRepo.save(product);

            // 기존 옵션 제거 후 다시 적재
            var oldRateOpts = rateOptRepo.findByProduct(product);
            if (!oldRateOpts.isEmpty()) rateOptRepo.deleteAll(oldRateOpts);

            if (!opts.isEmpty()) {
                List<LoanRateOption> entities = new ArrayList<>(opts.size());
                for (var o : opts) {
                    LoanRateOption e = new LoanRateOption();
                    e.setProduct(product);
                    e.setRpayTypeNm(safe(o_rpayTypeNm, o));
                    e.setLendRateTypeNm(safe(o_lendRateTypeNm, o));
                    e.setLendRateMin(safe(o_lendRateMin, o));
                    e.setLendRateMax(safe(o_lendRateMax, o));
                    e.setLendRateAvg(safe(o_lendRateAvg, o));

                    // 스키마에 mrtgTypeNm 컬럼이 없다면 note에 병기
                    String note = safe(o_note, o);
                    String mrtg = safe(o_mrtgTypeNm, o);
                    if (mrtg != null && (note == null || !note.contains("담보유형:"))) {
                        note = (note == null ? "" : note + " | ") + "담보유형:" + mrtg;
                    }
                    e.setNote(note);
                    entities.add(e);
                }

                if (!"MORTGAGE".equals(loanType) && !"JEONSE".equals(loanType)) {
                    log.warn("[SYNC:{}] rate options save skipped (not JEONSE/MORTGAGE). product={}", loanType, finPrdtCd);
                } else {
                    rateOptRepo.saveAll(entities);
                }
            }

            upsertCount++;
        }
        log.info("[SYNC:{}] page {} upsert {}건 (now/max={}/{})",
                loanType, pageNo, upsertCount, nowPageNo, maxPageNo);
        return new PageResult(upsertCount, nowPageNo, maxPageNo);
    }

    /**
     * 신용대출 옵션 업서트
     * 옵션을(A/B/C)타입으로 그룹핑 후, 타입별 1행만 upsert
     */
    @Transactional
    public PageResult upsertOnePageCredit(
            int pageNo,
            List<FinlifeCreditResponseDTO.Base> baseList,
            List<FinlifeCreditResponseDTO.Option> optList,
            Integer nowPageNo, Integer maxPageNo
    ){
        Map<String, List<FinlifeCreditResponseDTO.Option>> optsByProduct =
                optList.stream().collect(Collectors.groupingBy(FinlifeCreditResponseDTO.Option::getFinPrdtCd));

        int upsertCount = 0;

        for (var b: baseList) {
            String code = b.getFinPrdtCd();
            if (code == null || code.isBlank()) continue;

            var rawOpts = optsByProduct.getOrDefault(code, Collections.emptyList());

            // 타입(A/B/C) 기준으로 그룹핑 (null/공백 제외)
            Map<String, List<FinlifeCreditResponseDTO.Option>> byType = rawOpts.stream()
                    .map(o -> new AbstractMap.SimpleEntry<>(trimToNull(o.getCrdtLendRateType()), o))
                    .filter(e -> e.getKey() != null)
                    .collect(Collectors.groupingBy(
                            e -> e.getKey().toUpperCase(),
                            Collectors.mapping(Map.Entry::getValue, Collectors.toList())
                    ));

            // A타입 min/max(표시용)
            BigDecimal min = byType.getOrDefault("A", List.of()).stream()
                    .map(FinlifeCreditResponseDTO.Option::getGradAvg)
                    .filter(Objects::nonNull).min(BigDecimal::compareTo).orElse(null);
            BigDecimal max = byType.getOrDefault("A", List.of()).stream()
                    .map(FinlifeCreditResponseDTO.Option::getGradAvg)
                    .filter(Objects::nonNull).max(BigDecimal::compareTo).orElse(null);

            // ─ 상품 UPSERT
            LoanProduct p = productRepo.findByLoanCode(code).orElseGet(LoanProduct::new);
            boolean isNew = (p.getLoanNo() == null);
            if (isNew) {
                p.setLoanCode(code);
                p.setLoanType("CREDIT");
                p.setStatus("PUBLISHED");
                p.setIsActive(true);
                p.setSourceType("API");
            }
            p.setLoanName(b.getFinPrdtNm());
            p.setBankName(b.getKorCoNm());
            p.setFinCoNo(b.getFinCoNo());
            p.setDclsMonth(b.getDclsMonth());
            p.setDclsStartDay(b.getDclsStrtDay());
            p.setDclsEndDay(b.getDclsEndDay());
            p.setFinCoSubmDay(b.getFinCoSubmDay());

            // 신용 전용 베이스
            p.setCrdtPrdtType(b.getCrdtPrdtType());
            p.setCrdtPrdtTypeNm(b.getCrdtPrdtTypeNm());
            p.setCbName(b.getCbName());

            p.setRateMin(min);
            p.setRateMax(max);

            p.setJoinWay(b.getJoinWay());
            p.setEtcNote(b.getEtcNote());

            p = productRepo.save(p);

            // 타입별 1행씩 upsert (유니크 (lpd_no, rate_type) 가정)
            for (var entry : byType.entrySet()) {
                String type = entry.getKey();            // A/B/C
                var list = entry.getValue();

                // ✅ 레포 메서드명 통일
                var existingOpt = creditOptRepo.findFirstByLoanProductAndRateType(p, type).orElse(null);

                if (existingOpt == null) {
                    existingOpt = new LoanCreditOption();
                    existingOpt.setLoanProduct(p);
                    existingOpt.setRateType(type);
                }
                existingOpt.setRateTypeNm(pickMostCommonNameCrdt(list));
                existingOpt.setG1(avgOf(list.stream().map(FinlifeCreditResponseDTO.Option::getGrad1)));
                existingOpt.setG4(avgOf(list.stream().map(FinlifeCreditResponseDTO.Option::getGrad4)));
                existingOpt.setG5(avgOf(list.stream().map(FinlifeCreditResponseDTO.Option::getGrad5)));
                existingOpt.setG6(avgOf(list.stream().map(FinlifeCreditResponseDTO.Option::getGrad6)));
                existingOpt.setG10(avgOf(list.stream().map(FinlifeCreditResponseDTO.Option::getGrad10)));
                existingOpt.setG11(avgOf(list.stream().map(FinlifeCreditResponseDTO.Option::getGrad11)));
                existingOpt.setG12(avgOf(list.stream().map(FinlifeCreditResponseDTO.Option::getGrad12)));
                existingOpt.setG13(avgOf(list.stream().map(FinlifeCreditResponseDTO.Option::getGrad13)));
                existingOpt.setAvg(avgOf(list.stream().map(FinlifeCreditResponseDTO.Option::getGradAvg)));

                creditOptRepo.save(existingOpt);
            }

            if (rawOpts.stream().anyMatch(o -> trimToNull(o.getCrdtLendRateType()) == null)) {
                log.warn("[CREDIT] {} has options with blank lendRateType — skipped", code);
            }

            upsertCount++;
        }

        log.info("[SYNC:CREDIT] page {} upsert {}건 (now/max={}/{})",
                pageNo, upsertCount, nowPageNo, maxPageNo);
        return new PageResult(upsertCount, nowPageNo, maxPageNo);
    }

    private static String pickMostCommonNameCrdt(List<FinlifeCreditResponseDTO.Option> list) {
        return list.stream().map(FinlifeCreditResponseDTO.Option::getCrdtLendRateTypeNm)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(x -> x, Collectors.counting()))
                .entrySet().stream().max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse(null);
    }

    // ===== 공통 유틸 =====
    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static BigDecimal avgOf(Stream<BigDecimal> s) {
        var list = s.filter(Objects::nonNull).toList();
        if (list.isEmpty()) return null;
        return list.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(list.size()), 4, RoundingMode.HALF_UP);
    }

    private static <T, R> R safe(Function<T, R> f, T v) {
        if (f == null) return null;
        try { return f.apply(v); } catch (Exception ignore) { return null; }
    }

    // 금리 가드: null 제외 + (0,50) 구간만 인정
    private static <O> BigDecimal minFiltered(List<O> list, Function<O, BigDecimal> getter) {
        BigDecimal lower = new BigDecimal("0");
        BigDecimal upper = new BigDecimal("50");
        return list.stream().map(getter).filter(Objects::nonNull)
                .filter(r -> r.compareTo(lower) > 0 && r.compareTo(upper) < 0)
                .min(BigDecimal::compareTo).orElse(null);
    }
    private static <O> BigDecimal maxFiltered(List<O> list, Function<O, BigDecimal> getter) {
        BigDecimal lower = new BigDecimal("0");
        BigDecimal upper = new BigDecimal("50");
        return list.stream().map(getter).filter(Objects::nonNull)
                .filter(r -> r.compareTo(lower) > 0 && r.compareTo(upper) < 0)
                .max(BigDecimal::compareTo).orElse(null);
    }

    //-- 한도/ltv 파서 (문구 -> 숫자)
    private static final java.util.regex.Pattern P_EOK =
            java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*억(?:원)?");
    private static final java.util.regex.Pattern P_CHEONMAN =
            java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*천\\s*만(?:원)?");
    private static final java.util.regex.Pattern P_MAN =
            java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*만(?:원)?");
    private static final java.util.regex.Pattern P_WON =
            java.util.regex.Pattern.compile("(\\d{1,3}(?:,\\d{3})+|\\d+)\\s*원");
    private static final BigDecimal U_EOK      = new BigDecimal("100000000");
    private static final BigDecimal U_CHEONMAN = new BigDecimal("10000000");
    private static final BigDecimal U_MAN      = new BigDecimal("10000");

    private static BigDecimal extractMaxWon(String raw){
        if (raw == null) return null;
        String s = raw.replaceAll("\\s+", "");
        BigDecimal max = null;
        max = maxOf(max, scanAll(s, P_EOK, U_EOK, false));
        max = maxOf(max, scanAll(s, P_CHEONMAN, U_CHEONMAN, false));
        max = maxOf(max, scanAll(s, P_MAN, U_MAN, false));
        max = maxOf(max, scanAll(s, P_WON, BigDecimal.ONE, true));
        return max;
    }

    private static BigDecimal scanAll(String s, java.util.regex.Pattern p, BigDecimal unit, boolean stripComma) {
        var m = p.matcher(s);
        BigDecimal max = null;
        while (m.find()) {
            String n = m.group(1);
            if (stripComma) n = n.replace(",", "");
            try {
                BigDecimal v = new BigDecimal(n).multiply(unit);
                max = maxOf(max, v);
            } catch (Exception ignore) {}
        }
        return max;
    }

    private static BigDecimal maxOf(BigDecimal a, BigDecimal b) {
        if (b == null) return a;
        if (a == null) return b;
        return a.max(b);
    }

    private static Integer extractMaxLtv(String raw){
        if (raw == null) return null;
        var m = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*%").matcher(raw);
        BigDecimal max = null;
        while (m.find()) {
            try {
                BigDecimal v = new BigDecimal(m.group(1));
                max = (max == null) ? v : max.max(v);
            } catch (Exception ignore) {}
        }
        return (max == null) ? null : max.setScale(0, RoundingMode.HALF_UP).intValue();
    }
}
