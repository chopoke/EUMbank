package com.boot.eumbank.account.open.controller;


import com.boot.eumbank.account.open.dto.mypage.DocumentListResponse;
import com.boot.eumbank.account.open.enums.DocumentStatus;
import com.boot.eumbank.account.open.enums.FileType;
import com.boot.eumbank.account.open.service.mypage.DocumentMyPageService;
import com.boot.eumbank.product.service.product.LoanDocumentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentMyPageService documentService;
    private final Logger logger = LoggerFactory.getLogger(DocumentController.class);

    // 대출서류 업로드
    private final LoanDocumentService loanDocuSer;

    /**
     * 서류 업로드
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") FileType fileType) {
        
        logger.info("서류 업로드 요청 - type: {}", fileType);
        
        try {
            if(fileType == FileType.대출신청서명){
                loanDocuSer.saveLoanDocument(file, fileType);
            }
            else{
                documentService.saveDocument(file, fileType);
            }
            return ResponseEntity.ok("업로드 성공");
        } catch (Exception e) {
            logger.error("업로드 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("업로드 실패: " + e.getMessage());
        }
    }

    /**
     * 서류 목록 조회 (페이징)
     */
    @GetMapping(value = "/documents")
    public ResponseEntity<DocumentListResponse> getDocuments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {  // ✅ sort 추가
        logger.info("DocumentController => getDocuments - page: {}, size: {}, sort: {}", page, size, sort);

        // 정렬 파싱
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 &&
                sortParams[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = sortParams[0];

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

        DocumentListResponse response = documentService.getDocuments(pageable);

        logger.info("응답 - 문서 수: {}, 총 페이지: {}, 현재 페이지: {}",
                response.getDocuments().size(), response.getTotalPages(), response.getCurrentPage());

        return ResponseEntity.ok(response);
    }

    /**
     * 서류 다운로드
     */
    @GetMapping("/download/{dNo}")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Integer dNo) {
        logger.info("서류 다운로드 요청 - dNo: {}", dNo);
        
        try {
            Resource resource = documentService.downloadDocument(dNo);
            String filename = resource.getFilename();
            
            // 파일명 인코딩 (한글 지원)
            String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8.toString())
                    .replaceAll("\\+", "%20");

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + encodedFilename + "\"")
                    .body(resource);
        } catch (Exception e) {
            logger.error("다운로드 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 서류 미리보기 (새 창에서 열기)
     */
    @GetMapping("/view/{dNo}")
    public ResponseEntity<Resource> viewDocument(@PathVariable Integer dNo) {
        logger.info("서류 미리보기 요청 - dNo: {}", dNo);
        
        try {
            Resource resource = documentService.downloadDocument(dNo);
            String filename = resource.getFilename();
            String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
            
            MediaType mediaType;
            switch (extension) {
                case "pdf":
                    mediaType = MediaType.APPLICATION_PDF;
                    break;
                case "png":
                    mediaType = MediaType.IMAGE_PNG;
                    break;
                case "jpg":
                case "jpeg":
                    mediaType = MediaType.IMAGE_JPEG;
                    break;
                default:
                    mediaType = MediaType.APPLICATION_OCTET_STREAM;
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            logger.error("미리보기 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * 서류 상태 변경 (관리자용)
     */
    @PutMapping("/{dNo}/status")
    public ResponseEntity<String> updateStatus(
            @PathVariable Integer dNo,
            @RequestParam DocumentStatus status) {
        
        logger.info("서류 상태 변경 요청 - dNo: {}, status: {}", dNo, status);
        
        try {
            documentService.updateDocumentStatus(dNo, status);
            return ResponseEntity.ok("상태 변경 성공");
        } catch (Exception e) {
            logger.error("상태 변경 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("상태 변경 실패: " + e.getMessage());
        }
    }

    /**
     * 서류 삭제
     */
    @DeleteMapping("/{dNo}")
    public ResponseEntity<String> deleteDocument(@PathVariable Integer dNo) {
        logger.info("서류 삭제 요청 - dNo: {}", dNo);
        
        try {
            documentService.deleteDocument(dNo);
            return ResponseEntity.ok("삭제 성공");
        } catch (Exception e) {
            logger.error("삭제 실패: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body("삭제 실패: " + e.getMessage());
        }
    }
}