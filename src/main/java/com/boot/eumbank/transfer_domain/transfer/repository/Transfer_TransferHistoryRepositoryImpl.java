package com.boot.eumbank.transfer_domain.transfer.repository;

import com.boot.eumbank.account.select.entity.TransferHistory;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static com.boot.eumbank.account.select.entity.QTransferHistory.transferHistory;

@Repository
@RequiredArgsConstructor
public class Transfer_TransferHistoryRepositoryImpl implements Transfer_TransferHistoryRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Optional<TransferHistory> findByTransferId(String transferId) {
        TransferHistory result = queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.transferId.eq(transferId))
                .fetchOne();
        return Optional.ofNullable(result);
    }

    @Override
    public Page<TransferHistory> findByAccountNoOrderByTransferAtDescPage(Integer accountNo, Pageable pageable) {
        // QueryDSL로 페이징 처리
        List<TransferHistory> content = queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo))
                .orderBy(transferHistory.transferAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory
                .select(transferHistory.count())
                .from(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo))
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0);
    }

    @Override
    public List<TransferHistory> findByAccountNoOrderByTransferAtDescList(Integer accountNo, Pageable pageable) {
        return queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo))
                .orderBy(transferHistory.transferAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    @Override
    public List<TransferHistory> findByAccountNoAndTransferAtBetween(Integer accountNo, LocalDateTime startDate, LocalDateTime endDate) {
        return queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo)
                        .and(transferHistory.transferAt.between(startDate, endDate)))
                .orderBy(transferHistory.transferAt.desc())
                .fetch();
    }

    @Override
    public List<TransferHistory> findByAccountNoAndTransferType(Integer accountNo, String transferType) {
        return queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo)
                        .and(transferHistory.transferType.eq(transferType)))
                .orderBy(transferHistory.transferAt.desc())
                .fetch();
    }

    @Override
    public List<TransferHistory> findByAccountNoAndAmountGreaterThanEqual(Integer accountNo, Integer amount) {
        return queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo)
                        .and(transferHistory.amount.goe(new BigDecimal(amount)))) // amount는 BigDecimal
                .orderBy(transferHistory.transferAt.desc())
                .fetch();
    }

    @Override
    public List<TransferHistory> findByAccountNoAndOtherAccount(Integer accountNo, String otherAccount) {
        return queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo)
                        .and(transferHistory.otherAccount.eq(otherAccount)))
                .orderBy(transferHistory.transferAt.desc())
                .fetch();
    }

    @Override
    public List<TransferHistory> findByCustomerIdOrderByTransferAtDesc(String customerId, Pageable pageable) {
        // 이 부분은 Account와 Customer 조인이 필요하므로 QueryDSL로 구현
        // 현재 TransferHistory 엔티티에 Customer 정보가 직접 연결되어 있지 않으므로,
        // Account 엔티티를 통해 Customer를 찾고, 해당 Customer의 모든 계좌에 대한 TransferHistory를 조회해야 함.
        // 이 예시에서는 간단히 accountNo를 통해 조회하는 것으로 대체합니다.
        // 실제 구현에서는 QAccount와 QCustomer를 사용하여 조인 로직을 추가해야 합니다.
        return queryFactory
                .selectFrom(transferHistory)
                // .join(transferHistory.account, QAccount.account) // Account 엔티티와 관계 설정 필요
                // .join(QAccount.account.customer, QCustomer.customer) // Customer 엔티티와 관계 설정 필요
                // .where(QCustomer.customer.cId.eq(customerId))
                .orderBy(transferHistory.transferAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    @Override
    public List<TransferHistory> findTodayTransfers(Integer accountNo) {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        return queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo)
                        .and(transferHistory.transferAt.between(startOfDay, endOfDay)))
                .orderBy(transferHistory.transferAt.desc())
                .fetch();
    }

    @Override
    public List<TransferHistory> findByAccountNoAndTransactionType(Integer accountNo, String transactionType) {
        return queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo)
                        .and(transferHistory.transferType.eq(transactionType)))
                .orderBy(transferHistory.transferAt.desc())
                .fetch();
    }

    @Override
    public List<TransferHistory> findWithdrawalsByAccountNo(Integer accountNo) {
        return queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo)
                        .and(transferHistory.transferType.eq("출금")))
                .orderBy(transferHistory.transferAt.desc())
                .fetch();
    }

    @Override
    public List<TransferHistory> findDepositsByAccountNo(Integer accountNo) {
        return queryFactory
                .selectFrom(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo)
                        .and(transferHistory.transferType.eq("입금")))
                .orderBy(transferHistory.transferAt.desc())
                .fetch();
    }

    @Override
    public Integer getTodayWithdrawSum(Integer accountNo) {
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);

        java.math.BigDecimal result = queryFactory
                .select(transferHistory.amount.sum())
                .from(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo)
                        .and(transferHistory.transferType.eq("출금"))
                        .and(transferHistory.transferAt.between(startOfDay, endOfDay)))
                .fetchOne();

        return result != null ? result.intValue() : 0;
    }

    @Override
    public Integer getMonthlyWithdrawSum(Integer accountNo) {
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfMonth = LocalDateTime.now().withDayOfMonth(LocalDateTime.now().toLocalDate().lengthOfMonth())
                .withHour(23).withMinute(59).withSecond(59).withNano(999999999);

        java.math.BigDecimal result = queryFactory
                .select(transferHistory.amount.sum())
                .from(transferHistory)
                .where(transferHistory.accountNo.eq(accountNo)
                        .and(transferHistory.transferType.eq("출금"))
                        .and(transferHistory.transferAt.between(startOfMonth, endOfMonth)))
                .fetchOne();

        return result != null ? result.intValue() : 0;
    }
}