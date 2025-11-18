package com.boot.eumbank.risk.controller;

import com.boot.eumbank.risk.service.RiskGradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/risk")
@RequiredArgsConstructor
public class RiskAdminController {
    private final RiskGradeService risk;

    @PostMapping("/{customerNo}/recalc")
    public void recalcOne(@PathVariable Integer customerNo) {
        risk.recalcForCustomer(customerNo);
    }

    @PostMapping("/recalc-all")
    public void recalcAll() {
        risk.recalcAll();
    }
}
