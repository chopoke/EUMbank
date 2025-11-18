// src/main/java/com/boot/eumbank/risk/entity/DelinquencyEvent.java
package com.boot.eumbank.risk.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "DELINQUENCY_EVENT_TBL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DelinquencyEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "de_id")
    private Long id;

    // c_no
    @Column(name = "c_no", nullable = false)
    private Integer customerNo;

    // de_category
    @Column(name = "de_category", nullable = false, length = 20)
    private String category;   // "DEPOSIT" | "SAVING" | "LOAN"

    // de_occurred_at (DB DEFAULT 사용)
    @Column(name = "de_occurred_at", insertable = false, updatable = false)
    private LocalDateTime occurredAt;

    // de_memo
    @Column(name = "de_memo", length = 500)
    private String memo;
}
