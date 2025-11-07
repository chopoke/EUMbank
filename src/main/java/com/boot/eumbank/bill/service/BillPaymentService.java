package com.boot.eumbank.bill.service;

import com.boot.eumbank.bill.adapter.BillGateway;
import com.boot.eumbank.bill.entity.BillInvoice;
import com.boot.eumbank.bill.entity.BillPayment;
import com.boot.eumbank.bill.port.AccountDebitPort;
import com.boot.eumbank.bill.port.AccountLedgerPort;
import com.boot.eumbank.bill.repo.BillInvoiceRepo;
import com.boot.eumbank.bill.repo.BillPaymentRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service @RequiredArgsConstructor @Transactional
public class BillPaymentService {
    private final BillPaymentRepo payRepo;
    private final BillInvoiceRepo invRepo;
    private final BillGateway gateway;
    private final AccountDebitPort debit;
    private final AccountLedgerPort ledger;

    private static String billTypeLabel(String ubType) {
        if (ubType == null) return "공과금";
        return switch (ubType) {
            case "ELECTRIC" -> "전기";
            case "WATER"    -> "수도";
            case "GAS"      -> "가스";
            case "TELCO"    -> "통신";
            case "TAX"      -> "세금";
            default         -> ubType; // 그 외는 원문 표시
        };
    }

    public BillPayment pay(Integer biNo, Integer aNo, String idempotencyKey) {
        if (idempotencyKey!=null) {
            payRepo.findByBpIdempotencyKey(idempotencyKey).ifPresent(p -> { throw new DuplicateKeyException("idem"); });
        }
        BillInvoice inv = invRepo.findById(biNo).orElseThrow();
        if (!"READY".equals(inv.getBiStatus())) throw new IllegalStateException("이미 처리됨");

        BillPayment p = new BillPayment();
        p.setInvoice(inv);
        p.setBill(inv.getBill());
        p.setANo(aNo);
        p.setBpAmount(inv.getBiAmount());
        p.setBpStatus("PENDING");
        p.setBpIdempotencyKey(idempotencyKey);
        payRepo.saveAndFlush(p);

        var res = gateway.pay(inv.getBill(), inv, inv.getBiAmount(), idempotencyKey);
        if (res.success()) {
            // 1) 잔액 차감 → 최신 잔액
            var newBal = debit.debit(aNo, inv.getBiAmount());

            // 2) 거래내역 기록(출금)
            String transferId = res.receiptNo() != null ? res.receiptNo() : "BP-" + p.getBpNo();
            var bill = inv.getBill();
            String memo = "공과금 납부(" + billTypeLabel(bill.getUbType()) + ") " + inv.getBiBillYm();
            ledger.recordDebit(aNo, inv.getBiAmount(), newBal, transferId, "출금", memo);

            // 3) 상태 반영
            p.setBpStatus("SUCCESS");
            p.setBpProviderTxId(res.providerTxId());
            p.setBpReceiptNo(res.receiptNo());
            p.setBpPaidAt(java.time.LocalDateTime.now(com.boot.eumbank.bill.util.Kst.ZONE));
            inv.setBiStatus("PAID");
        } else {
            p.setBpStatus("FAILED");
        }
        return p;
    }
}

