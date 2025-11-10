import api from "../../../api/axios";

/**
 * 사용자의 출금 가능 계좌 목록을 조회합니다.
 * @returns {Promise<Array>} 계좌 목록 배열을 반환합니다. 실패 시 빈 배열을 반환합니다.
 */
export async function getAccountList() {
    try {
        const response = await api.get("/api/accountList");

        return response.data;

    } catch (error) {
        console.error("계좌 목록을 불러오는 중 오류가 발생했습니다:", error);
        return [];
    }
}

// 사용자가 가입한 계좌 목록 조회
export const checkUserSubscribedAccounts = async () => {
    try {
        const response = await api.get(`/api/check-exists`);

        return response.data;
    } catch (error) {
        console.error('가입 계좌 조회 실패:', error);
        throw error;
    }
};