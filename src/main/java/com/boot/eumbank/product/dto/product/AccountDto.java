package com.boot.eumbank.product.dto.product;

import com.boot.eumbank.account.open.dto.account.AccountDTO;
import com.boot.eumbank.account.open.entity.account.Account;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 계좌 정보(ACCOUNT_TBL)를 위한 DTO
 */
@Getter
@Setter
@ToString
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountDto {

    // 계좌 번호 (PK)
    private Long aNo;

    // 계좌 ID
    private String aId;

    // 고객 번호 (FK)
    private Long cNo;

    // 계좌번호 (실제 사용)
    private String accountNo;

    // 앱 ID
    private Integer appId;

    // 상품 코드
    private String productCode;

    // 계좌 종류
    private String accountType;

    // 개설일
    private LocalDateTime openedAt;

    // 계좌 비밀번호
    private String accountPwd;

    // 해지일
    private LocalDateTime closedAt;

    // 계좌 상태
    private String status;

    // 잔액
    private BigDecimal balance;

    // 통화
    private String currency;

    // 계좌 별칭
    private String nickname;

    // 최종 거래일
    private LocalDateTime lastTxAt;

    // 생성자
    private String createdBy;

    // 수정일
    private LocalDateTime updatedAt;

    // 약관 동의 여부
    private String agreeTerms;

    // 개인정보 동의 여부
    private String agreePrivacy;

    // 마케팅 동의 여부
    private String agreeMarketing;

    // 이자율
    private BigDecimal rate;

    /**
     * Entity -> DTO 변환을 위한 정적 팩토리 메서드
     * 이 메서드를 추가하세요!
     */
    public static AccountDTO from(Account account) {
        if (account == null) {
            return null;
        }

        return AccountDTO.builder()
                .aNo(Long.valueOf(account.getANo()))
                .aId(account.getAId())
                .cNo(Long.valueOf(account.getCNo()))
                .accountNo(account.getAccountNo())
                .appId(account.getAppId())
                .productCode(account.getProductCode())
                .accountType(account.getAccountType())
                .openedAt(account.getOpenedAt())
                .accountPwd(account.getAccountPwd())
                .closedAt(account.getClosedAt())
                .status(account.getStatus())
                .balance(account.getBalance())
                .currency(account.getCurrency())
                .nickname(account.getNickname())
                .lastTxAt(account.getLastTxAt())
                .createdBy(account.getCreatedBy())
                .updatedAt(account.getUpdatedAt())
                .agreeTerms(account.getAgreeTerms())
                .agreePrivacy(account.getAgreePrivacy())
                .agreeMarketing(account.getAgreeMarketing())
                .rate(account.getRate())
                .build();
    }
}