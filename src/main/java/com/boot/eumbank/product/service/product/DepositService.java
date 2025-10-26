package com.boot.eumbank.product.service.product;

import com.boot.eumbank.account.open.dto.account.AccountDTO;
import com.boot.eumbank.product.dto.product.DepositSubscriptionRequestDto;
import com.boot.eumbank.product.dto.product.ProductDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DepositService {

    public List<ProductDto> findAllProducts();

    public List<AccountDTO> findAllAccounts();

    public String processSubscription(DepositSubscriptionRequestDto requestDto, MultipartFile signedPdfFile);

}