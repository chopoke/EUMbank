package com.boot.eumbank.product.controller;

import com.boot.eumbank.product.dto.product.DepositSubscriptionRequestDto;
import com.boot.eumbank.product.service.product.DepositService;
import com.boot.eumbank.product.service.product.Impl.DepositServiceImpl;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DepositController {

    private Logger logger = LoggerFactory.getLogger(DepositServiceImpl.class);

    private final DepositService depositService;

    /**
     * 예금상품 가입
     * @param requestDto 가입 요청 정보 (productName, amount, period)
     * @param signedPdfFile 서명된 PDF 파일
     * @return 가입 결과
     */
    @PostMapping(value = "/depositproductsave",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> depositSave(
            @RequestPart(value = "subscriptionRequest") DepositSubscriptionRequestDto requestDto,
            @RequestPart(value = "signedPdf") MultipartFile signedPdfFile) {

        logger.info("========================================");
        logger.info("예금 가입 요청 수신");
        logger.info("========================================");
        logger.info("요청 DTO: {}", requestDto);
        logger.info("파일명: {}", signedPdfFile != null ? signedPdfFile.getOriginalFilename() : "null");
        logger.info("파일 크기: {} bytes", signedPdfFile != null ? signedPdfFile.getSize() : 0);
        logger.info("파일 타입: {}", signedPdfFile != null ? signedPdfFile.getContentType() : "null");
        logger.info("========================================");

        Map<String, Object> response = new HashMap<>();

        try {
            // 1. 요청 데이터 검증
            if (requestDto.getProductName() == null || requestDto.getProductName().trim().isEmpty()) {
                logger.error("상품명이 비어있음");
                response.put("success", false);
                response.put("message", "상품명을 입력해주세요.");
                return ResponseEntity.badRequest().body(response);
            }

            if (requestDto.getAmount() == null || requestDto.getAmount() <= 0) {
                logger.error("잘못된 금액: {}", requestDto.getAmount());
                response.put("success", false);
                response.put("message", "유효한 금액을 입력해주세요.");
                return ResponseEntity.badRequest().body(response);
            }

            if (requestDto.getPeriod() == null || requestDto.getPeriod() <= 0) {
                logger.error("잘못된 기간: {}", requestDto.getPeriod());
                response.put("success", false);
                response.put("message", "유효한 기간을 입력해주세요.");
                return ResponseEntity.badRequest().body(response);
            }

            // 2. 파일 검증
            if (signedPdfFile == null || signedPdfFile.isEmpty()) {
                logger.error("파일이 비어있음");
                response.put("success", false);
                response.put("message", "PDF 파일을 업로드해주세요.");
                return ResponseEntity.badRequest().body(response);
            }

            // Content-Type 검증
            String contentType = signedPdfFile.getContentType();
            if (contentType == null || !contentType.equals("application/pdf")) {
                logger.error("잘못된 파일 타입: {}", contentType);
                response.put("success", false);
                response.put("message", "PDF 파일만 업로드 가능합니다.");
                return ResponseEntity.badRequest().body(response);
            }

            // 파일 크기 검증 (10MB)
            if (signedPdfFile.getSize() > 10 * 1024 * 1024) {
                logger.error("파일 크기 초과: {} bytes", signedPdfFile.getSize());
                response.put("success", false);
                response.put("message", "파일 크기는 10MB를 초과할 수 없습니다.");
                return ResponseEntity.badRequest().body(response);
            }

            // 3. 서비스 레이어 호출 (username 없이)
            logger.info("서비스 레이어 호출 시작");
            String savedFilePath = depositService.depositSubscription(
                    requestDto,
                    signedPdfFile
            );
            logger.info("서비스 레이어 호출 완료. 저장 경로: {}", savedFilePath);

            depositService.depositSave(requestDto, savedFilePath);

            logger.info("========================================");
            logger.info("예금 테이블 저장 완료 (성공)");
            logger.info("========================================");
            
            // 4. 성공 응답
            response.put("success", true);
            response.put("message", "가입 신청이 성공적으로 완료되었습니다.");
            response.put("filePath", savedFilePath);

            logger.info("========================================");
            logger.info("예금 가입 요청 처리 완료 (성공)");
            logger.info("========================================");

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            logger.error("잘못된 요청: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);

        } catch (Exception e) {
            logger.error("서버 오류 발생", e);
            response.put("success", false);
            response.put("message", "처리 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

}
