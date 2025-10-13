package com.boot.eumbank.account.service;


import com.boot.eumbank.account.dto.AccountDetailDTO;
import com.boot.eumbank.account.dto.AccountSummaryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface AccountService {
    // 리스트조회
    List<AccountSummaryDTO> list(int c_no);
    // 페이징 리스트처리
    Page<AccountSummaryDTO> listpage(int c_no, Pageable pageable);
    // 단건조회
    Optional<AccountDetailDTO> detail(int a_no);
}
