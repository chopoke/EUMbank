package com.boot.eumbank.account.Open.util;

public final class ImageFormats {
    public static String sniff(byte[] b) {
        if (b == null || b.length < 12) return "unknown";
        // JPEG: FF D8 FF
        if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "jpg";
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if ((b[0] & 0xFF) == 0x89 && b[1]=='P' && b[2]=='N' && b[3]=='G') return "png";
        // TIFF (LE): 49 49 2A 00, (BE): 4D 4D 00 2A
        if ((b[0]=='I' && b[1]=='I' && (b[2] & 0xFF)==0x2A && b[3]==0x00) ||
            (b[0]=='M' && b[1]=='M' && b[2]==0x00 && (b[3] & 0xFF)==0x2A)) return "tiff";
        // PDF: %PDF-
        if (b[0]=='%' && b[1]=='P' && b[2]=='D' && b[3]=='F') return "pdf";
        // HEIC/HEIF: ... 'ftypheic' or 'ftypheif' near offset 4
        if (b[4]=='f' && b[5]=='t' && b[6]=='y' && b[7]=='p') {
            String box = new String(b, 8, Math.min(8, b.length-8));
            if (box.startsWith("heic") || box.startsWith("heif") || box.startsWith("hevc") || box.startsWith("mif1"))
                return "heic";
        }
        return "unknown";
    }

    public static String canonical(String f) {
        if (f == null) return "unknown";
        return switch (f.toLowerCase()) {
            case "jpeg" -> "jpg";
            case "tif" -> "tiff";
            default -> f.toLowerCase();
        };
    }
}