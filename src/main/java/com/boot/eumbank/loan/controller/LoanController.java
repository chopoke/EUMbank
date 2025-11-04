package com.boot.eumbank.loan.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.dto.LoanProductDetailDTO;
import com.boot.eumbank.loan.dto.apply.*;
import com.boot.eumbank.loan.dto.payment.RepaymentRequestDTO;
import com.boot.eumbank.loan.dto.payment.RepaymentResponseDTO;
import com.boot.eumbank.loan.service.apply.LoanApplicationService;
import com.boot.eumbank.loan.service.apply.LoanConsentService;
import com.boot.eumbank.loan.service.apply.LoanQuoteService;
import com.boot.eumbank.loan.service.LoanService;
import com.boot.eumbank.loan.service.payment.LoanRepaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
@RestController
@RequestMapping("/api/loan")
@RequiredArgsConstructor
public class LoanController {

    // DB 로드용 서비스  (상세조횟)
    private final LoanService loanService;

    // 한도조회 (꼐산용)
    private final LoanQuoteService loanQuoteService;

    // 신청 저장용
    private final LoanApplicationService loanApplicationService;

    // 약관 저장용
    private final LoanConsentService loanConsentService;

    // 상환서비스
    private final LoanRepaymentService repaymentService;



    // 상품 리스트 -------------------------------------------------
    @GetMapping("/products")
    public Page<LoanProductDTO> list(
            @RequestParam(defaultValue = "MORTGAGE") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ){
        return loanService.getProducts(type, page, size);
    }

    // 상품 상세 --------------------------------------------------------
    @GetMapping("/products/{code}")
    public ResponseEntity<LoanProductDetailDTO> detail(@PathVariable String code) {
        return loanService.getProductDetail(code)               // Optional<LoanProductDetailDTO>
                .map(ResponseEntity::ok)                        // 200 OK + body
                .orElseGet(() -> ResponseEntity.notFound().build()); // 404에렁
    }

    // 한도/금리 조회계산 ------------------------------------------
    @PostMapping("/{code}/quote")
    public ResponseEntity<LoanQuoteResponseDTO> quote(@PathVariable("code") String loanCode,
                                                      @RequestBody LoanQuoteRequestDTO req,
                                                      @AuthenticationPrincipal Customer customer){
        return ResponseEntity.ok(loanQuoteService.quote(loanCode, req, customer));
    }

    // 대출 신청 저장 ----------------------------------------
    @PostMapping("/{code}/applications")
    public ResponseEntity<LoanApplicationResponseDTO> apply(
            @PathVariable("code") String loanCode,
            @RequestBody LoanApplicationRequestDTO req,
            @AuthenticationPrincipal Customer customer) {

        // 로그인 사용자에서 고객번호 주입
        if (req.getCustomerNo() == null && customer != null) {
            req.setCustomerNo(customer.getCustomerNo()); // 엔티티 필드 이름에 맞는 getter
        }
        // 프론트 V1/V2 혼용 지원: productCode 없고 route code만 있을 때 대비
        if (req.getProductCode() == null || req.getProductCode().isBlank()) {
            req.setProductCode(loanCode);
        }
        return ResponseEntity.ok(loanApplicationService.createAndSubmit(req, "WEB"));
    }

    // 대출 약관 동의
    @PostMapping("/{code}/consents")
    public ResponseEntity<LoanSaveConsentsResponseDTO> consents(@PathVariable("code") String loanCode,
                                                       @RequestBody LoanSaveConsentsRequestDTO req,
                                                       @AuthenticationPrincipal Customer customer){
        Integer cNo = (customer != null) ? customer.getCustomerNo() : Integer.valueOf(req.getCustomerNo());
        // la_no는 아직 없을 수도 있음(동의 → 신청 전 단계). 그땐 NULL로 저장해도 됨.
        LoanSaveConsentsResponseDTO res = loanConsentService.saveConsents(req, null, cNo);
        return ResponseEntity.ok(res);
    }


    // --   상환(Repayment) 추가 엔드포인트
    @PostMapping("/loans/{lNo}/repayments")
    public ResponseEntity<RepaymentResponseDTO> repay(@PathVariable("lNo") Long loanNo,
                                                      @RequestBody RepaymentRequestDTO req) {
        RepaymentResponseDTO res = repaymentService.repay(loanNo, req);
        return ResponseEntity.ok(res);
    }
}
