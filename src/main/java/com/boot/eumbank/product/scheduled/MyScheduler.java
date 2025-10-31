package com.boot.eumbank.product.scheduled;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.open.entity.account.QAccount;
import com.boot.eumbank.product.entity.product.ProductDeposit;
import com.boot.eumbank.product.entity.product.QProductDeposit;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class MyScheduler {

    private final Logger logger = LoggerFactory.getLogger(MyScheduler.class);

    private final JPAQueryFactory queryFactory;

    // Q클래스
    private final QProductDeposit productDeposit = QProductDeposit.productDeposit;

    private final QAccount account = QAccount.account;

    /**
     * 비관적 락을 사용한 안전한 차감
     * ⭐ 계좌 테이블과 예금 테이블 모두 락 적용
     */
    @Scheduled(cron = "*/30 * * * * ?")
    @Transactional
    public void deductDepositWithLock() {

        logger.info("MyScheduler => deductDepositWithLock() 시작 - {}", LocalDateTime.now());

        try {

            // ⭐ 1. ACTIVE 예금이 존재하는지 먼저 확인
            boolean hasActiveDeposits = queryFactory
                    .selectOne()
                    .from(productDeposit)
                    .where(productDeposit.dStatus.eq("ACTIVE"))
                    .fetchFirst() != null;

            if (!hasActiveDeposits) {
                logger.info("처리할 ACTIVE 예금이 없습니다.");
                return;
            }

            // 2. ACTIVE 예금 목록 조회
            List<ProductDeposit> deposits = queryFactory
                    .selectFrom(productDeposit)
                    .where(productDeposit.dStatus.eq("ACTIVE"))
                    .orderBy(productDeposit.dNo.asc()) // 데드락 방지
                    .fetch();

            logger.info("처리할 예금 건수: {}", deposits.size());

            int successCount = 0;
            int failCount = 0;

            for (var deposit : deposits) {

                logger.info("처리 중 - dNo: {}, aNo: {}, accountNo: {}",
                        deposit.getDNo(), deposit.getANo(), deposit.getAAccountNo());

                try {
                    boolean depositExists = queryFactory
                            .selectOne()
                            .from(productDeposit)
                            .where(productDeposit.dNo.eq(deposit.getDNo()))
                            .fetchFirst() != null;

                    if (!depositExists) {
                        logger.warn("예금이 더 이상 ACTIVE 상태가 아님 - dNo: {}", deposit.getDNo());
                        failCount++;
                        continue;
                    }

                    // 4. 예금 정보 락 (FOR UPDATE)
                    ProductDeposit depositEntity = queryFactory
                            .selectFrom(productDeposit)
                            .where(productDeposit.dNo.eq(deposit.getDNo()))
                            .setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
                            .fetchOne();

                    if (depositEntity == null) {
                        logger.warn("예금 정보를 찾을 수 없음 - dNo: {}", deposit.getDNo());
                        failCount++;
                        continue;
                    }

                    // ⭐ 5. 계좌 존재 여부 exists로 확인
                    boolean accountExists = queryFactory
                            .selectOne()
                            .from(account)
                            .where(
                                    account.aNo.eq(depositEntity.getANo())
                                            .and(account.accountNo.eq(depositEntity.getAAccountNo()))
                            )
                            .fetchFirst() != null;

                    if (!accountExists) {
                        logger.warn("계좌가 존재하지 않음 - aNo: {}, accountNo: {}",
                                depositEntity.getANo(), depositEntity.getAAccountNo());
                        failCount++;
                        continue;
                    }

                    // 6. 계좌 정보 락 (FOR UPDATE)
                    Account accountEntity = queryFactory
                            .selectFrom(account)
                            .where(
                                    account.aNo.eq(depositEntity.getANo())
                                            .and(account.accountNo.eq(depositEntity.getAAccountNo()))
                            )
                            .setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
                            .fetchOne();

                    if (accountEntity == null) {
                        logger.warn("계좌를 찾을 수 없음 - aNo: {}, accountNo: {}",
                                depositEntity.getANo(), depositEntity.getAAccountNo());
                        failCount++;
                        continue;
                    }

                    // ⭐ 7. 잔액이 충분한지 exists로 확인 (조회 전 미리 체크)
                    boolean hasSufficientBalance = queryFactory
                            .selectOne()
                            .from(account)
                            .where(
                                    account.aNo.eq(accountEntity.getANo())
                                            .and(account.balance.goe(depositEntity.getDPrincipalBal()))
                            )
                            .fetchFirst() != null;

                    if (!hasSufficientBalance) {
                        logger.warn("잔액 부족 - 계좌: {}, 필요금액: {}",
                                depositEntity.getAAccountNo(),
                                depositEntity.getDPrincipalBal());
                        failCount++;
                        continue;
                    }

                    // 8. 잔액 체크 (실제 값 확인)
                    if (accountEntity.getBalance().compareTo(BigDecimal.valueOf(depositEntity.getDPrincipalBal())) < 0) {
                        logger.warn("잔액 부족 - 계좌: {}, 잔액: {}, 차감금액: {}",
                                depositEntity.getAAccountNo(),
                                accountEntity.getBalance(),
                                depositEntity.getDPrincipalBal());
                        failCount++;
                        continue;
                    }

                    // 9. 계좌 잔액 차감
                    long accountUpdated = queryFactory
                            .update(account)
                            .set(account.balance,
                                    account.balance.subtract(depositEntity.getDPrincipalBal()))
                            .set(account.updatedAt, LocalDateTime.now())
                            .where(account.aNo.eq(accountEntity.getANo()))
                            .execute();

                    if (accountUpdated == 0) {
                        logger.warn("계좌 업데이트 실패 - aNo: {}", accountEntity.getANo());
                        failCount++;
                        continue;
                    }

                    logger.info("계좌 차감 완료 - 계좌번호: {}, 차감금액: {}",
                            depositEntity.getAAccountNo(), depositEntity.getDPrincipalBal());

                    // 10. 예금 테이블 업데이트
                    long depositUpdated = queryFactory
                            .update(productDeposit)
                            .set(productDeposit.dAmount,
                                    productDeposit.dAmount.add(depositEntity.getDPrincipalBal()))
                            .set(productDeposit.dUpdatedAt, LocalDateTime.now())
                            .where(productDeposit.dNo.eq(depositEntity.getDNo()))
                            .execute();

                    if (depositUpdated == 0) {
                        logger.warn("예금 업데이트 실패 - dNo: {}", depositEntity.getDNo());
                        failCount++;
                        continue;
                    }

                    logger.info("예금 증액 완료 - 예금번호: {}, 증액금액: {}",
                            depositEntity.getDNo(), depositEntity.getDPrincipalBal());

                    successCount++;

                } catch (Exception e) {
                    logger.error("개별 예금 처리 중 에러 - depositNo: {}", deposit.getDNo(), e);
                    failCount++;
                }
            }

            logger.info("처리 완료 - 성공: {}, 실패: {}", successCount, failCount);

        } catch (Exception e) {
            logger.error("deductDepositWithLock 실행 중 에러", e);
            throw e; // 트랜잭션 롤백
        }
    }
}