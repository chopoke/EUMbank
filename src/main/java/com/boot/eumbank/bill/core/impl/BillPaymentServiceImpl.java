package com.boot.eumbank.bill.core.impl;

import com.boot.eumbank.bill.core.BillPaymentService;
import com.boot.eumbank.bill.entity.BillPayment;
import com.boot.eumbank.bill.repo.BillInvoiceRepo;
import com.boot.eumbank.bill.repo.BillPaymentRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillPaymentServiceImpl implements BillPaymentService {
    private final BillInvoiceRepo invoiceRepo;
    private final BillPaymentRepo paymentRepo;
    private final JdbcTemplate jdbc; // 계좌 차감 및 거래내역 기록용(기존 스키마에 맞춤)

    @Transactional
    @Override public BillPayment payNow(Integer biNo, Integer aNo) {
        var inv = invoiceRepo.findById(biNo).orElseThrow();
        if (!"READY".equals(inv.getBiStatus())) throw new IllegalStateException("이미 처리됨");

        BigDecimal amt = inv.getBiAmount();

        // 1) 계좌 잔액 차감 (임의 SQL. 실제 a_balance 컬럼 존재 기준)
        jdbc.update("UPDATE account_tbl SET a_balance = a_balance - ? WHERE a_no = ?", amt, aNo);

        // 2) 거래내역 INSERT: 출금 표시(th_account_out=amt, after_balance=서브쿼리)
        jdbc.update("""
          INSERT INTO transfer_history_tbl
          (a_no, th_account_in, th_account_out, th_after_balance, th_amount,
           th_transfer_at, th_transfer_id, th_transfer_type, th_memo, th_other_account, th_other_bank, th_transaction_type)
          SELECT ?, NULL, ?, a_balance, ?, NOW(6), ?, '출금',
                 ?, NULL, NULL, 'WITHDRAWAL'
          FROM account_tbl WHERE a_no = ?
        """,
                aNo, amt, amt, // th_amount는 절대값 보관
                "BP-" + biNo + "-" + UUID.randomUUID().toString().substring(0,8),
                memoFor(inv.getUbNo()), aNo
        );

        // 3) 납부 이력 저장
        var p = new BillPayment();
        p.setBiNo(biNo); p.setANo(aNo);
        p.setBpId("BP-" + biNo + "-" + System.currentTimeMillis());
        p.setBpAmount(amt); p.setBpStatus("COMPLETED");
        p.setBpReceiptNo("RC-" + UUID.randomUUID().toString().substring(0,12));
        p.setBpPaidAt(LocalDateTime.now()); p.setBpCreatedAt(LocalDateTime.now());
        var saved = paymentRepo.save(p);

        // 4) 청구 상태 갱신
        inv.setBiStatus("PAID");
        invoiceRepo.save(inv);

        return saved;
    }

    private String memoFor(Integer ubNo){
        // ub_no -> 공급자 종류를 조인해 "공과금 납부(전기/수도/가스)" 메모 생성 (간단화)
        String kind = jdbc.queryForObject("""
      SELECT bp.bp_kind FROM utility_bill_tbl ub
      JOIN bill_provider_tbl bp ON bp.bp_code = ub.bp_code
      WHERE ub.ub_no = ?
    """, String.class, ubNo);
        return switch (kind) {
            case "ELEC" -> "공과금 납부(전기)";
            case "WATER"-> "공과금 납부(수도)";
            case "GAS"  -> "공과금 납부(가스)";
            default     -> "공과금 납부";
        };
    }
}
