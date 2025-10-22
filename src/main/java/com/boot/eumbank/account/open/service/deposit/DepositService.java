package com.boot.eumbank.account.open.service.deposit;

import com.boot.eumbank.account.open.dto.deposit.ProductDto;
import java.util.List;

public interface DepositService {

    public List<ProductDto> findAllProducts();

}