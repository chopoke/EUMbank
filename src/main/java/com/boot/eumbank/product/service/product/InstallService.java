package com.boot.eumbank.product.service.product;

import com.boot.eumbank.product.dto.product.InstallSubscriptionRequestDto;
import org.springframework.web.multipart.MultipartFile;

public interface InstallService {

    public String installSubscription(InstallSubscriptionRequestDto requestDto, MultipartFile signedPdfFile);

    public void installSave(InstallSubscriptionRequestDto requestDto);

}
