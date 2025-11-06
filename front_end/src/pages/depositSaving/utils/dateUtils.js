/**
 * 오늘 날짜 문자열 (YYYY-MM-DD 형식)
 */
export const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * 날짜 문자열에서 일(day) 추출
 */
export const getDayFromDateString = (dateStr) => {
    return dateStr;
};

/**
 * 날짜 포맷팅 함수 (한국어)
 */
export const formatDateKorean = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
};

/**
 * 주말 체크 함수
 */
export const isWeekend = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0 = 일요일, 6 = 토요일
    return dayOfWeek === 0 || dayOfWeek === 6;
};

/**
 * 요일 이름 가져오기
 */
export const getDayOfWeekName = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return days[date.getDay()];
};