// com.boot.eumbank.foreign.controller.ForeignMeController
package com.boot.eumbank.foreign.controller;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.open.jpa.repository.custom.AccountRepo;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.foreign.dto.MeResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/foreign")
@RequiredArgsConstructor
@Slf4j
public class ForeignMeController {

    private final CustomerRepo customerRepo;
    private final AccountRepo accountRepo;

    @GetMapping("/me")
    public ResponseEntity<MeResponseDto> me(Authentication auth) {
        Object principal = auth.getPrincipal();
        // principal 이 UserDetails 또는 Customer 엔티티로 올 수 있음
        String userId;
        if (principal instanceof UserDetails ud) {
            userId = ud.getUsername();      // = c_user_id
        } else if (principal instanceof Customer c) {
            userId = c.getUserId();         // = c_user_id
        } else {
            throw new IllegalArgumentException("인증 정보를 확인할 수 없습니다.");
        }

        log.info("[/api/foreign/me] userId={}", userId);

        // ✅ 오직 c_user_id 로 조회 (고유값) - 더 이상 c_id fallback 금지
        Customer c = customerRepo.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("고객 정보를 찾을 수 없습니다."));

        // 계좌 FK 는 c_no
        List<Account> accs = accountRepo.findByCNo(c.getCustomerNo());

        List<MeResponseDto.AccountSummary> accounts = accs.stream()
                .map(a -> MeResponseDto.AccountSummary.builder()
                        .accountNo(a.getAccountNo())
                        .name(a.getNickname())
                        .type(a.getAccountType())   // 필드명에 맞춰 매핑
                        .currency(a.getCurrency())
                        .balance(a.getBalance())
                        .build()
                )
                .toList();

        MeResponseDto body = MeResponseDto.builder()
                .cNo(c.getCustomerNo())
                .preferentialRate(BigDecimal.ZERO) // 필요 시 정책 반영
                .accounts(accounts)
                .build();

        return ResponseEntity.ok(body);
    }
}
