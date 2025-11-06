package com.boot.eumbank.management.assetreport.repository;

import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.management.assetreport.dto.DailySummaryDto;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * 자산 리포트 복잡 쿼리용 Custom Repository
 * 
 * @author 임형욱
 */
public interface AssetReportRepositoryCustom {

    /**
     * 고객의 모든 계좌번호 조회
     * 
     * @param customerNo 고객번호
     * @return 계좌번호 Set
     */
    Set<String> findAllAccountNumbersByCustomerNo(Integer customerNo);

    /**
     * 월별 타인과의 거래 내역 조회
     * 자기 계좌 간 이체는 제외하고, 외부 계좌와의 거래만 조회
     * 
     * @param customerNo 고객번호
     * @param accountNos 고객의 모든 계좌번호 Set
     * @param startDate 시작 날짜 (월의 첫날 00:00:00)
     * @param endDate 종료 날짜 (월의 마지막날 23:59:59)
     * @return 거래 내역 리스트
     */
    List<TransferHistory> findExternalTransfersByMonth(
            Integer customerNo,
            Set<String> accountNos,
            LocalDate startDate,
            LocalDate endDate
    );

    /**
     * 특정 날짜의 타인과의 거래 내역 조회
     * 
     * @param customerNo 고객번호
     * @param accountNos 고객의 모든 계좌번호 Set
     * @param date 조회할 날짜
     * @return 거래 내역 리스트 (시간순 정렬)
     */
    List<TransferHistory> findExternalTransfersByDate(
            Integer customerNo,
            Set<String> accountNos,
            LocalDate date
    );

    /**
     * 일별 증감 요약 조회
     * 월별로 일별 수입/지출/순변동을 집계
     * 
     * @param customerNo 고객번호
     * @param accountNos 고객의 모든 계좌번호 Set
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 일별 요약 리스트
     */
    List<DailySummaryDto> getDailySummaries(
            Integer customerNo,
            Set<String> accountNos,
            LocalDate startDate,
            LocalDate endDate
    );
}

