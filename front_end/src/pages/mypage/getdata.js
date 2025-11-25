import axios from 'axios';

/**
 * 최고 이율 예금 상품 TOP 3 목록을 백엔드 API로부터 조회합니다.
 * @returns {Promise<Array<Object>>} 조회된 상품 목록 (ProductResponseDto 리스트)
 */
const getTop3Deposits = async () => {
    const API_URL = 'https://eumbank.co.kr/api/best3';

    try {
        console.log("TOP 3 예금 상품 데이터 호출 시작...");
        
        // API 호출
        const response = await axios.get(API_URL);
        
        console.log("TOP 3 예금 상품 데이터 호출 성공!");
        console.log(response.data);
        // 응답 데이터 (ProductResponseDto 리스트) 반환
        return response.data;
        
    } catch (error) {
        console.error("API 호출 실패:", error);
        // 오류 발생 시 빈 배열이나 null 대신 에러를 throw하여 메인 컴포넌트에서 처리하도록 합니다.
        throw new Error("최고 이율 상품 목록을 불러오는 데 실패했습니다.");
    }
};

// 함수를 default export 합니다.
export default getTop3Deposits;