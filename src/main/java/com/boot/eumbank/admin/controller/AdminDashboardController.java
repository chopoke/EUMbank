package com.boot.eumbank.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;
import java.util.Map;

@Controller
public class AdminDashboardController {
    @GetMapping("/admin/dashboard")
    public String dashboard(Model model) {
        var stats = List.of(
                Map.of("title","Total Users","value","1,200","icon","ri-user-line","color","text-blue-600"),
                Map.of("title","Active Loans","value","350","icon","ri-file-list-line","color","text-green-600"),
                Map.of("title","Inquiry Resolution Rate","value","80%","icon","ri-checkbox-circle-line","color","text-teal-600")
        );
        var recentLoans = List.of(
                Map.of("name","Jane Cooper","amount","$26,000","date","2024-01-15","status","Active"),
                Map.of("name","Cody Fisher","amount","$16,000","date","2024-01-12","status","Active"),
                Map.of("name","Dianne Russell","amount","$6,000","date","2024-01-01","status","Active")
        );
        var recentInquiries = List.of(
                Map.of("subject","Loan Application","status","Pending"),
                Map.of("subject","Account Closure","status","Pending"),
                Map.of("subject","Credit Issue","status","Pending")
        );
        model.addAttribute("stats", stats);
        model.addAttribute("recentLoans", recentLoans);
        model.addAttribute("recentInquiries", recentInquiries);
        return "admin/dashboard";
    }
}
