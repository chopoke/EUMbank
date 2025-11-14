// src/main/java/com/boot/eumbank/bill/util/PdfUtil.java
package com.boot.eumbank.bill.util;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType0Font;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

public final class PdfUtil {
    private PdfUtil() {}

    /** 컨트롤러 변경 없이 사용: "라벨: 값" 본문을 카드형 영수증으로 렌더링 */
    public static byte[] textReceipt(String title, String body) {
        return renderReceipt(title, parseBody(body));
    }

    // ---------------------------------------------------------

    private static byte[] renderReceipt(String title, Map<String, String> fields) {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            // 한글 폰트 로드 (resources/fonts/NanumGothic.ttf)
            InputStream fontIs = PdfUtil.class.getResourceAsStream("/fonts/NanumGothic.ttf");
            if (fontIs == null) throw new IllegalStateException("Font not found: /fonts/NanumGothic.ttf");
            var font = PDType0Font.load(doc, fontIs, true);

            float margin = 48f;
            float pageW = page.getMediaBox().getWidth();
            float y = page.getMediaBox().getHeight() - margin;

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                // 제목
                cs.setNonStrokingColor(Color.BLACK);
                cs.beginText();
                cs.setFont(font, 22);
                cs.newLineAtOffset(margin, y);
                cs.showText(title);
                cs.endText();

                // 진한 언더라인
                y -= 12f;
                cs.setStrokingColor(30, 30, 30);
                cs.setLineWidth(1.4f);
                line(cs, margin, y, pageW - margin, y);

                // 정보 박스
                y -= 20f;
                float boxLeft = margin;
                float boxRight = pageW - margin;
                float labelW = 120f;
                float rowH = 24f;

                // 박스 외곽선만 그리기 위해 내용 먼저 렌더링하며 y를 내린다
                float boxTop = y;
                int idx = 0;
                for (Map.Entry<String, String> e : fields.entrySet()) {
                    float rowTop = y;
                    float rowBottom = y - rowH;

                    // 줄무늬 배경
                    if (idx % 2 == 0) {
                        cs.setNonStrokingColor(new Color(245, 247, 250));
                        fillRect(cs, boxLeft, rowBottom, boxRight - boxLeft, rowH - 1f);
                    }

                    // 라벨
                    cs.setNonStrokingColor(new Color(90, 96, 105));
                    textLeft(cs, font, 12, boxLeft + 12f, rowBottom + 6.5f, e.getKey());

                    // 값(숫자/원은 우측 정렬)
                    String val = e.getValue() == null ? "" : e.getValue();
                    boolean numericLike = val.matches("^[\\d,]+(\\.\\d+)?( ?원)?$");
                    cs.setNonStrokingColor(Color.BLACK);
                    if (numericLike) {
                        textRight(cs, font, 12, boxRight - 12f, rowBottom + 6.5f, val);
                    } else {
                        textLeft(cs, font, 12, boxLeft + 12f + labelW, rowBottom + 6.5f, val);
                    }

                    // 행 구분선
                    cs.setStrokingColor(new Color(220, 224, 229));
                    cs.setLineWidth(0.6f);
                    line(cs, boxLeft, rowBottom, boxRight, rowBottom);

                    y -= rowH;
                    idx++;
                }

                // 박스 테두리
                cs.setStrokingColor(new Color(50, 54, 63));
                cs.setLineWidth(1.2f);
                rect(cs, boxLeft, y, boxRight - boxLeft, boxTop - y);

                // 하단 고지
                y -= 22f;
                cs.setStrokingColor(new Color(220, 224, 229));
                cs.setLineWidth(0.8f);
                line(cs, margin, y, pageW - margin, y);

                y -= 14f;
                cs.setNonStrokingColor(new Color(110, 114, 120));
                textLeft(cs, font, 9.5f, margin,
                        y, "본 영수증은 전자문서로 발행되었으며 위·변조 시 법적 책임이 따릅니다.  발행자: 이음은행  |  고객센터: 1588-0000  |  www.eumbank.co.kr");
            }

            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            return ("FAILED: " + e.getMessage()).getBytes(StandardCharsets.UTF_8);
        }
    }

    // ---------- 텍스트 유틸 ----------
    private static void textLeft(PDPageContentStream cs, PDType0Font font, float size, float x, float y, String text) throws Exception {
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(text);
        cs.endText();
    }

    private static void textRight(PDPageContentStream cs, PDType0Font font, float size, float xRight, float y, String text) throws Exception {
        float w = stringWidth(font, size, text);
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(xRight - w, y);
        cs.showText(text);
        cs.endText();
    }

    private static float stringWidth(PDType0Font font, float fontSize, String text) throws Exception {
        if (text == null) return 0f;
        return font.getStringWidth(text) / 1000f * fontSize;
    }

    // ---------- 도형 유틸 ----------
    private static void line(PDPageContentStream cs, float x1, float y1, float x2, float y2) throws Exception {
        cs.moveTo(x1, y1);
        cs.lineTo(x2, y2);
        cs.stroke();
    }

    private static void rect(PDPageContentStream cs, float x, float y, float w, float h) throws Exception {
        cs.addRect(x, y, w, h);
        cs.stroke();
    }

    private static void fillRect(PDPageContentStream cs, float x, float y, float w, float h) throws Exception {
        cs.addRect(x, y, w, h);
        cs.fill();
    }

    // ---------- 파서 ----------
    private static Map<String, String> parseBody(String body) {
        Map<String, String> m = new LinkedHashMap<>();
        if (body == null) return m;
        for (String line : body.split("\n")) {
            int i = line.indexOf(':');
            if (i > 0) {
                String k = line.substring(0, i).trim();
                String v = line.substring(i + 1).trim();
                if (!k.isEmpty()) m.put(k, v);
            }
        }
        return m;
    }
}
