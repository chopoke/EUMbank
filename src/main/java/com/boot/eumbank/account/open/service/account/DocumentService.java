package com.boot.eumbank.account.open.service.account;

import org.springframework.web.multipart.MultipartFile;

public interface DocumentService {

    /**
     * 주민등록증 문서 저장
     * @param file
     */
    public void saveDocument(MultipartFile file);

}
