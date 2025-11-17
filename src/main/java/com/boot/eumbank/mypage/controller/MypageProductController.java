// src/main/java/com/boot/eumbank/mypage/controller/MypageProductController.java
package com.boot.eumbank.mypage.controller;

import com.boot.eumbank.mypage.dto.MyDepositDTO;
import com.boot.eumbank.mypage.dto.SavingItemDto;
import com.boot.eumbank.mypage.dto.LoanItemDto;
import com.boot.eumbank.mypage.service.MypageProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MypageProductController {

    private final MypageProductService service;

    /** 예금 목록 */
    @GetMapping("/deposits")
    public List<MyDepositDTO> deposits(Principal principal,
                                       @RequestParam(value = "cno", required = false) Integer cno) {
        int customerNo = service.resolveCustomerNo(principal, cno);
        log.info("[mypage] deposits cNo={}", customerNo);
        return service.myDeposits(customerNo);
    }

    /** 적금 목록 */
    @GetMapping("/savings")
    public List<SavingItemDto> savings(Principal principal,
                                       @RequestParam(value = "cno", required = false) Integer cno) {
        int customerNo = service.resolveCustomerNo(principal, cno);
        log.info("[mypage] savings cNo={}", customerNo);
        return service.mySavings(customerNo);
    }

    /**  대출 목록  */
    @GetMapping("/loans")
    public List<LoanItemDto> loans(Principal principal,
                                   @RequestParam(value = "cno", required = false) Integer cno) {
        int customerNo = service.resolveCustomerNo(principal, cno);
        log.info("[mypage] loans cNo={}", customerNo);
        return service.myLoans(customerNo);
    }
}
