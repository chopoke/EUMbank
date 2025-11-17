import { formatWon } from '../../utils/formatUtils';
import { calculateMaturityAmount } from '../../utils/depositCalculator';
import { useMemo } from 'react';

// 계산식 작성하는 컴포넌트

const CalculatorBox = ({
    type,
    amount, 
    setAmount, 
    term, 
    setTerm, 
    formattedProduct,
    isConfirmed,
    setIsConfirmed,
    onSubscribe
}) => {

    // console.log("amount:", amount);
    // console.log("setTerm:", setTerm);
    // console.log("setAmount:", setAmount);
    // console.log("term:", term);
    // console.log("isConfirmed:", isConfirmed);
    // console.log("setIsConfirmed:", setIsConfirmed);
    // console.log("onSubscribe:", onSubscribe);
    // console.log("formattedProduct:", formattedProduct);


    const handleAmountChange = (newAmount) => {
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

    const calculatedResult = useMemo(() => {
        return calculateMaturityAmount(amount, term, formattedProduct.rateInfo);
    }, [amount, term, formattedProduct.rateInfo]);

    return (
        <div className="calculator-box">
            <h4>만기 수익 계산기 (단리 예시)</h4>
            <div className="calc-input-group">
                <label>예치금액 (원)</label>
                <input type="text" readOnly value={`${formatWon(amount)}`} />
                <input 
                    type="range" 
                    min={formattedProduct.minAmount} 
                    max={formattedProduct.maxAmount} 
                    step="1" 
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
                {type === 'deposit' ? (
                    <div className="result-item total">
                        <span>만기 예상 수령액</span>
                        <strong>{formatWon(calculatedResult.total)}원</strong>
                    </div>
                ) : (
                    <div className="result-item total">
                        <span>만기 예상 수령액</span>
                        <strong>{formatWon(calculatedResult.total * term)}원</strong>
                    </div>
                )}
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
                <button onClick={onSubscribe} className="sub-action-button primary">
                    가입하기
                </button>
            </div>
        </div>
    );
};

export default CalculatorBox;