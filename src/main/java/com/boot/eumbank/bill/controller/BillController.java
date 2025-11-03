// src/main/java/com/boot/eumbank/bill/controller/BillController.java
package com.boot.eumbank.bill.controller;

import com.boot.eumbank.bill.dto.AutopayCreateReq;
import com.boot.eumbank.bill.dto.AutopayRes;
import com.boot.eumbank.bill.entity.BillAutopay;
import com.boot.eumbank.bill.entity.UtilityBill;
import com.boot.eumbank.bill.repo.BillInvoiceRepo;
import com.boot.eumbank.bill.repo.UtilityBillRepo;
import com.boot.eumbank.bill.service.BillAutopayService;
import com.boot.eumbank.bill.service.BillPaymentService;
import com.boot.eumbank.customer.entity.Customer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/bill")
@RequiredArgsConstructor
public class BillController {
    private final BillAutopayService apService;
    private final BillPaymentService payService;
    private final BillInvoiceRepo invRepo;
    private final UtilityBillRepo ubRepo;

    @GetMapping("/my/ub")
    public ResponseEntity<?> myUb(@AuthenticationPrincipal Customer me) {
        if (me == null) return ResponseEntity.status(401).build();
        try {
            Integer customerNo = me.getCustomerNo();
            List<UtilityBill> list = ubRepo.findMyActive(customerNo); // 네이티브/파생 중 사용중인 메서드

            var result = list.stream().map(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("ubNo", u.getUbNo());
                m.put("type", u.getUbType());                   // null 허용
                m.put("customerNo", u.getUbCustomerNum());      // null 허용
                m.put("provider", u.getProvider() != null ? u.getProvider().getBpvCode() : null);
                m.put("active", u.getUbActive());               // null 허용
                return m;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("GET /api/bill/my/ub failed", e);
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{ubNo}/autopay")
    public AutopayRes createAp(@PathVariable Integer ubNo, @RequestBody AutopayCreateReq req){
        LocalDate s = LocalDate.parse(req.startDate());
        LocalDate e = (req.endDate()==null || req.endDate().isBlank())? null : LocalDate.parse(req.endDate());
        BillAutopay ap = apService.create(ubNo, req.aNo(), req.payDay(), req.payTime(), s, e, req.memo());
        return new AutopayRes(ap.getBaNo(), ap.getANo(), ap.getBaPayDay(), ap.getBaPayTime(),
                ap.getBaStartedAt().toString(), ap.getBaEndedAt()==null? null: ap.getBaEndedAt().toString());
    }

    @PostMapping(
            value = "/invoices/{biNo}/pay",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> pay(@PathVariable Integer biNo,
                                 @RequestBody(required = false) Map<String, Object> body,
                                 @RequestHeader(value = "Idempotency-Key", required = false) String idem) {
        if (body == null || body.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "empty body"));
        }

        Integer aNo = extractInt(body, "aNo", "a_no", "ano", "accountNo", "account_no");
        if (aNo == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "aNo is required"));
        }

        var p = payService.pay(biNo, aNo, idem);

        // Map.of -> null 허용되는 LinkedHashMap 사용
        var res = new java.util.LinkedHashMap<String, Object>();
        res.put("bpNo",     p.getBpNo());                      // null 가능
        res.put("status",   p.getBpStatus());                  // null 가능
        res.put("paidAt",   p.getBpPaidAt() != null ? p.getBpPaidAt().toString() : null);
        return ResponseEntity.ok(res);
    }

    private Integer extractInt(Map<String, Object> m, String... keys) {
        for (String k : keys) {
            Object v = m.get(k);
            if (v == null) continue;
            if (v instanceof Number n) return n.intValue();
            try { return Integer.valueOf(v.toString()); } catch (Exception ignored) {}
        }
        return null;
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
