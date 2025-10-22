package com.boot.eumbank.account.select.service;


import com.boot.eumbank.account.select.dto.TransactionDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface TransferService {
    Page<TransactionDTO> transactions(int a_no, String th_transfer_type,
                                      LocalDateTime from, LocalDateTime to,
                                      Pageable pageable);
}