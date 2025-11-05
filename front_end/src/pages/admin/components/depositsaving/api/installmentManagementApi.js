// src/api/installmentManagementApi.js
import api from '../../../../../api/axios';

/**
 * 가입한 적금 목록 조회
 */
export async function getMyInstallments(cNo) {
    try {
        const response = await api.get(`/api/installment-management/my-installments/${cNo}`);
        return response.data;
    } catch (error) {
        console.error("적금 목록 조회 실패:", error);
        throw error;
    }
}

/**
 * 적금 상태 변경
 */
export async function changeInstallmentStatus(iNo, status) {
    try {
        await api.put(`/api/installment-management/installments/${iNo}/status`, { status });
    } catch (error) {
        console.error("적금 상태 변경 실패:", error);
        throw error;
    }
}

/**
 * 적금 삭제
 */
export async function deleteInstallment(iNo) {
    try {
        await api.delete(`/api/installment-management/installments/${iNo}`);
    } catch (error) {
        console.error("적금 삭제 실패:", error);
        throw error;
    }
}

/**
 * 적금 상품 목록 조회 (관리자용)
 */
export async function getInstallmentProducts() {
    try {
        const response = await api.get('/api/installment-management/products');

        console.log("API Response:", response.data);

        return response.data;
    } catch (error) {
        console.error("적금 상품 목록 조회 실패:", error);
        throw error;
    }
}

/**
 * 적금 상품 활성화/비활성화
 */
export async function toggleInstallmentProductStatus(ipNo) {
    try {
        await api.put(`/api/installment-management/products/${ipNo}/toggle-status`);
    } catch (error) {
        console.error("적금 상품 상태 변경 실패:", error);
        throw error;
    }
}

/**
 * 예금 등록
 */
export async function createInstallmentProduct(productData) {
    try {
        await api.post(`/api/installment-management/register`, productData);
    } catch (error) {
        console.error("예금 상품 상태 변경 실패:", error);
        throw error;
    }
}