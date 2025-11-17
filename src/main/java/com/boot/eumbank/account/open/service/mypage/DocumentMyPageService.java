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

    /**
     * 서버에서 생성한 PDF(예: 공과금 영수증)를 증빙서류로 저장
     * @return 생성된 문서번호(dNo)
     */
    Integer saveGeneratedDocument(byte[] pdfBytes,
                                  FileType fileType,
                                  Integer cNo,
                                  Integer aNo,
                                  String fileName);

}
