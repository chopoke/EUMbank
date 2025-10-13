// src/main/java/com/boot/eumbank/foreign/dto/FxOpenReqDto.java
package com.boot.eumbank.foreign.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxOpenReqDto {
    private Integer customerId;
    private Integer productId;
    private String  currency;
    private Integer termMon;
    private String  krwAccountNo;
    private String  agreeTerms;
    private String  agreePrivacy;
    private String  agreeMarketing; // optional
}
