// src/pages/loan/util/signPdf.js (경로는 네가 쓰는 곳 기준)

import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";


// 폰트 한번 로드
let koreanFontBytes = null;
async function loadKoreanFontBytes() {
  if (koreanFontBytes) return koreanFontBytes;

  const fontUrl = "/font/NotoSansKR.ttf";
  const res = await fetch(fontUrl);
  if (!res.ok) {
    throw new Error(`한글 폰트 로드 실패: ${res.status} ${res.statusText}`);
  }
  const buffer = await res.arrayBuffer();
  koreanFontBytes = new Uint8Array(buffer);
  return koreanFontBytes;
}

/**
 * 여러 PDF를 하나로 병합하고, 마지막 페이지의 서명 박스 위치에 서명 이미지를 올린다.
 */
export async function mergePdfsAndAddSignature(signatureCanvas, pdfUrls, fields = {}) {
  if (!signatureCanvas) throw new Error("서명 캔버스를 찾을 수 없습니다.");
  if (!pdfUrls || pdfUrls.length === 0) throw new Error("병합할 PDF가 없습니다.");

  const merged = await PDFDocument.create();
  merged.registerFontkit(fontkit);

  // 1) PDF 병합
  for (const url of pdfUrls) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PDF 로드 실패: ${url}`);
    const bytes = await res.arrayBuffer();
    const srcPdf = await PDFDocument.load(bytes);
    const copiedPages = await merged.copyPages(srcPdf, srcPdf.getPageIndices());
    copiedPages.forEach((p) => merged.addPage(p));
  }

  // 2) 서명 이미지 (캔버스 → PNG)
  const dataUrl = signatureCanvas.toDataURL("image/png");
  const imgBytes = await (await fetch(dataUrl)).arrayBuffer();
  const sigImg = await merged.embedPng(imgBytes);

  // 3) 마지막 페이지 (서명+신청정보)
  const pages = merged.getPages();
  const last = pages[pages.length - 1];
  const { width, height } = last.getSize();

  // 텍스트용 폰트
  const fontBytes = await loadKoreanFontBytes();
    const font = await merged.embedFont(fontBytes); 

  //------------------------- 텍스트정보삽입
  const textColor = rgb(0, 0, 0);
  const fontSize = 10;

  // 예시 좌표 (A4 기준, 윗쪽에서 아래로 내려오게)
  const leftX = width * 0.14;   // 왼쪽 컬럼 시작 X
  const rightX = width * 0.56;  // 오른쪽 컬럼 시작 X
  let rowY = height - 230;      // 첫 줄 Y 
  const gap = 22;               // 줄간 간격

  const safe = (v) => (v == null ? "" : String(v));

  // 왼쪽 컬럼
  last.drawText(safe(fields.borrowerName), { x: leftX + 90, y: rowY, size: fontSize, font, color: textColor }); // 이름
  rowY -= gap;
  last.drawText(safe(fields.ssn),         { x: leftX + 260, y: rowY + 20, size: fontSize, font, color: textColor }); // 주민번호
  rowY -= gap;
  last.drawText(safe(fields.address),     { x: leftX + 90, y: rowY + 15, size: fontSize, font, color: textColor }); // 주소
  rowY -= gap;
  last.drawText(safe(fields.phone),       { x: leftX + 70, y: rowY +15 , size: fontSize, font, color: textColor }); // 전화번호
  rowY -= gap;
  last.drawText(safe(fields.job),         { x: leftX + 300, y: rowY + 35, size: fontSize, font, color: textColor }); // 직업
  rowY -= gap;
  // last.drawText(safe(fields.hireDate),    { x: leftX + 90, y: rowY, size: fontSize, font, color: textColor }); // 입사날짜
  rowY -= gap;
  // last.drawText(safe(fields.yearsAtJob),  { x: leftX + 90, y: rowY, size: fontSize, font, color: textColor }); // 근속기간

  // 오른쪽 컬럼 (y 다시 세팅)
  let rowY2 = height - 260;
  last.drawText(safe(fields.purpose),       { x: rightX + 90, y: rowY2, size: fontSize, font, color: textColor }); // 자금용도
  rowY2 -= gap;
  last.drawText(safe(fields.repayMethod),   { x: rightX -30, y: rowY2 - 75, size: fontSize, font, color: textColor }); // 상환조건
  rowY2 -= gap;
  last.drawText(safe(fields.periodMonths),  { x: rightX - 160, y: rowY2 - 80, size: fontSize, font, color: textColor }); // 기간
  rowY2 -= gap;
  last.drawText(safe(fields.interestRate),  { x: rightX + 90, y: rowY2 - 56, size: fontSize, font, color: textColor }); // 이율
  rowY2 -= gap;
  // last.drawText(safe(fields.firstRepayDate),{ x: rightX + 90, y: rowY2, size: fontSize, font, color: textColor }); // 상환예정일
  // ---------------------------------------

  /**
   * - PDF-lib 좌표계 기준: (0,0)은 "왼쪽 아래"
   * - y 값을 키우면 → 위로 올라감
   * - 템플릿의 "대출신청인(서명)" 박스에 맞춰서 대략 값 넣어둔 거라
   *   실제 양식에 맞게 숫자만 살짝 조정하면 된다.
   */

  // 서명 이미지 너비 (페이지 폭의 비율로 설정)
  const targetWidth = width * 0.30; // 필요하면 0.25 ~ 0.35 사이로 조절

  // 서명 캔버스 비율 유지랑 위치
  const aspect =
    signatureCanvas.width && signatureCanvas.height
      ? signatureCanvas.height / signatureCanvas.width
      : 0.35;
  const targetHeight = targetWidth * aspect;

  // --- 서명 박스 위치 추정값 ---
  // 1) 서명 박스의 중앙 X (오른쪽 박스 중앙 근처)
  const boxCenterX = width * 0.75; // 너무 왼쪽/오른쪽이면 이 값만 바꿔주면 됨

  // 2) 서명 박스의 "아래 y 좌표" (페이지 아래에서 얼마나 떨어져 있는지)
  //    지금 네 스샷 기준으로 scribble 이 박스보다 너무 아래라서,
  //    y 값을 "기존보다 더 크게" 잡아 박스 안으로 올려준다.
  const boxBottomY = 120; 

  // 3) 서명 박스 높이 (대략)
  const boxHeight = 30;   // 실제 박스 높이에 맞춰 조정

  // 박스 안에 수직 중앙 정렬
  const x = boxCenterX - targetWidth / 2;
  const y = boxBottomY + (boxHeight - targetHeight) / 2;

  last.drawImage(sigImg, {
    x,
    y,
    width: targetWidth,
    height: targetHeight,
  });

  // 4) Blob 반환
  const outBytes = await merged.save();
  return new Blob([outBytes], { type: "application/pdf" });

  
}

export async function mergePdfsForPreview(pdfUrls = []) {
  if (!pdfUrls || pdfUrls.length === 0) {
    throw new Error("병합할 PDF가 없습니다.(preview)");
  }

  const merged = await PDFDocument.create();

  for (const url of pdfUrls) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PDF 로드 실패(preview): ${url}`);
    const bytes = await res.arrayBuffer();
    const srcPdf = await PDFDocument.load(bytes);
    const copiedPages = await merged.copyPages(srcPdf, srcPdf.getPageIndices());
    copiedPages.forEach((p) => merged.addPage(p));
  }

  const outBytes = await merged.save();
  return new Blob([outBytes], { type: "application/pdf" });
}

/**
 * flow 등에 저장할 메타 정보
 */
export function buildSignatureMeta(pdfBlob, sourceUrls) {
  if (!(pdfBlob instanceof Blob)) {
    throw new Error("유효하지 않은 PDF Blob 입니다.");
  }
  const ts = new Date().toISOString();
  const url = URL.createObjectURL(pdfBlob);

  return {
    signedPdfBlob: pdfBlob,
    previewUrl: url,
    signatureDate: ts,
    sourcePdfs: sourceUrls,
    fileName: `loan-sign-${ts.slice(0, 10)}.pdf`,
  };
}
