import React, { useState, useRef, useEffect } from 'react';
// import './AgreementPage.css'; // 별도 CSS 파일이 필요합니다.

// --- 약관 내용 (필요에 따라 내용을 채우고, 탭을 추가/삭제하세요) ---
const AGREEMENTS = [
  { id: 'terms', title: '서비스 이용약관 (필수)', isRequired: true, content: '여기에 서비스 이용 약관의 법적 내용을 길게 넣어주세요. 스크롤을 끝까지 내려야 동의 버튼이 활성화됩니다. 이 약관은 회원과 회사의 권리와 의무를 규정합니다. [약관 내용 전문] ...' },
  { id: 'privacy', title: '개인정보 수집 및 이용 동의 (필수)', isRequired: true, content: '여기에 개인정보 처리방침 내용을 넣어주세요. 수집 목적, 항목, 보유 및 이용 기간 등이 명시되어야 합니다. 민감 정보 처리에 대한 동의 내용도 명확히 구분해야 합니다. [약관 내용 전문] ...' },
  { id: 'marketing', title: '마케팅 정보 수신 동의 (선택)', isRequired: false, content: '선택 동의 사항입니다. 이메일, 문자 등으로 광고성 정보를 수신하는 것에 동의하는지 여부를 묻습니다. 동의하지 않더라도 서비스 이용에는 지장이 없습니다. [약관 내용 전문] ...' },
];

const DisclosurePage = () => {
  
  
  return (
    <div className="agreement-container" style={styles.container}>
      <p>
        금융투자회사 경영공시<br />
        <br />
        [회사명] (이하 '회사'라 한다)는 「자본시장과 금융투자업에 관한 법률」 및 관련 규정에 따라 회사의 건전성 및 경영 상황을 투명하게 공개합니다.<br />
        <br />

        공시 기준일: [YYYY년 MM월 DD일] (가장 최근 분기 말 기준)<br />

        <br />
        제1조(회사의 개요)<br />
        <br />

        회사명: [회사명]<br />

        대표이사: [대표이사 성명]<br />

        본점 주소: [주소]<br />

        설립일: [설립일]<br />

        주요 사업: 금융투자업(투자매매업, 투자중개업 등)<br />
        <br />
        제2조(재무 현황 요약)<br />
        <br />
        회사의 최근 재무상태 및 경영실적 요약은 다음과 같습니다. (단위: 백만원)<br />
        <br />

        자산 및 부채 현황<br />

        총자산: [XXX,XXX]<br />

        총부채: [XX,XXX]<br />

        자본총계: [XXX,XXX]<br />
        <br />

        손익 현황<br />

        영업수익: [X,XXX]<br />

        영업비용: [XXX]<br />

        당기순이익(손실): [XXX]<br />
        <br />
        제3조(자본 적정성 및 건전성)<br />
        <br />
        회사는 재무 건전성 유지를 위하여 금융당국의 규제 비율을 준수하고 있습니다.<br />
        <br />

        순자본비율 (NCR, Net Capital Ratio)<br />

        기준: [XX.XX]%<br />

        규제 기준: 100% 이상<br />

        설명: 순자본비율은 회사의 재무 건전성을 나타내는 핵심 지표로, 영업용순자본을 총위험액으로 나눈 값입니다. 당사는 규제 기준을 상회하는 높은 수준을 유지하고 있습니다.<br />
        <br />

        레버리지 비율 (Leverage Ratio)<br />

        기준: [X.XX]배<br />

        설명: 총자산 대비 자기자본의 비율로, 회사의 차입 의존도를 나타냅니다. 안정적인 자본 구조를 유지하고 있습니다.<br />
        <br />
        제4조(주요 리스크 관리 현황)<br />
        <br />
        회사가 관리하는 주요 리스크 및 관리 체계는 다음과 같습니다.<br />
        <br />

        시장 위험 (Market Risk)<br />

        정의: 금리, 주가, 환율 등의 변동으로 인해 회사가 손실을 입을 가능성<br />

        관리: VaR(Value at Risk) 시스템 운영 및 리스크 한도 설정<br />
        <br />

        신용 위험 (Credit Risk)<br />

        정의: 거래 상대방 또는 발행자의 파산 등으로 인해 손실을 입을 가능성<br />

        관리: 신용 등급별 한도 관리 및 담보 확보 체계 운영<br />
        <br />

        운영 위험 (Operational Risk)<br />

        정의: 인적 오류, 시스템 장애, 내부 통제 미비 등으로 인해 발생하는 손실 위험<br />

        관리: 내부 감사 및 상시 모니터링 시스템 구축<br />
        <br />
        제5조(조직 및 지배구조)<br />
        <br />

        지배구조: [주주총회 → 이사회 → 감사위원회 → 경영진]의 체계를 갖추고 있습니다.<br />

        이사회 구성: 사외이사 [X]명, 상임이사 [Y]명 등 총 [Z]명으로 구성<br />

        내부통제 시스템: 컴플라이언스(Compliance) 부서를 독립적으로 운영하며, 내부 통제 기준을 엄격히 준수합니다.<br />
        <br />
        제6조(투자자 보호 장치)<br />
        <br />

        금융소비자보호 조직: 금융소비자보호 총괄책임자(CCO)를 임명하고, 금융소비자보호 관련 조직을 운영합니다.<br />

        분쟁 처리 절차: 투자자 보호를 위한 내부 분쟁 처리 절차를 마련하고, 금융감독원 등 외부 기관과의 연계 시스템을 구축하고 있습니다.<br />

        투자자 유의사항: 본 공시 내용은 투자 권유를 목적으로 하지 않으며, 투자 결정은 투자자 본인의 판단과 책임하에 이루어져야 합니다.<br />
        <br />
        <br />
        (참고)<br />
        본 공시 내용의 세부 사항 및 최신 정보는 회사의 홈페이지 ([홈페이지 주소]) 또는 금융감독원 전자공시 시스템(DART)을 통해 확인하실 수 있습니다.<br />
        <br />
        <br />
        [회사명]<br />
      </p>
    </div>
  );
};

export default DisclosurePage;


// --- 인라인 스타일 (CSS 파일을 대체하여 쉽게 사용 가능하도록 임시 적용) ---
const styles = {
  container: {
    maxWidth: '1240px',
    margin: '40px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '24px',
    color: '#333',
  },
  tabContainer: {
    display: 'flex',
    marginBottom: '15px',
    borderBottom: '1px solid #eee',
  },
  tabButton: {
    padding: '10px 15px',
    marginRight: '5px',
    border: 'none',
    backgroundColor: '#f9f9f9',
    cursor: 'pointer',
    flexGrow: 1,
  },
  activeTabButton: {
    padding: '10px 15px',
    marginRight: '5px',
    border: 'none',
    borderBottom: '3px solid #007bff',
    backgroundColor: '#fff',
    color: '#007bff',
    fontWeight: 'bold',
    cursor: 'default',
    flexGrow: 1,
  },
  contentArea: {
    height: '250px',
    border: '1px solid #ccc',
    padding: '15px',
    overflowY: 'scroll',
    backgroundColor: '#f9f9f9',
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap', // 약관 내용을 원본 형식대로 표시
  },
  checkboxes: {
    marginTop: '20px',
  },
  checkboxItem: {
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
  },
  divider: {
    margin: '15px 0',
    border: '0',
    borderTop: '1px dashed #ddd',
  },
  allAgreeLabel: {
    fontWeight: 'bold',
  },
  scrollNotice: {
    color: 'red',
    marginLeft: '10px',
    fontSize: '12px',
  },
  submitButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  disabledButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#adb5bd',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
    marginTop: '20px',
    cursor: 'not-allowed',
  }
};