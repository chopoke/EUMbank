package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.FinlifeCreditResponseDTO;
import com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO;
import com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO;
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
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.*;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinlifeSaveSync {

    private final FssFinlifeService fss; // FSS API 호출 서비스
    private final FinlifeUpsert upsertTx;

    private final ObjectMapper om = new ObjectMapper()
            .setPropertyNamingStrategy(com.fasterxml.jackson.databind.PropertyNamingStrategies.SNAKE_CASE)
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    /** 새벽 3시(서울)마다 동기화 */
    @Scheduled(cron = "${jobs.finlife.sync.cron:0/15 * * * * *}", zone = "${jobs.timezone:Asia/Seoul}")
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

    public static record PageResult(int upserted, Integer nowPageNo, Integer maxPageNo) {}

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
                var res = om.readValue(json, FinlifeMortgageResponseDTO.class);
                var r = res.getResult();
                return upsertTx.upsertOnePageGeneric(
                        "MORTGAGE", page,
                        Optional.ofNullable(r).map(FinlifeMortgageResponseDTO.Result::getBaseList).orElse(List.of()),
                        Optional.ofNullable(r).map(FinlifeMortgageResponseDTO.Result::getOptionList).orElse(List.of()),
                        FinlifeMortgageResponseDTO.Base::getFinPrdtCd,
                        FinlifeMortgageResponseDTO.Base::getFinPrdtNm,
                        FinlifeMortgageResponseDTO.Base::getKorCoNm,
                        FinlifeMortgageResponseDTO.Base::getFinCoNo,
                        FinlifeMortgageResponseDTO.Base::getDclsMonth,
                        FinlifeMortgageResponseDTO.Base::getLoanLmt,
                        FinlifeMortgageResponseDTO.Base::getJoinWay,
                        FinlifeMortgageResponseDTO.Base::getEtcNote,
                        FinlifeMortgageResponseDTO.Option::getFinPrdtCd,
                        FinlifeMortgageResponseDTO.Option::getLendRateMin,
                        FinlifeMortgageResponseDTO.Option::getLendRateMax,
                        FinlifeMortgageResponseDTO.Option::getLendRateAvg,
                        FinlifeMortgageResponseDTO.Option::getRpayTypeNm,
                        FinlifeMortgageResponseDTO.Option::getLendRateTypeNm,
                        Optional.ofNullable(r).map(FinlifeMortgageResponseDTO.Result::getNowPageNo).orElse(null),
                        Optional.ofNullable(r).map(FinlifeMortgageResponseDTO.Result::getMaxPageNo).orElse(null)
                );
            } catch (Exception e) { throw new RuntimeException(e); }
        });
    }

    /** 전세자금대출 */
    public void upsertAllPagesJeonse(String topFinGrpNo) {
        loopPages(topFinGrpNo, "JEONSE", (grp, page) -> {
            try {
                String json = fss.getJeonseProductsRaw(grp, page);
                var res = om.readValue(json, FinlifeJeonseResponseDTO.class);
                var r = res.getResult();

                return upsertTx.upsertOnePageGeneric(
                        "JEONSE", page,
                        Optional.ofNullable(r).map(FinlifeJeonseResponseDTO.Result::getBaseList).orElse(List.of()),
                        Optional.ofNullable(r).map(FinlifeJeonseResponseDTO.Result::getOptionList).orElse(List.of()),
                        FinlifeJeonseResponseDTO.Base::getFinPrdtCd,
                        FinlifeJeonseResponseDTO.Base::getFinPrdtNm,
                        FinlifeJeonseResponseDTO.Base::getKorCoNm,
                        FinlifeJeonseResponseDTO.Base::getFinCoNo,
                        FinlifeJeonseResponseDTO.Base::getDclsMonth,
                        FinlifeJeonseResponseDTO.Base::getLoanLmt,
                        FinlifeJeonseResponseDTO.Base::getJoinWay,
                        FinlifeJeonseResponseDTO.Base::getEtcNote,
                        FinlifeJeonseResponseDTO.Option::getFinPrdtCd,
                        FinlifeJeonseResponseDTO.Option::getLendRateMin,
                        FinlifeJeonseResponseDTO.Option::getLendRateMax,
                        FinlifeJeonseResponseDTO.Option::getLendRateAvg,
                        FinlifeJeonseResponseDTO.Option::getRpayTypeNm,
                        FinlifeJeonseResponseDTO.Option::getLendRateTypeNm,
                        Optional.ofNullable(r).map(FinlifeJeonseResponseDTO.Result::getNowPageNo).orElse(null),
                        Optional.ofNullable(r).map(FinlifeJeonseResponseDTO.Result::getMaxPageNo).orElse(null)
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
                var res = om.readValue(json, FinlifeCreditResponseDTO.class);
                var r = res.getResult();

                return upsertTx.upsertOnePageGeneric(
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
