package com.boot.eumbank.account.select.service;


import com.boot.eumbank.account.select.dto.AccountDetailDTO;
import com.boot.eumbank.account.select.dto.AccountSummaryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface AccountSelectService {
    // 리스트조회
    List<AccountSummaryDTO> list(int c_no);
    // 페이징 리스트처리
    Page<AccountSummaryDTO> listpage(int c_no, Pageable pageable);
    // 단건조회
    Optional<AccountDetailDTO> detail(int a_no);

    //별명검증
    public void updateNickname(int a_no, String nickName);
}