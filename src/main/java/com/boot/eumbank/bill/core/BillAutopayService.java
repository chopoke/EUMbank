package com.boot.eumbank.bill.core;

import com.boot.eumbank.bill.entity.BillAutopay;

import java.util.List;

public interface BillAutopayService {
    List<BillAutopay> list(Integer ubNo);
    BillAutopay create(Integer ubNo, Integer aNo, Integer payDay, String payTime, String memo);
    BillAutopay patch(Integer baNo, String active, Integer payDay, String payTime, String memo);
    void delete(Integer baNo);
}
