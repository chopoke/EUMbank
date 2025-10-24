package com.boot.eumbank.loan.controller;

import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.dto.LoanProductDetailDTO;
import com.boot.eumbank.loan.service.FssFinlifeService;
import com.boot.eumbank.loan.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
@RestController
@RequestMapping("/api/loan")
@RequiredArgsConstructor
public class LoanController {

//    // 대출 상품 목록
//    private final FssFinlifeService fssFinlifeService;
//
//    // 주택담보대출 api json원본 결과
//    @GetMapping(value = "/mortgage/raw", produces = MediaType.APPLICATION_JSON_VALUE)
//    public String mortgageRaw(
//            @RequestParam(defaultValue = "020000") String topFinGrpNo,
//            @RequestParam(defaultValue = "1") int pageNo
//    ){
//        return fssFinlifeService.getMortgageProductsRaw(topFinGrpNo, pageNo);
//    }
//
//    // 상품 목록으로 다듬기 (Json -> 가공) 일단 주택담보대출만
//    @GetMapping("/mortgage")
//    public List<LoanProductDTO> mortgageList(
//            @RequestParam(defaultValue = "020000") String topFinGrpNo,
//            @RequestParam(defaultValue = "1") int pageNo
//    ){
//        return fssFinlifeService.getMortgageProductsForList(topFinGrpNo, pageNo);
//    }
//
//    // 주택담보대출 단일 상세내용
//    @GetMapping("/product/{id}")
//    public LoanProductDetailDTO detail (
//            @PathVariable String id,
//            @RequestParam(defaultValue = "020000") String topFinGrpNo,
//            @RequestParam(defaultValue = "1") int pageNo
//    ){
//        return fssFinlifeService.getMortgageProductDetail(topFinGrpNo, pageNo, id);
//    }


    // DB 로드용 서비스
    private final LoanService loanService;

    @GetMapping("/products")
    public Page<LoanProductDTO> list(
            @RequestParam(defaultValue = "MORTGAGE") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ){
        return loanService.getProducts(type, page, size);
    }

    @GetMapping("/products/{code}")
    public ResponseEntity<LoanProductDetailDTO> detail(@PathVariable String code) {
        return loanService.getProductDetail(code)               // Optional<LoanProductDetailDTO>
                .map(ResponseEntity::ok)                        // 200 OK + body
                .orElseGet(() -> ResponseEntity.notFound().build()); // 404
    }
}
