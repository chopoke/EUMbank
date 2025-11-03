package com.boot.eumbank.product.scheduled;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.open.entity.account.QAccount;
import com.boot.eumbank.account.select.entity.TransferHistory;
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
import java.util.List;

/**
 * 예금 자동 스케줄러
 */
@Component
@RequiredArgsConstructor
public class MyScheduler {

    private final Logger logger = LoggerFactory.getLogger(MyScheduler.class);

    private final JPAQueryFactory queryFactory;
    private final EntityManager entityManager;

    // Q클래스
    private final QProductDeposit productDeposit = QProductDeposit.productDeposit;
    private final QProductInstallment productInstallment = QProductInstallment.productInstallment;

    private final QAccount account = QAccount.account;


    /**
     * 예금
     */
    @Scheduled(cron = "*/30 * * * * ?")
    @Transactional
    public void deductDepositWithLock() {

//        logger.info("MyScheduler => deductDepositWithLock() 시작 - {}", LocalDateTime.now());
//
//        try {
//
//            // ⭐ 1. ACTIVE 예금이 존재하는지 먼저 확인
//            boolean hasActiveDeposits = queryFactory
//                    .selectOne()
//                    .from(productDeposit)
//                    .where(productDeposit.dStatus.eq("ACTIVE"))
//                    .fetchFirst() != null;
//
//            if (!hasActiveDeposits) {
//                logger.info("처리할 ACTIVE 예금이 없습니다.");
//                return;
//            }
//
//            // 2. ACTIVE 예금 목록 조회
//            List<ProductDeposit> deposits = queryFactory
//                    .selectFrom(productDeposit)
//                    .where(productDeposit.dStatus.eq("ACTIVE"))
//                    .orderBy(productDeposit.dNo.asc()) // 데드락 방지
//                    .fetch();
//
//            logger.info("처리할 예금 건수: {}", deposits.size());
//
//            int successCount = 0;
//            int failCount = 0;
//
//            for (var deposit : deposits) {
//
//                logger.info("처리 중 - dNo: {}, aNo: {}, accountNo: {}",
//                        deposit.getDNo(), deposit.getANo(), deposit.getAAccountNo());
//
//                try {
//                    boolean depositExists = queryFactory
//                            .selectOne()
//                            .from(productDeposit)
//                            .where(productDeposit.dNo.eq(deposit.getDNo()))
//                            .fetchFirst() != null;
//
//                    if (!depositExists) {
//                        logger.warn("예금이 더 이상 ACTIVE 상태가 아님 - dNo: {}", deposit.getDNo());
//                        failCount++;
//                        continue;
//                    }
//
//                    // 4. 예금 정보 락 (FOR UPDATE)
//                    ProductDeposit depositEntity = queryFactory
//                            .selectFrom(productDeposit)
//                            .where(productDeposit.dNo.eq(deposit.getDNo()))
//                            .setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
//                            .fetchOne();
//
//                    if (depositEntity == null) {
//                        logger.warn("예금 정보를 찾을 수 없음 - dNo: {}", deposit.getDNo());
//                        failCount++;
//                        continue;
//                    }
//
//                    ProductDeposit product = queryFactory
//                            .selectFrom(productDeposit)
//                            .where(productDeposit.dNo.eq(deposit.getDNo()))
//                            .fetchOne();
//
//                    if(product.getDCountPeriod().equals(product.getDPeriod())) {
//                        logger.info("완료 처리");
//
//                        queryFactory
//                                .update(productDeposit)
//                                .set(productDeposit.dStatus, "NONE")
//                                .execute();
//                        continue;
//                    }
//
//                    logger.info(String.valueOf(product.getDAmount()));
//                    logger.info(String.valueOf(product.getDPrincipalBal()));
//                    if(product.getDAmount() == product.getDPrincipalBal() && product.getDStatus().equals("ACTIVE")) {
//                        logger.info("정상적으로 현재 금액을 유지중입니다.");
//
//                        // 기간 증가
//                        queryFactory
//                                .update(productDeposit)
//                                .set(productDeposit.dCountPeriod, productDeposit.dCountPeriod.add(1))
//                                .execute();
//
//                        logger.info("testddr " + product.getDPeriod());
//                        logger.info("testddr " + product.getDCountPeriod());
//                        // 해당 개월수 일치하는 경우 ACTIVE => NONE
//
//                        continue;
//                    }
//
//                    // 에금 기간이 1회가 넘었거나, 그리고 금액이 일치하지 않을시..
//                    if(product.getDCountPeriod() > 1 && !(product.getDAmount() == product.getDPrincipalBal() == false)){
//                        logger.info("약속된 금액을 입금해주세요.");
//                        // 기간 증가
//                        queryFactory
//                                .update(productDeposit)
//                                .set(productDeposit.dFail, productDeposit.dCountPeriod.add(1))
//                                .execute();
//                    }
//
//                    // 5. 계좌 존재 여부 exists로 확인
//                    boolean accountExists = queryFactory
//                            .selectOne()
//                            .from(account)
//                            .where(
//                                    account.aNo.eq(depositEntity.getANo())
//                                            .and(account.accountNo.eq(depositEntity.getAAccountNo()))
//                            )
//                            .fetchFirst() != null;
//
//                    if (!accountExists) {
//                        logger.warn("계좌가 존재하지 않음 - aNo: {}, accountNo: {}",
//                                depositEntity.getANo(), depositEntity.getAAccountNo());
//                        failCount++;
//                        continue;
//                    }
//
//                    // 6. 계좌 정보 락 (FOR UPDATE)
//                    Account accountEntity = queryFactory
//                            .selectFrom(account)
//                            .where(
//                                    account.aNo.eq(depositEntity.getANo())
//                                            .and(account.accountNo.eq(depositEntity.getAAccountNo()))
//                            )
//                            .setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
//                            .fetchOne();
//
//                    if (accountEntity == null) {
//                        logger.warn("계좌를 찾을 수 없음 - aNo: {}, accountNo: {}",
//                                depositEntity.getANo(), depositEntity.getAAccountNo());
//                        failCount++;
//                        continue;
//                    }
//
//                    // ⭐ 7. 잔액이 충분한지 exists로 확인 (조회 전 미리 체크)
//                    boolean hasSufficientBalance = queryFactory
//                            .selectOne()
//                            .from(account)
//                            .where(
//                                    account.aNo.eq(accountEntity.getANo())
//                                            .and(account.balance.goe(depositEntity.getDPrincipalBal()))
//                            )
//                            .fetchFirst() != null;
//
//                    if (!hasSufficientBalance) {
//                        logger.warn("잔액 부족 - 계좌: {}, 필요금액: {}",
//                                depositEntity.getAAccountNo(),
//                                depositEntity.getDPrincipalBal());
//                        failCount++;
//                        continue;
//                    }
//
//                    // 8. 잔액 체크 (실제 값 확인)
//                    if (accountEntity.getBalance().compareTo(BigDecimal.valueOf(depositEntity.getDPrincipalBal())) < 0) {
//                        logger.warn("잔액 부족 - 계좌: {}, 잔액: {}, 차감금액: {}",
//                                depositEntity.getAAccountNo(),
//                                accountEntity.getBalance(),
//                                depositEntity.getDPrincipalBal());
//                        failCount++;
//                        continue;
//                    }
//
//                    BigDecimal beforeBalance = accountEntity.getBalance();
//
//                    // 9. 계좌 잔액 차감
//                    long accountUpdated = queryFactory
//                            .update(account)
//                            .set(account.balance,
//                                    account.balance.subtract(depositEntity.getDPrincipalBal()))
//                            .set(account.updatedAt, LocalDateTime.now())
//                            .where(account.aNo.eq(accountEntity.getANo()))
//                            .execute();
//
//                    if (accountUpdated == 0) {
//                        logger.warn("계좌 업데이트 실패 - aNo: {}", accountEntity.getANo());
//                        failCount++;
//                        continue;
//                    }
//
//                    logger.info("계좌 차감 완료 - 계좌번호: {}, 차감금액: {}",
//                            depositEntity.getAAccountNo(), depositEntity.getDPrincipalBal());
//
//
//                    // transfer_history_tbl에 히스토리 쌓기
//                    BigDecimal afterBalance = beforeBalance.subtract(BigDecimal.valueOf(depositEntity.getDPrincipalBal()));
//
//                    TransferHistory history = TransferHistory.builder()
//                            // transferNo는 자동 생성되므로 제외
//                            .transferId(generateTransferId())  // 고유 ID
//                            .accountNo(accountEntity.getANo())  // a_no (계좌 PK)
//                            .amount(BigDecimal.valueOf(depositEntity.getDPrincipalBal()))  // 거래 금액
//                            .memo("예금 자동이체 - " + depositEntity.getDId())  // 메모
//                            .otherBank("EUM_BANK")  // 상대방 은행
//                            .otherAccount(depositEntity.getDAccountNo())  // 상대방 계좌 (예금계좌)
//                            .transferType("DEPOSIT_AUTO")  // 이체 유형
//                            .afterBalance(afterBalance)  // 거래 후 잔액
//                            .transactionType("WITHDRAW")  // 거래 구분 (출금)
//                            .accountOut(BigDecimal.valueOf(depositEntity.getDPrincipalBal()))  // 출금액
//                            .accountIn(BigDecimal.ZERO)  // 입금액 (출금이므로 0)
//                            .build();
//
//                    entityManager.persist(history);
//                    logger.info("거래 히스토리 저장 완료 - 계좌: {}, 금액: {}",
//                            accountEntity.getAccountNo(), depositEntity.getDPrincipalBal());
//
//                    // 기간 증가
//                    queryFactory
//                            .update(productDeposit)
//                            .set(productDeposit.dCountPeriod, productDeposit.dCountPeriod.add(1))
//                            .execute();
//
//                    logger.info("기간 증감");
//
//                    // 10. 예금 테이블 업데이트
//                    long depositUpdated = queryFactory
//                            .update(productDeposit)
//                            .set(productDeposit.dAmount,
//                                    productDeposit.dAmount.add(depositEntity.getDPrincipalBal()))
//                            .set(productDeposit.dUpdatedAt, LocalDateTime.now())
//                            .where(productDeposit.dNo.eq(depositEntity.getDNo()))
//                            .execute();
//
//                    if (depositUpdated == 0) {
//                        logger.warn("예금 업데이트 실패 - dNo: {}", depositEntity.getDNo());
//                        failCount++;
//                        continue;
//                    }
//
//                    logger.info("예금 증액 완료 - 예금번호: {}, 증액금액: {}",
//                            depositEntity.getDNo(), depositEntity.getDPrincipalBal());
//
//                    successCount++;
//
//                } catch (Exception e) {
//                    logger.error("개별 예금 처리 중 에러 - depositNo: {}", deposit.getDNo(), e);
//                    failCount++;
//                }
//            }
//
//
//
//        } catch (Exception e) {
//            logger.error("deductDepositWithLock 실행 중 에러", e);
//            throw e; // 트랜잭션 롤백
//        }
    }

    private String generateTransferId() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(20);

        for (int i = 0; i < 20; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * 적금 자동 스케줄러
     */
    @Scheduled(cron = "*/59 * * * * ?")
    @Transactional
    public void deductSavingWithLock() {

        logger.info("MyScheduler => deductSavingWithLock() 시작 - {}", LocalDateTime.now());

        try {

            // 1. ACTIVE 적금이 존재하는지 먼저 확인
            boolean hasActiveSavings = queryFactory
                    .selectOne()
                    .from(productInstallment)
                    .where(productInstallment.iStatus.eq("ACTIVE"))
                    .fetchFirst() != null;

            if (!hasActiveSavings) {
                logger.info("처리할 ACTIVE 적금이 없습니다.");
                return;
            }

            // 2. ACTIVE 적금 목록 조회
            List<ProductInstallment> savings = queryFactory
                    .selectFrom(productInstallment)
                    .where(productInstallment.iStatus.eq("ACTIVE"))
                    .orderBy(productInstallment.iNo.asc()) // 데드락 방지
                    .fetch();

            logger.info("ff" + savings);

            logger.info("처리할 적금 건수: {}", savings.size());

            int successCount = 0;
            int failCount = 0;

            // 적금 목록들 차례대로 실행
            for (var saving : savings) {

                // installment_tbl
                logger.info("처리 중 - 적금 번호/sNo: {}, 해당 계정 번호/aNo: {}, 계좌번호/installAccountNo: {}",
                        saving.getINo(), saving.getANo(), saving.getIAccountNo());

                try {
                    // 3. 적금 존재 여부 확인
                    boolean savingExists = queryFactory
                            .selectOne()
                            .from(productInstallment)
                            .where(productInstallment.iNo.eq(saving.getINo())
                                    .and(productInstallment.iStatus.eq("ACTIVE")))
                            .fetchFirst() != null;

                    if (!savingExists) {
                        logger.warn("적금이 더 이상 ACTIVE 상태가 아님 - sNo: {}", saving.getINo());
                        continue;
                    }

                    // 4. 적금 정보 락 - ACID 격리성
                    ProductInstallment savingEntity = queryFactory
                            .selectFrom(productInstallment)
                            .where(productInstallment.iNo.eq(saving.getINo()))
                            .setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
                            .fetchOne();

                    if (savingEntity == null) {
                        logger.warn("적금 정보를 찾을 수 없음 - sNo: {}", saving.getINo());
                        continue;
                    }

                    // 총 납입일
                    logger.info(String.valueOf(saving.getIMonth()));
                    // 현재 납입 횟수
                    logger.info(String.valueOf((saving.getICountPeriod())));
                    // 5. 만기 확인 (총 기간 == 현재 납입 횟수)
                    if (saving.getIMonth().equals(saving.getICountPeriod())) {
                        logger.info("적금 만기 완료 처리 - sNo: {}", saving.getINo());
                        queryFactory
                                .update(productInstallment)
                                .set(productInstallment.iStatus, "COMPLETE")
                                .where(productInstallment.iNo.eq(saving.getINo()))
                                .execute();
                        continue;
                    }

                    logger.info("현재 적금 금액: {}, 월 납입액: {}, 납입 횟수: {}/{}",
                            saving.getIAmount(),
                            saving.getIPrincipalBal(),
                            saving.getIMonth(),
                            saving.getICountPeriod());

                    // 6. 정상 납입 확인
                    // 예상 금액 = 월 납입액 * 납입 횟수
                    Long expectedAmount = BigDecimal.valueOf(savingEntity.getIPrincipalBal())
                            .multiply(savingEntity.getIInterestRate())
                            .longValue();


                    // 7. 계좌 정보 락 (FOR UPDATE)
                    Account accountEntity = queryFactory
                            .selectFrom(account)
                            .where(
                                    account.aNo.eq(saving.getANo())
                                            .and(account.accountNo.eq(saving.getAAccountNo()))
                            )
                            .setLockMode(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
                            .fetchOne();

                    if (accountEntity == null) {
                        logger.warn("계좌를 찾을 수 없음 - aNo: {}, accountNo: {}",
                                saving.getANo(), saving.getAAccountNo());
                        continue;
                    }

                    // 8. 잔액 충분 여부 확인
                    boolean hasSufficientBalance = queryFactory
                            .selectOne()
                            .from(account)
                            .where(
                                    account.aNo.eq(saving.getANo())
                                            .and(account.balance.goe(saving.getIPrincipalBal()))
                            )
                            .fetchFirst() != null;

                    if (!hasSufficientBalance) {
                        logger.warn("잔액 부족 - 계좌: {}, 필요금액: {}",
                                saving.getAAccountNo(),
                                saving.getIPrincipalBal());

                        failCount++;

                        // 잔액 부족도 실패로 카운트
                        queryFactory
                                .update(productInstallment)
                                .set(productInstallment.iFail, failCount)
                                .where(productInstallment.iNo.eq(saving.getINo()))
                                .execute();
                        continue;
                    }

                    BigDecimal beforeBalance = accountEntity.getBalance();

                    // 12. 계좌 잔액 차감
                    long accountUpdated = queryFactory
                            .update(account)
                            .set(account.balance, account.balance.subtract(expectedAmount))
                            .set(account.updatedAt, LocalDateTime.now())
                            .where(account.aNo.eq(saving.getANo()))
                            .execute();

                    if (accountUpdated == 0) {
                        logger.warn("계좌 업데이트 실패 - aNo: {}", accountEntity.getANo());
                        failCount++;
                        continue;
                    }

                    logger.info("계좌 차감 완료 - 계좌번호: {}, 차감금액: {}",
                            saving.getAAccountNo(), expectedAmount);

                    // 13. 거래 히스토리 저장
                    BigDecimal afterBalance = beforeBalance.subtract(BigDecimal.valueOf(savingEntity.getIPrincipalBal()));

                    TransferHistory history = TransferHistory.builder()
                            .transferId(generateTransferId())  // 고유 ID
                            .accountNo(accountEntity.getANo())  // a_no (계좌 PK)
                            .amount(BigDecimal.valueOf(saving.getIPrincipalBal()))  // 거래 금액
                            .memo("적금 자동이체 - " + saving.getIId() + " (" +
                                    (saving.getICountPeriod() + 1) + "/" + saving.getIMonth() + "회차)")
                            .otherBank("EUM_BANK")  // 상대방 은행
                            .otherAccount(saving.getAAccountNo())  // 상대방 계좌 (적금계좌)
                            .transferType("SAVING_AUTO")  // 이체 유형
                            .afterBalance(afterBalance)  // 거래 후 잔액
                            .transactionType("WITHDRAW")  // 거래 구분 (출금)
                            .accountOut(BigDecimal.valueOf(saving.getIPrincipalBal()))  // 출금액
                            .accountIn(BigDecimal.ZERO)  // 입금액 (출금이므로 0)
                            .build();

                    entityManager.persist(history);
                    logger.info("거래 히스토리 저장 완료 - 계좌: {}, 금액: {}",
                            accountEntity.getAccountNo(), saving.getIPrincipalBal());

                    // 14. 적금 테이블 업데이트 (금액 증가 + 납입 횟수 증가)
                    long savingUpdated = queryFactory
                            .update(productInstallment)
                            .set(productInstallment.iAmount,
                                    productInstallment.iAmount.add(saving.getIPrincipalBal()))
                            .set(productInstallment.iCountPeriod,
                                    productInstallment.iCountPeriod.add(1))
                            .set(productInstallment.iUpdatedAt, LocalDateTime.now())
                            .where(productInstallment.iNo.eq(saving.getINo()))
                            .execute();

                    if (savingUpdated == 0) {
                        logger.warn("적금 업데이트 실패 - sNo: {}", saving.getINo());
                        failCount++;
                        continue;
                    }

                    logger.info("적금 납입 완료 - 적금번호: {}, 납입금액: {}, 납입횟수: {}/{}",
                            saving.getINo(),
                            saving.getIAmount(),
                            saving.getIMonth(),
                            saving.getICountPeriod() + 1);

                    successCount++;

                } catch (Exception e) {
                    //logger.error("개별 적금 처리 중 에러 - savingNo: {}", saving.getSNo(), e);
                    failCount++;
                }
            }

            logger.info("적금 스케줄러 완료 - 성공: {}, 실패: {}", successCount, failCount);

        } catch (Exception e) {
            logger.error("deductSavingWithLock 실행 중 에러", e);
            throw e; // 트랜잭션 롤백
        }
    }
}