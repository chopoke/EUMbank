import { useState, useMemo, useEffect } from 'react';
import '../css/subscription.css';
import { useLocation, useNavigate } from 'react-router-dom';
import PdfSignatureModal from '../commom/pdfCp/PdfSignatureModal';
import { getAccountList } from '../api/accountApi';
import { savingsSave } from '../api/savingApi';
import { formatProductData } from '../utils/formatProductData';
import { getDayFromDateString } from '../utils/dateUtils';
import SignatureSection from '../commom/depositSubCp/SignatureSection';
import SavingAccountInfoSection from '../commom/savingCp/SavingAccountInfoSection';
import NoticeSection from '../commom/depositSubCp/NoticeSection.jsx';
import FAQSection from '../commom/depositSubCp/FAQSection.jsx';
import SummaryBox from '../commom/depositSubCp/SummaryBox';
import CalculatorBox from '../commom/depositSubCp/CalculatorBox';

const SavingSubscription = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [productList, setProductList] = useState();
    const [aggreement, setAggreement] = useState();
    const [amount, setAmount] = useState(10000000);
    const [term, setTerm] = useState(12);
    const [linkedAccount, setLinkedAccount] = useState('');
    const [savingAccount, setSavingAccount] = useState('');
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

    const handleSignPdf = () => {
        setIsModalOpen(true);
    };

    const handleSaveSignature = (data) => {
        console.log('========================================');
        console.log('서명된 PDF 데이터 받음:', {
            pdfSize: data.signedPdfBlob.size,
            date: data.signatureDate,
            pdfPath: data.templatePdfPath
        });
        console.log('========================================');
        
        setSignatureData(data);
        setIsSigned(true);
    };

    const handleSubscription = async () => {
        if (!isConfirmed) { alert('상품설명서 및 약관에 동의해주세요.'); return; }
        if (!isSigned || !signatureData) { alert('약관 확인 및 서명을 먼저 진행해주세요.'); return; }
        if (!linkedAccount) { alert('출금 계좌를 선택해주세요.'); return; }
        if (!savingAccount) { alert('입금 계좌를 입력해주세요.'); return; }
        if (!pin || pin.length !== 6) { alert('계좌 비밀번호 6자리를 입력해주세요.'); return; }
        if (!paymentStartDate) { alert('첫 납입일을 선택해주세요.'); return; }

        try {
            const formData = new FormData();

            const subscriptionRequest = {
                ipNo: productList.no,
                productName: formattedProduct.name,
                amount: amount,
                period: term,
                linkedAccount: linkedAccount,
                savingAccount: savingAccount,
                pin: pin,
                payDay: getDayFromDateString(paymentStartDate),
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

            const result = await savingsSave(formData);

            console.log('가입 성공:', result);
            alert('적금 가입이 완료되었습니다!');
            navigate('/depositSavingProductList/open', { state: { result } });
            
        } catch (error) {
            console.error('적금 가입 실패:', error);
            alert('가입 처리 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
        }
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

                    {/* 계좌 정보 입력 섹션 (적금 전용) */}
                    <SavingAccountInfoSection
                        linkedAccount={linkedAccount}
                        setLinkedAccount={setLinkedAccount}
                        savingAccount={savingAccount}
                        setSavingAccount={setSavingAccount}
                        pin={pin}
                        setPin={setPin}
                        userAccounts={userAccounts}
                        paymentStartDate={paymentStartDate}
                        setPaymentStartDate={setPaymentStartDate}
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

export default SavingSubscription;