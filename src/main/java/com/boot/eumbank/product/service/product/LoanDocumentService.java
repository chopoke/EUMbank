package com.boot.eumbank.product.service.product;

import com.boot.eumbank.account.open.enums.FileType;
import org.springframework.web.multipart.MultipartFile;

/**
 * 대출관련 서류 업로드용 서비스(저장경로 분기를 위해)
 */
public interface LoanDocumentService {

    void saveLoanDocument(MultipartFile file, FileType fileType);

}
