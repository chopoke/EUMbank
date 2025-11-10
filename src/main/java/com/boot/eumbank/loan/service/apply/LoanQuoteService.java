package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.loan.dto.apply.LoanApplicationRequestDTO;
import com.boot.eumbank.loan.dto.apply.LoanApplicationResponseDTO;
import com.boot.eumbank.loan.dto.apply.LoanQuoteRequestDTO;
import com.boot.eumbank.loan.dto.apply.LoanQuoteResponseDTO;

public interface LoanQuoteService {
    public LoanQuoteResponseDTO quote(String loanCode, LoanQuoteRequestDTO req, Customer customer);

}
