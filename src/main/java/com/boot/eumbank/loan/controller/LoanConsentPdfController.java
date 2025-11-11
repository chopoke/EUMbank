package com.boot.eumbank.loan.controller;

import com.boot.eumbank.loan.entity.LoanApplication;
import com.boot.eumbank.loan.entity.LoanConsent;
import com.boot.eumbank.loan.repository.apply.LoanApplicationRepository;
import com.boot.eumbank.loan.repository.apply.LoanConsentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/loan")
public class LoanConsentPdfController {

    private final LoanApplicationRepository appRepo;
    private final LoanConsentRepository consentRepo;
    private final ObjectMapper om = new ObjectMapper();

    @GetMapping(value = "/applications/{laId}/consents.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadConsentsPdf(@PathVariable String laId) {
        try {
            if (laId == null || laId.isBlank()) {
                return ResponseEntity.badRequest()
                        .contentType(MediaType.TEXT_PLAIN)
                        .body("신청번호가 비어있습니다.".getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }

            var appOpt = appRepo.findByLaId(laId);
            if (appOpt.isEmpty()) {
                return ResponseEntity.status(404)
                        .contentType(MediaType.TEXT_PLAIN)
                        .body(("신청을 찾을 수 없습니다: " + laId).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }
            var app = appOpt.get();

            // 동의 이력
            List<LoanConsent> items = (app.getLaNo() != null) ? consentRepo.findByLaNo(app.getLaNo()) : List.of();
            if (items.isEmpty()) items = readConsentsFromContextJson(app.getContextJson());

            byte[] pdf = renderPdfWithPdfBox(laId, app, items);

            String filename = ("loan-consents_" + laId + ".pdf").replaceAll("[\\r\\n\"]", "");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);

        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(getClass()).error("[PDF] failed: laId={}", laId, e);
            return ResponseEntity.status(400)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(("PDF 생성 실패: " + e.getMessage()).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        }
    }

    // -------- context_json → 동의 항목 복원 --------
    private List<LoanConsent> readConsentsFromContextJson(String ctxJson){
        try {
            if (ctxJson == null || ctxJson.isBlank()) return List.of();
            JsonNode root = om.readTree(ctxJson);
            JsonNode arr = root.get("consents");
            if (arr == null || !arr.isArray()) return List.of();

            List<LoanConsent> list = new ArrayList<>();
            for (JsonNode n : arr){
                LoanConsent lc = new LoanConsent();
                lc.setTermCode(optText(n,"termCode"));
                lc.setTermTitle(optText(n,"title"));
                lc.setVersion(optText(n,"version"));
                lc.setBodyMd(optText(n,"body"));
                lc.setAgreed(n.path("agreed").asBoolean(false));
                String at = optText(n,"agreedAt");
                lc.setAgreedAt(at == null ? null : java.time.LocalDateTime.parse(at.replace("Z","")));
                if (lc.getTermTitle() == null || lc.getTermTitle().isBlank()) {
                    lc.setTermTitle(mapTitleFallback(lc.getTermCode()));
                }
                list.add(lc);
            }
            return list;
        } catch (Exception e){
            return List.of();
        }
    }
    private static String optText(JsonNode n, String k){
        JsonNode v = n.get(k);
        return v == null || v.isNull() ? null : v.asText();
    }
    private static String mapTitleFallback(String code){
        if (code == null) return "약관";
        return switch (code){
            case "ELC" -> "전자금융거래 약관";
            case "PI_COLLECT" -> "개인(신용)정보 수집·이용 동의";
            case "LOAN_KEY" -> "대출거래 기본약관(핵심설명서 포함)";
            case "CREDIT_MASTER" -> "은행여신거래기본약관";
            case "LOAN_FEE" -> "수수료·인지세·중도상환 안내";
            case "AUTO_DEBIT" -> "자동이체 출금 동의";
            case "MK_OPTIN" -> "마케팅 정보 수신 동의(선택)";
            default -> "약관(" + code + ")";
        };
    }
    private static String safe(String s){ return s == null ? "-" : s; }

    private byte[] renderPdfWithPdfBox(String laId, LoanApplication app, List<LoanConsent> items) {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);


            // 한글폰트 임베드
            PDType0Font fontRegular;
            PDType0Font fontBold;
            try (var is = getClass().getResourceAsStream("/fonts/NanumGothic.ttf")) {
                fontRegular = PDType0Font.load(doc, Objects.requireNonNull(is), true);
            }
            try (var isb = getClass().getResourceAsStream("/fonts/NanumGothic.ttf")) {
                fontBold = PDType0Font.load(doc, Objects.requireNonNull(isb), true); // 볼드가 없으면 레귤러 재사용
            }

            float margin = 36f;
            float y = page.getMediaBox().getHeight() - margin;
            float leading = 14f;

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                // 제목
                cs.beginText();
                cs.setFont(fontBold, 16);
                cs.newLineAtOffset(margin, y);
                cs.showText("대출 약관 동의서");
                cs.endText();
                y -= 24f;

                var fmt = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

                // 메타
                String[] meta = {
                        "신청번호: " + laId,
                        "고객번호: " + app.getCustomerNo(),
                        (app.getSubmittedAt() != null ? "신청일시: " + app.getSubmittedAt().format(fmt) : null)
                };
                for (String line : meta) {
                    if (line == null) continue;
                    cs.beginText();
                    cs.setFont(fontRegular, 10);
                    cs.newLineAtOffset(margin, y);
                    cs.showText(line);
                    cs.endText();
                    y -= leading;
                }
                y -= 8f;

                // 요약 헤더
                cs.beginText();
                cs.setFont(fontRegular, 11);
                cs.newLineAtOffset(margin, y);
                cs.showText("[약관 동의 요약]");
                cs.endText();
                y -= leading;
            }

            // 요약 리스트
            for (LoanConsent c : items) {
                if (y < margin + 60) {
                    page = new PDPage(PDRectangle.A4);
                    doc.addPage(page);
                    y = page.getMediaBox().getHeight() - margin;
                }
                String ts = (c.getAgreedAt() == null) ? "-" : c.getAgreedAt().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                String line = String.format("- %s | v%s | %s",
                        safe(c.getTermTitle()), safe(c.getVersion()), ts);

                try (PDPageContentStream row = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true)) {
                    row.beginText();
                    row.setFont(fontRegular, 10);
                    row.newLineAtOffset(margin, y);
                    row.showText(line);
                    row.endText();
                }
                y -= leading;
            }

            y -= 10f;

            // 본문
            for (LoanConsent c : items) {
                if (y < margin + 80) {
                    page = new PDPage(PDRectangle.A4);
                    doc.addPage(page);
                    y = page.getMediaBox().getHeight() - margin;
                }
                try (PDPageContentStream cs2 = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true)) {
                    cs2.beginText();
                    cs2.setFont(fontBold, 12);
                    cs2.newLineAtOffset(margin, y);
                    cs2.showText("[" + safe(c.getTermTitle()) + "]");
                    cs2.endText();
                }
                y -= leading;

                String body = java.util.Optional.ofNullable(c.getBodyMd()).orElse("-");
                for (String ln : body.split("\n")) {
                    if (y < margin + 40) {
                        page = new PDPage(PDRectangle.A4);
                        doc.addPage(page);
                        y = page.getMediaBox().getHeight() - margin;
                    }
                    try (PDPageContentStream cs3 = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true)) {
                        cs3.beginText();
                        cs3.setFont(fontRegular, 10);
                        cs3.newLineAtOffset(margin, y);
                        cs3.showText(ln);
                        cs3.endText();
                    }
                    y -= leading;
                }
                y -= 6f;
            }

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                doc.save(baos);
                return baos.toByteArray();
            }
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}

