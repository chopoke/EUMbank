package com.boot.eumbank.loan.service;


import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanProductOption;
import com.boot.eumbank.loan.repository.LoanProductOptionRepository;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinlifeUpsert {
    private final LoanProductRepository productRepo;
    private final LoanProductOptionRepository optionRepo;

    @Transactional
    public <B,O> FinlifeSaveSync.PageResult upsertOnePageGeneric(
            String loanType, int pageNo,
            List<B> baseList, List<O> optList,
            Function<B,String> b_finPrdtCd,
            Function<B,String> b_finPrdtNm,
            Function<B,String> b_korCoNm,
            Function<B,String> b_finCoNo,
            Function<B,String> b_dclsMonth,
            Function<B,String> b_loanLmt,
            Function<B,String> b_joinWay,
            Function<B,String> b_etcNote,
            Function<O,String>  o_finPrdtCd,
            Function<O,Double>  o_lendRateMin,
            Function<O,Double>  o_lendRateMax,
            Function<O,Double>  o_lendRateAvg,
            Function<O,String>  o_rpayTypeNm,
            Function<O,String>  o_lendRateTypeNm,
            Integer nowPageNo, Integer maxPageNo
    ) {
        Map<String, List<O>> optsByProduct = new HashMap<>();
        for (var o : optList) {
            String code = o_finPrdtCd.apply(o);
            if (code == null) continue;
            optsByProduct.computeIfAbsent(code, k -> new ArrayList<>()).add(o);
        }

        int upsertCount = 0;

        for (var b : baseList) {
            String finPrdtCd = b_finPrdtCd.apply(b);
            if (finPrdtCd == null) continue;

            List<O> opts = optsByProduct.getOrDefault(finPrdtCd, List.of());

            Double rateMin = opts.stream().map(o_lendRateMin).filter(Objects::nonNull).min(Double::compareTo).orElse(null);
            Double rateMax = opts.stream().map(o_lendRateMax).filter(Objects::nonNull).max(Double::compareTo).orElse(null);

            String loanLmt = b_loanLmt.apply(b);
            Long   limitWon = extractMaxWon(loanLmt);   // ← 여기서 필요
            Integer ltvMax  = extractMaxLtv(loanLmt);   // ← 여기서 필요

            LoanProduct product = productRepo.findByLoanCode(finPrdtCd).orElseGet(LoanProduct::new);
            boolean isNew = (product.getLoanNo() == 0);
            if (isNew) {
                product.setLoanCode(finPrdtCd);
                product.setLoanType(loanType);
                product.setStatus("Y");
            }

            product.setLoanName(b_finPrdtNm.apply(b));
            product.setBankName(b_korCoNm.apply(b));
            product.setFinCoNo(b_finCoNo.apply(b));
            product.setLoanLmtRaw(loanLmt);
            product.setLimitMax(limitWon);
            product.setLtvMax(ltvMax);
            product.setRateMin(rateMin);
            product.setRateMax(rateMax);
            product.setDclsMonth(b_dclsMonth.apply(b));
            product.setJoinWay(b_joinWay.apply(b));
            product.setEtcNote(b_etcNote.apply(b));

            product = productRepo.save(product);

            optionRepo.deleteAllByProduct(product);
            if (!opts.isEmpty()) {
                List<LoanProductOption> entities = new ArrayList<>(opts.size());
                for (var o : opts) {
                    entities.add(LoanProductOption.builder()
                            .product(product)
                            .rpayTypeNm(o_rpayTypeNm.apply(o))
                            .lendRateTypeNm(o_lendRateTypeNm.apply(o))
                            .lendRateMin(o_lendRateMin.apply(o))
                            .lendRateMax(o_lendRateMax.apply(o))
                            .lendRateAvg(o_lendRateAvg.apply(o))
                            .build());
                }
                optionRepo.saveAll(entities);
            }

            upsertCount++;
        }

        log.info("[SYNC:{}] page {} upsert {}건", loanType, pageNo, upsertCount);
        return new FinlifeSaveSync.PageResult(upsertCount, nowPageNo, maxPageNo);
    }

    // ── 여기 추가: 한도/ltv 파서 ─────────────────────────────────────────────
    private static Long extractMaxWon(String raw){
        if (raw == null) return null;
        String s = raw.replace(",", "");
        double max = -1;
        max = Math.max(max, scanMax(s, "(\\d+(?:\\.\\d+)?)\\s*억(?:원)?", 100_000_000));
        max = Math.max(max, scanMax(s, "(\\d+)\\s*천만(?:원)?", 10_000_000));
        max = Math.max(max, scanMax(s, "(\\d+)\\s*백만(?:원)?", 1_000_000));
        max = Math.max(max, scanMax(s, "(\\d+(?:\\.\\d+)?)\\s*만(?:원)?", 10_000));
        max = Math.max(max, scanMax(s, "(\\d+)\\s*원", 1));
        return (max < 0) ? null : (long)Math.floor(max);
    }
    private static double scanMax(String s, String regex, double unit){
        var m = java.util.regex.Pattern.compile(regex).matcher(s);
        double max = -1;
        while (m.find()){
            try {
                double v = Double.parseDouble(m.group(1)) * unit;
                if (v > max) max = v;
            } catch (Exception ignore) {}
        }
        return max;
    }
    private static Integer extractMaxLtv(String raw){
        if (raw == null) return null;
        var m = java.util.regex.Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*%").matcher(raw);
        double max = -1;
        while (m.find()){
            try {
                double v = Double.parseDouble(m.group(1));
                if (v > max) max = v;
            } catch (Exception ignore) {}
        }
        return (max < 0) ? null : (int)Math.round(max);
    }
}
