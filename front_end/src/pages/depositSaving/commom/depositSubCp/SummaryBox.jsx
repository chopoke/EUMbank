const SummaryBox = ({ summary }) => {
    return (
        <div className="summary-box">
            <h4>요약</h4>
            <div className="summary-item"><span>상품코드</span> <strong>{summary.code}</strong></div>
            <div className="summary-item"><span>가입한도</span> <strong>{summary.limit}</strong></div>
            <div className="summary-item"><span>세율(일반과세)</span> <strong>{summary.taxRate}</strong></div>
            <div className="summary-item"><span>상품유형</span> <strong>{summary.type}</strong></div>
        </div>
    );
};

export default SummaryBox;