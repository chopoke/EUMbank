package com.boot.eumbank.account.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Entity
@Data
@Table(name = "ACCOUNT_TBL")
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int a_no;                   // 계좌 no
    @Column(nullable = false, unique = true)
    private String a_id;                // 계좌 Id

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "c_no")
    private Customer customer;          // 고객 id

    private String a_account_no;        // 계좌번호
    private Integer a_app_id;           // 신청번호
    private String a_product_code;      // 상품 코드
    private String a_account_type;      // 계좌유형
    private Timestamp a_opened_at;      // 개설일시
    private String a_account_pwd;       // 계좌 비밀번호
    private Timestamp a_closed_at;      // 해지일시
    private String a_status;            // 계좌 상태
    private BigDecimal a_balance;       // 잔액
    private String a_currency;          // 통화
    private String a_nickname;          // 별칭
    private Timestamp a_last_tx_at;     // 계좌거래일시
    private String a_created_by;        // 생성자
    private Timestamp a_updated_at;     // 수정일
    private String a_agree_terms;       // 전자금융거래약관 동의(필수)
    private String a_agree_privacy;     // 개인정보 수집이용 동의(필수)
    private String a_agree_marketing;   // 마케팅 정보 수신 동의(선택)
    private BigDecimal a_rate;          // 이율

}
