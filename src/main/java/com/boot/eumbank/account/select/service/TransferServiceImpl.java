package com.boot.eumbank.account.select.service;

import com.boot.eumbank.account.select.dto.TransactionDTO;
import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.account.select.repository.DepoSelectRepository;
import com.boot.eumbank.account.select.repository.InstSelectRepository;
import com.boot.eumbank.account.select.repository.TransferHistoryRepository;
import com.boot.eumbank.product.entity.product.ProductDeposit;
import com.boot.eumbank.product.entity.product.ProductInstallment;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Service("accountSelectTransferService")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransferServiceImpl implements TransferService {
    private final TransferHistoryRepository repo;
    private final DepoSelectRepository depoRepo;
    private final InstSelectRepository instRepo;

    @Override
    public Page<TransactionDTO> transactions(int a_no, String type,
                                             LocalDateTime from, LocalDateTime to, Pageable pageable) {
        Timestamp fromAt = (from != null) ? Timestamp.valueOf(from) : null;
        Timestamp toAt   = (to   != null) ? Timestamp.valueOf(to)   : null;

        return repo.search(a_no, type, fromAt, toAt, pageable)
                .map(this::toDTO);
    }

    @Override
    public Page<TransactionDTO> depositTransactions(int dNo, String type, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        // 예끔엔티티에서 dNo 연결
        ProductDeposit depo = depoRepo.findById((long) dNo)
                .orElseThrow(() -> new IllegalArgumentException("예금 계좌 없음: " + dNo));

        String depoAccountNo = depo.getDAccountNo();  // 예금 계좌번호
        Timestamp fromAt = from != null ? Timestamp.valueOf(from) : null;
        Timestamp toAt   = to   != null ? Timestamp.valueOf(to)   : null;

        return repo.searchByOtherAccount(depoAccountNo, type, fromAt, toAt, pageable)
                .map(this::toDTO);

    }

    @Override
    public Page<TransactionDTO> installmentTransactions(int iNo, String type, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        ProductInstallment inst = instRepo.findById((long) iNo)
                .orElseThrow(() -> new IllegalArgumentException("적금 계좌 없음: " + iNo));

        String instAccountNo = inst.getIAccountNo();  // 적금 계좌번호
        Timestamp fromAt = from != null ? Timestamp.valueOf(from) : null;
        Timestamp toAt   = to   != null ? Timestamp.valueOf(to)   : null;

        return repo.searchByOtherAccount(instAccountNo, type, fromAt, toAt, pageable)
                .map(this::toDTO);
    }

    private TransactionDTO toDTO(TransferHistory th) {
        return TransactionDTO.builder()
                .th_transfer_no(th.getTransferNo())
                .th_transfer_id(th.getTransferId())
                .a_no(th.getAccountNo())
                .th_amount(th.getAmount())
                .th_transfer_type(th.getTransferType())
                .th_transaction_type(th.getTransactionType())
                .th_memo(th.getMemo())
                .th_other_bank(th.getOtherBank())
                .th_other_account(th.getOtherAccount())
                .th_after_balance(th.getAfterBalance())
                .th_account_out(th.getAccountOut())
                .th_account_in(th.getAccountIn())
                .th_transfer_at(
                        th.getTransferAt() != null ? th.getTransferAt() : null
                )
                .build();
    }
}