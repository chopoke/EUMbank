import React, { useState, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import '../css/depositSavingProductList.css';

// --- 데이터 정의 (기존과 동일) ---
// ... (예금, 적금, 대출, 외환 상품 데이터는 여기에 그대로 복사) ...
// 난수 5자리를 생성하는 헬퍼 함수
const generateRandomNumber = () => Math.floor(10000 + Math.random() * 90000);
const depositProducts = [{ id: 'deposit-1', name: '고수익 예금', rate: '0.02%', minAmount: '최소 금액: 0원', features: ['월 관리수수료 없음', '편리한 온라인 이체', '모바일로 바로 입금', '24시간 고객지원'], buttonText: '계좌 개설', href: '/deposit/open/deposit-1', type: `D${generateRandomNumber()}` }, { id: 'deposit-2', name: '프리미엄 예금', rate: '0.05%', minAmount: '최소 금액: 1,000만원', features: ['높은 이자율', '우선 고객 서비스', '무료 송금 서비스', '전담 상담사 배정'], buttonText: '계좌 개설', href: '/deposit/open/deposit-2', type: `D${generateRandomNumber()}` }, { id: 'deposit-3', name: '기업 예금', rate: '0.03%', minAmount: '최소 금액: 500만원', features: ['기업 특화 서비스', '다중 사용자 권한', '당좌예금 연계', '자금 관리 요구'], buttonText: '계좌 개설', href: '/deposit/open/deposit-3', type: `D${generateRandomNumber()}` },];
const installmentSavingsProducts = [{ id: 'savings-1', name: '정기적금', rate: '0.08%', minAmount: '최소 납입: 월 10만원', features: ['정기 납입', '만기시 높은 수익', '중도해지 가능', '자동이체 서비스'], buttonText: '적금 가입', href: '/savings/open/savings-1', type: `S${generateRandomNumber()}` }, { id: 'savings-2', name: '자유적금', rate: '0.06%', minAmount: '최소 납입: 월 5만원', features: ['자유로운 납입', '금액 조절 기능', '목표 설정 지원', '모바일 관리'], buttonText: '적금 가입', href: '/savings/open/savings-2', type: `S${generateRandomNumber()}` }, { id: 'savings-3', name: '청년 적금', rate: '0.10%', minAmount: '최소 납입: 월 20만원', features: ['청년 우대금리', '정부 지원 혜택', '금융 교육 제공', '미래 설계 상담'], buttonText: '적금 가입', href: '/savings/open/savings-3', type: `S${generateRandomNumber()}` },];
const foreignExchangeProducts = [{ id: 'fx-1', name: '환전 서비스', rate: '주요 통화 우대 90%', minAmount: '최소 금액 없음', features: ['온라인 환전 신청', '공항 및 지점 수령', '실시간 환율 정보', '다양한 통화 보유'], buttonText: '환전 신청', href: '/fx/open/fx-1', type: `F${generateRandomNumber()}` }, { id: 'fx-2', name: '해외 송금', rate: '송금 수수료 5,000원', minAmount: '건당 최대 $50,000', features: ['빠르고 안전한 송금', '전세계 네트워크', '모바일 간편 송금', '송금 진행상황 조회'], buttonText: '송금 하기', href: '/fx/open/fx-2', type: `F${generateRandomNumber()}` }, { id: 'fx-3', name: '외화 예금', rate: 'USD 연 1.2%', minAmount: '최소 $100', features: ['환테크에 유리', '환차익 비과세', '주요 통화 가입 가능', '자유로운 입출금'], buttonText: '계좌 개설', href: '/fx/open/fx-3', type: `F${generateRandomNumber()}` },];

// --- 컴포넌트 정의 ---
const DepositSavingProductList = () => {
    const navigate = useNavigate();

    // 변경점 1: 모든 상품을 하나의 배열로 합치고, 필터링을 위해 'category' 속성 추가
    const allProducts = useMemo(() => [
        ...depositProducts.map(p => ({ ...p, category: '예금' })),
        ...installmentSavingsProducts.map(p => ({ ...p, category: '적금' })),
        ...foreignExchangeProducts.map(p => ({ ...p, category: '외환' })),
    ], []);

    // 페이지 로드 시 한 번만 상품을 섞기 위한 useMemo
    const shuffledProducts = useMemo(() => [...allProducts].sort(() => 0.5 - Math.random()), [allProducts]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        '예금': true,
        '적금': true,
        '외환': true,
    });

    const handleFilterChange = (event) => {
        const { name, checked } = event.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: checked }));
    };

    // 변경점 2: 필터링 로직을 단일 배열 기준으로 변경
    const filteredProducts = useMemo(() => {
        return shuffledProducts
            .filter(product => filters[product.category]) // 체크박스로 선택된 카테고리 필터링
            .filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase())); // 검색어 필터링
    }, [searchTerm, filters, shuffledProducts]);

    const handleCardClick = (product) => {
        navigate(product.href, { state: { productData: product } });
    };

    return (
        <div className="containerdepart">
            <header className='headerType'>
                <h1>전체 금융 상품</h1>
                <p>다양한 금융 상품을 둘러보고 나에게 맞는 최적의 상품을 찾아보세요.</p>
            </header>

            <div className="filter-controls">
                <input
                    type="text"
                    placeholder="상품명 검색..."
                    className="depositsearch-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="checkbox-group">
                    {Object.keys(filters).map(filterName => (
                        <label key={filterName}>
                            <input
                                type="checkbox"
                                name={filterName}
                                checked={filters[filterName]}
                                onChange={handleFilterChange}
                            />
                            {filterName}
                        </label>
                    ))}
                </div>
            </div>

            <main>
                {/* 변경점 3: 단일 그리드로 모든 상품을 렌더링 (섹션 구분 없음) */}
                {filteredProducts.length > 0 ? (
                    <div className="product-grid">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onProductClick={() => handleCardClick(product)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="no-results">
                        <p>조건에 맞는 상품이 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DepositSavingProductList;