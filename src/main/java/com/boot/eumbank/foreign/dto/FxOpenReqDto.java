package com.boot.eumbank.foreign.dto;

import com.boot.eumbank.customer.entity.Customer;
import lombok.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxOpenReqDto {
    // 기존 필드
    private Integer customerId;
    private String  currency;       // "USD" (비우면 서비스가 USD로 고정)
    private String  agreeTerms;     // "Y"
    private String  agreePrivacy;   // "Y"
    private String  agreeMarketing; // "Y"/"N" (선택)

    // 서비스에서 사용하는 추가 필드
    private String  pin;            // 계좌 비밀번호 (최소 4자리)
    private Integer pinNumber;    // 거래 PIN (정수)

    private String  nickname;       // 별칭(선택)


    // 서비스 코드 호환용 별칭 getter
    public Integer getCustomerNo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();
        return customer.getCustomerNo();
    }
}
