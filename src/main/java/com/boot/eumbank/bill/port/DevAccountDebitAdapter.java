package com.boot.eumbank.bill.port;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@Profile({"local","dev"})
@RequiredArgsConstructor
public class DevAccountDebitAdapter implements AccountDebitPort {
    private final JdbcTemplate jdbc;

    @Override
    public BigDecimal debit(Integer aNo, BigDecimal amount) {
        int updated = jdbc.update(
                // 잔액 충분할 때만 차감. 동시성 안전.
                "UPDATE ACCOUNT_TBL SET a_balance = a_balance - ? " +
                        "WHERE a_no = ? AND a_balance >= ?",
                amount, aNo, amount
        );
        if (updated == 0) throw new IllegalStateException("INSUFFICIENT_BALANCE");
        return jdbc.queryForObject(
                "SELECT a_balance FROM ACCOUNT_TBL WHERE a_no=?",
                (rs, i) -> rs.getBigDecimal(1), aNo
        );
    }
}
