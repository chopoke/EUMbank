import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { termsData } from '../data/terms';
import AggreementCard from '../commom/termAgreementCp/AggreementCard';
import '../css/termAgreements.css';

import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

const TermsAgreement = ({ productType }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const masterCheckboxRef = useRef(null);
    const [product, setProduct] = useState(null);
    const [openModalId, setOpenModalId] = useState(null);

    // 대칭키 DES 방식으로 암호화해서 넘기기 sessionStorage에서 데이터를 가져옵니다.
    useEffect(() => {
        const encrypted = sessionStorage.getItem('product');
    
        if (encrypted) {
            const decrypted = CryptoJS.DES.decrypt(encrypted, SECRET_KEY);
            const product = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
            setProduct(product);
        }
        
    }, [location.state, navigate]); // 의존성 배열에 location.state와 navigate를 추가

    const terms = termsData[productType];

    // 각 약관의 동의(checked) 및 읽음(hasRead) 상태를 함께 관리
    const [agreements, setAgreements] = useState(() => {
        const initialState = {};
        terms.clauses.forEach(clause => {
            initialState[clause.id] = {
                checked: false,
                hasRead: !clause.required, // 필수 항목이 아니면 처음부터 읽은 것으로 간주
            };
        });
        return initialState;
    });

    // 어떤 약관 모달이 열렸는지 관리
    const requiredClauses = terms.clauses.filter(c => c.required);
    const isAllRequiredAgreed = requiredClauses.every(c => agreements[c.id].checked);

    // 개별 체크박스 핸들러
    const handleCheckboxChange = (id) => {
        setAgreements(prev => ({
            ...prev,
            [id]: { ...prev[id], checked: !prev[id].checked }
        }));
    };

    // 약관을 다 읽었을 때 호출되는 콜백
    const handleReadComplete = useCallback((id) => {
        setAgreements(prev => ({
            ...prev,
            [id]: { ...prev[id], hasRead: true }
        }));
    }, []);

    // 전체 동의 로직
    const checkedCount = Object.values(agreements).filter(v => v.checked).length;
    const allChecked = checkedCount === terms.clauses.length;
    const someChecked = checkedCount > 0 && !allChecked;

    useEffect(() => {
        if (masterCheckboxRef.current) {
            masterCheckboxRef.current.indeterminate = someChecked;
        }
    }, [someChecked]);

    const handleAgreeAll = (e) => {
        const isChecked = e.target.checked;
        const newAgreements = { ...agreements };
        terms.clauses.forEach(clause => {
            // 필수 약관은 읽었을 경우에만, 선택 약관은 항상 상태 변경
            if (agreements[clause.id].hasRead || !clause.required) {
                newAgreements[clause.id].checked = isChecked;
            }
        });
        setAgreements(newAgreements);
    };

    const handleBack = () => navigate("/depositSavingProductList/open");
    const handleGoToJoin = () => {

        // 약관 동으 데이터 담기
        const agreementStatus = Object.entries(agreements).reduce((acc, [id, value]) => { acc[id] = value.checked; return acc;}, {});

        navigate("/" + product.href.split('/')[1] + "/form", { state: { productData: product, agreements: agreementStatus } });
    };

    return (
        <div className="containerdepart">
            <button className="back-button" onClick={handleBack}>← 뒤로가기</button>
            <div className="terms-box modern">
                <h2>{terms.title}</h2>
                <div className="agreement-list modern">
                    {/* 전체 동의 */}
                    <label className="agreement-item all-agree">
                        <input
                            ref={masterCheckboxRef}
                            type="checkbox"
                            checked={allChecked}
                            onChange={handleAgreeAll}
                        />
                        <div>
                            <div className="font-medium">전체 동의</div>
                            <div className="description">선택 항목 포함 전체 약관에 동의합니다.</div>
                        </div>
                    </label>

                    {/* 개별 약관 리스트 */}
                    {terms.clauses.map((clause) => {
                        const { checked, hasRead } = agreements[clause.id];
                        const isRequired = clause.required;

                        return (
                            <div key={clause.id} className="agreement-item-wrapper">
                                <label className="agreement-item">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handleCheckboxChange(clause.id)}
                                        disabled={isRequired && !hasRead}
                                    />
                                    <div className="text-content">
                                        <div className="font-medium">
                                            {clause.text}
                                            {isRequired ? (
                                                hasRead ? <span className="status-badge read">읽음 확인</span> : <span className="status-badge">원문 읽기 필요</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setOpenModalId(clause.id)}
                                    className="view-button"
                                >
                                    원문 보기
                                </button>
                            </div>
                        );
                    })}
                </div>

                <button className="submit-button" onClick={handleGoToJoin} disabled={!isAllRequiredAgreed}>
                    동의하고 계속하기
                </button>
            </div>

            {/* 약관 상세 모달 */}
            {terms.clauses.map((clause) => (
                <AggreementCard
                    key={`modal-${clause.id}`}
                    open={openModalId === clause.id}
                    title={clause.text}
                    onClose={() => setOpenModalId(null)}
                    onReadComplete={handleReadComplete}
                    clauseId={clause.id}
                >
                    {terms.details}
                </AggreementCard>
            ))}
        </div>
    );
};

export default TermsAgreement;