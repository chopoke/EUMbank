package com.boot.eumbank.asset.peer.dto;

public record PeerBucketKey(
        String gender,
        Integer ageBand,
        String incomeCd,
        String jobCd,
        String regionCd
) {}
