package com.boot.eumbank.bill.core;

import com.boot.eumbank.bill.entity.BillPayment;

public interface BillPaymentService {
    BillPayment payNow(Integer biNo, Integer aNo);
}
