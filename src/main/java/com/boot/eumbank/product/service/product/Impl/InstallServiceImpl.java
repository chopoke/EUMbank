package com.boot.eumbank.product.service.product.Impl;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.product.dto.product.InstallSubscriptionRequestDto;
import com.boot.eumbank.product.dto.product.ProductDto;
import com.boot.eumbank.product.jpa.repository.AccountQueryRepository;
import com.boot.eumbank.product.jpa.repository.InstallQueryRepository;
import com.boot.eumbank.product.service.product.InstallService;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstallServiceImpl implements InstallService {

    private Logger logger = LoggerFactory.getLogger(InstallServiceImpl.class);

    private final AccountQueryRepository accountQueryRepository;

    private final InstallQueryRepository installQueryRepository;

    // application.properties에서 파일 저장 경로를 주입받음
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    @Transactional
    public String installSubscription(
            InstallSubscriptionRequestDto requestDto,
            MultipartFile signedPdfFile) {

        logger.info("=== PDF 처리 시작 ===");
        logger.info("상품명: {}", requestDto.getProductName());
        logger.info("금액: {}", requestDto.getAmount());
        logger.info("기간: {}", requestDto.getPeriod());

        try (PDDocument document = PDDocument.load(signedPdfFile.getInputStream())) {

            // PDF 첫 페이지 가져오기
            if (document.getNumberOfPages() == 0) {
                throw new IllegalArgumentException("PDF 문서에 페이지가 없습니다.");
            }

            PDPage firstPage = document.getPage(0);
            logger.info("PDF 페이지 수: {}", document.getNumberOfPages());

            // 한글 폰트 로드 (선택사항)
            PDFont font;
            try {
                // ClassPathResource는 'src/main/resources'를 기준으로 경로를 찾습니다.
                font = PDType0Font.load(document,
                        new ClassPathResource("fonts/NanumGothic.ttf").getInputStream());
                logger.info("한글 폰트(NanumGothic.ttf) 로드 성공");
            } catch (IOException e) { // Exception 대신 IOException으로 구체화
                logger.error("한글 폰트 파일을 찾을 수 없거나 읽는 데 실패했습니다. 'resources/fonts/' 경로를 확인하세요.", e);
                throw new RuntimeException("PDF 생성을 위한 한글 폰트 로드에 실패했습니다.", e);
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Customer customer = (Customer) authentication.getPrincipal();

            // ✅ PDF에 정보 추가 로직 변경
            try (PDPageContentStream contentStream = new PDPageContentStream(
                    document, firstPage, PDPageContentStream.AppendMode.APPEND, true, true)) {

                // 기본 좌표 및 폰트 크기 설정
                float yPosition = 683; // 시작 Y 좌표 (페이지 상단 근처)
                float lineHeight = 27;  // 각 라인의 간격
                float valueX = 180;     // 실제 데이터 값의 X 좌표
                int fontSize = 10;      // 폰트 크기

                // 성명
                addText(contentStream, font, fontSize, valueX, yPosition, customer.getCNameKr());
                yPosition -= lineHeight;

                // 주민등록번호
                addText(contentStream, font, fontSize, valueX, yPosition, customer.getCRrnHash());
                yPosition -= lineHeight;

                // 연락처
                addText(contentStream, font, fontSize, valueX, yPosition, customer.getCPhoneMobile());
                yPosition -= lineHeight;

                // 주소
                addText(contentStream, font, fontSize, valueX, yPosition, customer.getCAddress());
                yPosition -= lineHeight;

                // -----------------------------------------------

                float underyPosition = 530; // 시작 Y 좌표 (페이지 상단 근처)
                float underlineHeight = 28;  // 각 라인의 간격
                float undervalueX = 180;     // 실제 데이터 값의 X 좌표
                int underfontSize = 10;      // 폰트 크기

                // 상품명
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, requestDto.getProductName());
                underyPosition -= underlineHeight; // 다음 라인을 위해 y 좌표 감소

                // 계좌번호
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, requestDto.getSavingAccount());
                underyPosition -= underlineHeight;

                // 신규 가입일
                String formattedDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, formattedDate);
                underyPosition -= underlineHeight;

                // 만기일
                LocalDate today = LocalDate.now();
                int period = requestDto.getPeriod();
                LocalDate maturityDate = today.plusMonths(period);
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                String formattedMaturityDate = maturityDate.format(formatter);
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, formattedMaturityDate);
                underyPosition -= underlineHeight;

                // 가입금액;
                String formattedAmount = NumberFormat.getInstance().format(requestDto.getAmount()) + " 원";
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, formattedAmount);
                underyPosition -= underlineHeight;

                // 가입기간
                String formattedPeriod = formattedDate + " ~ " + formattedMaturityDate;
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, formattedPeriod);
                underyPosition -= underlineHeight;

                // 적용이율
                ProductDto oneDepositProducts = installQueryRepository.findOneInstallProducts(requestDto.getIpNo());
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, oneDepositProducts.getRate());
                underyPosition -= underlineHeight;

                logger.info("PDF에 세분화된 정보 추가 완료");
            }


            // 저장 디렉토리 생성
            File directory = new File(uploadDir);
            if (!directory.exists()) {
                boolean created = directory.mkdirs();
                logger.info("디렉토리 생성: {} ({})", uploadDir, created ? "성공" : "실패");
            }

            // 파일명 생성
            String originalFilename = signedPdfFile.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".pdf";

            String fileName = String.format(
                    "deposit_%s_%s%s",
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")),
                    UUID.randomUUID().toString().substring(0, 8),
                    fileExtension
            );

            Path filePath = Paths.get(uploadDir, fileName);

            // PDF 저장
            document.save(filePath.toFile());
            logger.info("PDF 파일 저장 완료: {}", filePath);

            // DB 저장 로직 (필요시 구현)
            // ...

            logger.info("=== PDF 처리 완료 ===");
            return filePath.toString();

        } catch (IOException e) {
            logger.error("PDF 처리 중 IO 오류 발생", e);
            throw new RuntimeException("PDF 파일 처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("PDF 처리 중 예외 발생", e);
            throw new RuntimeException("처리 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }


    @Override
    public void installSave(InstallSubscriptionRequestDto requestDto) {

        // --- 1. 현재 로그인한 사용자(JWT) 정보 가져오기 ---
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();

        ProductDto installProducts = installQueryRepository.findOneInstallProducts(requestDto.getIpNo());

        Account oneAccount = installQueryRepository.findOneAccount(customer, requestDto);

        installQueryRepository.installSave(requestDto, customer, installProducts, oneAccount);
    }

    // ✅ 헬퍼 메소드 추가: 지정된 좌표에 텍스트를 추가하는 로직
    private void addText(PDPageContentStream contentStream, PDFont font, int fontSize, float x, float y, String text) throws IOException {
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(text);
        contentStream.endText();
    }

    /**
     * 발급일자를 생성하는 메서드
     * @return yyyy-MM-dd 형식의 발급일자
     */
    private String generateIssueDate() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    /**
     * 문서번호를 생성하는 메서드
     * 형식: INS-yyyyMMdd-[8자리 영문+숫자]
     * 예시: INS-20251030-A7F3K9M2
     * @return 생성된 문서번호
     */
    private String generateDocumentNumber() {
        // 날짜 부분 (yyyyMMdd)
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // 8자리 랜덤 영문(대문자) + 숫자 조합
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder randomPart = new StringBuilder();

        for (int i = 0; i < 8; i++) {
            int index = (int) (Math.random() * characters.length());
            randomPart.append(characters.charAt(index));
        }

        // 최종 문서번호 생성: INS-yyyyMMdd-XXXXXXXX
        return String.format("INS-%s-%s", datePart, randomPart.toString());
    }

}
