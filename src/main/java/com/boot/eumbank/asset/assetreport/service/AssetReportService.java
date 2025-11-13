package com.boot.eumbank.asset.assetreport.service;

import com.boot.eumbank.asset.assetreport.dto.AssetReportResponse;
import com.boot.eumbank.asset.assetreport.dto.DailyTransactionResponse;

import java.time.LocalDate;

/**
 * 자산 리포트 서비스 인터페이스
 * 
 * @author 임형욱
 */
public interface AssetReportService {

    /**
     * 월별 리포트 조회
     * 캘린더에 표시할 일별 증감 요약 데이터 반환
     * 
     * @param customerNo 고객번호
     * @param year 조회할 연도
     * @param month 조회할 월 (1-12)
     * @return 월별 리포트 응답
     */
    AssetReportResponse getMonthlyReport(Integer customerNo, int year, int month);

    /**
     * 일별 상세 거래 내역 조회
     * 날짜 클릭 시 모달에 표시할 데이터 반환
     * 
     * @param customerNo 고객번호
     * @param date 조회할 날짜
     * @return 일별 거래 상세 응답
     */
    DailyTransactionResponse getDailyTransactions(Integer customerNo, LocalDate date);
}

