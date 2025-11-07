// enums/DocumentStatus.java
package com.boot.eumbank.account.open.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DocumentStatus {
    PENDING("심사중"),
    APPROVED("승인완료"),
    REJECTED("반려");

    private final String description;
}