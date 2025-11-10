package com.boot.eumbank.account.select.service;


import com.boot.eumbank.account.select.dto.TransactionDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface TransferService {
    Page<TransactionDTO> transactions(int a_no, String th_transfer_type,
                                      LocalDateTime from, LocalDateTime to,
                                      Pageable pageable);
    // 예끔
    Page<TransactionDTO> depositTransactions(int dNo, String type,
                                             LocalDateTime from, LocalDateTime to, Pageable pageable);

    //적금추가
    Page<TransactionDTO> installmentTransactions(int iNo, String type,
                                                 LocalDateTime from, LocalDateTime to, Pageable pageable);
}