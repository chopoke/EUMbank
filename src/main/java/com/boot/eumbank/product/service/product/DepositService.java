package com.boot.eumbank.product.service.product;

import com.boot.eumbank.product.dto.product.DepositSubscriptionRequestDto;
import org.springframework.web.multipart.MultipartFile;

public interface DepositService {

    public String depositSubscription(DepositSubscriptionRequestDto requestDto, MultipartFile signedPdfFile);

    public void depositSave(DepositSubscriptionRequestDto requestDto);

}