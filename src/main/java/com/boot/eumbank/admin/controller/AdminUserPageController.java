package com.boot.eumbank.admin.controller;

import com.boot.eumbank.admin.service.CustomerAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller("adminUserPageController")
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminUserPageController {

    private final CustomerAdminService service;

    @GetMapping("/user")
    public String userPage(
            @RequestParam(defaultValue = "")  String keyword,
            @RequestParam(defaultValue = "All") String status,
            @RequestParam(required = false)   String verification,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Model model
    ) {
        Page<?> result = service.list(keyword, status, verification, page, size);
        model.addAttribute("page", result);

        final String k0 = keyword;
        final String s0 = status;
        final String v0 = verification;

        model.addAttribute("cond", new Object() {
            public final String keyword = k0;
            public final String status = s0;
            public final String verification = v0;
        });

        model.addAttribute("activeMenu", "user");
        model.addAttribute("hideHero", true);
        return "admin/user";
    }

}
