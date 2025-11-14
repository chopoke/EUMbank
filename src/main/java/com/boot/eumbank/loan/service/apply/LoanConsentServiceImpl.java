package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.loan.dto.apply.LoanConsentViewDTO;
import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsResponseDTO;
import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsRequestDTO;
import com.boot.eumbank.loan.entity.LoanApplication;
import com.boot.eumbank.loan.entity.LoanApplicationHistory;
import com.boot.eumbank.loan.entity.LoanConsent;
import com.boot.eumbank.loan.repository.apply.LoanApplicationRepository;
import com.boot.eumbank.loan.repository.apply.LoanConsentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j @RequiredArgsConstructor
public class LoanConsentServiceImpl implements LoanConsentService{

    private final LoanConsentRepository repo;
    private final LoanApplicationRepository appRepo;

    /**
     * 신청번호 기준 조회
     * @param req 요청dto
     * @param laNo  신청번호(application)
     * @param cNo   고객번호
     * @return
     */
    @Override
    @Transactional
    public LoanSaveConsentsResponseDTO saveConsents(LoanSaveConsentsRequestDTO req, Long laNo, Integer cNo) {

        // 신청별 묶음을 위한 키 생성
        String batchKey = (req.getBatchKey() == null || req.getBatchKey().isBlank())
                ? java.util.UUID.randomUUID().toString()
                : req.getBatchKey();

        int n = 0;

        for (var it : Optional.ofNullable(req.getItems()).orElse(List.of())) {
            if (!it.isAgreed()) continue; // 동의한 것만 기록

            // 같은 세션(batchKey) + 같은 항목(term_code, version)은 1건만 허용
            boolean exists = repo.existsByBatchKeyAndTermCodeAndVersion(batchKey, it.getTermCode(), it.getVersion());
            if (exists) continue;

            LoanConsent lc = LoanConsent.builder()
                    .laNo(laNo)                 // 신청전엔 null로 들어감
                    .customerNo(cNo)
                    .termCode(it.getTermCode())
                    .batchKey(batchKey)
                    .termTitle(it.getTitle())
                    .version(it.getVersion())
                    .bodyMd(it.getBody())
                    .agreed(true)
                    .agreedAt(parseTime(it.getAgreedAt()))
                    .build();
            repo.save(lc);
            n++;
        }
        return new LoanSaveConsentsResponseDTO(true, n);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoanConsent> getConsentsByLaNo(Long laNo) {
        return repo.findByLaNo(laNo);
    }

    @Override
    @Transactional
    public void attachConsentsToApp(Integer customerNo, Long laNo, String batchKey) {
        int updated = repo.attachLaNoToConsents(customerNo, laNo, batchKey);
    }


    // ================ 유틸 메서드들
    private static LocalDateTime parseTime(String s){
        try { return LocalDateTime.parse(s.replace("Z",""));
        } catch(Exception e){
            return LocalDateTime.now();
        }
    }
}
