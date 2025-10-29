import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from '../commom/mainCp/ProductCard';
import { useNavigate } from 'react-router-dom';
import '../css/depositSavingProductList.css';
import { depsoitProductList } from '../api/productListApi';

import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

const Deposit = () => {
    console.log("====== 랜더링 시작 ======");
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // useMemo를 쓴 경우, 상품또는 검색한 상품의 변화가 있으면 랜더링 되도록하고 싶었습니다.(즉, 한번 랜더링)
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

    // 약관 동의 화면으로 이동
    // 이동하면서 상품 정보 : 이자율, 상품번호, 상품코드, 상품설명 다 가지고 넘어감
    const handleCardClick = (product) => {

        const encrypted = CryptoJS.DES.encrypt(
                JSON.stringify(product),
                SECRET_KEY
            ).toString();


        sessionStorage.setItem('product', encrypted);
        navigate(product.href);
    };

    // 최초 한번 DB에서 전체 상품 데이터 가져오기
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await depsoitProductList();
                setProducts(data);
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