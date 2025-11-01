import { PDFDocument } from 'pdf-lib';

/**
 * 서명이 포함된 PDF 생성
 */
export const generateSignedPdf = async (canvas, templatePdfPath) => {
    const existingPdfBytes = await fetch(templatePdfPath).then(res => res.arrayBuffer());
    
    const signatureImageBytes = await new Promise(resolve => {
        canvas.toBlob(blob => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(new Uint8Array(reader.result));
            reader.readAsArrayBuffer(blob);
        }, 'image/png');
    });

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
    const pages = pdfDoc.getPages();

    if (pages.length > 0) {
        const firstPage = pages[0];
        firstPage.drawImage(signatureImage, {
            x: firstPage.getWidth() / 2 - (-90),
            y: 60,
            width: 150,
            height: 75,
        });
    }

    const finalPdfBytes = await pdfDoc.save();
    return new Blob([finalPdfBytes], { type: 'application/pdf' });
};

/**
 * 서명 데이터 객체 생성
 */
export const createSignatureData = (signedPdfBlob, templatePdfPath) => ({
    signedPdfBlob,
    signatureDate: new Date().toLocaleDateString('ko-KR'),
    templatePdfPath,
    timestamp: Date.now()
});