package com.boot.eumbank.account.open.service.mypage;

import com.boot.eumbank.account.open.dto.mypage.DocumentListResponse;
import com.boot.eumbank.account.open.enums.DocumentStatus;
import com.boot.eumbank.account.open.enums.FileType;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentMyPageService {

    public void saveDocument(MultipartFile file, FileType fileType);

    public DocumentListResponse getDocuments(Pageable pageable);

    public Resource downloadDocument(Integer dNo);

    public void updateDocumentStatus(Integer dNo, DocumentStatus status);

    public void deleteDocument(Integer dNo);

}
