import api from './axios';

/**
 * 자산 분석 API 호출
 */

/**
 * 자산 분석 전체 데이터 조회
 * @param {string} period - 비교 기간 (DAILY, WEEKLY, MONTHLY) - 기본값: WEEKLY
 * @param {number} count - 비교 개수 (일간: 1-10, 주간: 1-5, 월간: 1-6) - 기본값: period별 기본값
 * @returns {Promise} AssetAnalysisResponse
 */
export const getAssetAnalysis = async (period = 'WEEKLY', count = null) => {
  try {
    const params = { period };
    if (count !== null) {
      params.count = count;
    }
    const response = await api.get('/api/asset/analysis', { params });
    return response.data;
  } catch (error) {
    console.error('자산 분석 조회 실패:', error);
    throw error;
  }
};

/**
 * 자산 목표 설정/수정
 * @param {Object} goalData - {targetAmount: number, targetDate?: string}
 * @returns {Promise} AssetGoalDto
 */
export const setAssetGoal = async (goalData) => {
  try {
    const response = await api.post('/api/asset/goal', goalData);
    return response.data;
  } catch (error) {
    console.error('자산 목표 설정 실패:', error);
    throw error;
  }
};

/**
 * 월별 리포트 조회
 * @param {number} year - 조회할 연도
 * @param {number} month - 조회할 월 (1-12)
 * @returns {Promise} AssetReportResponse
 */
export const getMonthlyReport = async (year, month) => {
  try {
    const response = await api.get('/api/asset/report', {
      params: { year, month }
    });
    return response.data;
  } catch (error) {
    console.error('월별 리포트 조회 실패:', error);
    throw error;
  }
};

/**
 * 일별 상세 거래 내역 조회
 * @param {string} date - 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns {Promise} DailyTransactionResponse
 */
export const getDailyTransactions = async (date) => {
  try {
    const response = await api.get('/api/asset/report/daily', {
      params: { date }
    });
    return response.data;
  } catch (error) {
    console.error('일별 거래 상세 조회 실패:', error);
    throw error;
  }
};


