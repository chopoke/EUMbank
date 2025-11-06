// com.boot.eumbank.admin.controller.AdminErrorController
package com.boot.eumbank.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AdminErrorController {
    @GetMapping("/admin/forbidden")
    public String forbidden() { return "admin/forbidden"; } // templates/admin/forbidden.html
}
