package com.boot.eumbank.bill.dto;

import com.boot.eumbank.bill.entity.UtilityBill;

public record UtilityBillDto(Integer ubNo, String bpCode, String ubId,
                             String ubHolder, String ubAddr, String ubStatus) {
    public static UtilityBillDto from(UtilityBill u) {
        return new UtilityBillDto(
                u.getUbNo(), u.getBpCode(), u.getUbId(),
                u.getUbHolder(), u.getUbAddr(), u.getUbStatus());
    }
}
