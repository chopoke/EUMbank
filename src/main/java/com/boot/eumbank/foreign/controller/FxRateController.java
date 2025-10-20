// src/main/java/com/boot/eumbank/foreign/controller/FxRateController.java
package com.boot.eumbank.foreign.controller;

import com.boot.eumbank.foreign.service.FxRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/foreign/rates")
@RequiredArgsConstructor
public class FxRateController {

    private final FxRateService service;

    /** 전체 요약 (프런트 우측 표) */
    @GetMapping
    public Map<String, Object> list() {
        service.warmupIfEmpty();

        List<FxRateService.Rate> src = service.list();
        List<Map<String,Object>> rows = new ArrayList<>();

        for (FxRateService.Rate r : src) {
            Map<String,Object> m = new HashMap<>();
            // 새 키
            m.put("cur",  r.cur());
            m.put("name", r.name());
            m.put("base", r.base());
            m.put("buy",  r.buy());
            m.put("sell", r.sell());
            // 구(레거시) 키 - 프론트 구코드 호환
            m.put("curUnit",  r.cur());
            m.put("curNm",    r.name());
            m.put("dealBasR", r.base());
            m.put("ttb",      r.buy());
            m.put("tts",      r.sell());
            rows.add(m);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("updatedAt", service.getLastUpdated());
        res.put("rows", rows);
        return res;
    }

    /** 특정 통화 최신 스냅샷 */
    @GetMapping("/{cur}")
    public Map<String, Object> get(@PathVariable("cur") String cur) {
        service.warmupIfEmpty();

        Map<String, Object> res = new HashMap<>();
        res.put("updatedAt", service.getLastUpdated());

        Map<String,Object> one = null;
        var opt = service.get(cur);
        if (opt.isPresent()) {
            FxRateService.Rate r = opt.get();
            one = new HashMap<>();
            one.put("cur",  r.cur());
            one.put("name", r.name());
            one.put("base", r.base());
            one.put("buy",  r.buy());
            one.put("sell", r.sell());
            // 구 키
            one.put("curUnit",  r.cur());
            one.put("curNm",    r.name());
            one.put("dealBasR", r.base());
            one.put("ttb",      r.buy());
            one.put("tts",      r.sell());
        }
        res.put("rate", one);
        return res;
    }

    /** 차트: 기본 시리즈 */
    @GetMapping("/series")
    public List<FxRateService.SeriesPoint> series(
            @RequestParam String cur,
            @RequestParam(defaultValue = "60") int days
    ) {
        return service.getSeries(cur, days);
    }

    /** 차트: 파생지표 포함 시리즈 */
    @GetMapping("/series/rich")
    public List<FxRateService.RichPoint> seriesRich(
            @RequestParam String cur,
            @RequestParam(defaultValue = "90") int days
    ) {
        return service.getSeriesRich(cur, days);
    }

    /** Top Movers (전일 대비 변동률 상위 N) */
    @GetMapping("/movers")
    public List<FxRateService.Mover> movers(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return service.topMovers(limit);
    }
}
