package com.boot.eumbank.bill.core.impl;

import com.boot.eumbank.bill.core.AutopayRunner;
import com.boot.eumbank.bill.core.BillPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

// 간단 구현: 오늘 날짜=pay_day 인 항목만 처리
@Service
@RequiredArgsConstructor
public class AutopayRunnerImpl implements AutopayRunner {
    private final JdbcTemplate jdbc;
    private final BillPaymentService pay;

    @Override
    public int runDueAutopay(LocalDateTime now){
        var y = now.getYear(); var m = now.getMonthValue();
        var day = now.getDayOfMonth();
        var t = now.toLocalTime().toString();

        // 납부 대상 청구서 조회(READY, 해당 ub_no, 최신 월)
        var rows = jdbc.query("""
      SELECT ap.ba_no, ap.ub_no, ap.a_no, bi.bi_no
      FROM bill_autopay_tbl ap
      JOIN bill_invoice_tbl bi ON bi.ub_no = ap.ub_no
      WHERE ap.ba_active='Y'
        AND ap.ba_pay_day = ?
        AND (ap.ba_pay_time IS NULL OR ap.ba_pay_time <= ?)
        AND bi.bi_status='READY'
        AND bi.bi_year = ? AND bi.bi_month = ?
    """, (rs,i)-> new int[]{ rs.getInt("ba_no"), rs.getInt("ub_no"),
                rs.getInt("a_no"), rs.getInt("bi_no") }, day, t, y, m);

        int ok=0;
        for (var r: rows) {
            pay.payNow(r[3], r[2]); ok++;
        }
        return ok;
    }
}
