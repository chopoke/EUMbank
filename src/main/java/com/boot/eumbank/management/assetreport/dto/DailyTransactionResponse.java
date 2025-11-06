package com.boot.eumbank.management.assetreport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * 일별 거래 상세 내역 응답 DTO
 * 날짜 클릭 시 모달에 표시할 데이터
 * 
 * @author 임형욱
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTransactionResponse {
    /**
     * 조회한 날짜
     */
    private LocalDate date;
    
    /**
     * 해당 날짜의 수입 합계
     */
    private Long totalIncome;
    
    /**
     * 해당 날짜의 지출 합계
     */
    private Long totalExpense;
    
    /**
     * 해당 날짜의 순변동
     */
    private Long netChange;
    
    /**
     * 거래 상세 내역 리스트 (시간순 정렬)
     */
    private List<TransactionDetailDto> transactions;
}

