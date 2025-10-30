package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BillInvoiceRepo extends JpaRepository<BillInvoice, Integer> {
    Optional<BillInvoice> findByBillUbNoAndBiBillYm(Integer ubNo, String ym);
}