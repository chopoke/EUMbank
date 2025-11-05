package com.boot.eumbank.spot.model;

import com.boot.eumbank.customer.entity.Customer;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "GOLD_TBL")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoldTbl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "g_no")
    private Integer gNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gp_no", nullable = false)
    private GoldProduct goldProduct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "c_no", nullable = false)
    private Customer customer;

    @Column(name = "g_id", unique = true, nullable = false, length = 20)
    private String gId;

    @Enumerated(EnumType.STRING)
    @Column(name = "g_transaction_type", nullable = false, length = 10)
    private TransactionType gTransactionType; // BUY(매수), SELL(매도)

    @Column(name = "g_quantity", precision = 10, scale = 3, nullable = false)
    private BigDecimal gQuantity;

    @Column(name = "g_price_per_g", precision = 18, scale = 2, nullable = false)
    private BigDecimal gPricePerG;

    @Column(name = "g_total_price", precision = 18, scale = 2, nullable = false)
    private BigDecimal gTotalPrice;

    @Column(name = "g_tax_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal gTaxAmount = BigDecimal.ZERO;

    @Column(name = "g_fee_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal gFeeAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "g_status", nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus gStatus = TransactionStatus.COMPLETED;

    @CreationTimestamp
    @Column(name = "g_purchased_at", nullable = false, updatable = false)
    private LocalDateTime gPurchasedAt;

    @Column(name = "g_wallet_name", length = 50)
    private String gWalletName; // 거래에 사용된 월렛 이름

    public enum TransactionType {
        BUY, SELL
    }

    public enum TransactionStatus {
        COMPLETED, CANCELED, PENDING
    }
}
