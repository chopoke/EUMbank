package com.boot.eumbank.bill.model;

import com.boot.eumbank.bill.entity.BillInvoice;
import com.boot.eumbank.bill.entity.UtilityBill;

import java.math.BigDecimal;

public record PayCommand(
        UtilityBill bill,
        BillInvoice invoice,
        BigDecimal amount,
        String idempotencyKey
) {}
