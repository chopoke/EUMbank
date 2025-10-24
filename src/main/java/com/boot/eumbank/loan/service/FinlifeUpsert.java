package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanProductOption;
import com.boot.eumbank.loan.repository.LoanProductOptionRepository;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.function.Function;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinlifeUpsert {

    private final LoanProductRepository productRepo;
    private final LoanProductOptionRepository optionRepo;

    /**
     * FSS 한 페이지 업서트 (상품 + 옵션)
     * @param loanType PERSONAL / MORTGAGE / JEONSE
     */
    @Transactional
    public <B,O> FinlifeSaveSync.PageResult upsertOnePageGeneric(
            String loanType, int pageNo,
            List<B> baseList, List<O> optList,
            // ─ 상품(base) 추출자
            Function<B,String> b_finPrdtCd,
            Function<B,String> b_finPrdtNm,
            Function<B,String> b_korCoNm,
            Function<B,String> b_finCoNo,
            Function<B,String> b_dclsMonth,
            Function<B,String> b_loanLmt,
            Function<B,String> b_joinWay,
            Function<B,String> b_etcNote,
            // ─ 옵션(option) 추출자
            Function<O,String>     o_finPrdtCd,
            Function<O,BigDecimal> o_lendRateMin,
            Function<O,BigDecimal> o_lendRateMax,
            Function<O,BigDecimal> o_lendRateAvg,
            Function<O,String>     o_rpayTypeNm,
            Function<O,String>     o_lendRateTypeNm,
            // 확장 필드 (없으면 null 전달 가능)
            Function<O,Integer>    o_termMonth,
            Function<O,String>     o_dclsMonth,
            Function<O,Boolean>    o_isOverdraft,
            Function<O,String>     o_note,
            Integer nowPageNo, Integer maxPageNo
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

            // ─ 금리 집계 (0/이상치/더미 제외)
            BigDecimal rateMin = minFiltered(opts, o_lendRateMin);
            BigDecimal rateMax = maxFiltered(opts, o_lendRateMax);

            // ─ 한도/LTV 파싱
            String loanLmtRaw = safe(b_loanLmt, b);
            BigDecimal limitWon = extractMaxWon(loanLmtRaw); // DECIMAL(18,0)
            Integer ltvMax = extractMaxLtv(loanLmtRaw);      // 정수 %

            // ─ 상품 업서트
            LoanProduct product = productRepo.findByLoanCode(finPrdtCd).orElseGet(LoanProduct::new);
            boolean isNew = (product.getLoanNo() == null);

            if (isNew) {
                product.setLoanCode(finPrdtCd);
                product.setLoanType(loanType);
                product.setStatus("Y");
            }

            product.setLoanName(safe(b_finPrdtNm, b));
            product.setBankName(safe(b_korCoNm, b));
            product.setFinCoNo(safe(b_finCoNo, b));
            product.setLoanLmtRaw(loanLmtRaw);
            product.setLimitMax(limitWon);
            product.setLtvMax(ltvMax);
            product.setRateMin(rateMin);
            product.setRateMax(rateMax);
            product.setDclsMonth(safe(b_dclsMonth, b));
            product.setJoinWay(safe(b_joinWay, b));
            product.setEtcNote(safe(b_etcNote, b));

            product = productRepo.save(product);

            // ─ 옵션 재적재(간단/안전)
            optionRepo.deleteAllByProduct(product);

            if (!opts.isEmpty()) {
                List<LoanProductOption> entities = new ArrayList<>(opts.size());
                for (var o : opts) {
                    LoanProductOption entity = LoanProductOption.builder()
                            .product(product)
                            .rpayTypeNm(safe(o_rpayTypeNm, o))
                            .lendRateTypeNm(safe(o_lendRateTypeNm, o))
                            .lendRateMin(safe(o_lendRateMin, o))
                            .lendRateMax(safe(o_lendRateMax, o))
                            .lendRateAvg(safe(o_lendRateAvg, o))
                            .termMonth(safe(o_termMonth, o))
                            .dclsMonth(orElse(safe(o_dclsMonth, o), product.getDclsMonth()))
                            .isOverdraft(Boolean.TRUE.equals(safe(o_isOverdraft, o)) ? "Y" : "N")
                            .note(safe(o_note, o))
                            .build();
                    entities.add(entity);
                }
                optionRepo.saveAll(entities);
            }

            upsertCount++;
        }

        log.info("[SYNC:{}] page {} upsert {}건 (now/max={}/{})",
                loanType, pageNo, upsertCount, nowPageNo, maxPageNo);
        return new FinlifeSaveSync.PageResult(upsertCount, nowPageNo, maxPageNo);
    }

    // ───────────────────────────── 헬퍼들 ─────────────────────────────

    private static <T, R> R safe(Function<T, R> f, T v) {
        if (f == null) return null;
        try { return f.apply(v); } catch (Exception ignore) { return null; }
    }

    private static String orElse(String v, String def) {
        return (v == null || v.isBlank()) ? def : v;
    }

    // 금리 가드: null 제외 + (0,50) 구간만 인정 (필요시 조정)
    private static <O> BigDecimal minFiltered(List<O> list, Function<O, BigDecimal> getter) {
        BigDecimal lower = new BigDecimal("0");
        BigDecimal upper = new BigDecimal("50");
        return list.stream()
                .map(getter)
                .filter(Objects::nonNull)
                .filter(r -> r.compareTo(lower) > 0 && r.compareTo(upper) < 0)
                .min(BigDecimal::compareTo)
                .orElse(null);
    }

    private static <O> BigDecimal maxFiltered(List<O> list, Function<O, BigDecimal> getter) {
        BigDecimal lower = new BigDecimal("0");
        BigDecimal upper = new BigDecimal("50");
        return list.stream()
                .map(getter)
                .filter(Objects::nonNull)
                .filter(r -> r.compareTo(lower) > 0 && r.compareTo(upper) < 0)
                .max(BigDecimal::compareTo)
                .orElse(null);
    }

    // ── 한도/ltv 파서 (문구 → 숫자)
    // "70억원", "1.5억", "3천만", "250만", "123,456,789원" 등
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

    private static BigDecimal extractMaxWon(String raw) {
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

    private static Integer extractMaxLtv(String raw) {
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
