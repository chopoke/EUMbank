// src/main/java/com/boot/eumbank/mypage/controller/MypageLoanController.java
package com.boot.eumbank.mypage.controller;

import com.boot.eumbank.mypage.projection.LoanApplicationRow;
import com.boot.eumbank.mypage.projection.LoanRow;
import com.boot.eumbank.mypage.service.MypageLoanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/mypage-jwt")
public class MypageLoanController {

    private final MypageLoanService service;

    private Integer tryGetCnoFromJwt(Jwt jwt) {
        if (jwt == null) return null;
        Object v = jwt.getClaim("cNo");
        if (v == null) v = jwt.getClaim("customerNo");
        if (v == null) {
            Map<String, Object> user = jwt.getClaim("user");
            if (user != null) v = user.getOrDefault("cNo", user.get("customerNo"));
        }
        try { return (v == null) ? null : Integer.parseInt(v.toString()); }
        catch (Exception ignore) { return null; }
    }

    @GetMapping("/loans")
    public List<LoanRow> myLoans(@AuthenticationPrincipal Jwt jwt) {
        Integer cNo = tryGetCnoFromJwt(jwt);
        log.info("[mypage-jwt] loans cNo={}", cNo);
        return service.findLoans(cNo);
    }

    @GetMapping("/loan-applications")
    public List<LoanApplicationRow> myLoanApps(@AuthenticationPrincipal Jwt jwt) {
        Integer cNo = tryGetCnoFromJwt(jwt);
        log.info("[mypage-jwt] loan-applications cNo={}", cNo);
        return service.findPendingApps(cNo);
    }
}
