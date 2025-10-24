import apiConfig from "../config/appConfig";

/**
 * 초기 입/출금 상품 값 가져오기
 */
export async function depsoitProductList() {
    try {
        const res = await apiConfig.get("/deposit/productsList");

        console.log("데이터 : " + res.data);

        return res.data;
    } catch (error) {
        console.error("상품 목록을 불러오는 중 오류 발생:", error);
        return [];
    }
}

/**
 * 예금 관련 저장
 */

export async function depositSave() {
    try {
        const res = await apiConfig.post("/deposit/depositSave");
    } catch (error) {

    }

}


/**
 * 적금 관련 저장
 */

export async function savingsSave() {
    try {
        const res = await apiConfig.post("/deposit/savingsSave");
    } catch (error) {

    }

}