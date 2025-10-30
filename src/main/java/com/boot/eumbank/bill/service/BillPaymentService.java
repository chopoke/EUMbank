package com.boot.eumbank.bill.service;

import com.boot.eumbank.bill.adapter.BillGateway;
import com.boot.eumbank.bill.entity.BillInvoice;
import com.boot.eumbank.bill.entity.BillPayment;
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

    public BillPayment pay(Integer biNo, Integer aNo, String idemKey) {
        if (idemKey!=null) {
            payRepo.findByBpIdempotencyKey(idemKey).ifPresent(p -> { throw new DuplicateKeyException("idem"); });
        }
        BillInvoice inv = invRepo.findById(biNo).orElseThrow();
        if (!"READY".equals(inv.getBiStatus())) throw new IllegalStateException("이미 처리됨");

        BillPayment p = new BillPayment();
        p.setInvoice(inv);
        p.setBill(inv.getBill());
        p.setANo(aNo);
        p.setBpAmount(inv.getBiAmount());
        p.setBpStatus("PENDING");
        p.setBpIdempotencyKey(idemKey);
        payRepo.saveAndFlush(p);

        var res = gateway.pay(inv.getBill(), inv, inv.getBiAmount(), idemKey);
        if (res.success()) {
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

