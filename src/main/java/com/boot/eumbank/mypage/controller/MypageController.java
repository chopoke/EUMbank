package com.boot.eumbank.mypage.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.mypage.dto.MypageSummaryDto;
import com.boot.eumbank.mypage.entity.MypageCustomer;
import com.boot.eumbank.mypage.service.MypageServiceImpl;
import com.boot.eumbank.mypage.service.MypageSummaryService;
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

    @Autowired
    private MypageSummaryService summaryService;

    /* =========================
       1) 마이페이지 기본 조회
       ========================= */
    @GetMapping("/mypage")
    public ResponseEntity<?> findcustomer() {
        System.out.println("test0");
        Integer customerNo = currentCustomerNoOrNull();
        if (customerNo == null) {
            return new ResponseEntity<>("UNAUTHORIZED", HttpStatus.UNAUTHORIZED);
        }

        Map<String, String> response = new HashMap<>();
        String customerName = currentCustomerNameOrNull();
        if (customerName != null) response.put("customerName", customerName);
        System.out.println(response);

        MypageCustomer myc = service.mypageCustomer(customerNo);
        return new ResponseEntity<>(myc, HttpStatus.OK);
    }

    /* =========================
       2) 마이페이지 업데이트
       ========================= */
    @PutMapping("/mypage")
    public ResponseEntity<?> updatecustomer(@RequestBody MypageCustomer updatedDto) {
        try {
            System.out.println("=== PUT /api/mypage 요청 시작 ===");
            System.out.println("Received DTO: " + updatedDto);

            Integer principalNo = currentCustomerNoOrNull();
            if (principalNo == null) {
                return new ResponseEntity<>("UNAUTHORIZED", HttpStatus.UNAUTHORIZED);
            }
            System.out.println("Authenticated Principal No: " + principalNo);

            if (updatedDto.getCustomerNo() == 0) {
                System.err.println("FATAL: customerNo 필드 누락!");
                return new ResponseEntity<>("Customer ID is missing.", HttpStatus.BAD_REQUEST);
            }

            // (선택) 본인 계정만 수정하도록 보호
            if (updatedDto.getCustomerNo() != principalNo) {
                return new ResponseEntity<>("FORBIDDEN", HttpStatus.FORBIDDEN);
            }

            service.updateMypage(updatedDto);
            System.out.println("=== PUT /api/mypage 처리 완료 ===");
            return new ResponseEntity<>("Update successful", HttpStatus.OK);

        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Server Error during update.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /* =========================
       3) 마이페이지 요약
          프론트는 나중에 /api/mypage/summary로 갈아타면 됨
       ========================= */
    @GetMapping("/mypage/summary")
    public ResponseEntity<MypageSummaryDto> summary(@RequestParam(value = "cNo", required = false) Integer cNo) {
        Integer customerNo = (cNo != null) ? cNo : currentCustomerNoOrNull();
        if (customerNo == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        MypageSummaryDto dto = summaryService.getSummary(customerNo);
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    /* =========================
       4) 호환용 엔드포인트
          /api/savings/summary 를 계속 지원
       ========================= */
    @GetMapping("/savings/summary")
    public ResponseEntity<MypageSummaryDto> summaryCompat(@RequestParam(value = "cNo", required = false) Integer cNo) {
        Integer customerNo = (cNo != null) ? cNo : currentCustomerNoOrNull();
        if (customerNo == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        MypageSummaryDto dto = summaryService.getSummary(customerNo);
        return new ResponseEntity<>(dto, HttpStatus.OK);
    }

    /* =========================
       헬퍼: 현재 로그인 사용자 정보
       ========================= */
    private Integer currentCustomerNoOrNull() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) return null;
            Object principal = authentication.getPrincipal();
            if (principal instanceof Customer c) {
                return c.getCustomerNo();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    private String currentCustomerNameOrNull() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || authentication.getPrincipal() == null) return null;
            Object principal = authentication.getPrincipal();
            if (principal instanceof Customer c) {
                return c.getCNameKr();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
