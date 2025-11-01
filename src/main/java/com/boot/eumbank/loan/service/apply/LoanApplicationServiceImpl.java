package com.boot.eumbank.loan.service.apply;

import com.boot.eumbank.loan.dto.apply.LoanApplicationRequestDTO;
import com.boot.eumbank.loan.dto.apply.LoanApplicationResponseDTO;
import com.boot.eumbank.loan.dto.apply.LoanSaveConsentsRequestDTO;
import com.boot.eumbank.loan.entity.LoanApplication;
import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.repository.LoanProductRepository;
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
    private final ObjectMapper om = new ObjectMapper();

    // ============================ 신청 저장
    @Override
    @Transactional
    public LoanApplicationResponseDTO createAndSubmit(LoanApplicationRequestDTO req, String channel) {
        // productCode -> lpd_no 해석
        LoanProduct product = productRepo.findByLoanCode(req.getProductCode())
                .orElseThrow(() -> new NoSuchElementException("상품 없음: " + req.getProductCode()));

        String laId = nextLaId();

        // context snapshot
        String contextJson = buildContextJson(req, product);

        LoanApplication la = new LoanApplication();
        la.setLaId(laId);
        la.setCustomerNo(Integer.valueOf(req.getCustomerNo()));
        la.setLoanProductNo(product.getLoanNo());
        la.setPayoutAccountNo(req.getPayoutAccountNo());
        la.setRepayAccountNo(req.getRepayAccountNo());
        la.setAppliedAmount(nvl(req.getDesiredAmount(), BigDecimal.ZERO));
        la.setDesiredTerm(req.getDesiredTerm());
        la.setPurposeCode(req.getPurposeCode());
        la.setStatus("SUBMITTED");
        // 견적 echo
        la.setApprovedAmount(req.getQuoteApprovedAmount());
        la.setApprovedRate(req.getQuoteAppliedRate());
        la.setApprovedTerm(req.getQuoteApprovedTerm());
        la.setContextJson(contextJson);
        la.setChannel(channel == null ? "WEB" : channel);
        la.setSubmittedAt(LocalDateTime.now());

        appRepo.save(la);

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

    private static BigDecimal nvl(BigDecimal v, BigDecimal d) { return v == null ? d : v; }
}
