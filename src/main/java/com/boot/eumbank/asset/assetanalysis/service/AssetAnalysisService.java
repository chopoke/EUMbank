package com.boot.eumbank.asset.assetanalysis.service;

import com.boot.eumbank.asset.assetanalysis.dto.AssetAnalysisResponse;
import com.boot.eumbank.asset.assetanalysis.dto.AssetGoalDto;
import com.boot.eumbank.asset.assetanalysis.dto.AssetGoalRequest;

/**
 * 자산 분석 서비스 인터페이스
 */
public interface AssetAnalysisService {

    /**
     * 고객의 전체 자산 분석 데이터 조회
     * 
     * @param customerNo 고객번호
     * @param period 비교 기간 (DAILY, WEEKLY, MONTHLY)
     * @param count 비교 개수 (일간: 1-10, 주간: 1-5, 월간: 1-6)
     * @param chartPeriod 차트 기간 (MINUTELY, HOURLY, DAILY, WEEKLY, MONTHLY)
     * @param chartCount 차트 개수
     * @return AssetAnalysisResponse 자산 분석 전체 응답
     */
    AssetAnalysisResponse getAssetAnalysis(Integer customerNo, String period, Integer count, String chartPeriod, Integer chartCount);

    /**
     * 자산 목표 설정 또는 수정
     * 
     * @param customerNo 고객번호
     * @param request 목표 설정 요청
     * @return 설정된 목표 정보
     */
    AssetGoalDto setGoal(Integer customerNo, AssetGoalRequest request);
}


