package com.boot.eumbank.entity;


import jakarta.persistence.*;
import lombok.Data;

import java.sql.Timestamp;

@Entity
@Table(name = "ACCOUNT_STATUS_HISTORY_TBL")
@Data
public class AccountStatusHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int ash_hist_id;            // '이력ID',
    private String a_id;                // '계좌ID',
    private String ash_prev_status;     // '이전 상태',
    private String ash_new_status;      // '변경 후 상태',
    private String ash_reason_code;     // 사유 코드',
    private String ash_changed_by;      // '변경자',
    private Timestamp ash_changed_at;   // '변경일시',
}
