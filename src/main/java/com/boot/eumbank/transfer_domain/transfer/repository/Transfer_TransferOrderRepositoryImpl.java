package com.boot.eumbank.transfer_domain.transfer.repository;

import com.boot.eumbank.transfer_domain.transfer.entity.TransferOrder;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.boot.eumbank.transfer_domain.transfer.entity.QTransferOrder.transferOrder;

@Repository
@RequiredArgsConstructor
public class Transfer_TransferOrderRepositoryImpl implements Transfer_TransferOrderRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Optional<TransferOrder> findByOrderId(Integer orderId) {
        TransferOrder result = queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.to_order_id.eq(orderId))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    @Override
    public List<TransferOrder> findByAccountNoOrderByCreatedAtDesc(Integer accountNo) {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.a_no.eq(accountNo))
                .orderBy(transferOrder.to_created_at.desc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findByAccountNoAndStatus(Integer accountNo, String status) {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.a_no.eq(accountNo)
                        .and(transferOrder.to_status.eq(status)))
                .orderBy(transferOrder.to_created_at.desc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findActiveOrdersByAccountNo(Integer accountNo) {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.a_no.eq(accountNo)
                        .and(transferOrder.to_status.eq("ACTIVE")))
                .orderBy(transferOrder.to_created_at.desc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findByAccountNoAndScheduleType(Integer accountNo, String scheduleType) {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.a_no.eq(accountNo)
                        .and(transferOrder.to_schedule_type.eq(scheduleType)))
                .orderBy(transferOrder.to_created_at.desc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findScheduledOrders(LocalDateTime currentTime) {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.to_status.eq("SCHEDULED")
                        .and(transferOrder.to_start_at.loe(currentTime)))
                .orderBy(transferOrder.to_start_at.asc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findCompletedOrders(LocalDateTime currentTime) {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.to_status.eq("COMPLETED")
                        .and(transferOrder.to_end_at.loe(currentTime)))
                .orderBy(transferOrder.to_created_at.desc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findByAccountNoAndBankCode(Integer accountNo, String bankCode) {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.a_no.eq(accountNo)
                        .and(transferOrder.to_bank_code.eq(bankCode)))
                .orderBy(transferOrder.to_created_at.desc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findByCustomerIdOrderByCreatedAtDesc(String customerId) {
        // Account와 Customer 조인이 필요하므로 QueryDSL로 구현
        // 현재 TransferOrder 엔티티에 Customer 정보가 직접 연결되어 있지 않으므로,
        // Account 엔티티를 통해 Customer를 찾고, 해당 Customer의 모든 계좌에 대한 TransferOrder를 조회해야 함.
        // 이 예시에서는 간단히 accountNo를 통해 조회하는 것으로 대체합니다.
        // 실제 구현에서는 QAccount와 QCustomer를 사용하여 조인 로직을 추가해야 합니다.
        return queryFactory
                .selectFrom(transferOrder)
                // .join(transferOrder.account, QAccount.account) // Account 엔티티와 관계 설정 필요
                // .join(QAccount.account.customer, QCustomer.customer) // Customer 엔티티와 관계 설정 필요
                // .where(QCustomer.customer.cId.eq(customerId))
                .orderBy(transferOrder.to_created_at.desc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findRecurringOrders() {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.to_schedule_type.eq("RECURRING"))
                .orderBy(transferOrder.to_created_at.desc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findPendingOrders() {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.to_status.eq("SCHEDULED"))
                .orderBy(transferOrder.to_start_at.asc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findByAccountNoAndStartAtBetween(Integer accountNo, LocalDateTime startDate, LocalDateTime endDate) {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.a_no.eq(accountNo)
                        .and(transferOrder.to_start_at.between(startDate, endDate)))
                .orderBy(transferOrder.to_start_at.asc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findCompletedOrdersByAccountNo(Integer accountNo) {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.a_no.eq(accountNo)
                        .and(transferOrder.to_status.eq("COMPLETED")))
                .orderBy(transferOrder.to_created_at.desc())
                .fetch();
    }

    @Override
    public List<TransferOrder> findCancelledOrdersByAccountNo(Integer accountNo) {
        return queryFactory
                .selectFrom(transferOrder)
                .where(transferOrder.a_no.eq(accountNo)
                        .and(transferOrder.to_status.eq("CANCELLED")))
                .orderBy(transferOrder.to_created_at.desc())
                .fetch();
    }
}
