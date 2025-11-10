package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BillInvoiceRepo extends JpaRepository<BillInvoice,Integer> {
    List<BillInvoice> findByUbNoAndBiStatusInOrderByBiYearDescBiMonthDesc(Integer ubNo, Collection<String> st);
    Optional<BillInvoice> findByUbNoAndBiYearAndBiMonth(Integer ubNo, Integer y, Integer m);
}
