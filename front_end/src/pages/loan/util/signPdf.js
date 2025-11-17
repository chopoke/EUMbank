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

  // === 오늘 날짜 (서명일) ===
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, "0");
  const dd   = String(now.getDate()).padStart(2, "0");
  const signDateText = `${yyyy}년 ${mm}월 ${dd}일`;
  const yy2 = String(yyyy).slice(2); // "25"

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

  // ==========날짜
  const dateY = 185;          // 세로 위치
  const yearX  = 435;         // "20" 뒤에 들어갈 2자리 연도
  const monthX = 480;         // "월" 앞의 칸
  const dayX   = 510;         // "일" 앞의 칸
  last.drawText(yy2, {x: yearX,y: dateY,size: 11,font,color: textColor,});

  last.drawText(mm, {x: monthX,y: dateY,size: 11,font,color: textColor,});

  last.drawText(dd, {x: dayX,y: dateY,size: 11,font,color: textColor,});


  // 서명 이미지 너비 (페이지 폭의 비율로 설정)
  const targetWidth = width * 0.30; 

  // 서명 캔버스 비율 유지랑 위치
  const aspect =
    signatureCanvas.width && signatureCanvas.height
      ? signatureCanvas.height / signatureCanvas.width
      : 0.35;
  const targetHeight = targetWidth * aspect;

  // --- 서명 박스 위치 추정값 ---
  const boxCenterX = width * 0.75; 

  const boxBottomY = 120; 

  // 3) 서명 박스 높이
  const boxHeight = 30;  

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
