import React, { useState, useRef, useEffect } from 'react';
// import './AgreementPage.css'; // 별도 CSS 파일이 필요합니다.

// --- 약관 내용 (필요에 따라 내용을 채우고, 탭을 추가/삭제하세요) ---
const AGREEMENTS = [
  { id: 'terms', title: '서비스 이용약관 (필수)', isRequired: true, content: '여기에 서비스 이용 약관의 법적 내용을 길게 넣어주세요. 스크롤을 끝까지 내려야 동의 버튼이 활성화됩니다. 이 약관은 회원과 회사의 권리와 의무를 규정합니다. [약관 내용 전문] ...' },
  { id: 'privacy', title: '개인정보 수집 및 이용 동의 (필수)', isRequired: true, content: '여기에 개인정보 처리방침 내용을 넣어주세요. 수집 목적, 항목, 보유 및 이용 기간 등이 명시되어야 합니다. 민감 정보 처리에 대한 동의 내용도 명확히 구분해야 합니다. [약관 내용 전문] ...' },
  { id: 'marketing', title: '마케팅 정보 수신 동의 (선택)', isRequired: false, content: '선택 동의 사항입니다. 이메일, 문자 등으로 광고성 정보를 수신하는 것에 동의하는지 여부를 묻습니다. 동의하지 않더라도 서비스 이용에는 지장이 없습니다. [약관 내용 전문] ...' },
];

const PrivacyPolicyPage = () => {
  
  
  return (
    <div className="agreement-container" style={styles.container}>
      <p>
        금융투자회사 개인정보 처리방침<br />
        <br />
        [회사명] (이하 '회사'라 한다)는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.<br />
        <br />

        이 방침은 [시행일]부터 시행됩니다.<br />

        <br />
        제1조(개인정보의 처리 목적)<br />
        <br />
        회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.<br />
        <br />

        금융거래 관계 관련<br />
        금융거래의 설정·유지·이행·관리, 금융사고 조사, 분쟁 해결, 민원 처리, 법령상 의무이행 등의 목적으로 개인정보를 처리합니다.<br />

        고객 분석 및 상품·서비스 홍보 및 판매 권유<br />
        고객별 맞춤 서비스 제공, 회사의 상품 및 서비스 홍보 및 판매 권유 등의 목적으로 개인정보를 처리합니다.<br />

        임직원 채용 및 인사 관리 관련<br />
        임직원 채용, 인사 관리 등의 목적으로 개인정보를 처리합니다.<br />

        마케팅 및 광고 활용 관련<br />
        이벤트, 광고성 정보 제공, 접속 빈도 파악 또는 회원의 서비스 이용에 대한 통계 등의 목적으로 개인정보를 처리합니다.<br />
        <br />
        제2조(처리하는 개인정보 항목)<br />
        <br />
        회사는 다음의 개인정보 항목을 처리하고 있습니다.<br />
        <br />

        필수적 정보<br />
        성명, 주민등록번호 등 고유식별정보, 주소, 연락처(전화번호, 휴대전화번호), 전자우편주소, 직업, 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보, 결제 기록 등<br />

        금융거래 정보<br />
        상품 유형, 거래 조건, 거래 일시, 금액, 계좌 정보 등 거래 설정 및 내역 정보<br />

        선택적 정보<br />
        취미, 결혼여부 등 금융거래 외에 정보주체가 선택적으로 제공한 정보<br />
        <br />
        제3조(개인정보의 처리 및 보유 기간)<br />
        <br />
        ① 회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시 동의 받은 개인정보 보유·이용 기간 내에서 개인정보를 처리하고 보유합니다.<br />
        <br />
        ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.<br />
        <br />

        금융거래와 관련한 개인정보: 「신용정보의 이용 및 보호에 관한 법률」에 따라 5년 보존<br />

        전자금융거래와 관련한 개인정보: 「전자금융거래법」에 따라 5년 보존<br />

        기타 법률에 따른 의무 이행: 해당 법률에서 정한 기간<br />
        <br />
        제4조(개인정보의 제3자 제공)<br />
        <br />
        ① 회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위를 초과하여 이용하거나 다른 사람 또는 다른 기업·기관에 제공하지 않습니다.<br />
        <br />
        ② 다만, 정보주체로부터 별도의 동의를 받은 경우, 법률에 특별한 규정이 있는 경우 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에는 개인정보를 제3자에게 제공할 수 있습니다.<br />
        <br />
        제5조(개인정보 처리업무의 위탁)<br />
        <br />
        ① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.<br />
        <br />

        전산 시스템 유지보수 및 운영<br />

        위탁받는 자 (수탁자): [수탁업체명]<br />

        위탁하는 업무의 내용: 전산 시스템 구축 및 유지보수, 백업 운영 등<br />
        <br />

        고객 상담 및 민원 처리<br />

        위탁받는 자 (수탁자): [수탁업체명]<br />

        위탁하는 업무의 내용: 고객 안내 및 전화 상담, 해피콜 운영 등<br />
        <br />
        ② 회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무 수행 목적 외 개인정보 처리 금지, 기술적·관리적 보호조치, 재위탁 제한, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지 감독하고 있습니다.<br />
        <br />
        제6조(정보주체의 권리·의무 및 행사방법)<br />
        <br />
        ① 정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.<br />
        <br />
        ② 제1항에 따른 권리 행사는 회사에 대해 「개인정보 보호법 시행규칙」 별지 제8호 서식에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 할 수 있으며, 회사는 이에 대해 지체 없이 조치하겠습니다.<br />
        <br />
        ③ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.<br />
        <br />
        제7조(개인정보의 파기)<br />
        <br />
        ① 회사는 개인정보 보유기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.<br />
        <br />
        ② 정보주체로부터 동의 받은 개인정보 보유기간이 경과하거나 처리 목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관 장소를 달리하여 보존합니다.<br />
        <br />
        ③ 개인정보 파기의 절차 및 방법은 다음과 같습니다.<br />
        <br />

        파기 절차: 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.<br />

        파기 방법: 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 로우레벨 포맷(Low Level Format) 등의 방법을 이용하여 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.<br />
        <br />
        제8조(개인정보 보호책임자)<br />
        <br />
        ① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.<br />
        <br />

        개인정보 보호책임자<br />

        성명: [성명]<br />

        직책: [직책]<br />

        연락처: [전화번호], [이메일 주소]<br />
        <br />
        ② 정보주체는 회사의 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 불만 처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의할 수 있습니다. 회사는 정보주체의 문의에 대해 지체 없이 답변 및 처리할 것입니다.<br />
        <br />
        제9조(개인정보 처리방침의 변경)<br />
        <br />
        이 개인정보 처리방침은 [시행일]부터 적용됩니다. 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 회사의 홈페이지 등을 통하여 고지할 것입니다.<br />
        <br />
        <br />
        (부칙)<br />
        이 방침은 [시행일]부터 시행합니다.<br />
      </p>
    </div>
  );
};

export default PrivacyPolicyPage;


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