package com.boot.eumbank.loan.controller;

import com.boot.eumbank.loan.dto.LoanProductDTO;
import com.boot.eumbank.loan.service.FssFinlifeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
@RestController
@RequestMapping("/api/loan")
@RequiredArgsConstructor
public class LoanController {

    // 대출 상품 목록
    private final FssFinlifeService fssFinlifeService;

//    // 대출 상품 목록
//    @GetMapping("/mortgage")
//    public String mortgageProduct(@RequestParam(defaultValue = "020000") String topFinGrpNo,     // 은행권 예시
//                                  @RequestParam(defaultValue = "1") int pageNo){
//        return fssFinlifeService.getMortgageProducts(topFinGrpNo, pageNo);
//    }

    /** 1) 원본 JSON 그대로 반환 (디버그/검증용) */
    @GetMapping(value = "/mortgage/raw", produces = MediaType.APPLICATION_JSON_VALUE)
    public String mortgageRaw(
            @RequestParam(defaultValue = "020000") String topFinGrpNo,
            @RequestParam(defaultValue = "1") int pageNo
    ){
        return fssFinlifeService.getMortgageProductsRaw(topFinGrpNo, pageNo);
    }

    /** 2) 화면에 바로 쓸 수 있게 가공된 리스트 반환 */
    @GetMapping("/mortgage")
    public List<LoanProductDTO> mortgageList(
            @RequestParam(defaultValue = "020000") String topFinGrpNo,
            @RequestParam(defaultValue = "1") int pageNo
    ){
        return fssFinlifeService.getMortgageProductsForList(topFinGrpNo, pageNo);
    }

}
