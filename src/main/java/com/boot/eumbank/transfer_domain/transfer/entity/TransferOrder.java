package com.boot.eumbank.transfer_domain.transfer.entity;

import com.boot.eumbank.account.Open.model.Account;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * [예약 이체 주문 엔티티]
 * - 미래의 특정 시점에 자동으로 이체되도록 예약하는 정보를 저장
 * - 주요 기능:
 *   1) 일회성 예약 이체 (ONCE)
 *   2) 반복 예약 이체 (RECURRING)
 *   3) 스케줄 표현식 기반 실행 시간 관리
 *   4) 이체 상태 추적 (SCHEDULED, EXECUTED, CANCELLED)
 * 
 * @author 임형욱
 * @since 2025-10-20
 */
@Entity
@Table(name = "TRANSFER_ORDER_TBL")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TransferOrder {

    @Id
    @Column(name = "to_order_id", nullable = false)
    private Integer to_order_id;

    @Column(name = "a_no", nullable = false)
    private Integer a_no;

    @Column(name = "to_bank_code", nullable = false, length = 10)
    private String to_bank_code;

    @Column(name = "to_dest_account_no", nullable = false, length = 30)
    private String to_dest_account_no;

    @Column(name = "to_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal to_amount;

    @Column(name = "to_schedule_type", nullable = false, length = 10)
    private String to_schedule_type;

    @Column(name = "to_schedule_expr", length = 100)
    private String to_schedule_expr;

    @Column(name = "to_start_at")
    private LocalDateTime to_start_at;

    @Column(name = "to_end_at")
    private LocalDateTime to_end_at;

    @Column(name = "to_status", nullable = false, length = 20)
    private String to_status;

    @Column(name = "to_memo", length = 200)
    private String to_memo;

    @Column(name = "to_created_at", nullable = false, updatable = false)
    private LocalDateTime to_created_at;

    // 관계 설정 - DB의 a_no와 매핑
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "a_no", insertable = false, updatable = false)
    private Account account;

    @Builder
    public TransferOrder(Integer to_order_id, Integer a_no, String to_bank_code,
                        String to_dest_account_no, BigDecimal to_amount,
                        String to_schedule_type, String to_schedule_expr,
                        LocalDateTime to_start_at, LocalDateTime to_end_at,
                        String to_status, String to_memo, LocalDateTime to_created_at) {
        this.to_order_id = to_order_id;
        this.a_no = a_no;
        this.to_bank_code = to_bank_code;
        this.to_dest_account_no = to_dest_account_no;
        this.to_amount = to_amount;
        this.to_schedule_type = to_schedule_type;
        this.to_schedule_expr = to_schedule_expr;
        this.to_start_at = to_start_at;
        this.to_end_at = to_end_at;
        this.to_status = to_status;
        this.to_memo = to_memo;
        // to_created_at이 null이면 현재 시간으로 설정
        this.to_created_at = to_created_at != null ? to_created_at : LocalDateTime.now();
        
        // 디버깅을 위한 로그
        System.out.println("TransferOrder Builder - to_created_at 설정: " + this.to_created_at);
    }

    // 비즈니스 메서드
    /**
     * 예약 이체가 활성 상태인지 확인하는 메서드
     * @return 활성 상태 여부
     */
    public boolean isActive() {
        return "ACTIVE".equals(this.to_status);
    }

    /**
     * 예약 이체가 스케줄된 상태인지 확인하는 메서드
     * @return 스케줄된 상태 여부
     */
    public boolean isScheduled() {
        return "SCHEDULED".equals(this.to_status);
    }

    /**
     * 예약 이체가 완료된 상태인지 확인하는 메서드
     * @return 완료된 상태 여부
     */
    public boolean isCompleted() {
        return "COMPLETED".equals(this.to_status);
    }

    /**
     * 예약 이체가 취소된 상태인지 확인하는 메서드
     * @return 취소된 상태 여부
     */
    public boolean isCancelled() {
        return "CANCELLED".equals(this.to_status);
    }

    /**
     * 예약 이체를 활성 상태로 변경하는 메서드
     */
    public void activate() {
        this.to_status = "ACTIVE";
    }

    /**
     * 예약 이체를 완료 상태로 변경하는 메서드
     */
    public void complete() {
        this.to_status = "COMPLETED";
    }

    /**
     * 예약 이체를 취소 상태로 변경하는 메서드
     */
    public void cancel() {
        this.to_status = "CANCELLED";
    }

    /**
     * 예약 이체 상태를 업데이트하는 메서드
     * - 성공 시 "COMPLETED"
     * - 실패 시 에러 코드 (예: "INSUFFICIENT_BALANCE")
     */
    public void updateStatus(String newStatus) {
        this.to_status = newStatus;
    }

    /**
     * 예약 이체가 실패한 상태인지 확인하는 메서드
     * - SCHEDULED, COMPLETED가 아니면 모두 실패로 간주
     */
    public boolean isFailed() {
        return !"SCHEDULED".equals(this.to_status) 
            && !"COMPLETED".equals(this.to_status);
    }

    /**
     * 다음 실행 시간으로 업데이트하는 메서드 (반복 예약용)
     */
    public void updateNextExecutionTime(LocalDateTime nextTime) {
        this.to_start_at = nextTime;
    }

    /**
     * 일회성 예약 이체인지 확인하는 메서드
     * @return 일회성 예약 이체 여부
     */
    public boolean isOneTime() {
        return "ONCE".equals(to_schedule_type);
    }

    /**
     * 반복 예약 이체인지 확인하는 메서드
     * @return 반복 예약 이체 여부
     */
    public boolean isRecurring() {
        return "RECURRING".equals(to_schedule_type);
    }

    /**
     * 예약 이체가 스케줄 범위 내에 있는지 확인하는 메서드
     * @return 스케줄 범위 내 여부
     */
    public boolean isWithinSchedule() {
        LocalDateTime now = LocalDateTime.now();
        return (to_start_at == null || now.isAfter(to_start_at)) && 
               (to_end_at == null || now.isBefore(to_end_at));
    }
}
