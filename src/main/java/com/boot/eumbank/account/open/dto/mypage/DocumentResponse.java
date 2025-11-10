package com.boot.eumbank.account.open.dto.mypage;

import com.boot.eumbank.account.open.enums.DocumentStatus;
import com.boot.eumbank.account.open.enums.FileType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponse {
    private Integer dNo;
    private FileType type;
    private String pdfName;
    private DocumentStatus status;
    private LocalDateTime createdAt;
    private String fileExtension;  // 파일 확장자 (pdf, png, jpg)
}