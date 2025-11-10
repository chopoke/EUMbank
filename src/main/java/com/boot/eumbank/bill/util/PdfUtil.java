package com.boot.eumbank.bill.util;

import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import java.io.ByteArrayOutputStream;

public final class PdfUtil {
    private PdfUtil() {}
    public static byte[] textReceipt(String title, String body) {
        try (var doc = new PDDocument(); var out = new ByteArrayOutputStream()) {
            var page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            var content = new PDPageContentStream(doc, page);
            content.beginText();
            content.setFont(PDType1Font.HELVETICA_BOLD, 18);
            content.newLineAtOffset(50, 750);
            content.showText(title);
            content.endText();

            float y = 720;
            for (String line : body.split("\n")) {
                content.beginText();
                content.setFont(PDType1Font.HELVETICA, 12);
                content.newLineAtOffset(50, y);
                content.showText(line);
                content.endText();
                y -= 18;
            }

            content.close();
            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            return "FAILED".getBytes();
        }
    }
}