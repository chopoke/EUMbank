package com.boot.eumbank.product.service.product.Impl;

import com.boot.eumbank.account.open.dto.account.AccountDTO;
import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.product.dto.product.AccountDto;
import com.boot.eumbank.product.jpa.repository.AccountQueryRepository;
import com.boot.eumbank.product.service.product.AccountProductService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountProductServiceImpl implements AccountProductService {

    private Logger logger = LoggerFactory.getLogger(DepositServiceImpl.class);

    private final AccountQueryRepository accountQueryRepository;

    @Override
    public List<AccountDTO> findAllofOneAccounts(Integer accountNo) {

        logger.info("DepositServiceImpl => findAllAccounts()");

        List<Account> allAccount = accountQueryRepository.findAllAccount(accountNo);

        logger.info("" + allAccount);

        return allAccount.stream()
                .map(AccountDto::from)  // 또는 .map(account -> AccountDto.from(account))
                .collect(Collectors.toList());

    }

}
