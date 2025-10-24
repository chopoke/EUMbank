// src/main/java/com/boot/eumbank/foreign/dto/FxOpenRespDto.java
package com.boot.eumbank.foreign.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxOpenRespDto {
    private String accountNo;
    private String currency;
    private String productCode;
    private String accountType;
    private LocalDateTime openedAt;
}
