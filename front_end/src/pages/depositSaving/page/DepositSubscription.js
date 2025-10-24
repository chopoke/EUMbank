import { useState, useMemo, useEffect } from 'react';
import '../css/depositSubscription.css'; // 예금 전용 CSS import
import { useLocation } from 'react-router-dom';
import PdfSignatureModal from '../components/SignatureComponent';

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

const DepositSubscription = () => {
    const location = useLocation();
    const [productList, setProductList] = useState();

    // 전자서명 관련
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSigned, setIsSigned] = useState(false);

    useEffect(() => {
        const product = location.state?.productData;
        setProductList(product);
    }, []);


    // 2. 원본 데이터(productList)를 JSX에서 사용하기 편한 형태로 가공 (핵심!)
    const formattedProduct = useMemo(() => {
        // productList가 없으면 아무것도 반환하지 않음
        if (!productList) return null;

        // 원본 데이터를 기반으로 새로운 객체를 만들어 반환
        return {
            name: productList.name || "상품명 정보 없음",
            description: productList.description || "상품 설명 정보 없음",
            tags: [productList.category] || ["예금"], // category를 tag로 활용
            baseRate: productList.rate || "0.0%", // rate를 baseRate로
            extraRate: "+0.00%p", // 이 정보는 없으므로 기본값 설정
            summary: {
                code: productList.id || "N/A", // id를 코드로
                limit: productList.minAmount || "제한 없음", // minAmount 활용
                taxRate: "15.4%", // 이 정보는 없으므로 고정값 사용
                type: "정기예금" // 이 정보는 없으므로 고정값 사용
            },
            // 매우 중요: rateInfo는 넘어온 데이터에 없으므로, 기본 rate를 기반으로 임시 데이터를 생성
            rateInfo: [
                { term: "6개월", base: (parseFloat(productList.rate) - 0.2).toFixed(2) + '%', max: (parseFloat(productList.rate) - 0.2).toFixed(2) + '%' },
                { term: "12개월", base: productList.rate, max: productList.rate },
                { term: "24개월", base: (parseFloat(productList.rate) + 0.2).toFixed(2) + '%', max: (parseFloat(productList.rate) + 0.2).toFixed(2) + '%' },
                { term: "36개월", base: (parseFloat(productList.rate) + 0.4).toFixed(2) + '%', max: (parseFloat(productList.rate) + 0.4).toFixed(2) + '%' },
            ],
            // faqs 정보도 없으므로, 기본값을 설정
            faqs: [
                { q: "중도해지 시 금리는 어떻게 적용되나요?", a: "가입 상품의 약관을 확인해주세요." },
                { q: "비대면으로도 가입 가능한가요?", a: "네, 모바일 앱을 통해 가입 가능합니다." },
            ]
        };
    }, [productList]); // productList가 변경될 때만 이 로직을 다시 실행

    // --- (1) 기존 State ---
    const [amount, setAmount] = useState(10000000);
    const [term, setTerm] = useState(12);

    // --- (2) 추가된 State ---
    const [linkedAccount, setLinkedAccount] = useState(''); // 출금 계좌
    const [pin, setPin] = useState(''); // 계좌 비밀번호
    const [isConfirmed, setIsConfirmed] = useState(false); // 약관 동의

    const formatWon = (n) => n.toLocaleString('ko-KR');

    // 이자 계산 로직도 formattedProduct를 사용하도록 수정
    const calculatedResult = useMemo(() => {
        // formattedProduct가 아직 준비되지 않았으면 계산하지 않음
        if (!formattedProduct) return { interest: 0, tax: 0, afterTaxAmount: 0, total: amount };

        const principal = amount;
        // rateInfo에서 현재 선택된 기간(term)의 금리를 찾음
        const rateObject = formattedProduct.rateInfo.find(r => r.term === `${term}개월`);
        const interestRate = rateObject ? parseFloat(rateObject.base) / 100 : 0; // 금리 정보가 없으면 0으로 처리

        const interest = Math.floor(principal * interestRate * (term / 12));
        const tax = Math.floor(interest * 0.154);
        const afterTaxAmount = interest - tax;
        const total = principal + afterTaxAmount;
        return { interest, tax, afterTaxAmount, total };
    }, [amount, term, formattedProduct]);

    // PDF 서명 로직 (실제 구현 시 PDF 라이브러리 연동 필요)
    const handleSignPdf = () => {
        alert("전자 서명을 위해 PDF 문서를 엽니다. (실제 기능 연동 필요)");
        setIsModalOpen(true);
    };

    const handleSaveSignature = () => {
        setIsSigned(true);
        setIsModalOpen(false);
        alert("서명이 완료되었습니다.");
    };

    // 최종 가입 로직
    const handleSubscription = () => {
        if (!linkedAccount) {
            alert("출금계좌를 선택해주세요.");
            return;
        }
        if (pin.length !== 4) {
            alert("계좌 비밀번호 4자리를 정확히 입력해주세요.");
            return;
        }
        if (!isConfirmed) {
            alert("상품설명서 및 약관에 동의해주세요.");
            return;
        }
        // 모든 조건 충족 시
        alert(`${formatWon(amount)}원 예금 가입 신청이 완료되었습니다.`);
        // >> 여기에 실제 서버로 가입 정보를 전송하는 API 호출 로직을 구현합니다.
    };

    // 3. 로딩 처리: 데이터가 아직 안 왔을 때를 대비
    if (!formattedProduct) {
        return <div>상품 정보를 불러오는 중입니다...</div>;
    }

    return (
        <div className="sub-container">
            <header className="sub-header">
                <div className="tags">
                    {formattedProduct.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                </div>
                <h1>{formattedProduct.name}</h1>
                <p>{formattedProduct.description}</p>
            </header>

            <main className="sub-main-grid">
                <div className="left-col">

                    {isModalOpen && (
                        <PdfSignatureModal
                            onClose={() => setIsModalOpen(false)}
                            onSave={handleSaveSignature}
                        />
                    )}
                    {/* 상품 문서, 유의사항, FAQ 등 왼쪽 컬럼 내용은 기존과 동일 */}
                    <section className="info-section">


                        <h3>전자 서명</h3>
                        <div className="form-group">
                            <button
                                onClick={handleSignPdf}
                                className="sub-action-button secondary"
                            >
                                약관 확인 및 서명하기 (PDF)
                            </button>
                            {isSigned && <span style={{ color: 'green', marginLeft: '10px' }}>✓ 서명 완료</span>}
                        </div>
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
                            {formattedProduct.faqs.map(faq => (
                                <AccordionItem key={faq.q} title={faq.q}><p>{faq.a}</p></AccordionItem>
                            ))}
                        </div>
                    </section>
                </div>
                <aside className="right-col">

                    {/* --- (3) 추가된 가입 폼 섹션 --- */}
                    <div className="subscription-form">
                        <div className="form-group">
                            <label htmlFor="linkedAccount">출금 계좌</label>
                            <select id="linkedAccount" value={linkedAccount} onChange={(e) => setLinkedAccount(e.target.value)}>
                                <option value="">계좌를 선택하세요</option>
                                {/* 실제 앱에서는 로그인된 사용자의 계좌 목록을 불러옵니다 */}
                                <option value="110-234-567890">EUM 입출금통장 (110-234-567890)</option>
                                <option value="333-91-0123456">EUM 청년희망통장 (333-91-0123456)</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="pin">계좌 비밀번호</label>
                            <input
                                type="password"
                                id="pin"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength="4"
                                placeholder="숫자 6자리"
                                autoComplete="off"
                            />
                        </div>

                    </div>
                    <br></br>
                    <div className="summary-box">
                        <h4>요약</h4>
                        <div className="summary-item"><span>상품코드</span> <strong>{formattedProduct.summary.code}</strong></div>
                        <div className="summary-item"><span>가입한도</span> <strong>{formattedProduct.summary.limit}</strong></div>
                        <div className="summary-item"><span>세율(일반과세)</span> <strong>{formattedProduct.summary.taxRate}</strong></div>
                        <div className="summary-item"><span>상품유형</span> <strong>{formattedProduct.summary.type}</strong></div>
                        {/* 가입/문의 버튼은 하단 최종 액션으로 이동 */}
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




                        {/* --- (4) 최종 동의 및 가입 버튼 --- */}
                        <div className="final-actions">
                            <div className="confirm-wrapper">
                                <input type="checkbox" id="confirm-check" checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} />
                                <label htmlFor="confirm-check">상품설명서 및 약관을 모두 확인했으며, 가입에 동의합니다.</label>
                            </div>
                            <button onClick={handleSubscription} className="sub-action-button primary">
                                총 {formatWon(amount)}원 가입하기
                            </button>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default DepositSubscription;