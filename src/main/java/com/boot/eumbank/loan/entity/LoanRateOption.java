package com.boot.eumbank.loan.entity;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data @Table(name = "LOAN_RATE_OPTION_TBL")
@Builder @NoArgsConstructor
@AllArgsConstructor
public class LoanRateOption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lro_no")
    private Long lroNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="lpd_no", nullable=false)
    private LoanProduct product;            // join

    // 공통필드--------------------------
    @Column(name="lro_rpay_type_nm") 
    private String rpayTypeNm;              // 상환방식(원금균등상환/원리금균등상환/만기일시상환)
    @Column(name="lro_lend_rate_type") 
    private String lendRateType;            // 금리유형코드
    @Column(name="lro_lend_rate_type_nm") 
    private String lendRateTypeNm;          // 금리유형 (고정금리/변동금리/혼합금리)

    // 금리
    @Column(name="lro_lend_rate_min", precision=5, scale=2)
    private BigDecimal lendRateMin;                 // 최저금리
    @Column(name="lro_lend_rate_max", precision=5, scale=2)
    private BigDecimal lendRateMax;                 // 최고금리
    @Column(name="lro_lend_rate_avg", precision=5, scale=2)
    private BigDecimal lendRateAvg;                 // 평균금리

    // 비고
    @Column(name="lro_note")
    private String note;                // 비고

    @Column(name="lro_created_at", insertable=false, updatable=false, nullable=false)       //DB에서 관리할 수 있도록
    private LocalDateTime createdAt;                    // 등록일
    @Column(name="lro_updated_at" , insertable=false, updatable=false, nullable=false)       //DB에서 관리할 수 있도록
    private LocalDateTime updatedAt;                    // 수정일

}
