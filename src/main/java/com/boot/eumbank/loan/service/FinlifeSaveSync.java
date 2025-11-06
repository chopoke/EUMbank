// src/main/java/com/boot/eumbank/loan/service/FinlifeSaveSync.java
package com.boot.eumbank.loan.service;

import com.boot.eumbank.loan.dto.FinlifeJeonseResponseDTO;
import com.boot.eumbank.loan.dto.FinlifeMortgageResponseDTO;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

/**
 * 스케줄(지금은 적용x) + 페이지루프 + 역질렬화 + 업서트호출
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FinlifeSaveSync {

    private final FssFinlifeService fss; // FSS API 호출 서비스
    private final FinlifeUpsert upsertTx;

    // 매핑을 위함
    private final ObjectMapper om = new ObjectMapper()
            .findAndRegisterModules()
            .setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE)
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    /** 새벽 3시(서울)마다 동기화 (기본값은 properties로 제어) */
    @Scheduled(cron = "${jobs.finlife.sync.cron:0 0 3 * * *}", zone = "${jobs.timezone:Asia/Seoul}")
    public void runSave() {
        upsertAllPagesMortgage("020000"); // 주담대
        upsertAllPagesJeonse("020000");   // 전세자금(임차)
//        upsertAllPagesCredit("020000");   // 신용대출
    }

    // ===== 페이지 루프 공통 =====

    @FunctionalInterface
    private interface PageWorker {
        FinlifeUpsert.PageResult work(String topFinGrpNo, int pageNo);
    }

    // 현재페이지, 최대페이지 확인하면서 페이지 루프
    private void loopPages(String topFinGrpNo, String loanType, PageWorker worker) {
        int page = 1, total = 0;
        while (true) {
            FinlifeUpsert.PageResult pr = worker.work(topFinGrpNo, page);
            total += (pr.getUpserted() == 0 ? 0 : pr.getUpserted());
            Integer now = pr.getNowPageNo();
            Integer max = pr.getMaxPageNo();
            if (now == null || max == null || now >= max) {
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
                        "MORTGAGE",
                        page,
                        Optional.ofNullable(r).map(FinlifeMortgageResponseDTO.Result::getBaseList).orElse(Collections.emptyList()),
                        Optional.ofNullable(r).map(FinlifeMortgageResponseDTO.Result::getOptionList).orElse(Collections.emptyList()),
                        FinlifeMortgageResponseDTO.Base::getFinPrdtCd,
                        FinlifeMortgageResponseDTO.Base::getFinPrdtNm,
                        FinlifeMortgageResponseDTO.Base::getKorCoNm,
                        FinlifeMortgageResponseDTO.Base::getFinCoNo,
                        FinlifeMortgageResponseDTO.Base::getDclsMonth,
                        FinlifeMortgageResponseDTO.Base::getJoinWay,
                        FinlifeMortgageResponseDTO.Base::getDclsStrtDay,
                        FinlifeMortgageResponseDTO.Base::getDclsEndDay,
                        FinlifeMortgageResponseDTO.Base::getFinCoSubmDay,
                        FinlifeMortgageResponseDTO.Base::getLoanInciExpn,
                        FinlifeMortgageResponseDTO.Base::getErlyRpayFee,
                        FinlifeMortgageResponseDTO.Base::getDlyRate,
                        FinlifeMortgageResponseDTO.Base::getLoanLmt,
                        FinlifeMortgageResponseDTO.Option::getFinPrdtCd,
                        FinlifeMortgageResponseDTO.Option::getMrtgTypeNm,
                        FinlifeMortgageResponseDTO.Option::getRpayTypeNm,
                        FinlifeMortgageResponseDTO.Option::getLendRateTypeNm,
                        FinlifeMortgageResponseDTO.Option::getLendRateMin,
                        FinlifeMortgageResponseDTO.Option::getLendRateMax,
                        FinlifeMortgageResponseDTO.Option::getLendRateAvg,
                        o -> null, // termMonth
                        o -> null, // dclsMonth
                        o -> null, // note
                        Optional.ofNullable(r).map(FinlifeMortgageResponseDTO.Result::getNowPageNo).orElse(null),
                        Optional.ofNullable(r).map(FinlifeMortgageResponseDTO.Result::getMaxPageNo).orElse(null)
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
                var res = om.readValue(json, FinlifeJeonseResponseDTO.class);
                var r = res.getResult();

                return upsertTx.upsertOnePageGeneric(
                        "JEONSE",
                        page,
                        Optional.ofNullable(r).map(FinlifeJeonseResponseDTO.Result::getBaseList).orElse(Collections.emptyList()),
                        Optional.ofNullable(r).map(FinlifeJeonseResponseDTO.Result::getOptionList).orElse(Collections.emptyList()),
                        FinlifeJeonseResponseDTO.Base::getFinPrdtCd,
                        FinlifeJeonseResponseDTO.Base::getFinPrdtNm,
                        FinlifeJeonseResponseDTO.Base::getKorCoNm,
                        FinlifeJeonseResponseDTO.Base::getFinCoNo,
                        FinlifeJeonseResponseDTO.Base::getDclsMonth,
                        FinlifeJeonseResponseDTO.Base::getJoinWay,
                        FinlifeJeonseResponseDTO.Base::getDclsStrtDay,
                        FinlifeJeonseResponseDTO.Base::getDclsEndDay,
                        FinlifeJeonseResponseDTO.Base::getFinCoSubmDay,
                        FinlifeJeonseResponseDTO.Base::getLoanInciExpn,
                        FinlifeJeonseResponseDTO.Base::getErlyRpayFee,
                        FinlifeJeonseResponseDTO.Base::getDlyRate,
                        FinlifeJeonseResponseDTO.Base::getLoanLmt,
                        FinlifeJeonseResponseDTO.Option::getFinPrdtCd,
                        FinlifeJeonseResponseDTO.Option::getMrtgTypeNm,
                        FinlifeJeonseResponseDTO.Option::getRpayTypeNm,
                        FinlifeJeonseResponseDTO.Option::getLendRateTypeNm,
                        FinlifeJeonseResponseDTO.Option::getLendRateMin,
                        FinlifeJeonseResponseDTO.Option::getLendRateMax,
                        FinlifeJeonseResponseDTO.Option::getLendRateAvg,
                        o -> null,
                        o -> null,
                        o -> null,
                        Optional.ofNullable(r).map(FinlifeJeonseResponseDTO.Result::getNowPageNo).orElse(null),
                        Optional.ofNullable(r).map(FinlifeJeonseResponseDTO.Result::getMaxPageNo).orElse(null)
                );
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }

//    /** 신용대출 */
//    public void upsertAllPagesCredit(String topFinGrpNo) {
//        loopPages(topFinGrpNo, "CREDIT", (grp, page) -> {
//            try {
//                String json = fss.getCreditProductsRaw(grp, page);
//                var res = om.readValue(json, FinlifeCreditResponseDTO.class);
//                var r = res.getResult();
//
//                return upsertTx.upsertOnePageCredit(
//                        page,
//                        Optional.ofNullable(r).map(FinlifeCreditResponseDTO.Result::getBaseList).orElse(Collections.emptyList()),
//                        Optional.ofNullable(r).map(FinlifeCreditResponseDTO.Result::getOptionList).orElse(Collections.emptyList()),
//                        Optional.ofNullable(r).map(FinlifeCreditResponseDTO.Result::getNowPageNo).orElse(null),
//                        Optional.ofNullable(r).map(FinlifeCreditResponseDTO.Result::getMaxPageNo).orElse(null)
//                );
//            } catch (Exception e) {
//                throw new RuntimeException(e);
//            }
//        });
//    }

    // ===== 유틸 ================================

    /** 상환방식명으로 마이너스한도 여부 추정 (현재 미사용) */
    @SuppressWarnings("unused")
    private static boolean isOverdraftByRepayName(String repayTypeNm) {
        if (repayTypeNm == null) return false;
        String s = repayTypeNm.replaceAll("\\s+", "");
        return s.contains("마이너스") || s.contains("한도");
    }
}
