package com.boot.eumbank.bill.controller;

import com.boot.eumbank.bill.core.BillAutopayService;
import com.boot.eumbank.bill.entity.BillAutopay;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bills")
public class BillAutopayController {

    private final BillAutopayService service;

    @GetMapping("/{ubNo}/autopay")
    public ResponseEntity<List<BillAutopay>> list(@PathVariable Integer ubNo) {
        return ResponseEntity.ok(service.list(ubNo));
    }

    @PostMapping("/{ubNo}/autopay")
    public ResponseEntity<BillAutopay> create(@PathVariable Integer ubNo, @RequestBody CreateReq req) {
        return ResponseEntity.ok(
                service.create(ubNo, req.getANo(), req.getPayDay(), req.getPayTime(), req.getMemo())
        );
    }

    @PatchMapping("/autopay/{baNo}")
    public ResponseEntity<BillAutopay> patch(@PathVariable Integer baNo, @RequestBody PatchReq req) {
        return ResponseEntity.ok(
                service.patch(baNo, req.getActive(), req.getPayDay(), req.getPayTime(), req.getMemo())
        );
    }

    @DeleteMapping("/autopay/{baNo}")
    public ResponseEntity<Void> delete(@PathVariable Integer baNo) {
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
