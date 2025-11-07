package com.boot.eumbank.bill.controller;

import com.boot.eumbank.bill.adapter.GasAdapter;
import com.boot.eumbank.bill.adapter.KepcoAdapter;
import com.boot.eumbank.bill.adapter.WaterAdapter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/rates")
@RequiredArgsConstructor
public class RatesController {
    private final KepcoAdapter kepco;
    private final WaterAdapter water;
    private final GasAdapter gas;

    @GetMapping("/electric")
    public ResponseEntity<?> electric(@RequestParam int year,
                                      @RequestParam int month,
                                      @RequestParam(defaultValue="11") String metroCd,
                                      @RequestParam(defaultValue="1")  String svcKindCd) {
        try {
            var payload = kepco.fetchRates(year, month, metroCd, svcKindCd);
            return ResponseEntity.ok(Map.of(
                    "meta", Map.of("year",year,"month",month,"metroCd",metroCd,"svcKindCd",svcKindCd),
                    "data", payload
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/water")
    public Map<String,Object> water() {
        return water.fetchRates();
    }

    @GetMapping("/gas")
    public Map<String,Object> gas() {
        return gas.fetchRates();
    }
}

