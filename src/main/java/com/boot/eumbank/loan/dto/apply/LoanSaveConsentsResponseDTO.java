package com.boot.eumbank.loan.dto.apply;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class LoanSaveConsentsResponseDTO {
    private boolean ok;
    private int count;
}
