import { PDFDocument } from 'pdf-lib';

/**
 * 여러 PDF를 하나로 병합하고 서명 추가
 */
export const generateSignedPdf = async (signatureCanvas, pdfPaths) => {
    try {
        console.log('PDF 병합 시작, 경로:', pdfPaths);

        // 1. 새 PDF 문서 생성
        const mergedPdf = await PDFDocument.create();

        // 2. 모든 PDF 파일을 순차적으로 병합
        for (let i = 0; i < pdfPaths.length; i++) {
            const pdfPath = pdfPaths[i];
            console.log(`PDF ${i + 1} 로드 중:`, pdfPath);

            try {
                const response = await fetch(pdfPath);
                if (!response.ok) {
                    throw new Error(`PDF 파일을 불러올 수 없습니다: ${pdfPath}`);
                }

                const pdfBytes = await response.arrayBuffer();
                console.log(`PDF ${i + 1} 크기:`, pdfBytes.byteLength, 'bytes');

                const pdf = await PDFDocument.load(pdfBytes);
                const pageCount = pdf.getPageCount();
                console.log(`PDF ${i + 1} 페이지 수:`, pageCount);

                // 모든 페이지를 복사
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => {
                    mergedPdf.addPage(page);
                });

                console.log(`PDF ${i + 1} 병합 완료`);
            } catch (error) {
                console.error(`PDF ${i + 1} 처리 중 오류:`, error);
                throw new Error(`PDF ${i + 1} 처리 실패: ${error.message}`);
            }
        }

        console.log('총 병합된 페이지 수:', mergedPdf.getPageCount());

        // 3. 서명을 캔버스에서 이미지로 변환
        console.log('서명 이미지 생성 중...');
        const signatureDataUrl = signatureCanvas.toDataURL('image/png');
        const signatureImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
        const signatureImage = await mergedPdf.embedPng(signatureImageBytes);
        console.log('서명 이미지 생성 완료');

        // 4. 마지막 페이지에 서명 추가
        const pages = mergedPdf.getPages();
        const lastPage = pages[pages.length - 1];
        const { width, height } = lastPage.getSize();

        console.log('마지막 페이지 크기:', width, 'x', height);

        // 서명 크기 및 위치 설정
        const signatureWidth = 150;
        const signatureHeight = 50;
        const signatureX = width - signatureWidth - 50; // 오른쪽 하단
        const signatureY = 65; // 하단에서 100pt 위

        lastPage.drawImage(signatureImage, {
            x: signatureX,
            y: signatureY,
            width: signatureWidth,
            height: signatureHeight,
        });

        console.log('서명 추가 완료, 위치:', signatureX, signatureY);

        // 5. PDF를 Blob으로 변환
        console.log('최종 PDF 생성 중...');
        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        console.log('최종 PDF 생성 완료, 크기:', blob.size, 'bytes');

        return blob;
    } catch (error) {
        console.error('PDF 생성 중 오류:', error);
        throw error;
    }
};

/**
 * 서명된 PDF 데이터 생성
 */
export const createSignatureData = (pdfBlob, originalPath) => {
    if (!pdfBlob || !(pdfBlob instanceof Blob)) {
        console.error('유효하지 않은 PDF Blob:', pdfBlob);
        throw new Error('유효하지 않은 PDF 데이터입니다.');
    }

    const timestamp = new Date().toISOString();
    const data = {
        signedPdfBlob: pdfBlob,  // DepositSubscription에서 기대하는 이름
        signatureDate: timestamp,  // 서명 날짜
        templatePdfPath: originalPath,  // 원본 PDF 경로
        timestamp: timestamp,  // 타임스탬프
        url: URL.createObjectURL(pdfBlob)  // 미리보기용 URL
    };

    console.log('서명 데이터 생성 완료:', {
        pdfSize: data.signedPdfBlob.size,
        signatureDate: data.signatureDate,
        templatePdfPath: data.templatePdfPath,
        timestamp: data.timestamp
    });

    return data;
};