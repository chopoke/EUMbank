package com.boot.eumbank.product.service.product;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.product.dto.product.ProductDto;

import java.util.List;

public interface ProductService {

    public List<ProductDto> findAllProducts();

    public List<Account> checkAccountExists(Integer productNo);

}
