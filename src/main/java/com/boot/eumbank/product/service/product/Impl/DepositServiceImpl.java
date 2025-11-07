package com.boot.eumbank.product.service.product.Impl;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.product.dto.product.DepositSubscriptionRequestDto;
import com.boot.eumbank.product.dto.product.ProductDto;
import com.boot.eumbank.product.jpa.repository.AccountQueryRepository;
import com.boot.eumbank.product.jpa.repository.DepositQueryRepository;
import com.boot.eumbank.product.service.product.DepositService;
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
public class DepositServiceImpl implements DepositService {

    private Logger logger = LoggerFactory.getLogger(DepositServiceImpl.class);

    private final DepositQueryRepository depositQueryRepository;

    private final AccountQueryRepository accountQueryRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    @Transactional
    public String depositSubscription(
            DepositSubscriptionRequestDto requestDto,
            MultipartFile signedPdfFile) {

        logger.info("=== PDF 처리 시작 ===");
        logger.info("상품명: {}", requestDto.getProductName());
        logger.info("금액: {}", requestDto.getAmount());
        logger.info("기간: {}", requestDto.getPeriod());

        try (PDDocument document = PDDocument.load(signedPdfFile.getInputStream())) {

            // PDF 페이지 수 확인
            int totalPages = document.getNumberOfPages();
            logger.info("PDF 총 페이지 수: {}", totalPages);

            if (totalPages == 0) {
                throw new IllegalArgumentException("PDF 문서에 페이지가 없습니다.");
            }

            // ✅ 두 번째 페이지(상품 가입서)에 정보 추가
            // 페이지가 2개 이상이면 두 번째 페이지(인덱스 1), 1개면 첫 페이지 사용
            int targetPageIndex = totalPages > 1 ? 1 : 0;
            PDPage targetPage = document.getPage(targetPageIndex);

            logger.info("정보를 추가할 페이지: {} (총 {}페이지 중)", targetPageIndex + 1, totalPages);

            // 한글 폰트 로드
            PDFont font;
            try {
                font = PDType0Font.load(document,
                        new ClassPathResource("fonts/NanumGothic.ttf").getInputStream());
                logger.info("한글 폰트(NanumGothic.ttf) 로드 성공");
            } catch (IOException e) {
                logger.error("한글 폰트 파일을 찾을 수 없거나 읽는 데 실패했습니다.", e);
                throw new RuntimeException("PDF 생성을 위한 한글 폰트 로드에 실패했습니다.", e);
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Customer customer = (Customer) authentication.getPrincipal();

            System.out.println("test" + customer);

            ProductDto oneDepositProducts = depositQueryRepository.findOneDepositProducts(requestDto.getDpNo());

            System.out.println("=== PDF 처리 시작 === one" + requestDto);
            System.out.println("=== PDF 처리 시작 === three" + customer);
            System.out.println("=== PDF 처리 시작 === four" + oneDepositProducts);



            // ✅ 대상 페이지에 정보 추가
            try (PDPageContentStream contentStream = new PDPageContentStream(
                    document, targetPage, PDPageContentStream.AppendMode.APPEND, true, true)) {

                // 기본 좌표 및 폰트 크기 설정
                float yPosition = 683; // 시작 Y 좌표 (페이지 상단 근처)
                float lineHeight = 27;  // 각 라인의 간격
                float valueX = 180;     // 실제 데이터 값의 X 좌표
                int fontSize = 10;      // 폰트 크기

                logger.info("고객 정보 추가 시작");

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

                logger.info("고객 정보 추가 완료");

                // 상품 정보 추가 (하단)
                float underyPosition = 530; // 시작 Y 좌표 (페이지 상단 근처)
                float underlineHeight = 28;  // 각 라인의 간격
                float undervalueX = 180;     // 실제 데이터 값의 X 좌표
                int underfontSize = 10;      // 폰트 크기

                logger.info("상품 정보 추가 시작");

                // 상품명
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, requestDto.getProductName());
                underyPosition -= underlineHeight;

                // 계좌번호
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, requestDto.getDepositAccount());
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

                // 가입금액
                String formattedAmount = NumberFormat.getInstance().format(requestDto.getAmount()) + "원";
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, formattedAmount);
                underyPosition -= underlineHeight;

                // 가입기간
                String formattedPeriod = formattedDate + " ~ " + formattedMaturityDate;
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, formattedPeriod);
                underyPosition -= underlineHeight;

                // 적용이율
                addText(contentStream, font, underfontSize, undervalueX, underyPosition, oneDepositProducts.getRate());
                underyPosition -= underlineHeight;

                logger.info("상품 정보 추가 완료");
                logger.info("페이지 {}에 모든 정보 추가 완료", targetPageIndex + 1);
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
            logger.info("최종 페이지 수: {}", document.getNumberOfPages());

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
    public void depositSave(DepositSubscriptionRequestDto requestDto) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();

        ProductDto depositProducts = depositQueryRepository.findOneDepositProducts(requestDto.getDpNo());
        Account oneAccount = depositQueryRepository.findOneAccount(customer, requestDto);

        depositQueryRepository.depositSave(requestDto, customer, depositProducts, oneAccount);
    }

    private void addText(PDPageContentStream contentStream, PDFont font, int fontSize, float x, float y, String text) throws IOException {
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(text);
        contentStream.endText();
    }
}