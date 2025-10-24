package com.boot.eumbank.deposit.service.deposit;

import com.boot.eumbank.deposit.dto.deposit.ProductDto;
import java.util.List;

public interface DepositService {

    public List<ProductDto> findAllProducts();

}