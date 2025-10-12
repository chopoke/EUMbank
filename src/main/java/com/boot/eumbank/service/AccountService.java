package com.boot.eumbank.service;


import com.boot.eumbank.dto.AccountDetailDTO;
import com.boot.eumbank.dto.AccountSummaryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface AccountService {
    List<AccountSummaryDTO> list(int c_no);
    Page<AccountSummaryDTO> listpage(int c_no, Pageable pageable);
    AccountDetailDTO detail(int a_no);
}
