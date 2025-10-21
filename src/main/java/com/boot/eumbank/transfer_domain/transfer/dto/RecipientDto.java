package com.boot.eumbank.transfer_domain.transfer.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * [수취인 정보 DTO]
 * - 다건이체 시 각 수취인의 정보를 담는 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipientDto {
    
    private String bank;        // 수취 은행명
    private String account;     // 수취 계좌번호
    private String name;        // 수취인명
    private Integer amount;     // 이체 금액
    private String memo;        // 이체 메모
    
    // 추가 메서드들
    public String getBankName() {
        return this.bank;
    }
    
    public String getAccountNo() {
        return this.account;
    }
    
    public String getName() {
        return this.name;
    }
    
    public Integer getAmount() {
        return this.amount;
    }
    
    public String getMemo() {
        return this.memo;
    }
}

