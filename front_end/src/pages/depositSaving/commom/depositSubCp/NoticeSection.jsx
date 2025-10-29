import { formatWon } from '../../utils/formatUtils';

const NoticeSection = ({ formattedProduct }) => {
    return (
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
    );
};

export default NoticeSection;