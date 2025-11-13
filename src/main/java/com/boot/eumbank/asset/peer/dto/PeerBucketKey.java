package com.boot.eumbank.asset.peer.dto;

public record PeerBucketKey(
        String gender,
        Integer age,
        String income,
        String job,
        String region
) {}
