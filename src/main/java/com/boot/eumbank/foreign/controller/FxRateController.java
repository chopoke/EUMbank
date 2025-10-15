package com.boot.eumbank.foreign.controller;

import com.boot.eumbank.foreign.infra.EximClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/foreign/rates")
@RequiredArgsConstructor
public class FxRateController {

    private final EximClient eximClient;

    @GetMapping
    public List<Map<String, Object>> list() {
        return eximClient.fetchToday().stream()
                .map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("curUnit",  r.curUnit);
                    m.put("curNm",    r.curNm);
                    m.put("dealBasR", r.dealBasR);
                    m.put("ttb",      r.ttb);
                    m.put("tts",      r.tts);
                    return m;
                })
                .collect(Collectors.toList()); // JDK 11/17 호환
    }

    @GetMapping("/{cur}")
    public Map<String, Object> one(@PathVariable String cur) {
        var r = eximClient.fetchToday().stream()
                .filter(x -> cur.equalsIgnoreCase(x.curUnit))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("통화 없음: " + cur));

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("curUnit",  r.curUnit);
        m.put("curNm",    r.curNm);
        m.put("dealBasR", r.dealBasR);
        m.put("ttb",      r.ttb);
        m.put("tts",      r.tts);
        return m;
    }
}
