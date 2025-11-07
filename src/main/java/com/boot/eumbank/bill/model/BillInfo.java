package com.boot.eumbank.bill.model;

public record BillInfo(String customerNo, String title, String extra) {
    public static BillInfo empty() { return new BillInfo(null, null, null); }
}
