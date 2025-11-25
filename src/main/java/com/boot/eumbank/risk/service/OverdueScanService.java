// src/main/java/com/boot/eumbank/risk/service/OverdueScanService.java
package com.boot.eumbank.risk.service;

import com.boot.eumbank.risk.repo.DelinquencyEventRepo;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OverdueScanService {

    @PersistenceContext
    private EntityManager em;

    private final RiskGradeService risk;
    private final DelinquencyEventRepo delinquencyEventRepo;

    /** 만기 후 N일 이상 방치 시 연체로 간주 (테스트용 0일) */
    private static final int GRACE_DAYS = 0;

    /** 예금 연체 후보 상태 */
    private static final List<String> DEPOSIT_STATUSES = List.of(
            "ACTIVE", "MATURED_UNSETTLED", "MATURED"
    );

    /** 적금 연체 후보 상태 */
    private static final List<String> SAVING_STATUSES = List.of(
            "ACTIVE"
    );

    /** 대출 연체 후보 상태 */
    private static final List<String> LOAN_STATUSES = List.of(
            "ACTIVE", "DELINQUENT"
    );

    /** 예·적금에서 한 번 연체로 잡힌 뒤에 바꿔줄 상태값 */
    private static final String STATUS_OVERDUE = "OVERDUE";

    /* ========== 1. 예금 연체 스캔 ========== */
    @Transactional
    public int scanDeposits() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(GRACE_DAYS);

        String inQs = String.join(",", DEPOSIT_STATUSES.stream().map(s -> "?").toList());

        String selectSql =
                "SELECT d.c_no, " +              // 0
                        "       d.d_no, " +              // 1
                        "       d.d_maturity_date, " +   // 2
                        "       d.d_status, " +          // 3
                        "       d.d_principal_bal, " +   // 4
                        "       a.a_balance " +          // 5
                        "  FROM deposit_tbl d " +
                        "  JOIN account_tbl a ON d.a_no = a.a_no " +
                        " WHERE d.d_status IN (" + inQs + ")";

        var q = em.createNativeQuery(selectSql);
        int idx = 1;
        for (String st : DEPOSIT_STATUSES) q.setParameter(idx++, st);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        log.debug("[RISK] deposit scan rows (status in candidates) = {}", rows.size());

        int recorded = 0;
        for (Object[] r : rows) {
            Integer cNo      = ((Number) r[0]).intValue();
            Integer dNo      = ((Number) r[1]).intValue();
            Timestamp matTs  = (Timestamp) r[2];
            String status    = String.valueOf(r[3]);
            long principal   = ((Number) r[4]).longValue();
            long balance     = ((Number) r[5]).longValue();

            LocalDateTime maturity = (matTs != null) ? matTs.toLocalDateTime() : null;

            boolean isMaturityOverdue =
                    (maturity != null && !maturity.isAfter(cutoff)) && principal > 0;
            boolean isZeroBalance = balance <= 0;

            if (!isMaturityOverdue && !isZeroBalance) continue;

            StringBuilder reason = new StringBuilder();
            reason.append("deposit_no=").append(dNo).append(" 연체 발생 (");
            boolean first = true;

            if (isMaturityOverdue) {
                reason.append("만기일 경과(잔액=").append(principal).append(")");
                first = false;
            }
            if (isZeroBalance) {
                if (!first) reason.append(", ");
                reason.append("출금계좌 잔액 부족(balance=").append(balance).append(")");
            }
            reason.append(") status=").append(status);

            // 공통 연체 이벤트 기록
            risk.recordDelinquency(cNo, "DEPOSIT", reason.toString());

            // 예금 상태 OVERDUE로 변경
            em.createNativeQuery(
                            "UPDATE deposit_tbl " +
                                    "   SET d_status = ?, d_updated_at = CURRENT_TIMESTAMP " +
                                    " WHERE d_no = ?")
                    .setParameter(1, STATUS_OVERDUE)
                    .setParameter(2, dNo)
                    .executeUpdate();

            recorded++;
        }

        if (recorded > 0) {
            log.info("[RISK] deposit delinquency recorded count={}", recorded);
        }
        return recorded;
    }

    /* ========== 2. 적금 연체 스캔 ========== */
    @Transactional
    public int scanSavings() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(GRACE_DAYS);

        String inQs = String.join(",", SAVING_STATUSES.stream().map(s -> "?").toList());

        String selectSql =
                "SELECT i.c_no, " +               // 0
                        "       i.i_no, " +               // 1
                        "       i.i_maturity_date, " +    // 2
                        "       i.i_status, " +           // 3
                        "       i.i_principal_bal, " +    // 4
                        "       i.i_arrears_cnt, " +      // 5
                        "       i.i_arrears_amt, " +      // 6
                        "       i.i_fail, " +             // 7
                        "       a.a_balance " +           // 8
                        "  FROM installment_tbl i " +
                        "  JOIN account_tbl a ON i.a_no = a.a_no " +
                        " WHERE i.i_status IN (" + inQs + ")";

        var q = em.createNativeQuery(selectSql);
        int idx = 1;
        for (String st : SAVING_STATUSES) q.setParameter(idx++, st);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        log.debug("[RISK] saving scan rows (status in candidates) = {}", rows.size());

        int recorded = 0;
        for (Object[] r : rows) {
            Integer cNo      = ((Number) r[0]).intValue();
            Integer iNo      = ((Number) r[1]).intValue();
            Timestamp matTs  = (Timestamp) r[2];
            String status    = String.valueOf(r[3]);
            long principal   = r[4] == null ? 0L : ((Number) r[4]).longValue();
            int arrearsCnt   = ((Number) r[5]).intValue();
            long arrearsAmt  = ((Number) r[6]).longValue();
            int failCount    = ((Number) r[7]).intValue();
            long balance     = ((Number) r[8]).longValue();

            LocalDateTime maturity = (matTs != null) ? matTs.toLocalDateTime() : null;

            boolean isMaturityOverdue =
                    (maturity != null && !maturity.isAfter(cutoff)) && principal > 0;
            boolean hasArrears = (arrearsCnt > 0) || (arrearsAmt > 0);
            boolean isFailWithNoBalance = (failCount > 0) && (balance <= 0);

            if (!isMaturityOverdue && !hasArrears && !isFailWithNoBalance) continue;

            StringBuilder reason = new StringBuilder();
            reason.append("saving_no=").append(iNo).append(" 연체 발생 (");
            boolean first = true;

            if (isMaturityOverdue) {
                reason.append("만기일 경과(잔액=").append(principal).append(")");
                first = false;
            }
            if (hasArrears) {
                if (!first) reason.append(", ");
                reason.append("연체회차/금액 존재(cnt=")
                        .append(arrearsCnt).append(", amt=").append(arrearsAmt).append(")");
                first = false;
            }
            if (isFailWithNoBalance) {
                if (!first) reason.append(", ");
                reason.append("자동이체 실패(fail=")
                        .append(failCount).append(", balance=").append(balance).append(")");
            }
            reason.append(") status=").append(status);

            risk.recordDelinquency(cNo, "SAVING", reason.toString());

            em.createNativeQuery(
                            "UPDATE installment_tbl " +
                                    "   SET i_status = ?, i_updated_at = CURRENT_TIMESTAMP " +
                                    " WHERE i_no = ?")
                    .setParameter(1, STATUS_OVERDUE)
                    .setParameter(2, iNo)
                    .executeUpdate();

            recorded++;
        }

        if (recorded > 0) {
            log.info("[RISK] saving delinquency recorded count={}", recorded);
        }
        return recorded;
    }

    /* ========== 3. 대출 연체 스캔 ========== */
    @Transactional
    public int scanLoans() {
        // 만기 체크 기준일 (유예일 반영)
        LocalDate maturityCheckDate = LocalDate.now().minusDays(GRACE_DAYS);

        // "오늘" 하루 범위
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay   = startOfDay.plusDays(1);

        String inQs = String.join(",", LOAN_STATUSES.stream().map(s -> "?").toList());

        String selectSql =
                "SELECT l.c_no, " +               // 0
                        "       l.l_no, " +               // 1
                        "       l.l_maturity_date, " +    // 2
                        "       l.l_status, " +           // 3
                        "       l.l_balance, " +          // 4
                        "       a.a_balance " +           // 5
                        "  FROM loan_tbl l " +
                        "  JOIN account_tbl a ON l.l_repay_a_no = a.a_no " +
                        " WHERE l.l_status IN (" + inQs + ")";

        var q = em.createNativeQuery(selectSql);
        int idx = 1;
        for (String st : LOAN_STATUSES) q.setParameter(idx++, st);

        @SuppressWarnings("unchecked")
        List<Object[]> rows = q.getResultList();
        log.debug("[RISK] loan scan rows (status in candidates) = {}", rows.size());

        int recorded = 0;
        for (Object[] r : rows) {
            Integer cNo      = ((Number) r[0]).intValue();
            Integer loanNo   = ((Number) r[1]).intValue();
            Timestamp matTs  = (Timestamp) r[2];
            String status    = String.valueOf(r[3]);
            long loanBal     = ((Number) r[4]).longValue();
            long repayBal    = ((Number) r[5]).longValue();

            LocalDate maturity = null;
            if (matTs != null) {
                maturity = matTs.toLocalDateTime().toLocalDate();
            }

            boolean isMaturityOverdue =
                    (maturity != null && !maturity.isAfter(maturityCheckDate)) && loanBal > 0;
            boolean isFlagDelinquent =
                    "DELINQUENT".equalsIgnoreCase(status);
            boolean isRepayAccountEmpty = repayBal <= 0;

            if (!isMaturityOverdue && !isFlagDelinquent && !isRepayAccountEmpty) continue;

            // ======  하루에 한 번만 이벤트 기록 (중복 방지) ======
            String memoKeyword = "loan_no=" + loanNo;
            boolean existsToday = delinquencyEventRepo
                    .existsByCustomerNoAndCategoryAndMemoContainingAndOccurredAtBetween(
                            cNo,
                            "LOAN",
                            memoKeyword,
                            startOfDay,
                            endOfDay
                    );

            if (existsToday) {
                log.debug("[RISK] loan_no={} (cNo={}) 오늘 이미 LOAN 연체 이벤트 있어서 스킵", loanNo, cNo);
                continue;
            }
            // =====================================================

            StringBuilder reason = new StringBuilder();
            reason.append("loan_no=").append(loanNo).append(" 연체 발생 (");
            boolean first = true;

            if (isMaturityOverdue) {
                reason.append("만기일 경과(상환잔액=").append(loanBal).append(")");
                first = false;
            }
            if (isFlagDelinquent) {
                if (!first) reason.append(", ");
                reason.append("대출상태 DELINQUENT");
                first = false;
            }
            if (isRepayAccountEmpty) {
                if (!first) reason.append(", ");
                reason.append("상환계좌 잔액 부족(balance=").append(repayBal).append(")");
            }
            reason.append(") status=").append(status);

            // 대출은 상태는 건드리지 않고 이벤트만 쌓음
            risk.recordDelinquency(cNo, "LOAN", reason.toString());
            recorded++;
        }

        if (recorded > 0) {
            log.info("[RISK] loan delinquency recorded count={}", recorded);
        }
        return recorded;
    }
}
