package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.select.repository.AccountSelectRepository;
import com.boot.eumbank.loan.dto.apply.LoanApplicationRequestDTO;
import com.boot.eumbank.loan.dto.apply.LoanApplicationResponseDTO;
import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsRequestDTO;
import com.boot.eumbank.loan.entity.LoanApplication;
import com.boot.eumbank.loan.entity.LoanApplicationHistory;
import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import com.boot.eumbank.loan.repository.apply.LoanApplicationHistoryRepository;
import com.boot.eumbank.loan.repository.apply.LoanApplicationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class LoanApplicationServiceImpl implements LoanApplicationService {

    private final LoanApplicationRepository appRepo;
    private final LoanProductRepository productRepo;
    private final AccountSelectRepository accountRepository;
    private final ObjectMapper om = new ObjectMapper();
    private final LoanApplicationHistoryRepository historyRepo;     // 신청기록 테이블 저장(loan_application_history_tbl)

    // ============================ 신청 저장
    @Override
    @Transactional
    public LoanApplicationResponseDTO createAndSubmit(LoanApplicationRequestDTO req, String channel) {
        // productCode -> lpd_no 해석
        LoanProduct product = productRepo.findByLoanCode(req.getProductCode())
                .orElseThrow(() -> new NoSuchElementException("상품 없음: " + req.getProductCode()));

        String laId = nextLaId();

        
        // 고객번호보장
        Integer cNo = Optional.ofNullable(req.getCustomerNo())
                .orElseThrow(() -> new IllegalArgumentException("고객번호가 필요합니다. (customerNo)"));

        // 계좌 검증
        Account payout = accountRepository.findById(req.getPayoutAccountNo())
                .orElseThrow(() -> new IllegalArgumentException("지급계좌가 존재하지 않습니다."));
        Account repay = accountRepository.findById(req.getRepayAccountNo())
                .orElseThrow(() -> new IllegalArgumentException("상환계좌가 존재하지 않습니다."));

        // 금액/기간 보정
        BigDecimal applAmt = Optional.ofNullable(req.getDesiredAmount())
                .filter(a -> a.compareTo(BigDecimal.ZERO) > 0)
                .orElseThrow(() -> new IllegalArgumentException("신청금액(desiredAmount)은 0보다 커야 합니다."));
        Integer term = Optional.ofNullable(req.getDesiredTerm())
                .filter(t -> t > 0)
                .orElseThrow(() -> new IllegalArgumentException("기간(desiredTerm)은 1개월 이상이어야 합니다."));

        String rateKo = req.getRateType() != null && !req.getRateType().isBlank() ? req.getRateType() : "고정금리";  // "고정금리"/"변동금리"
        String rpayKo = req.getRpayType() != null && !req.getRpayType().isBlank() ? req.getRpayType() : "원리금균등";   // "원리금균등"/"원금균등"/"만기일시"
        String purpose = Optional.ofNullable(req.getPurposeCode()).filter(s -> !s.isBlank()).orElse("기타");


        // context snapshot
        String contextJson = buildContextJson(req, product);

        LoanApplication la = new LoanApplication();
        la.setLaId(laId);
        la.setLoanProductNo(product.getLoanNo());
        la.setCustomerNo(cNo);
        la.setPayoutAccountNo(payout.getANo());
        la.setRepayAccountNo(repay.getANo());
        la.setAppliedAmount(applAmt);
        la.setDesiredTerm(term);
        la.setPurposeCode(purpose);
        la.setStatus("SUBMITTED");
        la.setRateType(rateKo);
        la.setRpayType(rpayKo);
        // 견적 echo
        la.setApprovedAmount(req.getQuoteApprovedAmount());
        la.setApprovedRate(req.getQuoteAppliedRate());
        la.setApprovedTerm(req.getQuoteApprovedTerm());
        la.setContextJson(contextJson);
        la.setChannel((channel == null || channel.isBlank()) ? "WEB" : channel);
        la.setSubmittedAt(LocalDateTime.now());

        // 신청 저장
        appRepo.save(la);

        // ========== 신청내역 테이블에도 기록
        String bankCode = safeBankCode(payout);
        String receiveAcc = safeAccountNumber(payout);

        LoanApplicationHistory hist = LoanApplicationHistory.builder()
                .loanNo(la.getLaNo())                          // ※ 현재 스키마 제약(loanNo NOT NULL) 때문에 la_no를 넣어 추적
                .disbId(la.getLaId())                          // 신청 식별자
                .disbDate(la.getSubmittedAt())                 // 신청 일시
                .amount(applAmt)                               // 신청 금액
                .bankCode(bankCode)                            // 지급은행(가능하면)
                .receiveAccount(receiveAcc)                    // 지급계좌(가능하면)
                .memo("신청 접수(SUBMITTED) - 채널: " + la.getChannel())
                .build();

        // 내역테이블 저장
        historyRepo.save(hist);

        return new LoanApplicationResponseDTO(
                la.getLaId(),
                la.getStatus(),
                la.getLaNo(),
                la.getSubmittedAt()
        );
    }



    // ================================== 약관 동의
    @Override
    public Map<String, Object> saveConsents(LoanSaveConsentsRequestDTO req) {
        return Map.of("ok", true, "count", req.getItems() == null ? 0 : req.getItems().size());
    }

    // ================================= 유틸 메서드
    private String nextLaId() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String rnd = String.format("%06d", new Random().nextInt(1_000_000));
        return "LA" + date + "-" + rnd;
    }

    private String buildContextJson(LoanApplicationRequestDTO req, LoanProduct p) {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("schemaVersion", "1.0.0");
        root.put("capturedAt", LocalDateTime.now().toString());
        root.put("channel", "WEB");

        // 상품 스냅샷
        Map<String, Object> productSnapshot = new LinkedHashMap<>();
        productSnapshot.put("lpdNo",     p.getLoanNo());
        productSnapshot.put("code",      p.getLoanCode());
        productSnapshot.put("name",      p.getLoanName());
        productSnapshot.put("type",      p.getLoanType());
        productSnapshot.put("bankName",  p.getBankName());
        root.put("productSnapshot", productSnapshot);

        // 입력 스냅샷 (null-safe)
        Map<String, Object> input = new LinkedHashMap<>();
        putIfNotNull(input, "occupation",       req.getOccupation());
        putIfNotNull(input, "incomeAnnual",     req.getIncomeAnnual());
        putIfNotNull(input, "desiredAmount",    req.getDesiredAmount());
        putIfNotNull(input, "desiredTerm",      req.getDesiredTerm());
        putIfNotNull(input, "rateType",         req.getRateType());
        putIfNotNull(input, "rpayType",         req.getRpayType());
        putIfNotNull(input, "purpose",          req.getPurposeCode());
        putIfNotNull(input, "collateralValue",  req.getCollateralValue());
        putIfNotNull(input, "jeonseDeposit",    req.getJeonseDeposit());
        putIfNotNull(input, "payoutAccountNo",  req.getPayoutAccountNo());
        putIfNotNull(input, "repayAccountNo",   req.getRepayAccountNo());
        root.put("input", input);

        // 견적 스냅샷 (null-safe)
        Map<String, Object> quote = new LinkedHashMap<>();
        putIfNotNull(quote, "approvedAmount", req.getQuoteApprovedAmount());
        putIfNotNull(quote, "appliedRate",    req.getQuoteAppliedRate());
        putIfNotNull(quote, "approvedTerm",   req.getQuoteApprovedTerm());
        putIfNotNull(quote, "monthlyPayment", req.getQuoteMonthlyPayment());
        root.put("quoteSnapshot", quote);

        // 동의/기타
        putIfNotNull(root, "consents", req.getConsents());
        putIfNotNull(root, "extra",    req.getExtra());

        try {
            return om.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // null 값은 건너뛰는 유틸
    private static void putIfNotNull(Map<String, Object> map, String key, Object value) {
        if (value != null) map.put(key, value);
    }

    private static String normalizeRateKo(String raw) {
        String s = raw == null ? "" : raw.trim();
        if (s.equalsIgnoreCase("VARIABLE") || s.contains("변동")) return "변동금리";
        return "고정금리";
    }

    // 은행코드 꺼내는 유틸
    private String safeBankCode(Account a) {
        try {
            return (String) Account.class.getMethod("getBankCode").invoke(a);
        } catch (Exception ignore) {
            return null;
        }
    }
    // 계좌 번호 꺼내는 유틸
    private String safeAccountNumber(Account a) {
        try {
            return (String) Account.class.getMethod("getAccountNumber").invoke(a);
        } catch (Exception ignore) {
            return String.valueOf(a.getANo()); // 최후: 내부번호 문자열로
        }
    }

}
