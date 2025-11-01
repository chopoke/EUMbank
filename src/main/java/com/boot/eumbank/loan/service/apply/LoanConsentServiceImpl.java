package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsResponseDTO;
import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsRequestDTO;
import com.boot.eumbank.loan.entity.LoanConsent;
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

    @Override
    @Transactional
    public LoanSaveConsentsResponseDTO saveConsents(LoanSaveConsentsRequestDTO req, Long laNo, Integer cNo) {
        int n = 0;
        for (var it : Optional.ofNullable(req.getItems()).orElse(List.of())) {
            if (!it.isAgreed()) continue; // 동의한 것만 기록 (원하면 비동의도 남길 수 있음)

            LoanConsent lc = LoanConsent.builder()
                    .laNo(laNo)
                    .customerNo(cNo)
                    .termCode(it.getTermCode())
                    .termTitle(it.getTitle())
                    .version(it.getVersion())
                    .bodyMd(it.getBody())
                    .agreed(true)
                    .agreedAt(parseTime(it.getAgreedAt()))
                    .bodyHash(sha256(it.getBody()))
                    .build();
            repo.save(lc);
            n++;
        }
        return new LoanSaveConsentsResponseDTO(true, n);
    }

    private static LocalDateTime parseTime(String s){
        try { return LocalDateTime.parse(s.replace("Z","")); } catch(Exception e){ return LocalDateTime.now(); }
    }
    private static String sha256(String s){
        try {
            var md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] d = md.digest((s==null?"":s).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b: d) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e){ return null; }
    }
}
