package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.loan.dto.apply.LoanConsentViewDTO;
import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsResponseDTO;
import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsRequestDTO;
import com.boot.eumbank.loan.entity.LoanConsent;

import java.util.List;

public interface LoanConsentService {

    /**
     * 약관 테이블 저장하기
     * @param req 요청dto
     * @param laNo 신청번호(null)
     * @param cNo 고객번호
     * @return  반환
     */
    LoanSaveConsentsResponseDTO saveConsents(LoanSaveConsentsRequestDTO req, Long laNo, Integer cNo);

    // 신청번호용 laNo로 조회
    List<LoanConsent> getConsentsByLaNo(Long laNo);

    // 신청 생성 시, 해당 고객이 바로 전에 동의했던(consent.laNo=null) 약관들을 이 신청 laNo에 귀속
    void attachConsentsToApplication(Integer customerNo, Long laNo);

    // 프론트에 전달해서 다운로드 지원하기
//    List<LoanConsentViewDTO> getConsentsByLaId(String laId);
}
