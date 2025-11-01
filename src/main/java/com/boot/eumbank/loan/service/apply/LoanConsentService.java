package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsResponseDTO;
import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsRequestDTO;

public interface LoanConsentService {
    public LoanSaveConsentsResponseDTO saveConsents(LoanSaveConsentsRequestDTO req, Long laNo, Integer cNo);

}
