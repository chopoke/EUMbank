package com.boot.eumbank.loan.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "LOAN_APPLICATION_TBL")
@Data @Builder
@AllArgsConstructor @NoArgsConstructor
public class LoanApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "la_no")
    private Long laNo;

    @Column(name = "la_id", nullable = false, unique = true, length = 20)
    private String laId;

    @Column(name = "c_no", nullable = false)
    private Integer customerNo;

    @Column(name = "lpd_no", nullable = false)
    private Long loanProductNo;

    @Column(name = "la_repay_a_no", nullable = false)
    private Integer repayAccountNo;

    @Column(name = "la_payout_a_no", nullable = false)
    private Integer payoutAccountNo;

    @Column(name = "la_appl_amount", precision = 18, scale = 2, nullable = false)
    private BigDecimal appliedAmount;

    @Column(name = "la_desired_term", nullable = false)
    private Integer desiredTerm;

    @Column(name = "la_purpose_code")
    private String purposeCode;

    @Column(name = "la_appl_status", length = 20, nullable = false)
    private String status; // DRAFT/SUBMITTED/UNDER_REVIEW/APPROVED/REJECTED/FUNDED/CANCELED

    @Column(name = "la_approved_amount", precision = 18, scale = 2)
    private BigDecimal approvedAmount;

    @Column(name = "la_approved_rate", precision = 5, scale = 3)
    private BigDecimal approvedRate;

    @Column(name = "la_approved_term")
    private Integer approvedTerm;

    @Column(name = "la_signed_at")
    private LocalDateTime signedAt;

    // MariaDB JSON -> JPA는 문자열로 보관(추후 hibernate-types로 JsonNode 매핑 )
    @Column(name = "la_context_json", columnDefinition = "json")
    private String contextJson;

    @Column(name = "la_channel", length = 20, nullable = false)
    private String channel; // WEB/APP

    @Column(name = "la_submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "la_decided_at")
    private LocalDateTime decidedAt;

    @Column(name = "la_funded_at")
    private LocalDateTime fundedAt;

    @Column(name = "la_decision_reason", length = 200)
    private String decisionReason;
}
