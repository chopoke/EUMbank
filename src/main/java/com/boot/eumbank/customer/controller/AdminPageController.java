package com.boot.eumbank.customer.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AdminPageController {
    @GetMapping("/templates/admin/test")
    public String test() {
        return "templates/admin/test"; // templates/admin/test.html
    }
}
