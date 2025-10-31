package com.boot.eumbank.product.service.product;

import com.boot.eumbank.account.open.dto.account.AccountDTO;

import java.util.List;

public interface AccountProductService {

    public List<AccountDTO> findAllAccounts();

}
