package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.FinlifeCreditResponseDTO;
import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.entity.LoanProductOption;
import com.boot.eumbank.loan.repository.LoanProductOptionRepository;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinlifeSaveSync {

    private final FssFinlifeService fss; // FSS API 호출 서비스
    private final LoanProductRepository productRepo;
    private final LoanProductOptionRepository optionRepo;

    private final ObjectMapper om = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    /** 새벽 3시(서울)마다 동기화 */
    @Scheduled(cron = "${jobs.finlife.sync.cron:0 0 3 * * *}", zone = "${jobs.timezone:Asia/Seoul}")
    public void runSave() {
        upsertAllPagesMortgage("020000"); // 주담대
        upsertAllPagesJeonse("020000");   // 전세자금(임차)
        upsertAllPagesCredit("020000");   // 신용대출
    }

    // ===== 페이지 루프 공통 =====

    @FunctionalInterface
    private interface PageWorker {
        PageResult work(String topFinGrpNo, int pageNo);
    }

    private record PageResult(int upserted, Integer nowPageNo, Integer maxPageNo) {}

    private void loopPages(String topFinGrpNo, String loanType, PageWorker worker) {
        int page = 1, total = 0;
        while (true) {
            PageResult pr = worker.work(topFinGrpNo, page);
            total += pr.upserted();
            if (pr.nowPageNo() == null || pr.maxPageNo() == null || pr.nowPageNo() >= pr.maxPageNo()) {
                log.info("[SYNC:{}] 마지막 페이지 {} 완료. 총 upsert {}", loanType, page, total);
                break;
            }
            page++;
        }
    }

    // ===== 각 상품군별 엔트리 =====

    /** 주택담보대출 */
    public void upsertAllPagesMortgage(String topFinGrpNo) {
        loopPages(topFinGrpNo, "MORTGAGE", (grp, page) -> {
            try {
                String json = fss.getMortgageProductsRaw(grp, page);
                var res = om.readValue(json, com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.class);
                var r = res.getResult();

                return upsertOnePageGeneric(
                        "MORTGAGE", page,
                        Optional.ofNullable(r).map(com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Result::getBaseList).orElse(List.of()),
                        Optional.ofNullable(r).map(com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Result::getOptionList).orElse(List.of()),
                        // Base extractors
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Base::getFinPrdtCd,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Base::getFinPrdtNm,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Base::getKorCoNm,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Base::getFinCoNo,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Base::getDclsMonth,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Base::getLoanLmt,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Base::getJoinWay,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Base::getEtcNote,
                        // Option extractors
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Option::getFinPrdtCd,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Option::getLendRateMin,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Option::getLendRateMax,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Option::getLendRateAvg,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Option::getRpayTypeNm,
                        com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Option::getLendRateTypeNm,
                        Optional.ofNullable(r).map(com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Result::getNowPageNo).orElse(null),
                        Optional.ofNullable(r).map(com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO.Result::getMaxPageNo).orElse(null)
                );
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    /** 전세자금대출 */
    public void upsertAllPagesJeonse(String topFinGrpNo) {
        loopPages(topFinGrpNo, "JEONSE", (grp, page) -> {
            try {
                String json = fss.getJeonseProductsRaw(grp, page);
                var res = om.readValue(json, com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.class);
                var r = res.getResult();

                return upsertOnePageGeneric(
                        "JEONSE", page,
                        Optional.ofNullable(r).map(com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Result::getBaseList).orElse(List.of()),
                        Optional.ofNullable(r).map(com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Result::getOptionList).orElse(List.of()),
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Base::getFinPrdtCd,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Base::getFinPrdtNm,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Base::getKorCoNm,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Base::getFinCoNo,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Base::getDclsMonth,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Base::getLoanLmt,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Base::getJoinWay,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Base::getEtcNote,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Option::getFinPrdtCd,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Option::getLendRateMin,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Option::getLendRateMax,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Option::getLendRateAvg,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Option::getRpayTypeNm,
                        com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Option::getLendRateTypeNm,
                        Optional.ofNullable(r).map(com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Result::getNowPageNo).orElse(null),
                        Optional.ofNullable(r).map(com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO.Result::getMaxPageNo).orElse(null)
                );
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    /** 신용대출 */
    public void upsertAllPagesCredit(String topFinGrpNo) {
        loopPages(topFinGrpNo, "PERSONAL", (grp, page) -> {
            try {
                String json = fss.getCreditProductsRaw(grp, page);
                var res = om.readValue(json, com.boot.eumbank.loan.dto.FinlifeCreditResponseDTO.class);
                var r = res.getResult();

                return upsertOnePageGeneric(
                        "PERSONAL", page,
                        Optional.ofNullable(r).map(FinlifeCreditResponseDTO.Result::getBaseList).orElse(List.of()),
                        Optional.ofNullable(r).map(FinlifeCreditResponseDTO.Result::getOptionList).orElse(List.of()),
                        FinlifeCreditResponseDTO.Base::getFinPrdtCd,
                        FinlifeCreditResponseDTO.Base::getFinPrdtNm,
                        FinlifeCreditResponseDTO.Base::getKorCoNm,
                        FinlifeCreditResponseDTO.Base::getFinCoNo,
                        FinlifeCreditResponseDTO.Base::getDclsMonth,
                        FinlifeCreditResponseDTO.Base::getLoanLmt,
                        FinlifeCreditResponseDTO.Base::getJoinWay,
                        FinlifeCreditResponseDTO.Base::getEtcNote,
                        FinlifeCreditResponseDTO.Option::getFinPrdtCd,
                        FinlifeCreditResponseDTO.Option::getLendRateMin,
                        FinlifeCreditResponseDTO.Option::getLendRateMax,
                        FinlifeCreditResponseDTO.Option::getLendRateAvg,
                        FinlifeCreditResponseDTO.Option::getRpayTypeNm,
                        FinlifeCreditResponseDTO.Option::getLendRateTypeNm,
                        Optional.ofNullable(r).map(FinlifeCreditResponseDTO.Result::getNowPageNo).orElse(null),
                        Optional.ofNullable(r).map(FinlifeCreditResponseDTO.Result::getMaxPageNo).orElse(null)
                );
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

    // ===== 제너릭 업서트 (페이지 단위 트랜잭션) =====

    @Transactional
    private <B,O> PageResult upsertOnePageGeneric(
            String loanType, int pageNo,
            List<B> baseList, List<O> optList,
            // Base extractors
            Function<B,String> b_finPrdtCd,
            Function<B,String> b_finPrdtNm,
            Function<B,String> b_korCoNm,
            Function<B,String> b_finCoNo,
            Function<B,String> b_dclsMonth,
            Function<B,String> b_loanLmt,
            Function<B,String> b_joinWay,
            Function<B,String> b_etcNote,
            // Option extractors
            Function<O,String>  o_finPrdtCd,
            Function<O,Double>  o_lendRateMin,
            Function<O,Double>  o_lendRateMax,
            Function<O,Double>  o_lendRateAvg,
            Function<O,String>  o_rpayTypeNm,
            Function<O,String>  o_lendRateTypeNm,
            // page info
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
            Long   limitWon = extractMaxWon(loanLmt);
            Integer ltvMax  = extractMaxLtv(loanLmt);

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

            optionRepo.deleteByProduct(product);
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
        return new PageResult(upsertCount, nowPageNo, maxPageNo);
    }

    // ===== 문자열 파서(한도/LTV) =====

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
