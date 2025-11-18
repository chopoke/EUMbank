package com.boot.eumbank.asset.peer.dto;

import java.math.BigDecimal;

public record PeerBucketSums(
        int n,
        BigDecimal totalAssets,
        BigDecimal totalLiabilities,
        BigDecimal netWorth,
        BigDecimal cash,
        BigDecimal installment,
        BigDecimal deposit,
        BigDecimal foreign,
        BigDecimal gold
) {}

