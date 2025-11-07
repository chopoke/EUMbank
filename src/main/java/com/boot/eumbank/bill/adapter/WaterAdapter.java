package com.boot.eumbank.bill.adapter;

import com.boot.eumbank.bill.model.PayCommand;
import com.boot.eumbank.bill.model.PayResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@Profile({"dev","public"})
@RequiredArgsConstructor
public class WaterAdapter implements BillProviderAdapter {
    private final JdbcTemplate jdbc;
    @Override public String providerCode() { return "K_WATER"; }

    public Map<String,Object> fetchRates() {
        String sql = """
            SELECT
              wr_base_charge AS base_charge,
              wr_unit_price  AS unit_price,
              wr_eff_from    AS eff_from
            FROM WATER_RATE_TBL
            WHERE wr_eff_from <= CURRENT_TIMESTAMP
            ORDER BY wr_eff_from DESC, wr_id DESC
            LIMIT 1
        """;

        Map<String,Object> r = jdbc.queryForMap(sql);

        // FE와 이전 포맷을 맞추기 위해 'columns'(한글) + 'rows'(키: 영문) 유지
        List<String> columns = List.of("구간","기본요금(원)","단가(원/㎥)","비고");
        List<Map<String,Object>> rows = List.of(Map.of(
                "tier",        "1~∞",
                "base_charge", r.get("base_charge"),
                "unit_price",  r.get("unit_price"),
                "note",        ""
        ));

        Timestamp eff = (Timestamp) r.get("eff_from");

        return Map.of(
                "columns", columns,
                "unit", Map.of("usage","㎥","price","KRW"),
                "rows", rows,
                "meta", Map.of("provider","K_WATER","effective", eff != null ? eff.toString() : null)
        );
    }

    @Override public PayResult pay(PayCommand cmd){ return null; }
}

