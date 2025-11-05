// src/pages/admin/components/ProductCatalogManagement.jsx
import { useState, useEffect } from 'react';
import {
    getDepositProducts, createDepositProduct,
    toggleDepositProductStatus
} from '../api/depositManagementApi';

import {
    getInstallmentProducts, createInstallmentProduct,
    toggleInstallmentProductStatus
} from '../api/installmentManagementApi';

import ProductFormModal from './ProductFormModal';

/**
 * 상품 전반적인 상품 목록 가져오는 부분
 * @param activeType
 * @returns {React.JSX.Element}
 * @constructor
 */

export default function ProductCatalogManagement({ activeType }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadProducts();
    }, [activeType]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            if (activeType === '예금') {
                const data = await getDepositProducts();
                setProducts(data);
            } else {
                const data = await getInstallmentProducts();
                setProducts(data);
            }
        } catch (error) {
            console.error('상품 목록 로드 실패:', error);
            alert('상품 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const toggleProductStatus = async (id) => {
        try {
            if (activeType === '예금') {
                await toggleDepositProductStatus(id);
            } else {
                await toggleInstallmentProductStatus(id);
            }

            // 로컬 상태 업데이트
            setProducts(products.map(p =>
                p.id === id ? { ...p, isActive: p.isActive === 'Y' ? 'N' : 'Y' } : p
            ));

            alert('상태가 변경되었습니다.');
        } catch (error) {
            console.error('상태 변경 실패:', error);
            alert('상태 변경에 실패했습니다.');
        }
    };

    const goToCreatePage = async () => {
        if (activeType === '예금') {
            await createInstallmentProduct();
        } else {
            await createDepositProduct();
        }
    };

    /**
     * 상품 등록하는 하는 폼 열기
     */
    const handleCreateClick = () => {
        setShowModal(true);
    };

    const handleModalSuccess = () => {
        setShowModal(false);
        loadProducts(); // 목록 새로고침
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            {/* 헤더 영역 */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {activeType} 상품 관리
                </h2>
                <button
                    onClick={handleCreateClick}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors shadow-sm"
                >
                    <i className="ri-add-line text-xl"></i>
                    <span className="font-medium">{activeType} 상품 등록</span>
                </button>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">전체 {activeType} 상품</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}개</p>
                        </div>
                        <div className={`p-3 rounded-full ${activeType === '예금' ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <i className={`ri-bank-line text-2xl ${activeType === '예금' ? 'text-red-600' : 'text-blue-600'}`}></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">판매중</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {products.filter(p => p.isActive === 'Y').length}개
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100">
                            <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">판매중지</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {products.filter(p => p.isActive === 'N').length}개
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-red-100">
                            <i className="ri-close-circle-line text-2xl text-red-600"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* 상품 테이블 */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-500">상품명</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">금리</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">금액범위</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">기간</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">상태</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-500">관리</th>
                            </tr>
                            </thead>
                            <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center space-y-3">
                                            <i className="ri-inbox-line text-4xl text-gray-400"></i>
                                            <p>등록된 {activeType} 상품이 없습니다.</p>
                                            <button
                                                onClick={goToCreatePage}
                                                className="mt-4 flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                <i className="ri-add-line"></i>
                                                <span>첫 번째 {activeType} 상품 등록하기</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4">
                                            <div>
                                                <p className="text-gray-900 font-medium">{product.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="text-blue-600 font-semibold">{product.rate}%</span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 text-sm">
                                            {product.minAmount}<br />~ {product.maxAmount}
                                        </td>
                                        <td className="py-4 px-4 text-gray-600">{product.period}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                product.isActive === 'Y'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {product.isActive === 'Y' ? '판매중' : '판매중지'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => toggleProductStatus(product.id)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        product.isActive === 'Y'
                                                            ? 'text-yellow-600 hover:bg-yellow-50'
                                                            : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                                    title={product.isActive === 'Y' ? '판매중지' : '판매시작'}
                                                >
                                                    <i className={`ri-${product.isActive === 'Y' ? 'pause' : 'play'}-circle-line text-xl`}></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 모달 */}
            {showModal && (
                <ProductFormModal
                    activeType={activeType}
                    onSuccess={handleModalSuccess}
                    onClose={handleModalClose}
                />
            )}
        </>
    );
}