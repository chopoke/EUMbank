// src/main/java/com/boot/eumbank/admin/controller/AdminUserPageController.java
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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Model model
    ) {
        Page<?> result = service.list(keyword, status, page, size);
        model.addAttribute("page", result);

        final String k0 = keyword;
        final String s0 = status;
        model.addAttribute("cond", new Object() {
            public final String keyword = k0;
            public final String status = s0;
        });

        model.addAttribute("activeMenu", "user");
        model.addAttribute("hideHero", true);
        return "admin/user";
    }

    /** 정지 */
    @PostMapping("/user/{id}/freeze")
    public String freeze(@PathVariable Integer id,
                         @RequestParam(defaultValue = "0") int page,
                         @RequestParam(defaultValue = "") String keyword,
                         @RequestParam(defaultValue = "All") String status) {
        service.freezeCustomer(id);
        return "redirect:/admin/user?page=" + page + "&keyword=" + keyword + "&status=" + status;
    }

    /** ✅ 정지 해제 */
    @PostMapping("/user/{id}/unfreeze")
    public String unfreeze(@PathVariable Integer id,
                           @RequestParam(defaultValue = "0") int page,
                           @RequestParam(defaultValue = "") String keyword,
                           @RequestParam(defaultValue = "All") String status) {
        service.unfreezeCustomer(id);
        return "redirect:/admin/user?page=" + page + "&keyword=" + keyword + "&status=" + status;
    }
}
