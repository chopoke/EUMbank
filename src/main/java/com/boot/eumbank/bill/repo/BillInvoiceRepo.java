package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillInvoice;

import java.util.Collection;

public interface BillInvoiceRepo extends JpaRepository<BillInvoice,Integer>{
    List<BillInvoice> findByUbNoAndBiStatusInOrderByBiYearDescBiMonthDesc(Integer ubNo, Collection<String> st);
    Optional<BillInvoice> findByUbNoAndBiYearAndBiMonth(Integer ubNo, Integer y, Integer m);
}
