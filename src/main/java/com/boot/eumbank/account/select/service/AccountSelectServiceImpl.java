package com.boot.eumbank.account.select.service;

import com.boot.eumbank.account.open.model.Account;
import com.boot.eumbank.account.select.dto.AccountDetailDTO;
import com.boot.eumbank.account.select.dto.AccountSummaryDTO;
import com.boot.eumbank.account.select.repository.AccountSelectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountSelectServiceImpl implements AccountSelectService {

    private final AccountSelectRepository accountRepository;

    @Override
    public List<AccountSummaryDTO> list(int c_no) {
        return accountRepository.findAccountsByCustomer(c_no)
                .stream().map(this::toSummaryDTO).toList();
    }

    // 페이지네이션
    @Override
    public Page<AccountSummaryDTO> listpage(int c_no, Pageable pageable){
        Page<Account> page = accountRepository
                .findAccountsByCustomer(c_no, pageable);
        return page.map(this::toSummaryDTO);
    }

    @Override
    public Optional<AccountDetailDTO> detail(int a_no) {
        return accountRepository.findById(a_no)
                .map(this::toDetailDTO);
    }

    @Override
    @Transactional
    public void updateNickname(int a_no, String nickName) {
        String trimName = (nickName == null) ?  "" : nickName.trim();
        if(trimName.isEmpty()){
            throw new IllegalArgumentException("별명은 공백일 수 없습니다.");
        }
        if(trimName.length() > 10) {
            throw new IllegalArgumentException("별명은 30자 이내로 입력해주세요.");
        }

        long updateCnt = accountRepository.updateNickname(a_no, trimName);
        if(updateCnt != 1){
            throw new IllegalArgumentException("별명 변경 오류 ");
        }
    }

    // --------- mapping ---------
    private AccountSummaryDTO toSummaryDTO(Account a) {
        AccountSummaryDTO dto = new AccountSummaryDTO();
        dto.setA_no(a.getANo());
        dto.setA_id(a.getAId());
        dto.setA_account_no(a.getAccountNo());
        dto.setA_account_type(a.getAccountType());
        dto.setA_currency(a.getCurrency());
        dto.setA_balance(a.getBalance());
        dto.setA_nickname(a.getNickname());
        dto.setA_status(a.getStatus());
        dto.setLastTransferAt(a.getLastTxAt());
        return dto;
    }

    private AccountDetailDTO toDetailDTO(Account a) {
        AccountDetailDTO dto = new AccountDetailDTO();
        dto.setA_no(a.getANo());
        dto.setA_id(a.getAId());
        dto.setC_no(a.getCNo());
        dto.setA_product_code(a.getProductCode());
        dto.setA_account_no(a.getAccountNo());
        dto.setA_account_type(a.getAccountType());
        dto.setA_currency(a.getCurrency());
        dto.setA_balance(a.getBalance());
        dto.setA_status(a.getStatus());
        dto.setA_nickname(a.getNickname());
        dto.setA_opened_at(a.getOpenedAt());
        dto.setA_closed_at(a.getClosedAt());
        dto.setA_last_tx_at(a.getLastTxAt());
        return dto;
    }
}