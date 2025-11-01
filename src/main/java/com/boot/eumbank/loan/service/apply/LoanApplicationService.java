package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsRequestDTO;

import java.util.Map;

public interface LoanApplicationService {

    public Map<String,Object> saveConsentsNoop(LoanSaveConsentsRequestDTO req);
    public CreateApplicationResponseDTO createAndSubmit(CreateApplicationRequestDTO req, String channel);

}
