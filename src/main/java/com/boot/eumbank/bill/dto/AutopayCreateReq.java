package com.boot.eumbank.bill.dto;

public record AutopayCreateReq(Integer aNo, Integer payDay, String payTime,
                               String startDate, String endDate, String memo) { } // 날짜 YYYY-MM-DD
