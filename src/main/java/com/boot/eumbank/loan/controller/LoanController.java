package com.boot.eumbank.loan.controller;

import com.boot.eumbank.account.open.jpa.repository.custom.CustomerRepository;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.dto.LoanProductDetailDTO;
import com.boot.eumbank.loan.dto.apply.*;
import com.boot.eumbank.loan.dto.payment.RepaymentRequestDTO;
import com.boot.eumbank.loan.dto.payment.RepaymentResponseDTO;
import com.boot.eumbank.loan.entity.LoanApplication;
import com.boot.eumbank.loan.repository.apply.LoanApplicationRepository;
import com.boot.eumbank.loan.service.apply.LoanApplicationService;
import com.boot.eumbank.loan.service.apply.LoanConsentService;
import com.boot.eumbank.loan.service.apply.LoanQuoteService;
import com.boot.eumbank.loan.service.LoanService;
import com.boot.eumbank.loan.service.payment.LoanRepaymentService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
@RestController
@RequestMapping("/api/loan")
@RequiredArgsConstructor @Slf4j
public class LoanController {

    // DB 로드용 서비스  (상세조횟)
    private final LoanService loanService;

    // 한도조회 (꼐산용)
    private final LoanQuoteService loanQuoteService;

    // 신청 저장용
    private final LoanApplicationService loanApplicationService;
    private final CustomerRepository customerRepo;

    // 약관 저장용
    private final LoanConsentService loanConsentService;
    private final LoanApplicationRepository appRepo;

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

    /** 대출 신청용지 사인할 때ㅏ 사용자 정보 가져와서 용지 프린팅 */
    @GetMapping("/me/sign-info")
    public ResponseEntity<LoanSignCustDTO> getSignInfo(@AuthenticationPrincipal Customer customer) {
        if (customer == null) {
            return ResponseEntity.status(401).build();
        }
        LoanSignCustDTO dto = new LoanSignCustDTO(
                customer.getCustomerNo(),
                customer.getCNameKr(),
                customer.getCRrnHash(),
                customer.getCPhoneMobile(),
                customer.getCAddress()
        );
        return ResponseEntity.ok(dto);
    }

    /**
     * DB에 저장된 사용자의 PIN번호 확인하여 대출신청허가
     */
    @PostMapping("/{code}/pin-verify")        // 기존 pin검사로 이동
    public ResponseEntity<PinRes> checkPin(@PathVariable("code") String loanCode,
                                           @AuthenticationPrincipal Customer cus,
                                           @RequestBody PinReq pinReq){
        Integer customer = cus.getCustomerNo();
        Customer cust = customerRepo.findById(customer).orElseThrow(()-> new IllegalArgumentException("존재하지 않는 회원 정보입니다. "));
        String dbPin = cust.getPinNumber();
        String inputPin = pinReq.getPin();
        boolean ok = dbPin != null && inputPin != null  && dbPin.trim().equals(inputPin.trim());
        log.info("@@@@@@@@ PIN결과 : {}", ok);
        return ResponseEntity.ok(new PinRes(ok));
    }

    // 대출 신청 저장 ----------------------------------------
    @PostMapping("/{code}/applications")
    public ResponseEntity<LoanApplicationResponseDTO> apply(
            @PathVariable("code") String loanCode,
            @RequestBody LoanApplicationRequestDTO req,
            @AuthenticationPrincipal Customer customer) {

        // 로그인 사용자에서 고객번호 주입
        if (req.getCustomerNo() == null && customer != null) {
            req.setCustomerNo(customer.getCustomerNo()); 
        }
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
        LoanSaveConsentsResponseDTO res = loanConsentService.saveConsents(req, null, cNo);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/applications/{laId}/consents")
    public ResponseEntity<?> getConsentsByApplication(@PathVariable("laId") String laId) {

        // laId -> LoanApplication
        LoanApplication app = appRepo.findByLaId(laId)
                .orElseThrow(() -> new IllegalArgumentException("신청 정보를 찾을 수 없습니다: " + laId));

        // laNo 기준으로 consents 조회
        var consents = loanConsentService.getConsentsByLaNo(app.getLaNo());

        if (consents == null || consents.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var body = consents.stream()
                .map(c -> new LoanConsentViewDTO(
                        c.getTermCode(),
                        c.getTermTitle(),
                        c.getVersion(),
                        c.getBodyMd(),
                        c.isAgreed(),
                        c.getAgreedAt()
                ))
                .toList();

        return ResponseEntity.ok(body);
    }

    // --   상환(Repayment) 추가 엔드포인트
    @PostMapping("/loans/{lNo}/repayments")
    public ResponseEntity<RepaymentResponseDTO> repay(@PathVariable("lNo") Long loanNo,
                                                      @RequestBody RepaymentRequestDTO req) {
        RepaymentResponseDTO res = repaymentService.repay(loanNo, req);
        return ResponseEntity.ok(res);
    }

    /**
     * PIN번호 확인용 응답/요청 DTO
     */
    @Data @AllArgsConstructor @NoArgsConstructor
    public static class PinReq{
        private String pin;
    }
    @Data @AllArgsConstructor @NoArgsConstructor
    public static class PinRes{
        private Boolean ok;
    }

//    // -- 상환 내역 목록 진입
//    @GetMapping("/loans/{lNo}/repayments")
//    public Page<LoanPaymentViewDTO> listRepayments(@PathVariable("lNo") Long loanNo,
//                                                   @RequestParam(defaultValue = "0") int page,
//                                                   @RequestParam(defaultValue = "20") int size){
//        return loanPaymentQueryService.getRepayments(loanNo, page, size);
//    }
}
