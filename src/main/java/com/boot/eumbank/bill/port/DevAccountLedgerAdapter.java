package com.boot.eumbank.bill.port;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@Profile({"local","dev"})
@RequiredArgsConstructor
public class DevAccountLedgerAdapter implements AccountLedgerPort {
    private final JdbcTemplate jdbc;

    @Override
    public void recordDebit(Integer aNo, BigDecimal amount, BigDecimal balanceAfter,
                            String transferId, String transferType, String memo) {
        int n = jdbc.update(
                "INSERT INTO TRANSFER_HISTORY_TBL " +
                        "(a_no, th_account_in, th_account_out, th_after_balance, th_amount, " +
                        " th_transfer_at, th_transfer_id, th_transfer_type, th_memo) " +
                        "VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ? )",
                aNo,
                0,
                amount,                  // 출금
                balanceAfter,            // 차감 후 잔액
                amount,                  // 이번 거래 금액
                LocalDateTime.now(),     // th_transfer_at
                transferId,              // 예: 영수증번호 또는 bp_no 기반
                transferType,            // 예: "공과금"
                memo                     // 예: "공과금 납부 NH_GIRO 2025-10"
        );
        log.info("[LEDGER] insert n={} aNo={} out={} bal={} id={} type={}",
                n, aNo, amount, balanceAfter, transferId, transferType);
    }
}
