package com.boot.eumbank.account.select.service;

import com.boot.eumbank.account.select.dto.TransactionDTO;
import com.boot.eumbank.account.select.repository.TransferHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransferServiceImpl implements TransferService {
    private final TransferHistoryRepository repo;

    @Override
    public Page<TransactionDTO> transactions(int a_no, String type,
                                             LocalDateTime from, LocalDateTime to, int page, int size) {
        return Page.empty();
    }
}