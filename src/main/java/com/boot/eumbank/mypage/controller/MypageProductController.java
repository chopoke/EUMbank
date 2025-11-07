// src/main/java/com/boot/eumbank/mypage/controller/MypageProductController.java
package com.boot.eumbank.mypage.controller;

import com.boot.eumbank.mypage.dto.DepositItemDto;
import com.boot.eumbank.mypage.dto.LoanItemDto;
import com.boot.eumbank.mypage.dto.SavingItemDto;
import com.boot.eumbank.mypage.service.MypageProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Collections;
import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mypage")   // 프론트 경로와 일치
public class MypageProductController {

    private final MypageProductService service;

    /** 예금 목록 */
    @GetMapping("/deposits")
    public List<DepositItemDto> deposits(Principal principal,
                                         @RequestParam(value = "cno", required = false) Integer cno) {
        try {
            int customerNo = service.resolveCustomerNo(principal, cno);
            log.info("[mypage] deposits cNo={}", customerNo);
            return service.myDeposits(customerNo);
        } catch (Exception e) {
            log.error("[mypage] /deposits 실패", e);
            return Collections.emptyList();
        }
    }

    /** 적금 목록 */
    @GetMapping("/savings")
    public List<SavingItemDto> savings(Principal principal,
                                       @RequestParam(value = "cno", required = false) Integer cno) {
        try {
            int customerNo = service.resolveCustomerNo(principal, cno);
            log.info("[mypage] savings cNo={}", customerNo);
            return service.mySavings(customerNo);
        } catch (Exception e) {
            log.error("[mypage] /savings 실패", e);
            return Collections.emptyList();
        }
    }

    /** 대출 목록 */
    @GetMapping("/loans")
    public List<LoanItemDto> loans(Principal principal,
                                   @RequestParam(value = "cno", required = false) Integer cno) {
        try {
            int customerNo = service.resolveCustomerNo(principal, cno);
            log.info("[mypage] loans cNo={}", customerNo);
            return service.myLoans(customerNo);
        } catch (Exception e) {
            log.error("[mypage] /loans 실패", e);
            return Collections.emptyList();
        }
    }
}
