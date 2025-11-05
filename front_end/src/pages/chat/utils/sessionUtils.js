// src/utils/sessionUtils.js

/**
 * UUID v4 생성
 */
export const generateSessionId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

/**
 * 세션 ID 저장
 */
export const saveSessionId = (sessionId) => {
    sessionStorage.setItem('chatbot_session_id', sessionId);
};

/**
 * 세션 ID 가져오기
 */
export const getSessionId = () => {
    let sessionId = sessionStorage.getItem('chatbot_session_id');
    if (!sessionId) {
        sessionId = generateSessionId();
        saveSessionId(sessionId);
    }
    return sessionId;
};

/**
 * 세션 초기화
 */
export const clearSession = () => {
    sessionStorage.removeItem('chatbot_session_id');
};