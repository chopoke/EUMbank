package com.boot.eumbank.spot.admin.service;

import com.boot.eumbank.spot.admin.dto.SpotAdminStatisticsDTO;
import com.boot.eumbank.spot.admin.dto.SpotUserHoldingsDTO;

/**
 * 현물 관리자 서비스 인터페이스
 * 관리자 대시보드에서 사용할 현물 통계 데이터 제공
 */
public interface SpotAdminService {
    
    /**
     * 현물 통계 데이터 조회
     * @return 현물 관련 전체 통계
     */
    SpotAdminStatisticsDTO getSpotStatistics();

    /**
     * 고객별 현물 보유량 목록
     */
    java.util.List<SpotUserHoldingsDTO> getUserHoldings();
}

