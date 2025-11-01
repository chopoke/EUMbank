// com.boot.eumbank.foreign.domain.ForeignProduct.java
package com.boot.eumbank.foreign.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor
@Entity
@Table(name = "FOREIGN_PRODUCT_TBL")
public class ForeignProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fp_no")
    private Integer id;                         // ← DB가 INT이므로 Integer로 통일

    @Column(name = "fp_cur_unit", length = 20, nullable = false)
    private String curUnit;

    @Column(name = "fp_cur_nm", length = 50, nullable = false)
    private String curNm;

    @Column(name = "fp_ttb", precision = 16, scale = 6, nullable = false)
    private BigDecimal ttb;

    @Column(name = "fp_tts", precision = 16, scale = 6, nullable = false)
    private BigDecimal tts;

    @Column(name = "fp_deal_bas_r", precision = 16, scale = 6, nullable = false)
    private BigDecimal dealBasR;

    @Column(name = "fp_bkpr", precision = 16, scale = 6, nullable = false)
    private BigDecimal bkpr;

    // ★ 스키마는 efee 입니다(efce 아님)
    @Column(name = "fp_yy_efee_r", precision = 9, scale = 6, nullable = false)
    private BigDecimal yyEfeeR;

    @Column(name = "fp_ten_dd_efee_r", precision = 9, scale = 6, nullable = false)
    private BigDecimal tenDdEfeeR;

    @Column(name = "fp_kftc_deal_bas_r", precision = 16, scale = 6, nullable = false)
    private BigDecimal kftcDealBasR;

    @Column(name = "fp_kftc_bkpr", precision = 16, scale = 6, nullable = false)
    private BigDecimal kftcBkpr;

    @Column(name = "fp_dp_protect_yn", length = 1, nullable = false)
    private String dpProtectYn;                 // 'Y' / 'N'

    @Column(name = "fp_io_yn", length = 1, nullable = false)
    private String ioYn;                        // 'Y' / 'N'

    @Column(name = "fp_term_mon")
    private Integer termMon;                    // 자유예금이면 null

    @Column(name = "fp_prod_type", length = 20, nullable = false)
    private String prodType;                    // GENERAL / TERM_DEPOSIT / FREE_DEPOSIT / MMF / ETF_SAVINGS ...

    @Column(name = "fp_apy", precision = 6, scale = 3)
    private BigDecimal apy;
}