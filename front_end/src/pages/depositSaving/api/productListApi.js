import api from "../../../api/axios";

/**
 * 초기 입/출금 상품 값 가져오기
 */
export async function depsoitProductList() {

    try {
        const res = await api.get("/api/productsList");
        console.log("데이터 : " + res);
        return res.data;
    } catch (error) {
        console.error("상품 목록을 불러오는 중 오류 발생:", error);
        return [];
    }
}