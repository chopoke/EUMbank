package com.boot.eumbank.loan.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.dto.LoanProductDetailDTO;
import com.boot.eumbank.loan.dto.apply.*;
import com.boot.eumbank.loan.service.apply.LoanQuoteService;
import com.boot.eumbank.loan.service.LoanService;
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

    // DB 로드용 서비스
    private final LoanService loanService;

    // 한도조회 및 신청
    private final LoanQuoteService loanQuoteService;

    // 상품 리스트
    @GetMapping("/products")
    public Page<LoanProductDTO> list(
            @RequestParam(defaultValue = "MORTGAGE") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ){
        return loanService.getProducts(type, page, size);
    }

    // 상품 상세
    @GetMapping("/products/{code}")
    public ResponseEntity<LoanProductDetailDTO> detail(@PathVariable String code) {
        return loanService.getProductDetail(code)               // Optional<LoanProductDetailDTO>
                .map(ResponseEntity::ok)                        // 200 OK + body
                .orElseGet(() -> ResponseEntity.notFound().build()); // 404에렁
    }

    // 한도/금리 조회계산
    @PostMapping("/{code}/quote")
    public ResponseEntity<LoanQuoteResponseDTO> quote(@PathVariable("code") String loanCode,
                                                      @RequestBody LoanQuoteRequestDTO req,
                                                      @AuthenticationPrincipal Customer customer){
        return ResponseEntity.ok(loanQuoteService.quote(loanCode, req, customer));
    }

    // 대출 신청 저장
    @PostMapping("/{code}/applications")
    public ResponseEntity<LoanApplicationResponseDTO> apply(
            @PathVariable("code") String loanCode,
            @RequestBody LoanApplicationRequestDTO req,
            @AuthenticationPrincipal Customer customer) {

        // 로그인 사용자에서 고객번호 주입
        if (req.getCustomerNo() == null && customer != null) {
            req.setCustomerNo(customer.getCustomerNo()); // 엔티티 필드 이름에 맞는 getter
        }
        return ResponseEntity.ok(loanQuoteService.apply(loanCode, req));
    }

    // 대출 신청 저장!
    @PostMapping("/{code}/consents")
    public ResponseEntity<Map<String,Object>> consents(
            @PathVariable("code") String loanCode,
            @RequestBody LoanSaveConsentsRequestDTO req
    ){
        // 필요 시: loanCode와 req.getProductCode() 일치 검증
        // 지금은 임시 OK만 응답해서 프론트 500 방지
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "count", req.getItems() == null ? 0 : req.getItems().size()
        ));
    }
}
