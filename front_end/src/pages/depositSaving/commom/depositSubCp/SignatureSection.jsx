const SignatureSection = ({ onSignClick, isSigned }) => {
    return (
        <section className="info-section">
            <h3>전자 서명</h3>
            <div className="form-group">
                <button
                    onClick={onSignClick}
                    className="sub-action-button secondary"
                >
                    약관 확인 및 서명하기 (PDF)
                </button>
                {isSigned && <span style={{ color: 'green', marginLeft: '10px' }}>✓ 서명 완료</span>}
            </div>
        </section>
    );
};

export default SignatureSection;