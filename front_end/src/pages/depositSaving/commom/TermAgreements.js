import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { termsData } from '../data/terms';
import '../css/termAgreements.css';

/**
 * 약관 내용을 보여주는 모달 컴포넌트
 */
const TermsModal = ({ open, title, onClose, onReadComplete, clauseId, children }) => {
    const boxRef = useRef(null);

    // 스크롤 이벤트를 감지하여 끝에 도달하면 onReadComplete 콜백을 실행
    useEffect(() => {
        if (!open) return;
        const element = boxRef.current;
        if (!element) return;

        const handleScroll = () => {
            // 스크롤이 맨 아래에 도달했는지 확인 (2px 여유)
            const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 2;
            if (isAtBottom) {
                onReadComplete?.(clauseId);
            }
        };

        // 스크롤바가 없는 경우를 위한 초기 체크
        const checkScrollable = () => {
            if (element.scrollHeight <= element.clientHeight) {
                onReadComplete?.(clauseId);
            }
        }

        element.addEventListener("scroll", handleScroll);
        checkScrollable(); // 처음 열렸을 때도 체크

        return () => element.removeEventListener("scroll", handleScroll);
    }, [open, onReadComplete, clauseId]);

    if (!open) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h4>{title}</h4>
                    <button onClick={onClose} className="close-button">닫기</button>
                </div>
                <div ref={boxRef} className="modal-body">
                    <pre>{children}</pre>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose}>확인</button>
                </div>
            </div>
        </div>
    );
};


const TermsAgreement = ({ productType }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const masterCheckboxRef = useRef(null);

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
    const [openModalId, setOpenModalId] = useState(null);

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

        // 선택한 상품에 대한 정보이어서 가져오기
        const product = location.state?.productData;

        console.log(product);

        const agreementStatus = Object.entries(agreements).reduce((acc, [id, value]) => {
            acc[id] = value.checked;
            return acc;
        }, {});

        const finalData = {
            ...product,
            agreements: agreementStatus
        };

        const finalDataJSON = JSON.stringify(finalData, null, 2);

        console.log("서버로 전송할 최종 데이터 객체:", finalData);

        console.log("서버로 전송할 최종 JSON 데이터:", finalDataJSON);
        const result = product.id.split('-')[0];
        navigate("/" + result + "/final", { state: { productData: product } });

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
                <TermsModal
                    key={`modal-${clause.id}`}
                    open={openModalId === clause.id}
                    title={clause.text}
                    onClose={() => setOpenModalId(null)}
                    onReadComplete={handleReadComplete}
                    clauseId={clause.id}
                >
                    {terms.details}
                </TermsModal>
            ))}
        </div>
    );
};

export default TermsAgreement;