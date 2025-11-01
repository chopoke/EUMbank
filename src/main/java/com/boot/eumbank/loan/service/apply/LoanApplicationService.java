package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.loan.dto.apply.LoanApplicationRequestDTO;
import com.boot.eumbank.loan.dto.apply.LoanApplicationResponseDTO;
import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsRequestDTO;

import java.util.Map;

public interface LoanApplicationService {

    // 대출 신청 저장
    public LoanApplicationResponseDTO createAndSubmit(LoanApplicationRequestDTO req, String channel);

    // 약관저장
    public Map<String, Object> saveConsents(LoanSaveConsentsRequestDTO req);
}
