package com.boot.eumbank.loan.service.payment;

import com.boot.eumbank.loan.dto.payment.RepaymentRequestDTO;
import com.boot.eumbank.loan.dto.payment.RepaymentResponseDTO;

public interface LoanRepaymentService {

    public RepaymentResponseDTO repay(Long loanNo, RepaymentRequestDTO req);

}
