package com.boot.eumbank.bill.dto;

public record AutopayRes(Integer baNo, Integer aNo, Integer payDay, String payTime,
                         String startedAt, String endedAt) { }
