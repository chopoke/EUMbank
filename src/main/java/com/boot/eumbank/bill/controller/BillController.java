package com.boot.eumbank.bill.controller;

import com.boot.eumbank.bill.dto.AutopayCreateReq;
import com.boot.eumbank.bill.dto.AutopayRes;
import com.boot.eumbank.bill.dto.PayReq;
import com.boot.eumbank.bill.entity.BillAutopay;
import com.boot.eumbank.bill.entity.BillPayment;
import com.boot.eumbank.bill.repo.BillInvoiceRepo;
import com.boot.eumbank.bill.service.BillAutopayService;
import com.boot.eumbank.bill.service.BillPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bill")
@RequiredArgsConstructor
public class BillController {
    private final BillAutopayService apService;
    private final BillPaymentService payService;
    private final BillInvoiceRepo invRepo;

    @PostMapping("/{ubNo}/autopay")
    public AutopayRes createAp(@PathVariable Integer ubNo, @RequestBody AutopayCreateReq req){
        LocalDate s = LocalDate.parse(req.startDate());
        LocalDate e = (req.endDate()==null || req.endDate().isBlank())? null : LocalDate.parse(req.endDate());
        BillAutopay ap = apService.create(ubNo, req.aNo(), req.payDay(), req.payTime(), s, e, req.memo());
        return new AutopayRes(ap.getBaNo(), ap.getANo(), ap.getBaPayDay(), ap.getBaPayTime(),
                ap.getBaStartedAt().toString(), ap.getBaEndedAt()==null? null: ap.getBaEndedAt().toString());
    }

    @PostMapping("/invoices/{biNo}/pay")
    public ResponseEntity<?> pay(@PathVariable Integer biNo, @RequestBody PayReq req,
                                 @RequestHeader(value="Idempotency-Key", required=false) String idem){
        BillPayment p = payService.pay(biNo, req.aNo(), idem);
        return ResponseEntity.ok(Map.of(
                "bpNo", p.getBpNo(), "status", p.getBpStatus(), "paidAt", p.getBpPaidAt()));
    }

    @GetMapping("/{ubNo}/invoices")
    public List<Map<String, Object>> list(@PathVariable Integer ubNo,
                                          @RequestParam(required = false) String status) {
        return invRepo.findAll().stream()
                .filter(i -> i.getBill().getUbNo().equals(ubNo))
                .filter(i -> status == null || i.getBiStatus().equals(status))
                .map(i -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("biNo", i.getBiNo());
                    m.put("ym", i.getBiBillYm());
                    m.put("amount", i.getBiAmount());
                    m.put("dueAt", i.getBiDueAt());
                    m.put("status", i.getBiStatus());
                    return m;
                })
                .collect(Collectors.toList());
    }
}
