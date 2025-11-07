package com.boot.eumbank.mypage.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.mypage.entity.MypageCustomer;
import com.boot.eumbank.mypage.service.MypageServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MypageController {

    @Autowired
    private MypageServiceImpl service;



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
}