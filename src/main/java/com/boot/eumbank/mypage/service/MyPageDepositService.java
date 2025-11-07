// src/main/java/com/boot/eumbank/mypage/service/MyPageDepositService.java
package com.boot.eumbank.mypage.service;

import com.boot.eumbank.mypage.dto.MyDepositDTO;
import com.boot.eumbank.mypage.repository.MyPageDepositRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MyPageDepositService {

    private final MyPageDepositRepository repo;

    public List<MyDepositDTO> getMyDeposits(int customerNo) {
        return repo.findMyDeposits(customerNo);
    }
}
