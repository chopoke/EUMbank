import React, { useState, useMemo, useEffect } from 'react';
import ProductCard from '../commom/mainCp/ProductCard';
import { useNavigate } from 'react-router-dom';
import '../css/depositSavingProductList.css';
import { depsoitProductList } from '../api/productListApi';
import { checkUserSubscribedAccounts } from '../api/accountApi'; // 새로 추가할 API

import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.REACT_APP_SECRET_KEY;

const Deposit = () => {
    console.log("====== 랜더링 시작 ======");
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasSubscribedAccounts, setHasSubscribedAccounts] = useState(false); // 가입 계좌 존재 여부
    const [subscribedAccountIds, setSubscribedAccountIds] = useState([]); // 가입한 상품 ID 목록

    const filteredProducts = useMemo(() => {
        if (!products || products.length === 0) {
            return [];
        }

        if (!searchTerm) {
            return products;
        }

        return products.filter(product => {
            if (!product) return false;

            const name = String(product.name || '').toLowerCase();
            const description = String(product.description || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            return name.includes(search) || description.includes(search);
        });
    }, [products, searchTerm]);

    const handleCardClick = (product) => {
        const encrypted = CryptoJS.DES.encrypt(
            JSON.stringify(product),
            SECRET_KEY
        ).toString();

        sessionStorage.setItem('product', encrypted);
        navigate(product.href);
    };

    // 사용자 가입 계좌 확인
    useEffect(() => {
        const checkSubscribedAccounts = async () => {
            try {
                const response = await checkUserSubscribedAccounts();

                if (response.exists) {
                    // 계좌가 존재하면 상품 목록/메인으로

                    console.log("계좌가 한개라도 존재합니다.");
                    navigate('/depositSavingProductList/open');

                } else {
                    // 계좌가 없으면 계좌 개설 첫 단계로
                    console.log("계좌가 한개도 존재하지 않습니다.");
                    navigate('/account/open/step1');
                }
            } catch (error) {
                console.error("가입 계좌 확인 중 오류 발생:", error);
                // 에러 발생 시에도 페이지는 정상 작동하도록
                setHasSubscribedAccounts(false);
            }
        };

        checkSubscribedAccounts();
    }, []);

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
            <header className='headerType w-[1240px] h-[152px]'>
                <h1>전체 예/적금 상품</h1>
                <p>다양한 금융 상품을 둘러보고 나에게 맞는 최적의 상품을 찾아보세요.</p>
            </header>

            {/* 가입 계좌 안내 메시지 (선택사항) */}
            {hasSubscribedAccounts && (
                <div className="info-banner">
                    <p>✓ 현재 가입하신 상품이 있습니다.</p>
                </div>
            )}

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
                {filteredProducts.length > 0 ? (
                    <div className="product-grid">
                        {filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onProductClick={() => handleCardClick(product)}
                                isSubscribed={subscribedAccountIds.includes(product.id)} // 가입 여부 전달
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