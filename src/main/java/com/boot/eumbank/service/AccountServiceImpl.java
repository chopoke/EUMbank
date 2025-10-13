package com.boot.eumbank.service;

import com.boot.eumbank.entity.Account;
import com.boot.eumbank.dto.AccountDetailDTO;
import com.boot.eumbank.dto.AccountSummaryDTO;
import com.boot.eumbank.repository.AccountRepository;
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
public class AccountServiceImpl implements AccountService{

    private final AccountRepository accountRepository;

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

    // --------- mapping ---------
    private AccountSummaryDTO toSummaryDTO(Account a) {
        AccountSummaryDTO dto = new AccountSummaryDTO();
        dto.setA_no(a.getA_no());
        dto.setA_id(a.getA_id());
        dto.setA_account_no(a.getA_account_no());
        dto.setA_account_type(a.getA_account_type());
        dto.setA_currency(a.getA_currency());
        dto.setA_balance(a.getA_balance());
        dto.setA_nickname(a.getA_nickname());
        dto.setA_status(a.getA_status());
        return dto;
    }

    private AccountDetailDTO toDetailDTO(Account a) {
        AccountDetailDTO dto = new AccountDetailDTO();
        dto.setA_no(a.getA_no());
        dto.setA_id(a.getA_id());
        dto.setC_no(a.getCustomer() != null ? a.getCustomer().getC_no() : 0); // Customer객체에서 꺼내깅
        dto.setA_product_code(a.getA_product_code());
        dto.setA_account_no(a.getA_account_no());
        dto.setA_account_type(a.getA_account_type());
        dto.setA_currency(a.getA_currency());
        dto.setA_balance(a.getA_balance());
        dto.setA_status(a.getA_status());
        dto.setA_nickname(a.getA_nickname());
        dto.setA_opened_at(a.getA_opened_at());
        dto.setA_closed_at(a.getA_closed_at());
        dto.setA_last_tx_at(a.getA_last_tx_at());
        return dto;
    }
}
