import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import '../css/depositSavingProductList.css';
import { depsoitProductList } from '../api/depositApi';


const Deposit = () => {
    const navigate = useNavigate();

    // 1. 받아온 상품 목록을 저장할 state 생성 (타입 적용)
    const [products, setProducts] = useState([]);

    // 페이지 로드 시 한 번만 상품을 섞기 위한 useMemo
    const shuffledProducts = useMemo(() => [...products].sort(() => 0.5 - Math.random()), [products]);

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
            // 초기 로딩 중이거나 데이터가 없으면 빈 배열 반환
            if (!products || products.length === 0) {
            return [];
            }

            // 검색어가 없으면 전체 반환
            if (!searchTerm) {
            return products;
            }

            // 안전한 필터링
            return products.filter(product => {
            // product가 null이면 제외
            if (!product) return false;

            // 각 필드를 안전하게 처리
            const name = String(product.name || '').toLowerCase();
            const description = String(product.description || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            return name.includes(search) || description.includes(search);
            });
        }, [products, searchTerm]);
    const handleCardClick = (product) => {
        
        sessionStorage.setItem('selectedProduct', JSON.stringify(product));

        navigate(product.href, { state: { productData: product } });
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await depsoitProductList();
                setProducts(data); // state에 데이터 저장
            } catch (error) {
                console.error("상품 데이터를 가져오지 못했습니다.", error);
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="containerdepart">
            {/* 헤더 */}
            <header className='headerType'>
                <h1>전체 금융 상품</h1>
                <p>다양한 금융 상품을 둘러보고 나에게 맞는 최적의 상품을 찾아보세요.</p>
            </header>

            {/* 검색대 */}
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

            {/* 상품리스트 */}
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

export default Deposit;