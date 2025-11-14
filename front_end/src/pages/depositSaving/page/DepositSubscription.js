import { useState, useMemo, useEffect } from 'react';
import '../css/subscription.css';
import { useLocation, useNavigate } from 'react-router-dom';
import PdfSignatureModal from '../commom/pdfCp/PdfSignatureModal';
import { getAccountList } from '../api/accountApi';
import { depositSave } from '../api/depositApi';
import { formatProductData } from '../utils/formatProductData';
import SignatureSection from '../commom/depositSubCp/SignatureSection';
import { calculateMaturityAmount} from "../utils/depositCalculator";
import AccountInfoSection from '../commom/depositSubCp/AccountInfoSection';
import NoticeSection from '../commom/depositSubCp/NoticeSection';
import FAQSection from '../commom/depositSubCp/FAQSection';
import SummaryBox from '../commom/depositSubCp/SummaryBox';
import CalculatorBox from '../commom/depositSubCp/CalculatorBox';

const DepositSubscription = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [productList, setProductList] = useState();
    const [aggreement, setAggreement] = useState();
    const [amount, setAmount] = useState(10000000);
    const [term, setTerm] = useState(null);
    const [linkedAccount, setLinkedAccount] = useState('');
    const [depositAccount, setDepositAccount] = useState('');
    const [pin, setPin] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [paymentStartDate, setPaymentStartDate] = useState('');

    // 전자서명 관련
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSigned, setIsSigned] = useState(false);
    const [signatureData, setSignatureData] = useState(null);
    const [userAccounts, setUserAccounts] = useState([]);

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

    const fetchUserAccounts = async () => {
        try {
            const accountsData = await getAccountList();
            setUserAccounts(accountsData);
        } catch (error) {
            console.error('계좌 목록 조회 실패:', error);
            alert('계좌 정보를 불러오는데 실패했습니다.');
        }
    };

    const formattedProduct = useMemo(() => {
        return formatProductData(productList);
    }, [productList]);

    // formattedProduct가 로드되면 자동으로 첫 번째 term 설정
    useEffect(() => {
        if (formattedProduct?.termOptions?.length > 0 && term === null) {
            setTerm(formattedProduct.termOptions[0]);
            console.log('초기 term 설정:', formattedProduct.termOptions[0]);
        }
    }, [formattedProduct, term]);

    const handleSignPdf = () => {
        setIsModalOpen(true);
    };

    const handleSaveSignature = (data) => {
        console.log('========================================');
        console.log('서명된 PDF 데이터 받음:', {
            pdfSize: data.signedPdfBlob.size,
            signatureDate: data.signatureDate,
            templatePdfPath: data.templatePdfPath,
            timestamp: data.timestamp
        });
        console.log('========================================');

        setSignatureData(data);
        setIsSigned(true);
    };

    const handleSubscription = async () => {
        if (!isConfirmed) { alert('상품설명서 및 약관에 동의해주세요.'); return; }
        if (!isSigned || !signatureData) { alert('약관 확인 및 서명을 먼저 진행해주세요.'); return; }
        if (!linkedAccount) { alert('출금 계좌를 선택해주세요.'); return; }
        if (!depositAccount) { alert('입금 계좌를 입력해주세요.'); return; }
        if (!pin || pin.length !== 6) { alert('계좌 비밀번호 6자리를 입력해주세요.'); return; }

        try {
            // 만기 예상 수령액 계산
            const calculatedResult = calculateMaturityAmount(amount, term, formattedProduct.rateInfo);
            const expectedMaturityAmount = calculatedResult.total;

            const formData = new FormData();

            const subscriptionRequest = {
                dpNo: productList.no,
                productName: formattedProduct.name,
                amount: amount,
                period: term,
                linkedAccountAno: linkedAccount.ano,
                linkedAccount: linkedAccount.accountNumber ,
                depositAccount: depositAccount,
                pin: pin,
                expectedMaturityAmount: expectedMaturityAmount,
                signatureDate: signatureData.signatureDate,
                templatePdfPath: signatureData.templatePdfPath,
                agreements: JSON.stringify(aggreement)
            };

            const jsonBlob = new Blob([JSON.stringify(subscriptionRequest)], { type: 'application/json' });
            formData.append('subscriptionRequest', jsonBlob);

            formData.append(
                'signedPdf',
                signatureData.signedPdfBlob,
                `subscription-${signatureData.timestamp}.pdf`
            );

            console.log('FormData 생성 완료. 서버로 전송합니다.');

            const result = await depositSave(formData);

            console.log('가입 성공:', result);
            alert('예금 가입이 완료되었습니다!');
            navigate('/depositSavingProductList/open', { state: { result } });

        } catch (error) {
            console.error('예금 가입 실패:', error);
            alert('가입 처리 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
        }
    };

    if (!formattedProduct || term === null) {
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
                    <SignatureSection
                        onSignClick={handleSignPdf}
                        isSigned={isSigned}
                    />

                    {/* PDF 모달 */}
                    {isModalOpen && (
                        <PdfSignatureModal
                            onClose={() => setIsModalOpen(false)}
                            onSave={handleSaveSignature}
                            href={productList.href}
                        />
                    )}

                    {/* 계좌 정보 입력 섹션 */}
                    <AccountInfoSection
                        linkedAccount={linkedAccount}
                        setLinkedAccount={setLinkedAccount}
                        depositAccount={depositAccount}
                        setDepositAccount={setDepositAccount}
                        pin={pin}
                        setPin={setPin}
                        userAccounts={userAccounts}
                    />

                    {/* 유의사항 섹션 */}
                    <NoticeSection formattedProduct={formattedProduct} />

                    {/* FAQ 섹션 */}
                    <FAQSection faqs={formattedProduct.faqs} />
                </div>

                <aside className="right-col">
                    {/* 요약 박스 */}
                    <SummaryBox summary={formattedProduct.summary} />

                    {/* 계산기 박스 */}
                    <CalculatorBox
                        type={'deposit'}
                        amount={amount}
                        setAmount={setAmount}
                        term={term}
                        setTerm={setTerm}
                        formattedProduct={formattedProduct}
                        isConfirmed={isConfirmed}
                        setIsConfirmed={setIsConfirmed}
                        onSubscribe={handleSubscription}
                    />
                </aside>
            </main>
        </div>
    );
};

export default DepositSubscription;