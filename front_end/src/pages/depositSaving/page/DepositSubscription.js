import { useState, useMemo, useEffect } from 'react';
import '../css/depositSubscription.css';
import { useLocation, useNavigate } from 'react-router-dom';
import PdfSignatureModal from '../components/SignatureComponent';
// ❌ pdf-lib 제거 (프론트엔드에서 PDF 병합 안 함)
// import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getAccountList } from '../api/accountApi';
import { depositSave } from '../api/depositApi';

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
    const navigate = useNavigate();
    const [productList, setProductList] = useState();
    const [aggreement, setAggreement] = useState();
    const [amount, setAmount] = useState(10000000);
    const [term, setTerm] = useState(12);
    const [linkedAccount, setLinkedAccount] = useState('');
    const [depositAccount, setDepositAccount] = useState('');
    const [pin, setPin] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);

    // 전자서명 관련
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSigned, setIsSigned] = useState(false);
    // ✅ 서명 데이터 저장 (이미지 Blob, 날짜, PDF 경로)
    const [signatureData, setSignatureData] = useState(null);
    // 백엔드에서 조회하여, 계좌목록 담기
    const [userAccounts, setUserAccounts] = useState([]);
    
    // 화면 업로드시 한번 계좌 정보테이블에서 데이터 가져오기
    useEffect(() => {
        let product = location.state?.productData;
        const agreement = location.state?.agreements;
        if (!product) {
            const savedProductJSON = sessionStorage.getItem('selectedProduct');
            if (savedProductJSON) {
                product = JSON.parse(savedProductJSON);
            }
        }

        if (product) {
            setProductList(product);
            setAggreement(agreement);
        } else {
            console.error("상품 정보를 찾을 수 없습니다. 목록 페이지로 이동합니다.");
            alert("상품 정보가 없습니다. 이전 페이지로 돌아갑니다.");
            navigate("/depositSavingProductList/open");
            return;
        }
        
        fetchUserAccounts();
    }, []);

    // 백엔드에서 사용자 계좌 목록 조회하는 함수
    const fetchUserAccounts = async () => {
        try {
            const accountsData = await getAccountList();
            setUserAccounts(accountsData);
        } catch (error) {
            console.error('계좌 목록 조회 실패:', error);
            alert('계좌 정보를 불러오는데 실패했습니다.');
        }
    };

    // 원본 데이터를 JSX에서 사용하기 편한 형태로 가공
    const formattedProduct = useMemo(() => {
        if (!productList) return null;

        const parseAmount = (amountStr) => {
            if (!amountStr) return null;
            const match = amountStr.match(/[\d.]+/);
            return match ? parseFloat(match[0]) : null;
        };

        const minAmount = parseAmount(productList.minAmount) || 1000000;
        const maxAmount = parseAmount(productList.maxAmount) || 100000000;
        const minMonths = productList.minMonths || 6;
        const maxMonths = productList.maxMonths || 36;

        const generateTermOptions = () => {
            const options = [];
            const standardTerms = [3, 6, 12, 24, 36];
            
            for (const term of standardTerms) {
                if (term >= minMonths && term <= maxMonths) {
                    options.push(term);
                }
            }
            return options;
        };

        const termOptions = generateTermOptions();

        return {
            name: productList.name || "상품명 정보 없음",
            description: productList.description || "상품 설명 정보 없음",
            tags: [productList.category] || ["예금"],
            baseRate: productList.rate || "0.0%",
            extraRate: "+0.00%p",
            minAmount: minAmount,
            maxAmount: maxAmount,
            minMonths: minMonths,
            maxMonths: maxMonths,
            termOptions: termOptions,
            summary: {
                code: productList.id || "N/A",
                limit: `${minAmount.toLocaleString()}원 ~ ${maxAmount.toLocaleString()}원`,
                taxRate: "15.4%",
                type: productList.paymentType || "정기예금"
            },
            rateInfo: [
                { term: "3개월", base: (parseFloat(productList.rate) - 0.3).toFixed(2) + '%', max: (parseFloat(productList.rate) - 0.3).toFixed(2) + '%' },
                { term: "6개월", base: (parseFloat(productList.rate) - 0.2).toFixed(2) + '%', max: (parseFloat(productList.rate) - 0.2).toFixed(2) + '%' },
                { term: "12개월", base: productList.rate, max: productList.rate },
                { term: "24개월", base: (parseFloat(productList.rate) + 0.2).toFixed(2) + '%', max: (parseFloat(productList.rate) + 0.2).toFixed(2) + '%' },
                { term: "36개월", base: (parseFloat(productList.rate) + 0.4).toFixed(2) + '%', max: (parseFloat(productList.rate) + 0.4).toFixed(2) + '%' },
            ],
            faqs: [
                { q: "중도해지 시 금리는 어떻게 적용되나요?", a: "가입 상품의 약관을 확인해주세요." },
                { q: "비대면으로도 가입 가능한가요?", a: "네, 모바일 앱을 통해 가입 가능합니다." },
            ]
        };
    }, [productList]);

    const handleAmountChange = (newAmount) => {
        if (!formattedProduct) return;
        
        const minAmt = formattedProduct.minAmount;
        const maxAmt = formattedProduct.maxAmount;
        
        if (newAmount < minAmt) {
            setAmount(minAmt);
        } else if (newAmount > maxAmt) {
            setAmount(maxAmt);
        } else {
            setAmount(newAmount);
        }
    };

    const formatWon = (n) => n.toLocaleString('ko-KR');

    const calculatedResult = useMemo(() => {
        if (!formattedProduct) return { interest: 0, tax: 0, afterTaxAmount: 0, total: amount };

        const principal = amount;
        const rateObject = formattedProduct.rateInfo.find(r => r.term === `${term}개월`);
        const interestRate = rateObject ? parseFloat(rateObject.base) / 100 : 0;

        const interest = Math.floor(principal * interestRate * (term / 12));
        const tax = Math.floor(interest * 0.154);
        const afterTaxAmount = interest - tax;
        const total = principal + afterTaxAmount;

        return { interest, tax, afterTaxAmount, total };
    }, [amount, term, formattedProduct]);

    // ✅ 서명 모달 열기
    const handleSignPdf = () => {
        setIsModalOpen(true);
    };

    // ✅ 서명 데이터 저장 핸들러 수정
    const handleSaveSignature = (data) => {
        console.log('========================================');
        console.log('서명된 PDF 데이터 받음:', {
            // `signedPdfBlob`의 크기를 확인
            pdfSize: data.signedPdfBlob.size,
            date: data.signatureDate,
            pdfPath: data.templatePdfPath
        });
        console.log('========================================');
        
        setSignatureData(data);
        setIsSigned(true);
    };

    // ✅ 예금 가입 처리 함수 수정
    const handleSubscription = async () => {
        // (입력값 검증 로직은 기존과 동일)
        if (!isConfirmed) { alert('상품설명서 및 약관에 동의해주세요.'); return; }
        if (!isSigned || !signatureData) { alert('약관 확인 및 서명을 먼저 진행해주세요.'); return; }
        if (!linkedAccount) { alert('출금 계좌를 선택해주세요.'); return; }
        if (!depositAccount) { alert('입금 계좌를 입력해주세요.'); return; }
        if (!pin || pin.length !== 6) { alert('계좌 비밀번호 6자리를 입력해주세요.'); return; }

        try {
            const formData = new FormData();

            const subscriptionRequest = {
                productName: formattedProduct.name,
                amount: amount,
                period: term,
                linkedAccount: linkedAccount,
                depositAccount: depositAccount,
                pin: pin,
                signatureDate: signatureData.signatureDate,
                templatePdfPath: signatureData.templatePdfPath,
                agreements: aggreement
            };

            const jsonBlob = new Blob([JSON.stringify(subscriptionRequest)], { type: 'application/json' });
            formData.append('subscriptionRequest', jsonBlob);

            // ✅ 핵심: 서명된 PDF Blob과 파일명을 .pdf로 변경하여 추가
            formData.append(
                'signedPdf', 
                signatureData.signedPdfBlob, // 이미지 Blob 대신 PDF Blob을 사용
                `subscription-${signatureData.timestamp}.pdf` // 확장자를 .pdf로 변경
            );

            console.log('FormData 생성 완료. 서버로 전송합니다.');
            
            const result = await depositSave(formData);

            console.log('가입 성공:', result);
            alert('예금 가입이 완료되었습니다!');
            // navigate('/deposit/success', { state: { result } });
            
        } catch (error) {
            console.error('예금 가입 실패:', error);
            alert('가입 처리 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDepositAccountChange = (e) => {
        setDepositAccount(e.target.value);
    };

    if (!formattedProduct) {
        return <div>로딩 중...</div>;
    }

    return (
        <div className="subscription-container">
            <header className="sub-header">
                <button className="back-button" onClick={() => navigate(-1)}>← 뒤로</button>
                <h2>{formattedProduct.name}</h2>
                <div className="sub-tags">
                    {formattedProduct.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                </div>
            </header>

            <main className="sub-main-grid">
                <div className="left-col">
                    {/* 전자 서명 섹션 */}
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

                    {/* PDF 모달 */}
                    {isModalOpen && (
                        <PdfSignatureModal
                            onClose={() => setIsModalOpen(false)}
                            onSave={handleSaveSignature}
                            href={productList.href}
                        />
                    )}

                    {/* 계좌 정보 입력 섹션 */}
                    <section className="info-section">
                        <h3>계좌 정보</h3>
                        <div className="subscription-form">
                            <div className="form-group">
                                <label htmlFor="linkedAccount">출금 계좌 *</label>
                                <select 
                                    id="linkedAccount" 
                                    value={linkedAccount} 
                                    onChange={(e) => setLinkedAccount(e.target.value)}
                                >
                                    <option value="">계좌를 선택하세요</option>
                                    {userAccounts.map(account => (
                                        <option key={account.accountNumber} value={account.accountNumber}>
                                            {account.accountName} ({account.accountNo}) - 계좌 종류 : {account.accountType}
                                        </option>
                                    ))}
                                </select>
                            </div>

                           <div className="form-group">
                                <label htmlFor="depositAccount">입금 계좌 (예금계좌 번호) *</label>
                                <input
                                    type="text"
                                    id="depositAccount"
                                    value={depositAccount}
                                    onChange={handleDepositAccountChange}
                                    placeholder="110-XXX-XXXXXX 형식으로 입력"
                                    autoComplete="off"
                                    maxLength="100"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="pin">계좌 비밀번호 *</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    maxLength="6"
                                    placeholder="숫자 6자리"
                                    autoComplete="off"
                                />
                            </div>
                        </div>
                    </section>

                    {/* 유의사항 섹션 */}
                    <section className="info-section">
                        <h3>유의사항</h3>
                        <ul className="notice-list">
                            <li>예금자보호: 이 예금은 예금자보호법에 따라 원금과 소정의 이자를 합하여 1인당 "최고 5천만원"까지 보호됩니다.</li>
                            <li>세금: 이자소득세 14% 및 지방소득세 1.4%가 원천징수됩니다.</li>
                            <li>금리: 표기된 금리는 예시이며, 시장 상황에 따라 변동될 수 있습니다.</li>
                            <li>가입한도: 최소 {formatWon(formattedProduct.minAmount)}원 ~ 최대 {formatWon(formattedProduct.maxAmount)}원</li>
                            <li>가입기간: {formattedProduct.minMonths}개월 ~ {formattedProduct.maxMonths}개월</li>
                        </ul>
                    </section>

                    {/* FAQ 섹션 */}
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
                    {/* 요약 박스 */}
                    <div className="summary-box">
                        <h4>요약</h4>
                        <div className="summary-item"><span>상품코드</span> <strong>{formattedProduct.summary.code}</strong></div>
                        <div className="summary-item"><span>가입한도</span> <strong>{formattedProduct.summary.limit}</strong></div>
                        <div className="summary-item"><span>세율(일반과세)</span> <strong>{formattedProduct.summary.taxRate}</strong></div>
                        <div className="summary-item"><span>상품유형</span> <strong>{formattedProduct.summary.type}</strong></div>
                    </div>

                    {/* 계산기 박스 */}
                    <div className="calculator-box">
                        <h4>만기 수익 계산기 (단리 예시)</h4>
                        <div className="calc-input-group">
                            <label>예치금액 (원)</label>
                            <input type="text" readOnly value={`${formatWon(amount)}원`} />
                            <input 
                                type="range" 
                                min={formattedProduct.minAmount} 
                                max={formattedProduct.maxAmount} 
                                step="100000" 
                                value={amount} 
                                onChange={(e) => handleAmountChange(Number(e.target.value))} 
                            />
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                                최소: {formatWon(formattedProduct.minAmount)}원 / 최대: {formatWon(formattedProduct.maxAmount)}원
                            </div>
                        </div>

                        <div className="calc-input-group">
                            <label>기간</label>
                            <select value={term} onChange={(e) => setTerm(Number(e.target.value))}>
                                {formattedProduct.termOptions.map(months => (
                                    <option key={months} value={months}>{months}개월</option>
                                ))}
                            </select>
                        </div>

                        <div className="calc-result">
                            <div className="result-item"><span>원금</span> <span>{formatWon(amount)}원</span></div>
                            <div className="result-item"><span>세전 이자</span> <span>{formatWon(calculatedResult.interest)}원</span></div>
                            <div className="result-item tax"><span>세금(15.4%)</span> <span>- {formatWon(calculatedResult.tax)}원</span></div>
                            <hr />
                            <div className="result-item total"><span>만기 예상 수령액(세후)</span><strong>{formatWon(calculatedResult.total)}원</strong></div>
                        </div>

                        {/* 최종 동의 및 가입 버튼 */}
                        <div className="final-actions">
                            <div className="confirm-wrapper">
                                <input 
                                    type="checkbox" 
                                    id="confirm-check" 
                                    checked={isConfirmed} 
                                    onChange={(e) => setIsConfirmed(e.target.checked)} 
                                />
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