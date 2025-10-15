import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import '../css/depositSavingProductList.css'

// 예금 상품 데이터
const depositProducts = [
    {
        id: 'deposit-1',
        name: '고수익 예금',
        rate: '0.02%',
        minAmount: '최소 금액: 0원',
        features: ['월 관리수수료 없음', '편리한 온라인 이체', '모바일로 바로 입금', '24시간 고객지원'],
        buttonText: '계좌 개설',
        href: '/deposit/open/deposit-1'
    },
    {
        id: 'deposit-2',
        name: '프리미엄 예금',
        rate: '0.05%',
        minAmount: '최소 금액: 1,000만원',
        features: ['높은 이자율', '우선 고객 서비스', '무료 송금 서비스', '전담 상담사 배정'],
        buttonText: '계좌 개설',
        href: '/deposit/open/deposit-2'
    },
    {
        id: 'deposit-3',
        name: '기업 예금',
        rate: '0.03%',
        minAmount: '최소 금액: 500만원',
        features: ['기업 특화 서비스', '다중 사용자 권한', '당좌예금 연계', '자금 관리 요구'],
        buttonText: '계좌 개설',
        href: '/deposit/open/deposit-3'
    },
];

// 적금 상품 데이터
const installmentSavingsProducts = [
    {
        id: 'savings-1',
        name: '정기적금',
        rate: '0.08%',
        minAmount: '최소 납입: 월 10만원',
        features: ['정기 납입', '만기시 높은 수익', '중도해지 가능', '자동이체 서비스'],
        buttonText: '적금 가입',
        href: '/savings/open/savings-1'
    },
    {
        id: 'savings-2',
        name: '자유적금',
        rate: '0.06%',
        minAmount: '최소 납입: 월 5만원',
        features: ['자유로운 납입', '금액 조절 기능', '목표 설정 지원', '모바일 관리'],
        buttonText: '적금 가입',
        href: '/savings/open/savings-2'
    },
    {
        id: 'savings-3',
        name: '청년 적금',
        rate: '0.10%',
        minAmount: '최소 납입: 월 20만원',
        features: ['청년 우대금리', '정부 지원 혜택', '금융 교육 제공', '미래 설계 상담'],
        buttonText: '적금 가입',
        href: '/savings/open/savings-3'
    },
];

const DepositSavingProductList = () => {
    const navigate = useNavigate();

    // 자식 컴포넌트(ProductCard)에서 호출될 콜백 함수
    const handleCardClick = (product) => {

        console.log(product);

        navigate(`/deposit/open/${product.id}`, {
            state: { productData: product }
        });
    };

    return (
        <div className="container">
            <header>
                <h1>예금 & 적금 상품</h1>
                <p>안전하고 수익성 높은 금융상품으로 여러분의 목표를 달성하세요. 모든 상품은 예금자보호법에 의해 보호됩니다.</p>
            </header>

            <main>
                <section className="product-section">
                    <h2>예금 상품</h2>
                    <div className="product-grid">
                        {depositProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onProductClick={() => handleCardClick(product)}
                            />
                        ))}
                    </div>
                </section>

                <section className="product-section">
                    <h2>적금 상품</h2>
                    <div className="product-grid">
                        {installmentSavingsProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onProductClick={() => handleCardClick(product)}
                            />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default DepositSavingProductList;