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
    // 약관
    private String agreeTerms;       // "Y"
    private String agreePrivacy;     // "Y"
    private String agreeMarketing;   // "Y"/"N" (선택)
    private String agreeRisk;        // (선택: 있으면 사용)
    private String agreeProduct;     // (선택: 있으면 사용)

    // 계좌 설정
    private String  currency;            // 예: "USD"
    private String  pin;                 // 계좌 비밀번호 (6자리)
    private Integer pinNumber;           // 거래 PIN (6자리, 정수)
    private String  nickname;            // 별칭 (선택)
    private String  preferredAccountNo;  // 프리뷰로 받은 계좌번호(있으면 채택)

    // 본인확인
    private Integer customerId;       // 클라에서 넘기긴 해도 실제 저장은 인증정보 사용
    private String  name;
    private String  englishName;      // 영문 이름
    private String  birth;            // "YYYY-MM-DD" 포맷

    /** 서비스 코드 호환용: 인증컨텍스트에서 고객번호 */
    public Integer getCustomerNo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();
        return customer.getCustomerNo();
    }
}
