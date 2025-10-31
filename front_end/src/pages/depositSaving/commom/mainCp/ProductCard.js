// 체크 아이콘 SVG
const CheckIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginRight: '8px', color: '#28a745' }}
    >
        <path
            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            fill="currentColor"
        />
    </svg>
);

const ProductCard = ({ product, onProductClick }) => {

    /**
         * ✅ 금액 문자열을 포맷팅하는 헬퍼 함수
         * 예: "최소금액: 50000000.00원" -> "최소금액: 50,000,000원"
         */
    const formatMinAmount = (amountStr) => {
        if (!amountStr) return ""; // amountStr이 없을 경우 빈 문자열 반환

        // 정규 표현식으로 문자열에서 숫자 부분(소수점 포함)을 찾습니다.
        const numberMatch = amountStr.match(/[\d.]+/);

        // 숫자 부분을 찾지 못하면 원본 문자열을 그대로 반환합니다.
        if (!numberMatch) return amountStr;

        const numericPart = numberMatch[0]; // "50000000.00"

        // 1. 소수점을 버리고 정수로 변환합니다.
        const integerValue = Math.floor(parseFloat(numericPart));

        // 2. 천 단위 쉼표를 추가합니다.
        const formattedNumber = integerValue.toLocaleString('ko-KR'); // "50,000,000"

        // 3. 원래 문자열의 숫자 부분을 포맷팅된 숫자로 교체합니다.
        return amountStr.replace(numericPart, formattedNumber);
    };

    const handleClick = () => {
        // onProductClick 함수가 존재하면, product.id를 인자로 넣어 호출
        if (onProductClick) {
            onProductClick(product);
        }
    };

    const featureList = product.feature && typeof product.feature === 'string'
        ? product.feature.replace(/^"|"$/g, '').split('", "')
        : [];

    return (
        <div className="product-card">
            <div className="card-content">
                <h3>{product.name}</h3>
                <p className="interest-rate">{product.rate}</p>
                <p className="rate-label">연이율</p>
                <p className="min-amount">{formatMinAmount(product.minAmount)}</p>
                <ul className="features">
                    {featureList.slice(0, 3).map((feature, index) => (
                        <li key={index}>
                            <CheckIcon />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
            {/* <a href={product.href}> */}
                <button className="action-button" onClick={handleClick}>{product.buttonText}</button>
            {/* </a> */}
        </div>
    );
};

export default ProductCard;