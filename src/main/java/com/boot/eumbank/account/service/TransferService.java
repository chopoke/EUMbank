package com.boot.eumbank.account.service;


import com.boot.eumbank.account.dto.TransactionDTO;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface TransferService {
    Page<TransactionDTO> transactions(int a_no, String th_transfer_type,
                                      LocalDateTime from, LocalDateTime to,
                                      int page, int size);
}
