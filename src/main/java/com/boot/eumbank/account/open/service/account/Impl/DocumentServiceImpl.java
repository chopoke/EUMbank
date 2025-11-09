package com.boot.eumbank.account.open.service.account.Impl;

import com.boot.eumbank.account.open.enums.FileType;
import com.boot.eumbank.account.open.jpa.repository.mypage.DocumentRepository;
import com.boot.eumbank.account.open.service.account.DocumentService;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.product.entity.product.DocumentFile;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final Logger logger = LoggerFactory.getLogger(DocumentServiceImpl.class);

    @Value("${file.upload-minjong}")
    private String uploadDir;

    /**
     * 주민등록증 문서 저장
     * @param file
     */
    @Override
    @Transactional
    public void saveDocument(MultipartFile file) {
        logger.info("DocumentServiceImpl => saveDocument()");

        // 파일 검증
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드된 파일이 없습니다.");
        }

        // 1️⃣ 원본 파일명
        String originalFilename = file.getOriginalFilename();
        logger.info("원본 파일명: {}", originalFilename);

        // 2️⃣ 파일 확장자 추출
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // 3️⃣ 저장 디렉토리 생성
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            boolean created = directory.mkdirs();
            logger.info("디렉토리 생성: {} ({})", uploadDir, created ? "성공" : "실패");
            if (!created) {
                throw new RuntimeException("디렉토리 생성에 실패했습니다: " + uploadDir);
            }
        }

        // 4️⃣ 고유 파일명 생성
        String savedFilename = UUID.randomUUID().toString() + extension;
        Path filePath = Paths.get(uploadDir, savedFilename);

        // 5️⃣ 파일 저장
        try {
            // ✅ Path 객체로 직접 저장
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            logger.info("파일 저장 완료: {}", filePath);

        } catch (IOException e) {
            logger.error("파일 저장 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("파일 저장에 실패했습니다.", e);
        }

        // 6️⃣ 현재 로그인한 사용자 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();

        // 7️⃣ DocumentFile 엔티티 생성 및 저장
        DocumentFile documentFile = DocumentFile.builder()
                .type(FileType.주민등록증)
                .pdfPath(filePath.toString())  // ✅ Path를 String으로 변환
                .pdfName(originalFilename)     // ✅ 원본 파일명 저장
                .cNo(customer.getCustomerNo())
                .build();

        documentRepository.save(documentFile);
        logger.info("문서 정보 DB 저장 완료 - 고객번호: {}, 파일명: {}", customer.getCustomerNo(), savedFilename);
    }
}