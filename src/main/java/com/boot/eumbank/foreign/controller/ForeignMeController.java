// com.boot.eumbank.foreign.controller.ForeignMeController
package com.boot.eumbank.foreign.controller;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.repo.CustomerRepo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/foreign")
@RequiredArgsConstructor
@Slf4j
public class ForeignMeController {

    private final CustomerRepo customerRepo;

    /** 외화가입 화면 프리필 (이름/생일/영문/고객번호/PIN여부) */
    @GetMapping("/me")
    public ResponseEntity<OpenMeRes> openMe(Authentication auth) {
        String userId = resolveUserId(auth);
        Customer c = customerRepo.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("고객 정보를 찾을 수 없습니다."));

        String birth = c.getCBirthDt() == null
                ? null
                : c.getCBirthDt().format(DateTimeFormatter.BASIC_ISO_DATE); // yyyyMMdd

        OpenMeRes res = OpenMeRes.builder()
                .customerNo(c.getCustomerNo())
                .c_name_kr(c.getCNameKr())
                .c_name_en(c.getCNameEn())
                .c_birth_dt(birth)
                .pinExists(c.getPinNumber() != null && !c.getPinNumber().isBlank())
                .build();

        return ResponseEntity.ok(res);
    }

    /** 거래 PIN 확인 (입력 1회 → DB 값과 일치 확인) */
    @PostMapping("/open/pin-verify")
    public ResponseEntity<PinVerifyRes> verifyPin(Authentication auth, @RequestBody PinVerifyReq req) {
        String userId = resolveUserId(auth);
        Customer c = customerRepo.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("고객 정보를 찾을 수 없습니다."));

        String saved = c.getPinNumber();        // 현재는 평문 저장 테이블이라고 하셨음
        boolean ok = saved != null && saved.trim().equals(req.getPin().trim());
        return ResponseEntity.ok(new PinVerifyRes(ok));
    }

    // ==== util ====
    private String resolveUserId(Authentication auth) {
        Object p = auth.getPrincipal();
        if (p instanceof UserDetails ud) return ud.getUsername();
        if (p instanceof Customer c) return c.getUserId();
        throw new IllegalArgumentException("인증 정보를 확인할 수 없습니다.");
    }

    // ==== DTOs ====
    @Data @AllArgsConstructor
    public static class PinVerifyReq { private String pin; }

    @Data @AllArgsConstructor
    public static class PinVerifyRes { private boolean ok; }

    @Data @Builder
    public static class OpenMeRes {
        private Integer customerNo;
        private String c_name_kr;
        private String c_name_en;
        private String c_birth_dt;   // yyyyMMdd
        private boolean pinExists;
    }
}
