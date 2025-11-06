package com.boot.eumbank.management.assetreport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 거래 상세 내역 DTO
 * 날짜 클릭 시 모달에 표시할 개별 거래 정보
 * 
 * @author 임형욱
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDetailDto {
    /**
     * 거래 ID
     */
    private String transferId;
    
    /**
     * 거래 시각
     */
    private LocalDateTime transferAt;
    
    /**
     * 거래 유형 (입금/출금)
     */
    private String transferType;
    
    /**
     * 거래 금액 (원)
     */
    private Long amount;
    
    /**
     * 거래 후 잔액 (원)
     */
    private Long afterBalance;
    
    /**
     * 메모
     */
    private String memo;
    
    /**
     * 상대방 은행명
     */
    private String otherBank;
    
    /**
     * 상대방 계좌번호 (마스킹 처리 권장)
     */
    private String otherAccount;
    
    /**
     * 내 계좌번호 (마스킹 처리 권장)
     */
    private String myAccountNo;
    
    /**
     * 내 계좌 별칭
     */
    private String myAccountNickname;
}

