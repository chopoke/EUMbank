package com.boot.eumbank.mypage.controller;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.foreign.service.FxRateService;
import com.boot.eumbank.mypage.entity.MypageCustomer;
import com.boot.eumbank.mypage.service.MypageServiceImpl;
import com.boot.eumbank.product.dto.product.ProductDto;
import com.boot.eumbank.product.service.product.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class MypageController {

    @Autowired
    private MypageServiceImpl service;

    @Autowired
    private ProductService productService;

    @Autowired
    private  FxRateService fxservice;


    @GetMapping("/mypage")
    public ResponseEntity<?> findcustomer() {
        System.out.println("test0");
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer customer = (Customer) authentication.getPrincipal();
        String test = customer.getCNameKr();
        int test1 = customer.getCustomerNo();

        System.out.println(test);
        System.out.println(test1);
        Map<String, String> response = new HashMap<>();
        response.put("customerName", test);
        System.out.println(response);
        MypageCustomer myc = service.mypageCustomer(test1);
        myc.getCustomerNo();
//        System.out.println(tt);
        return new ResponseEntity<>(myc, HttpStatus.OK);
    }

    @PutMapping("/mypage")
    public ResponseEntity<?> updatecustomer(@RequestBody MypageCustomer updatedDto) {
        try {
            System.out.println("=== PUT /api/mypage 요청 시작 ===");

            // 1. 넘어온 DTO 전체 출력 (JSON 파싱 성공 여부 확인)
            System.out.println("Received DTO: " + updatedDto);

            // 2. 인증 정보 확인 (토큰은 성공했지만, Principal이 살아있는지 확인)
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Customer principal = (Customer) authentication.getPrincipal(); // 여기서 Null 또는 ClassCast 발생 가능
            System.out.println("Authenticated Principal No: " + principal.getCustomerNo());

            // 3. DTO의 필수 키가 넘어왔는지 확인 (예: customerNo)
            if (updatedDto.getCustomerNo() == 0) {
                System.err.println("FATAL: customerNo 필드 누락!");
                return new ResponseEntity<>("Customer ID is missing.", HttpStatus.BAD_REQUEST);
            }

            // 4. (서비스 호출 및 저장)
            service.updateMypage(updatedDto);

            System.out.println("=== PUT /api/mypage 처리 완료 ===");
            return new ResponseEntity<>("Update successful", HttpStatus.OK);

        } catch (Exception e) {
            // ⭐ 이 catch 블록에서 예외를 출력하면 500 에러의 원인을 알 수 있습니다.
            e.printStackTrace();
            return new ResponseEntity<>("Server Error during update.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/best3")
    public ResponseEntity<?> getproduct() {
        System.out.println("test0");



//        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
//        Customer customer = (Customer) authentication.getPrincipal();
        List<ProductDto> pds = productService.findAllProducts();

        // 상품 번호(no)를 기준으로 내림차순(가장 큰 번호가 최신) 정렬 후 상위 3개 선택
        List<ProductDto> newest3Products = pds.stream()
                // 1. no 필드 값으로 비교합니다.
                //    ProductDto::getNo는 Integer 타입을 반환합니다.
                .sorted(Comparator.comparing(ProductDto::getNo)
                        .reversed()) // 2. 내림차순 정렬 (reversed): 번호가 클수록(최신일수록) 앞으로
                .limit(3) // 3. 상위 3개만 선택
                .collect(Collectors.toList());
        System.out.println(newest3Products);
        System.out.println("test1");

        fxservice.warmupIfEmpty();

        List<FxRateService.Rate> src = fxservice.list();
        List<Map<String, Object>> rows = new ArrayList<>();

        // 💡 1. 필터링할 통화 코드 집합 (Set) 정의
        Set<String> targetCurrencies = Set.of("USD", "EUR", "JPY");

        for (FxRateService.Rate r : src) {
            if (targetCurrencies.contains(r.cur())) {
                Map<String, Object> m = new HashMap<>();
                // 새 키
                m.put("cur",  r.cur());
                m.put("name", r.name());
                m.put("base", r.base());
                m.put("buy",  r.buy());
                m.put("sell", r.sell());
                // 레거시 키(프론트 호환)
                m.put("curUnit",  r.cur());
                m.put("curNm",    r.name());
                m.put("dealBasR", r.base());
                m.put("ttb",      r.buy());
                m.put("tts",      r.sell());
                rows.add(m);
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("updatedAt", fxservice.getLastUpdated());
        res.put("rows", rows);
        System.out.println(res);
        Map<String, Object> response = new HashMap<>();
        response.put("pro3", newest3Products);
        response.put("fx3", res);
        return ResponseEntity.ok(response);
    }
}
