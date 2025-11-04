package com.boot.eumbank.mypage.controller;

import com.boot.eumbank.mypage.dto.*;
import com.boot.eumbank.mypage.service.MypageProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MypageProductController {

    private final MypageProductService service;

    @GetMapping("/savings")
    public List<SavingItemDto> savings() {
        return service.mySavings();
    }

    @GetMapping("/deposits")
    public List<DepositItemDto> deposits() {
        return service.myDeposits();
    }

    @GetMapping("/loans")
    public List<LoanItemDto> loans() {
        return service.myLoans();
    }
}
