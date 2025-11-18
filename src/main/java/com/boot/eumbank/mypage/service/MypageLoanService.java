// src/main/java/com/boot/eumbank/mypage/service/MypageLoanService.java
package com.boot.eumbank.mypage.service;

import com.boot.eumbank.mypage.projection.LoanApplicationRow;
import com.boot.eumbank.mypage.projection.LoanRow;
import com.boot.eumbank.mypage.repository.MypageLoanViewRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MypageLoanService {
    private final MypageLoanViewRepo repo;

    public List<LoanRow> findLoans(Integer cNo) {
        return repo.findLoansByCustomer(cNo);
    }

    public List<LoanApplicationRow> findPendingApps(Integer cNo) {
        return repo.findPendingAppsByCustomer(cNo);
    }
}
