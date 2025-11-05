// src/pages/admin/DepositManagement.jsx
import { useState } from 'react';
import ProductTypeToggle from '../depositsaving/components/ProductTypeToggle';
import MyProductsManagement from './components/MyProductsManagement';
import ProductCatalogManagement from './components/ProductCatalogManagement';

export default function DepositManagement() {
    const [mainTab, setMainTab] = useState('subscribed');
    const [activeType, setActiveType] = useState('예금');

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">예금/적금 관리</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {mainTab === 'subscribed' ? '가입 상품을 관리하세요' : '상품을 등록하고 관리하세요'}
                    </p>
                </div>
            </div>

            {/* 메인 탭 */}
            <div className="bg-white rounded-lg shadow-sm p-2">
                <div className="flex space-x-2">
                    <button
                        onClick={() => setMainTab('subscribed')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            mainTab === 'subscribed'
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <i className="ri-user-line mr-2"></i>
                        가입 상품 관리
                    </button>
                    <button
                        onClick={() => setMainTab('products')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                            mainTab === 'products'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <i className="ri-shopping-bag-line mr-2"></i>
                        상품 관리
                    </button>
                </div>
            </div>

            {/* 예금/적금 토글 */}
            <div className="flex justify-center bg-white rounded-lg shadow-sm p-6">
                <ProductTypeToggle
                    activeType={activeType}
                    onToggle={setActiveType}
                />
            </div>

            {/* 탭별 컨텐츠 */}
            {mainTab === 'subscribed' ? (
                <MyProductsManagement activeType={activeType} />
            ) : (
                <ProductCatalogManagement activeType={activeType} />
            )}
        </div>
    );
}