import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/depositSubscription.css'; // 예금 전용 CSS import

// FAQ 아이템을 위한 간단한 아코디언 컴포넌트
const AccordionItem = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="faq-item">
            <button className="faq-question" onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <span className={`faq-icon ${isOpen ? 'open' : ''}`}>▼</span>
            </button>
            {isOpen && <div className="faq-answer">{children}</div>}
        </div>
    );
};

// 예금 상품 데이터
const depositProduct = {
    tags: ["고금리"],
    name: "EUM 정기예금",
    description: "안정적인 금리로 목돈을 운용하는 기본형 정기예금 상품입니다. 모바일 전용 추가 우대 제공.",
    baseRate: "3.20%",
    extraRate: "+1.00%p",
    summary: {
        code: "EUM-FD-101",
        limit: "1,000,000원 ~ 100,000,000원",
        taxRate: "15.4%",
        type: "정기예금"
    },
    rateInfo: [
        { term: "6개월", base: "3.00%", max: "4.00%" },
        { term: "12개월", base: "3.20%", max: "4.20%" },
        { term: "24개월", base: "3.40%", max: "4.60%" },
        { term: "36개월", base: "3.60%", max: "4.60%" },
    ],
    faqs: [
        { q: "중도해지 시 금리는 어떻게 적용되나요?", a: "중도해지 시에는 약정된 금리가 아닌 중도해지 이율이 적용되며, 이는 상품설명서에서 확인하실 수 있습니다." },
        { q: "비대면으로도 가입 가능한가요?", a: "네, 본 상품은 모바일 앱을 통해 간편하게 가입 가능한 비대면 전용 상품입니다." },
        { q: "만기 자동해지는 가능한가요?", a: "네, 가입 시 만기 자동해지 옵션을 선택하시면 만기일에 원금과 이자가 지정된 계좌로 자동 입금됩니다." },
    ]
};

const DepositSubscription = () => {
    const navigate = useNavigate();
    const product = depositProduct;

    const [amount, setAmount] = useState(10000000);
    const [term, setTerm] = useState(12);

    const formatWon = (n) => n.toLocaleString('ko-KR');

    const calculatedResult = useMemo(() => {
        const principal = amount;
        const interestRate = parseFloat(product.rateInfo.find(r => r.term === `${term}개월`).base) / 100;
        const interest = Math.floor(principal * interestRate * (term / 12));
        const tax = Math.floor(interest * 0.154);
        const afterTaxAmount = interest - tax;
        const total = principal + afterTaxAmount;
        return { interest, tax, afterTaxAmount, total };
    }, [amount, term, product.rateInfo]);

    return (
        <div className="sub-container">
            {/* ... JSX 내용은 이전과 동일하게 구성 ... */}
            <header className="sub-header">
                <div className="tags">
                    {product.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                </div>
                <h1>{product.name}</h1>
                <p>{product.description}</p>
                <div className="rate-highlight">
                    <span>기본금리(12개월) <br /> <strong>{product.baseRate}</strong></span>
                    <span>최대 우대 <br /> <strong>{product.extraRate}</strong></span>
                </div>
            </header>

            <main className="sub-main-grid">
                <div className="left-col">
                    <section className="info-section">
                        <h3>금리 안내</h3>
                        <table className="rate-table">
                            <thead>
                                <tr><th>기간</th><th>기본금리(연)</th><th>최대금리(연)</th></tr>
                            </thead>
                            <tbody>
                                {product.rateInfo.map(rate => (
                                    <tr key={rate.term}><td>{rate.term}</td><td>{rate.base}</td><td>{rate.max}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                    <section className="info-section">
                        <h3>상품 문서</h3>
                        <p className="document-link">상품설명서 및 약관(PDF)</p>
                    </section>
                    <section className="info-section">
                        <h3>유의사항</h3>
                        <ul className="notice-list">
                            <li>예금자보호: 이 예금은 예금자보호법에 따라 원금과 소정의 이자를 합하여 1인당 "최고 5천만원"까지 보호됩니다.</li>
                            <li>세금: 이자소득세 14% 및 지방소득세 1.4%가 원천징수됩니다.</li>
                            <li>금리: 표기된 금리는 예시이며, 시장 상황에 따라 변동될 수 있습니다.</li>
                        </ul>
                    </section>
                    <section className="info-section">
                        <h3>FAQ</h3>
                        <div className="faq-list">
                            {product.faqs.map(faq => (
                                <AccordionItem key={faq.q} title={faq.q}><p>{faq.a}</p></AccordionItem>
                            ))}
                        </div>
                    </section>
                </div>
                <aside className="right-col">
                    <div className="summary-box">
                        <h4>요약</h4>
                        <div className="summary-item"><span>상품코드</span> <strong>{product.summary.code}</strong></div>
                        <div className="summary-item"><span>가입한도</span> <strong>{product.summary.limit}</strong></div>
                        <div className="summary-item"><span>세율(일반과세)</span> <strong>{product.summary.taxRate}</strong></div>
                        <div className="summary-item"><span>상품유형</span> <strong>{product.summary.type}</strong></div>
                        <button className="sub-action-button primary">가입하기</button>
                        <button className="sub-action-button secondary">문의하기</button>
                    </div>

                    <div className="calculator-box">
                        <h4>만기 수익 계산기 (단리 예시)</h4>
                        <div className="calc-input-group">
                            <label>예치금액 (원)</label>
                            <input type="text" readOnly value={`${formatWon(amount)}원`} />
                            <input type="range" min="1000000" max="100000000" step="100000" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                        </div>
                        <div className="calc-input-group">
                            <label>기간</label>
                            <select value={term} onChange={(e) => setTerm(Number(e.target.value))}>
                                <option value="6">6개월</option>
                                <option value="12">12개월</option>
                                <option value="24">24개월</option>
                                <option value="36">36개월</option>
                            </select>
                        </div>
                        <div className="calc-result">
                            <div className="result-item"><span>원금</span> <span>{formatWon(amount)}원</span></div>
                            <div className="result-item"><span>세전 이자</span> <span>{formatWon(calculatedResult.interest)}원</span></div>
                            <div className="result-item tax"><span>세금(15.4%)</span> <span>- {formatWon(calculatedResult.tax)}원</span></div>
                            <hr />
                            <div className="result-item total"><span>만기 예상 수령액(세후)</span><strong>{formatWon(calculatedResult.total)}원</strong></div>
                        </div>
                        <div className="final-actions">
                            <input type="checkbox" id="confirm-check" />
                            <label htmlFor="confirm-check">상품설명서 및 약관을 확인했으며, 예시 계산 결과가 실제와 다를 수 있음을 이해했습니다.</label>
                            <button className="sub-action-button disabled">바로 가입하기</button>
                            <button className="sub-action-button secondary">상담 신청</button>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default DepositSubscription;