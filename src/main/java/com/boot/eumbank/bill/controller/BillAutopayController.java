package com.boot.eumbank.bill.controller;

import com.boot.eumbank.account.open.service.account.AccoutService;
import com.boot.eumbank.bill.core.BillAutopayService;
import com.boot.eumbank.bill.entity.BillAutopay;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bills")
public class BillAutopayController {

    private final BillAutopayService service;
    private final AccoutService accountService;

    @GetMapping("/{ubNo}/autopay")
    public ResponseEntity<List<BillAutopay>> list(@PathVariable Integer ubNo) {
        return ResponseEntity.ok(service.list(ubNo));
    }

    @PostMapping("/{ubNo}/autopay")
    public ResponseEntity<?> create(
            @PathVariable Integer ubNo,
            @RequestBody CreateReq req,
            @RequestParam String pin         // ★ 쿼리나 body로 PIN 전달
    ){
        Map<String,Object> pr = accountService.verifyPin(pin);
        if (!Boolean.TRUE.equals(pr.get("pinBooleanCheck"))) {
            return ResponseEntity.status(401).body(Map.of("error","INVALID_PIN"));
        }

        return ResponseEntity.ok(
                service.create(ubNo, req.getANo(), req.getPayDay(), req.getPayTime(), req.getMemo())
        );
    }

    @PatchMapping("/autopay/{baNo}")
    public ResponseEntity<?> patch(
            @PathVariable Integer baNo,
            @RequestBody PatchReq req,
            @RequestParam String pin
    ){
        Map<String,Object> pr = accountService.verifyPin(pin);
        if (!Boolean.TRUE.equals(pr.get("pinBooleanCheck"))) {
            return ResponseEntity.status(401).body(Map.of("error","INVALID_PIN"));
        }

        return ResponseEntity.ok(
                service.patch(baNo, req.getActive(), req.getPayDay(), req.getPayTime(), req.getMemo())
        );
    }

    @DeleteMapping("/autopay/{baNo}")
    public ResponseEntity<?> delete(
            @PathVariable Integer baNo,
            @RequestParam String pin
    ){
        Map<String,Object> pr = accountService.verifyPin(pin);
        if (!Boolean.TRUE.equals(pr.get("pinBooleanCheck"))) {
            return ResponseEntity.status(401).body(Map.of("error","INVALID_PIN"));
        }

        service.delete(baNo);
        return ResponseEntity.noContent().build();
    }

    @Getter
    @Setter
    static class CreateReq {
        @JsonProperty("aNo")
        private Integer aNo;
        private Integer payDay;
        private String  payTime;
        private String  memo;
    }

    @Getter @Setter
    static class PatchReq {
        private String  active;   // "Y"/"N"
        private Integer payDay;
        private String  payTime;
        private String  memo;
    }
}
