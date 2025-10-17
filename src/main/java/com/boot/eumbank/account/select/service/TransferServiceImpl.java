package com.boot.eumbank.account.select.service;

import com.boot.eumbank.account.select.dto.TransactionDTO;
import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.account.select.repository.TransferHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransferServiceImpl implements TransferService {
    private final TransferHistoryRepository repo;

    @Override
    public Page<TransactionDTO> transactions(int a_no, String type,
                                             LocalDateTime from, LocalDateTime to, Pageable pageable) {
        Timestamp fromAt = (from != null) ? Timestamp.valueOf(from) : null;
        Timestamp toAt   = (to   != null) ? Timestamp.valueOf(to)   : null;

        return repo.search(a_no, type, fromAt, toAt, pageable)
                .map(this::toDTO);
    }

    private TransactionDTO toDTO(TransferHistory th) {
        return TransactionDTO.builder()
                .th_transfer_no(th.getTh_transfer_no())
                .th_transfer_id(th.getTh_transfer_id())
                .a_no(th.getA_no())
                .th_amount(th.getTh_amount())
                .th_transfer_type(th.getTh_transfer_type())
                .th_transaction_type(th.getTh_transaction_type())
                .th_memo(th.getTh_memo())
                .th_other_bank(th.getTh_other_bank())
                .th_other_account(th.getTh_other_account())
                .th_after_balance(th.getTh_after_balance())
                .th_account_out(th.getTh_account_out())
                .th_account_in(th.getTh_account_in())
                .th_transfer_at(
                        th.getTh_transfer_at() != null ? th.getTh_transfer_at().toLocalDateTime() : null
                )
                .build();
    }
}