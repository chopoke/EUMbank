package com.boot.eumbank.asset.dashboard.dto;

public record TopSavingsDto(
        TopInstallmentDto installment,   // 없으면 null
        TopDepositDto     deposit,        // 없으면 null
        TopLoanDto  loan   // 없으면 null
) {}
