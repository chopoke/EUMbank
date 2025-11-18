package com.boot.eumbank.asset.peer.dto;

import java.math.BigDecimal;

public record PeerTotals(
        BigDecimal totalAssets,
        BigDecimal totalLiabilities,
        BigDecimal netWorth,
        BigDecimal cash,
        BigDecimal installment,
        BigDecimal deposit,
        BigDecimal foreign,
        BigDecimal gold
) {
    public static PeerTotals zero() {
        BigDecimal z = BigDecimal.ZERO;
        return new PeerTotals(z,z,z,z,z,z,z,z);
    }

    public PeerTotals minus(PeerTotals o) {
        return new PeerTotals(
                totalAssets.subtract(o.totalAssets()),
                totalLiabilities.subtract(o.totalLiabilities()),
                netWorth.subtract(o.netWorth()),
                cash.subtract(o.cash()),
                installment.subtract(o.installment()),
                deposit.subtract(o.deposit()),
                foreign.subtract(o.foreign()),
                gold.subtract(o.gold())
        );
    }
}
