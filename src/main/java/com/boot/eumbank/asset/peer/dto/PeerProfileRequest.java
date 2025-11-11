package com.boot.eumbank.asset.peer.dto;

public record PeerProfileRequest(
        String gender,     // "M" | "F"
        String ageBand,    // "A1".."A5"  (저장 시 정수대역으로 매핑)
        String jobGroup,   // "J1".. 등 코드
        String incomeBand, // "I1".. 등 코드
        String region      // "서울" ...
) {}
