package com.boot.eumbank.product.scheduled;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.open.entity.account.QAccount;
import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.product.entity.product.ProductDeposit;
import com.boot.eumbank.product.entity.product.ProductInstallment;
import com.boot.eumbank.product.entity.product.QProductDeposit;
import com.boot.eumbank.product.entity.product.QProductInstallment;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * ═══════════════════════════════════════════════════════════════
 * 예금/적금 자동이체 스케줄러
 * ───────────────────────────────────────────────────────────────
 * - 예금: 30초마다 실행 (월 단위 자동이체)
 * - 적금: 20초마다 실행 (월 단위 자동이체)
 *
 * 주요 기능:
 * 1. ACTIVE 상태의 예금/적금 조회
 * 2. 연결된 계좌에서 금액 차감
 * 3. 예금/적금 계좌로 입금
 * 4. 거래 히스토리 기록
 * 5. 만기 시 원금+이자 반환
 * ═══════════════════════════════════════════════════════════════
 */
@Component
@RequiredArgsConstructor
public class MyScheduler {

    private static final Logger logger = LoggerFactory.getLogger(MyScheduler.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final JPAQueryFactory queryFactory;
    private final EntityManager entityManager;

    // QueryDSL Q클래스
    private final QProductDeposit productDeposit = QProductDeposit.productDeposit;
    private final QProductInstallment productInstallment = QProductInstallment.productInstallment;
    private final QAccount account = QAccount.account;

    // ═══════════════════════════════════════════════════════════════
    // 예금 자동이체 스케줄러
    // ═══════════════════════════════════════════════════════════════

    /**
     * 예금 자동이체를 처리하는 스케줄러입니다.
     *
     * <p>실행 주기: 30초마다 (cron = "* /30 * * * * ?")
     *
     * <p>처리 프로세스:
     * <ol>
     *   <li>ACTIVE 상태의 예금 목록 조회</li>
     *   <li>각 예금에 대해 연결된 계좌에서 월 납입액 차감</li>
     *   <li>예금 계좌로 입금 처리</li>
     *   <li>거래 히스토리 기록</li>
     *   <li>납입 횟수 증가</li>
     *   <li>만기 시 원금+이자를 원래 계좌로 반환</li>
     * </ol>
     *
     * <p>주의사항:
     * <ul>
     *   <li>비관적 락(PESSIMISTIC_WRITE)을 사용하여 동시성 제어</li>
     *   <li>트랜잭션 내에서 실행되며, 예외 발생 시 롤백 처리</li>
     *   <li>잔액 부족 시 해당 예금은 건너뛰고 다음 예금 처리</li>
     * </ul>
     */
    @Scheduled(cron = "*/120 * * * * ?")
    @Transactional
    public void deductDepositWithLock() {
        LocalDateTime startTime = LocalDateTime.now();

        logger.info("╔═══════════════════════════════════════════════════════════════");
        logger.info("║ [START] 예금 자동이체 스케줄러 실행");
        logger.info("╠═══════════════════════════════════════════════════════════════");
        logger.info("║ 실행 시각: {}", startTime.format(DATE_FORMATTER));
        logger.info("║ 스케줄 주기: 120초");
        logger.info("╚═══════════════════════════════════════════════════════════════");

        int totalCount = 0;
        int successCount = 0;
        int failCount = 0;
        int skipCount = 0;

        try {
            // ─────────────────────────────────────────────────────────
            // STEP 1: ACTIVE 예금 존재 여부 확인
            // ─────────────────────────────────────────────────────────
            logger.debug("┌─────────────────────────────────────────────────────────────");
            logger.debug("│ STEP 1: ACTIVE 예금 존재 여부 확인");
            logger.debug("└─────────────────────────────────────────────────────────────");

            boolean hasActiveDeposits = queryFactory
                    .selectOne()
                    .from(productDeposit)
                    .where(productDeposit.dStatus.eq("ACTIVE"))
                    .fetchFirst() != null;

            if (!hasActiveDeposits) {
                logger.info("───────────────────────────────────────────────────────────────");
                logger.info("   처리할 ACTIVE 예금이 없습니다.");
                logger.info("───────────────────────────────────────────────────────────────");
                logger.info("╔═══════════════════════════════════════════════════════════════");
                logger.info("║ [END] 예금 자동이체 스케줄러 종료 (처리 대상 없음)");
                logger.info("╚═══════════════════════════════════════════════════════════════\n");
                return;
            }

            // ─────────────────────────────────────────────────────────
            // STEP 2: ACTIVE 예금 목록 조회
            // ─────────────────────────────────────────────────────────
            logger.debug("┌─────────────────────────────────────────────────────────────");
            logger.debug("│ STEP 2: ACTIVE 예금 목록 조회 (데드락 방지를 위해 정렬)");
            logger.debug("└─────────────────────────────────────────────────────────────");

            List<ProductDeposit> deposits = queryFactory
                    .selectFrom(productDeposit)
                    .where(productDeposit.dStatus.eq("ACTIVE"))
                    .orderBy(productDeposit.dNo.asc()) // 데드락 방지용 정렬
                    .fetch();

            totalCount = deposits.size();

            logger.info("───────────────────────────────────────────────────────────────");
            logger.info("   조회된 ACTIVE 예금 개수: {} 건", totalCount);
            logger.info("───────────────────────────────────────────────────────────────");

            // ─────────────────────────────────────────────────────────
            // STEP 3: 각 예금에 대해 자동이체 처리
            // ─────────────────────────────────────────────────────────
            for (int i = 0; i < deposits.size(); i++) {
                ProductDeposit deposit = deposits.get(i);

                logger.info("┌─────────────────────────────────────────────────────────────");
                logger.info("│ 예금 처리 [{}/{}]", (i + 1), totalCount);
                logger.info("├─────────────────────────────────────────────────────────────");
                logger.info("│ 예금번호(dNo): {}", deposit.getDNo());
                logger.info("│ 예금계좌번호: {}", deposit.getDAccountNo());
                logger.info("│ 연결계좌(aNo): {}", deposit.getANo());
                logger.info("│ 연결계좌번호: {}", deposit.getAAccountNo());
                logger.info("│ 월납입액: {}원", deposit.getDPrincipalBal());
                logger.info("│ 현재납입회차: {}/{}", deposit.getDCountPeriod(), deposit.getDPeriod());
                logger.info("└─────────────────────────────────────────────────────────────");

                try {
                    // 예금 개별 처리
                    boolean processed = processDepositTransaction(deposit);

                    if (processed) {
                        successCount++;
                        logger.info("   ✓ 예금 처리 성공 - dNo: {}", deposit.getDNo());
                    } else {
                        skipCount++;
                        logger.info("   ○ 예금 처리 스킵 - dNo: {}", deposit.getDNo());
                    }

                } catch (Exception e) {
                    failCount++;
                    logger.error("   ✗ 예금 처리 실패 - dNo: {}", deposit.getDNo());
                    logger.error("   에러 메시지: {}", e.getMessage(), e);
                }
            }

            // ─────────────────────────────────────────────────────────
            // STEP 4: 처리 결과 요약
            // ─────────────────────────────────────────────────────────
            LocalDateTime endTime = LocalDateTime.now();
            long executionTime = java.time.Duration.between(startTime, endTime).toMillis();

            logger.info("╔═══════════════════════════════════════════════════════════════");
            logger.info("║ [SUCCESS] 예금 자동이체 스케줄러 처리 완료");
            logger.info("╠═══════════════════════════════════════════════════════════════");
            logger.info("║ 처리 결과 요약:");
            logger.info("║   - 전체 건수: {} 건", totalCount);
            logger.info("║   - 성공: {} 건", successCount);
            logger.info("║   - 실패: {} 건", failCount);
            logger.info("║   - 스킵: {} 건", skipCount);
            logger.info("║ 실행 시간: {}ms", executionTime);
            logger.info("║ 완료 시각: {}", endTime.format(DATE_FORMATTER));
            logger.info("╚═══════════════════════════════════════════════════════════════\n");

        } catch (Exception e) {
            logger.error("╔═══════════════════════════════════════════════════════════════");
            logger.error("║ [ERROR] 예금 자동이체 스케줄러 실행 중 치명적 오류");
            logger.error("╠═══════════════════════════════════════════════════════════════");
            logger.error("║ 에러 메시지: {}", e.getMessage());
            logger.error("║ 처리 현황: 성공 {}, 실패 {}, 스킵 {}", successCount, failCount, skipCount);
            logger.error("╚═══════════════════════════════════════════════════════════════", e);
            throw e; // 트랜잭션 롤백
        }
    }

    /**
     * 개별 예금의 자동이체 트랜잭션을 처리합니다.
     *
     * @param deposit 처리할 예금 정보
     * @return 처리 성공 여부 (true: 성공, false: 스킵)
     * @throws Exception 처리 중 오류 발생 시
     */
    private boolean processDepositTransaction(ProductDeposit deposit) throws Exception {

        // ═════════════════════════════════════════════════════════
        // 3-1. 예금 정보 재확인 및 락 획득
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 예금 정보 재확인 및 락 획득 시도...");

        ProductDeposit depositEntity = queryFactory
                .selectFrom(productDeposit)
                .where(productDeposit.dNo.eq(deposit.getDNo()))
                .setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
                .fetchOne();

        if (depositEntity == null) {
            logger.warn("   ⚠ 예금 정보를 찾을 수 없음 (이미 삭제되었거나 상태 변경됨)");
            return false;
        }

        // ═════════════════════════════════════════════════════════
        // 3-2. 만기 확인 및 처리
        // ═════════════════════════════════════════════════════════
        if (depositEntity.getDCountPeriod().equals(depositEntity.getDPeriod())) {
            logger.info("   ★ 예금 만기 도달 - 만기금액 반환 처리");
            return processDepositMaturity(depositEntity);
        }

        // ═════════════════════════════════════════════════════════
        // 3-3. 정상 납입 확인
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 현재 예금액: {}원, 약정원금: {}원",
                depositEntity.getDAmount(), depositEntity.getDPrincipalBal());

        if (depositEntity.getDAmount() == depositEntity.getDPrincipalBal()
                && depositEntity.getDStatus().equals("ACTIVE")) {
            logger.info("   ✓ 정상 납입 유지 중 - 납입 횟수만 증가");

            // 납입 횟수 증가
            queryFactory
                    .update(productDeposit)
                    .set(productDeposit.dCountPeriod, productDeposit.dCountPeriod.add(1))
                    .where(productDeposit.dNo.eq(depositEntity.getDNo()))
                    .execute();

            logger.info("   납입 횟수: {}/{}",
                    depositEntity.getDCountPeriod() + 1, depositEntity.getDPeriod());
            return true;
        }

        // ═════════════════════════════════════════════════════════
        // 3-4. 납입 실패 처리 (약정금액 불일치)
        // ═════════════════════════════════════════════════════════
        if (depositEntity.getDCountPeriod() > 1
                && depositEntity.getDAmount() != depositEntity.getDPrincipalBal()) {
            logger.warn("   ⚠ 약정된 금액이 입금되지 않음");

            // 실패 횟수 증가
            queryFactory
                    .update(productDeposit)
                    .set(productDeposit.dFail, productDeposit.dFail.add(1))
                    .where(productDeposit.dNo.eq(depositEntity.getDNo()))
                    .execute();

            logger.warn("   실패 횟수 증가: {}", depositEntity.getDFail() + 1);
            return false;
        }

        // ═════════════════════════════════════════════════════════
        // 3-5. 계좌 정보 조회 및 락 획득
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 연결 계좌 조회 및 락 획득 시도...");

        boolean accountExists = queryFactory
                .selectOne()
                .from(account)
                .where(
                        account.aNo.eq(depositEntity.getANo())
                                .and(account.accountNo.eq(depositEntity.getAAccountNo()))
                )
                .fetchFirst() != null;

        if (!accountExists) {
            logger.warn("   ⚠ 연결 계좌를 찾을 수 없음 - aNo: {}, accountNo: {}",
                    depositEntity.getANo(), depositEntity.getAAccountNo());
            return false;
        }

        Account accountEntity = queryFactory
                .selectFrom(account)
                .where(
                        account.aNo.eq(depositEntity.getANo())
                                .and(account.accountNo.eq(depositEntity.getAAccountNo()))
                )
                .setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
                .fetchOne();

        if (accountEntity == null) {
            logger.warn("   ⚠ 계좌 락 획득 실패");
            return false;
        }

        // ═════════════════════════════════════════════════════════
        // 3-6. 잔액 확인
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 잔액 확인: {} 원 (필요금액: {} 원)",
                accountEntity.getBalance(), depositEntity.getDPrincipalBal());

        boolean hasSufficientBalance = queryFactory
                .selectOne()
                .from(account)
                .where(
                        account.aNo.eq(accountEntity.getANo())
                                .and(account.balance.goe(depositEntity.getDPrincipalBal()))
                )
                .fetchFirst() != null;

        if (!hasSufficientBalance) {
            logger.warn("   ⚠ 잔액 부족 - 계좌: {}, 잔액: {}, 필요: {}",
                    depositEntity.getAAccountNo(),
                    accountEntity.getBalance(),
                    depositEntity.getDPrincipalBal());
            return false;
        }

        // ═════════════════════════════════════════════════════════
        // 3-7. 계좌 잔액 차감
        // ═════════════════════════════════════════════════════════
        BigDecimal beforeBalance = accountEntity.getBalance();

        logger.debug("   → 계좌 잔액 차감 처리...");

        long accountUpdated = queryFactory
                .update(account)
                .set(account.balance, account.balance.subtract(depositEntity.getDPrincipalBal()))
                .set(account.updatedAt, LocalDateTime.now())
                .where(account.aNo.eq(accountEntity.getANo()))
                .execute();

        if (accountUpdated == 0) {
            logger.warn("   ⚠ 계좌 업데이트 실패 - aNo: {}", accountEntity.getANo());
            return false;
        }

        BigDecimal afterBalance = beforeBalance.subtract(
                BigDecimal.valueOf(depositEntity.getDPrincipalBal()));

        logger.info("   ✓ 계좌 차감 완료 - 차감액: {}원, 잔액: {}원 → {}원",
                depositEntity.getDPrincipalBal(), beforeBalance, afterBalance);

        // ═════════════════════════════════════════════════════════
        // 3-8. 거래 히스토리 저장
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 거래 히스토리 저장...");

        TransferHistory history = TransferHistory.builder()
                .transferId(generateTransferId())
                .accountNo(accountEntity.getANo())
                .amount(BigDecimal.valueOf(depositEntity.getDPrincipalBal()))
                .memo("예금 자동이체 - " + depositEntity.getDId() +
                        " (" + (depositEntity.getDCountPeriod() + 1) + "/" +
                        depositEntity.getDPeriod() + "회차)")
                .otherBank("EUM_BANK")
                .otherAccount(depositEntity.getDAccountNo())
                .transferType("출금")
                .afterBalance(afterBalance)
                .transactionType("DEPOSIT")
                .accountOut(BigDecimal.valueOf(depositEntity.getDPrincipalBal()))
                .accountIn(BigDecimal.ZERO)
                .pId(deposit.getANo())
                .build();

        entityManager.persist(history);
        logger.debug("   ✓ 거래 히스토리 저장 완료");

        // ═════════════════════════════════════════════════════════
        // 3-9. 납입 횟수 증가
        // ═════════════════════════════════════════════════════════
        queryFactory
                .update(productDeposit)
                .set(productDeposit.dCountPeriod, productDeposit.dCountPeriod.add(1))
                .where(productDeposit.dNo.eq(depositEntity.getDNo()))
                .execute();

        logger.debug("   ✓ 납입 횟수 증가: {}/{}",
                depositEntity.getDCountPeriod() + 1, depositEntity.getDPeriod());

        // ═════════════════════════════════════════════════════════
        // 3-10. 예금 금액 증액
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 예금 금액 증액 처리...");

        long depositUpdated = queryFactory
                .update(productDeposit)
                .set(productDeposit.dAmount,
                        productDeposit.dAmount.add(depositEntity.getDPrincipalBal()))
                .set(productDeposit.dUpdatedAt, LocalDateTime.now())
                .where(productDeposit.dNo.eq(depositEntity.getDNo()))
                .execute();

        if (depositUpdated == 0) {
            logger.warn("   ⚠ 예금 업데이트 실패 - dNo: {}", depositEntity.getDNo());
            return false;
        }

        logger.info("   ✓ 예금 증액 완료 - 증액액: {}원", depositEntity.getDPrincipalBal());

        return true;
    }

    /**
     * 예금 만기 처리를 수행합니다.
     *
     * @param depositEntity 만기 처리할 예금 정보
     * @return 처리 성공 여부
     */
    private boolean processDepositMaturity(ProductDeposit depositEntity) {
        logger.info("   ┌─────────────────────────────────────────────────────");
        logger.info("   │ 예금 만기 처리 시작");
        logger.info("   ├─────────────────────────────────────────────────────");
        logger.info("   │ 예금번호: {}", depositEntity.getDNo());
        logger.info("   │ 만기금액: {}원", depositEntity.getDExpectedMaturityAmount());
        logger.info("   │ 원금: {}원", depositEntity.getDPrincipalBal());
        logger.info("   │ 이자: {}원",
                depositEntity.getDExpectedMaturityAmount() - depositEntity.getDPrincipalBal());
        logger.info("   └─────────────────────────────────────────────────────");

        try {
            // 예금 금액을 만기금액으로 업데이트
            queryFactory
                    .update(productDeposit)
                    .set(productDeposit.dAmount, depositEntity.getDExpectedMaturityAmount())
                    .where(productDeposit.dNo.eq(depositEntity.getDNo()))
                    .execute();

            // 예금 상태를 완료로 변경
            queryFactory
                    .update(productDeposit)
                    .set(productDeposit.dStatus, "COMPLETE")
                    .where(productDeposit.dNo.eq(depositEntity.getDNo()))
                    .execute();

            // 원래 계좌로 만기금액 입금
            queryFactory
                    .update(account)
                    .set(account.balance,
                            account.balance.add(depositEntity.getDExpectedMaturityAmount()))
                    .where(account.aNo.eq(depositEntity.getANo()))
                    .execute();

            // 만기 거래 히스토리 저장
            TransferHistory history = TransferHistory.builder()
                    .transferId(generateTransferId())
                    .accountNo(Integer.valueOf(depositEntity.getAAccountNo()))
                    .amount(BigDecimal.valueOf(depositEntity.getDExpectedMaturityAmount()))
                    .memo("예금 만기 - " + depositEntity.getDId())
                    .otherBank("EUM_BANK")
                    .otherAccount(depositEntity.getDAccountNo())
                    .transferType("입금")
                    .afterBalance(BigDecimal.ZERO)
                    .transactionType("DEPOSIT_MATURITY")
                    .accountOut(BigDecimal.ZERO)
                    .accountIn(BigDecimal.valueOf(depositEntity.getDExpectedMaturityAmount()))
                    .pId(depositEntity.getANo())
                    .build();

            entityManager.persist(history);

            logger.info("   ✓ 예금 만기 처리 완료 - 만기금액 {}원 입금",
                    depositEntity.getDExpectedMaturityAmount());

            return true;

        } catch (Exception e) {
            logger.error("   ✗ 예금 만기 처리 실패 - dNo: {}", depositEntity.getDNo(), e);
            throw e;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 적금 자동이체 스케줄러
    // ═══════════════════════════════════════════════════════════════

    /**
     * 적금 자동이체를 처리하는 스케줄러입니다.
     *
     * <p>실행 주기: 120초마다 (cron = "* /20 * * * * ?")
     *
     * <p>처리 프로세스:
     * <ol>
     *   <li>ACTIVE 상태의 적금 목록 조회</li>
     *   <li>각 적금에 대해 연결된 계좌에서 월 납입액 차감</li>
     *   <li>적금 계좌로 입금 처리</li>
     *   <li>거래 히스토리 기록</li>
     *   <li>납입 횟수 증가</li>
     *   <li>만기 시 원금+이자를 원래 계좌로 반환</li>
     * </ol>
     *
     * <p>주의사항:
     * <ul>
     *   <li>비관적 락(PESSIMISTIC_WRITE)을 사용하여 동시성 제어</li>
     *   <li>트랜잭션 내에서 실행되며, 예외 발생 시 롤백 처리</li>
     *   <li>잔액 부족 시 실패 횟수를 기록하고 다음 적금 처리</li>
     * </ul>
     */
    @Scheduled(cron = "*/120 * * * * ?")
    @Transactional
    public void deductSavingWithLock() {
        LocalDateTime startTime = LocalDateTime.now();

        logger.info("╔═══════════════════════════════════════════════════════════════");
        logger.info("║ [START] 적금 자동이체 스케줄러 실행");
        logger.info("╠═══════════════════════════════════════════════════════════════");
        logger.info("║ 실행 시각: {}", startTime.format(DATE_FORMATTER));
        logger.info("║ 스케줄 주기: 120초");
        logger.info("╚═══════════════════════════════════════════════════════════════");

        int totalCount = 0;
        int successCount = 0;
        int failCount = 0;
        int skipCount = 0;

        try {
            // ─────────────────────────────────────────────────────────
            // STEP 1: ACTIVE 적금 존재 여부 확인
            // ─────────────────────────────────────────────────────────
            logger.debug("┌─────────────────────────────────────────────────────────────");
            logger.debug("│ STEP 1: ACTIVE 적금 존재 여부 확인");
            logger.debug("└─────────────────────────────────────────────────────────────");

            boolean hasActiveSavings = queryFactory
                    .selectOne()
                    .from(productInstallment)
                    .where(productInstallment.iStatus.eq("ACTIVE"))
                    .fetchFirst() != null;

            if (!hasActiveSavings) {
                logger.info("───────────────────────────────────────────────────────────────");
                logger.info("   처리할 ACTIVE 적금이 없습니다.");
                logger.info("───────────────────────────────────────────────────────────────");
                logger.info("╔═══════════════════════════════════════════════════════════════");
                logger.info("║ [END] 적금 자동이체 스케줄러 종료 (처리 대상 없음)");
                logger.info("╚═══════════════════════════════════════════════════════════════\n");
                return;
            }

            // ─────────────────────────────────────────────────────────
            // STEP 2: ACTIVE 적금 목록 조회
            // ─────────────────────────────────────────────────────────
            logger.debug("┌─────────────────────────────────────────────────────────────");
            logger.debug("│ STEP 2: ACTIVE 적금 목록 조회 (데드락 방지를 위해 정렬)");
            logger.debug("└─────────────────────────────────────────────────────────────");

            List<ProductInstallment> savings = queryFactory
                    .selectFrom(productInstallment)
                    .where(productInstallment.iStatus.eq("ACTIVE"))
                    .orderBy(productInstallment.iNo.asc()) // 데드락 방지용 정렬
                    .fetch();

            totalCount = savings.size();

            logger.info("───────────────────────────────────────────────────────────────");
            logger.info("   조회된 ACTIVE 적금 개수: {} 건", totalCount);
            logger.info("───────────────────────────────────────────────────────────────");

            // ─────────────────────────────────────────────────────────
            // STEP 3: 각 적금에 대해 자동이체 처리
            // ─────────────────────────────────────────────────────────
            for (int i = 0; i < savings.size(); i++) {
                ProductInstallment saving = savings.get(i);

                logger.info("┌─────────────────────────────────────────────────────────────");
                logger.info("│ 적금 처리 [{}/{}]", (i + 1), totalCount);
                logger.info("├─────────────────────────────────────────────────────────────");
                logger.info("│ 적금번호(iNo): {}", saving.getINo());
                logger.info("│ 적금계좌번호: {}", saving.getIAccountNo());
                logger.info("│ 연결계좌(aNo): {}", saving.getANo());
                logger.info("│ 연결계좌번호: {}", saving.getAAccountNo());
                logger.info("│ 월납입액: {}원", saving.getIPrincipalBal());
                logger.info("│ 현재납입회차: {}/{}", saving.getICountPeriod(), saving.getIMonth());
                logger.info("│ 현재 적금액: {}원", saving.getIAmount());
                logger.info("└─────────────────────────────────────────────────────────────");

                try {
                    // 적금 개별 처리
                    boolean processed = processSavingTransaction(saving);

                    if (processed) {
                        successCount++;
                        logger.info("   ✓ 적금 처리 성공 - iNo: {}", saving.getINo());
                    } else {
                        skipCount++;
                        logger.info("   ○ 적금 처리 스킵 - iNo: {}", saving.getINo());
                    }

                } catch (Exception e) {
                    failCount++;
                    logger.error("   ✗ 적금 처리 실패 - iNo: {}", saving.getINo());
                    logger.error("   에러 메시지: {}", e.getMessage(), e);
                }
            }

            // ─────────────────────────────────────────────────────────
            // STEP 4: 처리 결과 요약
            // ─────────────────────────────────────────────────────────
            LocalDateTime endTime = LocalDateTime.now();
            long executionTime = java.time.Duration.between(startTime, endTime).toMillis();

            logger.info("╔═══════════════════════════════════════════════════════════════");
            logger.info("║ [SUCCESS] 적금 자동이체 스케줄러 처리 완료");
            logger.info("╠═══════════════════════════════════════════════════════════════");
            logger.info("║ 처리 결과 요약:");
            logger.info("║   - 전체 건수: {} 건", totalCount);
            logger.info("║   - 성공: {} 건", successCount);
            logger.info("║   - 실패: {} 건", failCount);
            logger.info("║   - 스킵: {} 건", skipCount);
            logger.info("║ 실행 시간: {}ms", executionTime);
            logger.info("║ 완료 시각: {}", endTime.format(DATE_FORMATTER));
            logger.info("╚═══════════════════════════════════════════════════════════════\n");

        } catch (Exception e) {
            logger.error("╔═══════════════════════════════════════════════════════════════");
            logger.error("║ [ERROR] 적금 자동이체 스케줄러 실행 중 치명적 오류");
            logger.error("╠═══════════════════════════════════════════════════════════════");
            logger.error("║ 에러 메시지: {}", e.getMessage());
            logger.error("║ 처리 현황: 성공 {}, 실패 {}, 스킵 {}", successCount, failCount, skipCount);
            logger.error("╚═══════════════════════════════════════════════════════════════", e);
            throw e; // 트랜잭션 롤백
        }
    }

    /**
     * 개별 적금의 자동이체 트랜잭션을 처리합니다.
     *
     * @param saving 처리할 적금 정보
     * @return 처리 성공 여부 (true: 성공, false: 스킵)
     * @throws Exception 처리 중 오류 발생 시
     */
    private boolean processSavingTransaction(ProductInstallment saving) throws Exception {

        // ═════════════════════════════════════════════════════════
        // 3-1. 적금 정보 재확인 및 락 획득
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 적금 정보 재확인 및 락 획득 시도...");

        boolean savingExists = queryFactory
                .selectOne()
                .from(productInstallment)
                .where(productInstallment.iNo.eq(saving.getINo())
                        .and(productInstallment.iStatus.eq("ACTIVE")))
                .fetchFirst() != null;

        if (!savingExists) {
            logger.warn("   ⚠ 적금이 더 이상 ACTIVE 상태가 아님");
            return false;
        }

        ProductInstallment savingEntity = queryFactory
                .selectFrom(productInstallment)
                .where(productInstallment.iNo.eq(saving.getINo()))
                .setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
                .fetchOne();

        if (savingEntity == null) {
            logger.warn("   ⚠ 적금 정보를 찾을 수 없음 (이미 삭제되었거나 상태 변경됨)");
            return false;
        }

        // ═════════════════════════════════════════════════════════
        // 3-2. 만기 확인 및 처리
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 만기 여부 확인: {}/{}",
                savingEntity.getICountPeriod(), savingEntity.getIMonth());

        if (savingEntity.getIMonth().equals(savingEntity.getICountPeriod())) {
            logger.info("   ★ 적금 만기 도달 - 만기금액 반환 처리");
            return processSavingMaturity(savingEntity);
        }

        // ═════════════════════════════════════════════════════════
        // 3-3. 계좌 정보 조회 및 락 획득
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 연결 계좌 조회 및 락 획득 시도...");

        Account accountEntity = queryFactory
                .selectFrom(account)
                .where(
                        account.aNo.eq(savingEntity.getANo())
                                .and(account.accountNo.eq(savingEntity.getAAccountNo()))
                )
                .setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
                .fetchOne();

        if (accountEntity == null) {
            logger.warn("   ⚠ 연결 계좌를 찾을 수 없음 - aNo: {}, accountNo: {}",
                    savingEntity.getANo(), savingEntity.getAAccountNo());
            return false;
        }

        // ═════════════════════════════════════════════════════════
        // 3-4. 잔액 확인
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 잔액 확인: {} 원 (필요금액: {} 원)",
                accountEntity.getBalance(), savingEntity.getIPrincipalBal());

        boolean hasSufficientBalance = queryFactory
                .selectOne()
                .from(account)
                .where(
                        account.aNo.eq(savingEntity.getANo())
                                .and(account.balance.goe(savingEntity.getIPrincipalBal()))
                )
                .fetchFirst() != null;

        if (!hasSufficientBalance) {
            logger.warn("   ⚠ 잔액 부족 - 계좌: {}, 잔액: {}, 필요: {}",
                    savingEntity.getAAccountNo(),
                    accountEntity.getBalance(),
                    savingEntity.getIPrincipalBal());

            // 잔액 부족 시 실패 횟수 증가
            queryFactory
                    .update(productInstallment)
                    .set(productInstallment.iFail, productInstallment.iFail.add(1))
                    .where(productInstallment.iNo.eq(savingEntity.getINo()))
                    .execute();

            logger.warn("   실패 횟수 증가: {}", savingEntity.getIFail() + 1);
            return false;
        }

        // ═════════════════════════════════════════════════════════
        // 3-5. 계좌 잔액 차감
        // ═════════════════════════════════════════════════════════
        BigDecimal beforeBalance = accountEntity.getBalance();

        logger.debug("   → 계좌 잔액 차감 처리...");

        long accountUpdated = queryFactory
                .update(account)
                .set(account.balance, account.balance.subtract(savingEntity.getIPrincipalBal()))
                .set(account.updatedAt, LocalDateTime.now())
                .where(account.aNo.eq(savingEntity.getANo()))
                .execute();

        if (accountUpdated == 0) {
            logger.warn("   ⚠ 계좌 업데이트 실패 - aNo: {}", accountEntity.getANo());
            return false;
        }

        BigDecimal afterBalance = beforeBalance.subtract(
                BigDecimal.valueOf(savingEntity.getIPrincipalBal()));

        logger.info("   ✓ 계좌 차감 완료 - 차감액: {}원, 잔액: {}원 → {}원",
                savingEntity.getIPrincipalBal(), beforeBalance, afterBalance);

        // ═════════════════════════════════════════════════════════
        // 3-6. 거래 히스토리 저장
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 거래 히스토리 저장...");

        TransferHistory history = TransferHistory.builder()
                .transferId(generateTransferId())
                .accountNo(accountEntity.getANo())
                .amount(BigDecimal.valueOf(savingEntity.getIPrincipalBal()))
                .memo("적금 자동이체 - " + savingEntity.getIId() +
                        " (" + (savingEntity.getICountPeriod() + 1) + "/" +
                        savingEntity.getIMonth() + "회차)")
                .otherBank("EUM_BANK")
                .otherAccount(savingEntity.getIAccountNo())
                .transferType("출금")
                .afterBalance(afterBalance)
                .transactionType("INSTALLMENT")
                .accountOut(BigDecimal.valueOf(savingEntity.getIPrincipalBal()))
                .accountIn(BigDecimal.ZERO)
                .pId(saving.getANo())
                .build();

        entityManager.persist(history);
        logger.debug("   ✓ 거래 히스토리 저장 완료");

        // ═════════════════════════════════════════════════════════
        // 3-7. 적금 금액 증액 및 납입 횟수 증가
        // ═════════════════════════════════════════════════════════
        logger.debug("   → 적금 금액 증액 및 납입 횟수 증가 처리...");

        long savingUpdated = queryFactory
                .update(productInstallment)
                .set(productInstallment.iAmount,
                        productInstallment.iAmount.add(savingEntity.getIPrincipalBal()))
                .set(productInstallment.iCountPeriod,
                        productInstallment.iCountPeriod.add(1))
                .set(productInstallment.iUpdatedAt, LocalDateTime.now())
                .where(productInstallment.iNo.eq(savingEntity.getINo()))
                .execute();

        if (savingUpdated == 0) {
            logger.warn("   ⚠ 적금 업데이트 실패 - iNo: {}", savingEntity.getINo());
            return false;
        }

        logger.info("   ✓ 적금 납입 완료 - 납입액: {}원, 납입회차: {}/{}",
                savingEntity.getIPrincipalBal(),
                savingEntity.getICountPeriod() + 1,
                savingEntity.getIMonth());

        return true;
    }

    /**
     * 적금 만기 처리를 수행합니다.
     *
     * @param savingEntity 만기 처리할 적금 정보
     * @return 처리 성공 여부
     */
    private boolean processSavingMaturity(ProductInstallment savingEntity) {
        logger.info("   ┌─────────────────────────────────────────────────────");
        logger.info("   │ 적금 만기 처리 시작");
        logger.info("   ├─────────────────────────────────────────────────────");
        logger.info("   │ 적금번호: {}", savingEntity.getINo());
        logger.info("   │ 만기금액: {}원", savingEntity.getIExpectedMaturityAmount());
        logger.info("   │ 원금총액: {}원",
                savingEntity.getIPrincipalBal() * savingEntity.getIMonth());
        logger.info("   │ 이자: {}원",
                savingEntity.getIExpectedMaturityAmount() -
                        (savingEntity.getIPrincipalBal() * savingEntity.getIMonth()));
        logger.info("   └─────────────────────────────────────────────────────");

        try {
            // 적금 상태를 완료로 변경
            queryFactory
                    .update(productInstallment)
                    .set(productInstallment.iStatus, "COMPLETE")
                    .where(productInstallment.iNo.eq(savingEntity.getINo()))
                    .execute();

            // 적금 금액을 만기금액으로 업데이트
            queryFactory
                    .update(productInstallment)
                    .set(productInstallment.iAmount, savingEntity.getIExpectedMaturityAmount())
                    .where(productInstallment.iNo.eq(savingEntity.getINo()))
                    .execute();

            // 원래 계좌로 만기금액 입금
            queryFactory
                    .update(account)
                    .set(account.balance,
                            account.balance.add(savingEntity.getIExpectedMaturityAmount()))
                    .where(account.aNo.eq(savingEntity.getANo()))
                    .execute();

            // 만기 거래 히스토리 저장
            TransferHistory history = TransferHistory.builder()
                    .transferId(generateTransferId())
                    .accountNo(Integer.valueOf(savingEntity.getAAccountNo()))
                    .amount(BigDecimal.valueOf(savingEntity.getIExpectedMaturityAmount()))
                    .memo("적금 만기 - " + savingEntity.getIId())
                    .otherBank("EUM_BANK")
                    .otherAccount(savingEntity.getIAccountNo())
                    .transferType("입금")
                    .afterBalance(BigDecimal.ZERO)
                    .transactionType("INSTALLMENT_MATURITY")
                    .accountOut(BigDecimal.ZERO)
                    .accountIn(BigDecimal.valueOf(savingEntity.getIExpectedMaturityAmount()))
                    .build();

            entityManager.persist(history);

            logger.info("   ✓ 적금 만기 처리 완료 - 만기금액 {}원 입금",
                    savingEntity.getIExpectedMaturityAmount());

            return true;

        } catch (Exception e) {
            logger.error("   ✗ 적금 만기 처리 실패 - iNo: {}", savingEntity.getINo(), e);
            throw e;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 유틸리티 메서드
    // ═══════════════════════════════════════════════════════════════

    /**
     * 거래 ID를 생성합니다.
     *
     * <p>20자리 영숫자 조합의 고유한 거래 ID를 생성합니다.
     * SecureRandom을 사용하여 보안성을 확보합니다.
     *
     * @return 생성된 거래 ID (20자리)
     */
    private String generateTransferId() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(20);

        for (int i = 0; i < 20; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }

        String transferId = sb.toString();
        logger.trace("   거래 ID 생성: {}", transferId);

        return transferId;
    }
}