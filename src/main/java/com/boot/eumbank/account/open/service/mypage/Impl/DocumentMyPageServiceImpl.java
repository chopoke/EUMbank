package com.boot.eumbank.account.open.service.mypage.Impl;

import com.boot.eumbank.account.open.dto.mypage.DocumentListResponse;
import com.boot.eumbank.account.open.dto.mypage.DocumentResponse;
import com.boot.eumbank.account.open.enums.DocumentStatus;
import com.boot.eumbank.account.open.enums.FileType;
import com.boot.eumbank.account.open.jpa.repository.mypage.DocumentRepository;
import com.boot.eumbank.account.open.service.mypage.DocumentMyPageService;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.product.entity.product.DocumentFile;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentMyPageServiceImpl implements DocumentMyPageService {

    private final DocumentRepository documentRepository;
    private final Logger logger = LoggerFactory.getLogger(DocumentMyPageServiceImpl.class);

    @Value("${file.upload-minjong}")
    private String uploadDir;

    /**
     * 서류 저장
     */
    @Override
    @Transactional
    public void saveDocument(MultipartFile file, FileType fileType) {
        logger.info("DocumentServiceImpl => saveDocument()");

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드된 파일이 없습니다.");
        }

        String originalFilename = file.getOriginalFilename();
        logger.info("원본 파일명: {}", originalFilename);

        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // 디렉토리 생성
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            boolean created = directory.mkdirs();
            if (!created) {
                throw new RuntimeException("디렉토리 생성에 실패했습니다: " + uploadDir);
            }
        }

        String savedFilename = UUID.randomUUID().toString() + extension;
        Path filePath = Paths.get(uploadDir, savedFilename);

        try {
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            logger.info("파일 저장 완료: {}", filePath);
        } catch (IOException e) {
            logger.error("파일 저장 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("파일 저장에 실패했습니다.", e);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();

        DocumentFile documentFile = DocumentFile.builder()
                .type(fileType)
                .pdfPath(filePath.toString())
                .pdfName(originalFilename)
                .cNo(customer.getCustomerNo())
                .status(DocumentStatus.PENDING)  // 기본: 심사중
                .build();

        documentRepository.save(documentFile);
        logger.info("문서 정보 DB 저장 완료 - 고객번호: {}", customer.getCustomerNo());
    }

    /**
     * 서류 목록 조회 (페이징) - 주민등록증 우선, 크기 조정
     */
    @Override
    @Transactional(readOnly = true)
    public DocumentListResponse getDocuments(Pageable pageable) {
        logger.info("=== DocumentServiceImpl => getDocuments() ===");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();
        Integer customerNo = customer.getCustomerNo();

        // ✅ 간단하게: 모든 문서를 일반 페이징으로 조회
        Page<DocumentFile> documentPage = documentRepository.findBycNo(Long.valueOf(customerNo), pageable);

        logger.info("페이지: {}, 크기: {}, 전체: {}, 조회된 문서: {}",
                documentPage.getNumber(), documentPage.getSize(),
                documentPage.getTotalElements(), documentPage.getContent().size());

        List<DocumentResponse> documents = documentPage.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return DocumentListResponse.builder()
                .documents(documents)
                .currentPage(documentPage.getNumber())
                .totalPages(documentPage.getTotalPages())
                .totalElements(documentPage.getTotalElements())
                .size(documentPage.getSize())
                .build();
    }

    /**
     * 서류 다운로드
     */
    @Override
    @Transactional(readOnly = true)
    public Resource downloadDocument(Integer dNo) {
        DocumentFile document = documentRepository.findById(dNo)
                .orElseThrow(() -> new IllegalArgumentException("서류를 찾을 수 없습니다."));

        // 본인 서류인지 확인
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();

        if (!document.getCNo().equals(customer.getCustomerNo())) {
            throw new SecurityException("본인의 서류만 다운로드할 수 있습니다.");
        }

        try {
            Path filePath = Paths.get(document.getPdfPath());
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("파일을 읽을 수 없습니다.");
            }
        } catch (Exception e) {
            throw new RuntimeException("파일 다운로드 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 서류 상태 변경 (관리자용)
     */
    @Override
    @Transactional
    public void updateDocumentStatus(Integer dNo, DocumentStatus status) {
        DocumentFile document = documentRepository.findById(dNo)
                .orElseThrow(() -> new IllegalArgumentException("서류를 찾을 수 없습니다."));

        document.setStatus(status);
        documentRepository.save(document);
        logger.info("서류 상태 변경 완료 - dNo: {}, status: {}", dNo, status);
    }

    /**
     * 서류 삭제
     */
    @Override
    @Transactional
    public void deleteDocument(Integer dNo) {
        DocumentFile document = documentRepository.findById(dNo)
                .orElseThrow(() -> new IllegalArgumentException("서류를 찾을 수 없습니다."));

        // 본인 서류인지 확인
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();

        if (!document.getCNo().equals(customer.getCustomerNo())) {
            throw new SecurityException("본인의 서류만 삭제할 수 있습니다.");
        }

        // 파일 삭제
        try {
            Path filePath = Paths.get(document.getPdfPath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            logger.error("파일 삭제 실패: {}", e.getMessage());
        }

        documentRepository.delete(document);
        logger.info("서류 삭제 완료 - dNo: {}", dNo);
    }

    /**
     * Entity -> DTO 변환
     */
    private DocumentResponse convertToResponse(DocumentFile document) {
        String extension = "";
        if (document.getPdfName() != null && document.getPdfName().contains(".")) {
            extension = document.getPdfName().substring(document.getPdfName().lastIndexOf(".") + 1);
        }

        return DocumentResponse.builder()
                .dNo(document.getDNo())
                .type(document.getType())
                .pdfName(document.getPdfName())
                .status(document.getStatus())
                .createdAt(document.getCreatedAt())
                .fileExtension(extension)
                .build();
    }

    /**
     * 서버에서 생성한 PDF를 증빙서류(document_tbl)에 저장
     * - 예: 공과금 영수증
     */
    @Override
    @Transactional
    public Integer saveGeneratedDocument(byte[] pdfBytes,
                                         FileType fileType,
                                         Integer cNo,
                                         Integer aNo,
                                         String fileName) {
        logger.info("자동 생성 문서 저장 - type: {}, cNo: {}, aNo: {}", fileType, cNo, aNo);

        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException("PDF 데이터가 비어 있습니다.");
        }

        // 디렉토리 생성 (기존 uploadDir 그대로 사용)
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            boolean created = directory.mkdirs();
            if (!created) {
                throw new RuntimeException("디렉토리 생성에 실패했습니다: " + uploadDir);
            }
        }

        // 서버 내부에 저장할 실제 파일명(랜덤)
        String savedFilename = UUID.randomUUID().toString() + ".pdf";
        Path filePath = Paths.get(uploadDir, savedFilename);

        try {
            Files.write(filePath, pdfBytes);
            logger.info("자동 생성 PDF 저장 완료: {}", filePath);
        } catch (IOException e) {
            logger.error("자동 생성 PDF 저장 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("자동 생성 PDF 저장에 실패했습니다.", e);
        }

        // DB(document_tbl)에 기록
        DocumentFile documentFile = DocumentFile.builder()
                .type(fileType)                 // 예: FileType.공과금영수증
                .pdfPath(filePath.toString())   // 서버 실제 경로
                .pdfName(fileName)              // 화면에 보여줄 논리적 파일명
                .cNo(cNo)
                .aNo(aNo)
                .status(DocumentStatus.PENDING) // 필요하면 다른 기본값으로 변경 가능
                .build();

        documentFile = documentRepository.save(documentFile);
        logger.info("자동 생성 문서 DB 저장 완료 - dNo: {}, cNo: {}, aNo: {}",
                documentFile.getDNo(), cNo, aNo);

        return documentFile.getDNo();
    }
}