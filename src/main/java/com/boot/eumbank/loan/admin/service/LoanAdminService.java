package com.boot.eumbank.loan.admin.service;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.loan.admin.dto.*;
import org.springframework.data.domain.Page;

public interface LoanAdminService {

    // 리스트
    Page<LoanApplySummaryDTO> findApplications(LoanApplySearchDTO cond);
    LoanApplyDetailDTO getDetail(String laId);
    void startReview(String laId);
    LoanApproveResultDTO approve(String laId, LoanApproveComDTO cmd);
    void reject(String laId, LoanRejectComDTO cmd);
}
