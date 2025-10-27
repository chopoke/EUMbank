import api from "../../../api/axios";

/**
 * 초기 입/출금 상품 값 가져오기
 */
export async function depsoitProductList() {

    try {
        const res = await api.get("/api/productsList");
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
export async function depositSave(formData) {
    try {
        console.log("========================================");
        console.log("=== API 호출 시작 ===");
        console.log("========================================");

        // FormData 내용 상세 출력
        console.log("📦 FormData 내용:");
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`  ${key}:`, {
                    name: value.name,
                    size: value.size,
                    type: value.type,
                    lastModified: new Date(value.lastModified).toISOString()
                });
            } else if (value instanceof Blob) {
                console.log(`  ${key}:`, {
                    size: value.size,
                    type: value.type
                });
                // Blob 내용 읽기 (JSON인 경우)
                if (value.type === 'application/json') {
                    const text = await value.text();
                    console.log(`    내용:`, JSON.parse(text));
                }
            } else {
                console.log(`  ${key}:`, value);
            }
        }

        console.log("========================================");
        console.log("📡 요청 URL:", "/api/depositproductsave");
        console.log("========================================");

        const res = await api.post("/api/depositproductsave", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // 파일 업로드 진행 상황 추적
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                console.log(`📤 업로드 진행률: ${percentCompleted}%`);
            }
        });

        console.log("========================================");
        console.log("✅ API 호출 성공");
        console.log("========================================");
        console.log("📥 응답 데이터:", res.data);
        console.log("📥 응답 상태:", res.status);
        console.log("========================================");

        return res.data;

    } catch (error) {
        console.error("========================================");
        console.error("❌ API 호출 실패");
        console.error("========================================");
        console.error("예금 가입 처리 중 오류:", error);

        if (error.response) {
            // 서버가 응답을 반환한 경우
            console.error("📛 응답 상태:", error.response.status);
            console.error("📛 응답 헤더:", error.response.headers);
            console.error("📛 응답 데이터:", error.response.data);
        } else if (error.request) {
            // 요청이 전송되었지만 응답을 받지 못한 경우
            console.error("📛 요청은 전송되었으나 응답 없음");
            console.error("📛 요청 정보:", error.request);
        } else {
            // 요청 설정 중 에러가 발생한 경우
            console.error("📛 요청 설정 오류:", error.message);
        }
        console.error("========================================");

        // 에러 메시지 추출
        const errorMessage = error.response?.data?.message
            || error.response?.data
            || "예금 가입 처리 중 오류가 발생했습니다.";

        throw new Error(errorMessage);
    }
}


/**
 * 적금 관련 저장
 */

export async function savingsSave() {
    try {
        const res = await api.post("/product/savingsSave");
    } catch (error) {

    }

}