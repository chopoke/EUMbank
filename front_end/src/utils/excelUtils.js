import * as XLSX from 'xlsx';

/**
 * SheetJS를 사용한 거래내역 엑셀 다운로드 유틸리티
 * 간단하고 효율적인 엑셀 다운로드 기능 제공
 */

/**
 * 거래내역을 엑셀로 다운로드
 * @param {Array} transactions - 거래내역 데이터 배열
 * @param {string} filename - 파일명 (기본값: '거래내역')
 */
export const downloadTradingHistoryExcel = (transactions, filename = '거래내역') => {
  if (!transactions || transactions.length === 0) {
    alert('다운로드할 거래내역이 없습니다.');
    return;
  }

  try {
    // 워크시트 데이터 생성
    const worksheetData = transactions.map(transaction => ({
      '거래번호': transaction.gNo || '',
      '구분': transaction.transactionType === 'BUY' ? '매수' : '매도',
      '상품': transaction.metalCode === 'AU' ? '금(AU)' : '은(AG)',
      '수량(g)': transaction.quantity || 0,
      '단가(원)': transaction.pricePerG || 0,
      '총액(원)': transaction.totalPrice || 0,
      '수수료(원)': transaction.feeAmount || 0,
      '거래일시': transaction.purchasedAt ? new Date(transaction.purchasedAt).toLocaleString('ko-KR') : '',
      '상태': transaction.status === 'COMPLETED' ? '완료' : '처리중',
      '월렛명': transaction.walletName || ''
    }));

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // 컬럼 너비 자동 조정
    const colWidths = [
      { wch: 12 }, // 거래번호
      { wch: 8 },  // 구분
      { wch: 10 }, // 상품
      { wch: 12 }, // 수량
      { wch: 15 }, // 단가
      { wch: 15 }, // 총액
      { wch: 12 }, // 수수료
      { wch: 20 }, // 거래일시
      { wch: 8 },  // 상태
      { wch: 15 }  // 월렛명
    ];
    worksheet['!cols'] = colWidths;

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, '거래내역');

    // 엑셀 파일 다운로드
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `${filename}_${today}.xlsx`);
    
    console.log(`엑셀 다운로드 완료: ${transactions.length}건`);
  } catch (error) {
    console.error('엑셀 다운로드 오류:', error);
    alert('엑셀 다운로드 중 오류가 발생했습니다.');
  }
};

