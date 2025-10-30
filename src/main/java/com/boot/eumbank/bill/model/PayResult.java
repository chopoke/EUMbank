package com.boot.eumbank.bill.model;

public record PayResult(boolean success, String providerTxId, String receiptNo, String message) {
    public static PayResult ok(String txId, String receipt) { return new PayResult(true, txId, receipt, null); }
    public static PayResult fail(String msg) { return new PayResult(false, null, null, msg); }
}
