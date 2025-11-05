// src/api/depositManagementApi.js
import api from '../../../../../api/axios';

/**
 * 가입한 예금 목록 조회
 */
export async function getMyDeposits() {
    try {
        const response = await api.get(`/api/deposit-management/my-deposits`);
        return response.data;
    } catch (error) {
        console.error("예금 목록 조회 실패:", error);
        throw error;
    }
}

/**
 * 예금 상태 변경
 */
export async function changeDepositStatus(dNo, status) {
    try {
        await api.put(`/api/deposit-management/deposits/${dNo}/status`, { status });

    } catch (error) {
        console.error("예금 상태 변경 실패:", error);
        throw error;
    }
}

/**
 * 예금 삭제
 */
export async function deleteDeposit(dNo) {
    try {
        await api.delete(`/api/deposit-management/deposits/${dNo}`);
    } catch (error) {
        console.error("예금 삭제 실패:", error);
        throw error;
    }
}

/**
 * 예금 상품 목록 조회 (관리자용)
 */
export async function getDepositProducts() {
    try {
        const response = await api.get('/api/deposit-management/products');

        console.log("API Response:", response.data);

        return response.data;
    } catch (error) {
        console.error("예금 상품 목록 조회 실패:", error);
        throw error;
    }
}

/**
 * 예금 상품 활성화/비활성화
 */
export async function toggleDepositProductStatus(dpNo) {
    try {
        await api.put(`/api/deposit-management/products/${dpNo}/toggle-status`);
    } catch (error) {
        console.error("예금 상품 상태 변경 실패:", error);
        throw error;
    }
}

/**
 * 예금 상품 등록
 */
export async function createDepositProduct(productData) {
    try {
        const response = await api.post('/api/deposit-management/register', productData);
        return response.data;
    } catch (error) {
        console.error("예금 상품 상태 변경 실패:", error);
        throw error;
    }
}