package com.boot.eumbank.admin.controller;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AdminGateController {

    @GetMapping("/admin/enter")
    public String enter(Authentication auth) {
        if (auth == null) {
            // 로그인 안 된 경우 → 프론트(3000) 로그인 페이지로
            return "redirect:http://localhost:3000/login";
        }

        boolean admin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // 관리자면 대시보드, 아니면 접근거부
        return admin ? "redirect:/admin/dashboard" : "redirect:/admin/forbidden";
    }
}

