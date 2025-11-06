import api from "../../../api/axios";

/**
 * chatGpt
 * 챗봇용 API 호출
 *
 * @param {Object} params - 챗봇 요청 파라미터
 * @param {string} params.message - 사용자 메시지
 * @param {Array} params.history - 대화 이력 (선택적)
 * @param {string} params.sessionId - 세션 ID (선택적)
 * @returns {Promise<Object>} 챗봇 응답 { reply, timestamp, status }
 */
export async function chatGpt(params) {
    try {
        const { message, history = [], sessionId } = params;

        const response = await api.post("/api/chat/geminiChat", {
            message,
            history,
            sessionId
        });

        return response.data;
    } catch (error) {
        console.error("챗봇 응답을 불러오는 중 오류가 발생했습니다:", error);

        // 에러 응답 반환
        return {
            reply: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            timestamp: new Date().toISOString(),
            status: "error",
            errorMessage: error.message
        };
    }
}