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

    const handleClick = () => {
        // onProductClick 함수가 존재하면, product.id를 인자로 넣어 호출
        if (onProductClick) {
            console.log(product);
            onProductClick(product);
        }
    };

    return (
        <div className="product-card">
            <div className="card-content">
                <h3>{product.name}</h3>
                <p className="interest-rate">{product.rate}</p>
                <p className="rate-label">연이율</p>
                <p className="min-amount">{product.minAmount}</p>
                <ul className="features">
                    {product.features.map((feature, index) => (
                        <li key={index}>
                            <CheckIcon />
                            {feature}
                        </li>
                    ))}
                </ul>
            </div>
            <a href={product.href}>
                <button className="action-button" onClick={handleClick}>{product.buttonText}</button>
            </a>
        </div>
    );
};

export default ProductCard;