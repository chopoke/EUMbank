package com.boot.eumbank.bill.adapter;

import com.boot.eumbank.bill.model.PayCommand;
import com.boot.eumbank.bill.model.PayResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@Profile({"dev","public"})
@RequiredArgsConstructor
public class GasAdapter implements BillProviderAdapter {
    private final JdbcTemplate jdbc;
    @Override public String providerCode() { return "GAS"; }

    public Map<String,Object> fetchRates(String region, String svcKind, LocalDate when) {
        String sql = """
          SELECT
            gr_tier        AS tier,
            gr_usage_min   AS usage_min,
            gr_usage_max   AS usage_max,
            gr_base_charge AS base_charge,
            (gr_unit_price + COALESCE(gr_fuel_adj,0)) AS unit_price,
            gr_vat_rate    AS vat_rate,
            gr_fuel_adj    AS fuel_adj
          FROM GAS_RATE_TBL
          WHERE gr_region_cd=? AND gr_svc_kind_cd=?
            AND gr_eff_from<=? AND (gr_eff_to IS NULL OR gr_eff_to>=?)
          ORDER BY gr_tier
        """;
        List<Map<String,Object>> raw = jdbc.queryForList(sql, region, svcKind, when, when);
        // 화면 단가는 unit_price + fuel_adj 로 노출
        List<Map<String,Object>> rows = raw.stream().peek(r -> {
            int unit = ((Number)r.get("unit_price")).intValue();
            int adj  = ((Number)r.getOrDefault("fuel_adj",0)).intValue();
            r.put("unit_price", unit + adj);
        }).toList();

        return Map.of(
                "columns", List.of("구간","사용량(최소)","사용량(최대)","기본요금(원/㎥)","단가(원/㎥)","비고"),
                "unit", Map.of("usage","㎥","price","KRW"),
                "rows", rows,
                "meta", Map.of("provider","GAS","region",region,"effective",when.toString())
        );
    }

    @Override public PayResult pay(PayCommand cmd){ return null; }
}
