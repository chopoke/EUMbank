// com.boot.eumbank.foreign.dto.ForeignProductDto.java
package com.boot.eumbank.foreign.dto;

import java.math.BigDecimal;

public record ForeignProductDto(
        Integer id,
        String curUnit,
        String curNm,
        BigDecimal ttb,
        BigDecimal tts,
        BigDecimal dealBasR,
        BigDecimal apy,
        String dpProtectYn,
        String ioYn,
        Integer termMon,
        String prodType
) {}
