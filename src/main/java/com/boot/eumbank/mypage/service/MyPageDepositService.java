// src/main/java/com/boot/eumbank/mypage/service/MyPageDepositService.java
package com.boot.eumbank.mypage.service;

import com.boot.eumbank.mypage.dto.MyDepositDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
public class MyPageDepositService {

    private final MypageProductService productService;

    public List<MyDepositDTO> getMyDeposits(int customerNo) {
        return productService.myDeposits(customerNo); // 단일 경로
    }
}