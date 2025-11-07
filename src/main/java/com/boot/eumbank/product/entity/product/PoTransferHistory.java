package com.boot.eumbank.product.entity.product;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_history_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoTransferHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "th_transfer_no")
    private Long thTransferNo;

    @Column(name = "a_no")
    private Long aNo;

    @Column(name = "th_account_in", length = 50)
    private String thAccountIn;

    @Column(name = "th_account_out", length = 50)
    private String thAccountOut;

    @Column(name = "th_after_balance")
    private Long thAfterBalance;

    @Column(name = "th_amount")
    private Long thAmount;

    @Column(name = "th_transfer_at")
    private LocalDateTime thTransferAt;

    @Column(name = "th_transfer_id", length = 100)
    private String thTransferId;

    @Column(name = "th_transfer_type", length = 50)
    private String thTransferType;

    @Column(name = "th_memo", length = 200)
    private String thMemo;

    @Column(name = "th_other_account", length = 50)
    private String thOtherAccount;

    @Column(name = "th_other_bank", length = 50)
    private String thOtherBank;

    @Column(name = "th_transaction_type", length = 20)
    private String thTransactionType;
}