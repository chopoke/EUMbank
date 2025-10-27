package com.boot.eumbank.product.entity.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "FOREIGN_PRODUCT_TBL")
public class ProductForeignList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fp_no")
    private Integer id;

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

    @Column(name = "fp_yy_efee_r", precision = 9, scale = 6, nullable = false)
    private BigDecimal yyEfeeR;

    @Column(name = "fp_ten_dd_efee_r", precision = 9, scale = 6, nullable = false)
    private BigDecimal tenDdEfeeR;

    @Column(name = "fp_kftc_deal_bas_r", precision = 16, scale = 6, nullable = false)
    private BigDecimal kftcDealBasR;

    @Column(name = "fp_kftc_bkpr", precision = 16, scale = 6, nullable = false)
    private BigDecimal kftcBkpr;

    @Column(name = "fp_dp_protect_yn", length = 1, nullable = false)
    private String dpProtectYn;

    @Column(name = "fp_io_yn", length = 1, nullable = false)
    private String ioYn;

    @Column(name = "fp_term_mon")
    private Integer termMon;

    @Column(name = "fp_prod_type", length = 20, nullable = false)
    private String prodType;

    @Column(name = "fp_apy", precision = 6, scale = 3)
    private BigDecimal apy;

    @Column(name = "fp_code", unique = true, nullable = false, length = 50)
    private String fpCode;

    @Column(name = "fp_description")
    private String fpDescription;

    @Column(name = "fp_name")
    private String fpName;

    @Column(name = "fp_feature")
    private String fpFeature;

    @Column(name = "fp_button_text")
    private String fpButtonText;

    @Column(name = "fp_href")
    private String fpHref;

}
