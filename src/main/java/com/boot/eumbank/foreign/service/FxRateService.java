// src/main/java/com/boot/eumbank/foreign/service/FxRateService.java
package com.boot.eumbank.foreign.service;

import com.boot.eumbank.foreign.entity.ForeignRate;
import com.boot.eumbank.foreign.infra.EximClient;
import com.boot.eumbank.foreign.repo.ForeignRateRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FxRateService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final EximClient eximClient;
    private final ForeignRateRepo repo;

    /** 화면 목록 캐시 */
    private volatile List<ForeignRate> cache = Collections.emptyList();
    private volatile LocalDateTime updatedAt = null;

    /** 목록/상세 응답 DTO */
    public record Rate(String cur, String name, BigDecimal base, BigDecimal buy, BigDecimal sell){}

    /** 차트 응답 DTO(기본) */
    public record SeriesPoint(LocalDate date, BigDecimal rate) {}

    /** 차트 응답 DTO(파생지표 포함) */
    public record RichPoint(LocalDate date, BigDecimal rate,
                            BigDecimal delta, BigDecimal pct,
                            BigDecimal sma7, BigDecimal bbLo, BigDecimal bbHi) {}

    /** Movers 응답 DTO */
    public record Mover(String cur, BigDecimal today, BigDecimal yesterday,
                        BigDecimal delta, BigDecimal pct){}

    /** 기동 직후 1회 워밍업 */
    public void warmupIfEmpty() {
        if (this.cache.isEmpty()) {
            log.info("[FX] Cache is empty. Running initial warmup.");
            refreshRates();
        }
    }

    /** 최신 스냅샷 목록 */
    public List<Rate> list() {
        if (cache.isEmpty() && updatedAt == null) return List.of();
        return cache.stream()
                .map(e -> new Rate(
                        e.getFrCurUnit(),
                        e.getFrCurNm(),
                        e.getFrDealBas(),
                        e.getFrTtb(),
                        e.getFrTts()))
                .collect(Collectors.toList());
    }

    /** 특정 통화 최신 스냅샷 한 건 */
    public Optional<Rate> get(String cur) {
        return cache.stream()
                .filter(e -> e.getFrCurUnit().equalsIgnoreCase(cur))
                .findFirst()
                .map(e -> new Rate(
                        e.getFrCurUnit(),
                        e.getFrCurNm(),
                        e.getFrDealBas(),
                        e.getFrTtb(),
                        e.getFrTts()));
    }

    public LocalDateTime getLastUpdated() { return updatedAt; }

    /** 실시간 갱신 + DB 업서트(유니크 없음: UPDATE→INSERT) + 캐시 최신화 */
    @Transactional
    public int refreshRates() {
        try {
            var rows = eximClient.fetchLatest();
            if (rows.isEmpty()) {
                log.warn("[FX] refresh returned 0 rows; keeping previous snapshot.");
                return 0;
            }

            // Row에 날짜가 실려옴. 없으면 KST 오늘.
            LocalDate observed = rows.get(0).date != null
                    ? rows.get(0).date
                    : LocalDate.now(KST);

            // DTO -> 엔티티
            List<ForeignRate> entities = rows.stream()
                    .map(r -> toEntity(r, observed))
                    .filter(Objects::nonNull)
                    .toList();

            if (entities.isEmpty()) {
                log.warn("[FX] All fetched rows were incomplete after conversion; keeping previous snapshot.");
                return 0;
            }

            // 업서트
            int affected = 0;
            for (ForeignRate e : entities) {
                affected += repo.upsertOne(
                        e.getFrCurUnit(),
                        e.getFrCurNm(),
                        e.getFrTtb(),
                        e.getFrTts(),
                        e.getFrDealBas(),
                        e.getFrObservedDate()
                );
            }

            // 캐시 최신화
            this.cache = repo.findLatestSnapshot();
            this.updatedAt = LocalDateTime.now();

            log.info("[FX] refreshed {} currencies at {}", affected, this.updatedAt);
            return affected;

        } catch (Exception e) {
            log.error("[FX] Parse/Store error during refresh.", e);
            return 0;
        }
    }

    /** 최근 N영업일(=N행) 매매기준율 시계열 (정규화 매칭) */
    @Transactional(readOnly = true)
    public List<SeriesPoint> getSeries(String cur, int days) {
        String unit = cur.replaceAll("\\(.+\\)", "").trim(); // "JPY(100)" → "JPY"
        var rows = repo.findRecentSeriesNormalized(unit, PageRequest.of(0, days));
        if (rows.isEmpty()) return List.of();

        var points = rows.stream()
                .map(r -> new SeriesPoint(r.getDate(), r.getRate()))
                .toList();

        var asc = new ArrayList<>(points); // DESC → ASC
        Collections.reverse(asc);
        return asc;
    }

    /** 파생지표 포함 시리즈 (Δ, %변화, SMA7, 볼린저밴드) */
    @Transactional(readOnly = true)
    public List<RichPoint> getSeriesRich(String cur, int days) {
        var base = getSeries(cur, days + 14); // SMA/STD 여유분
        if (base.isEmpty()) return List.of();

        var out = new ArrayList<RichPoint>(base.size());
        var rates = new ArrayList<Double>(base.size());

        for (int i = 0; i < base.size(); i++) {
            var p = base.get(i);
            double r = p.rate().doubleValue();
            rates.add(r);

            // Δ, %
            BigDecimal delta = BigDecimal.ZERO;
            BigDecimal pct = BigDecimal.ZERO;
            if (i > 0) {
                var prev = base.get(i - 1).rate();
                delta = p.rate().subtract(prev);
                pct = prev.compareTo(BigDecimal.ZERO) == 0
                        ? BigDecimal.ZERO
                        : delta.divide(prev, 6, java.math.RoundingMode.HALF_UP);
            }

            // 7일 SMA & 표준편차 기반 볼밴드(±2σ)
            BigDecimal sma7 = null, bbLo = null, bbHi = null;
            if (i >= 6) {
                double sum = 0;
                for (int k = i - 6; k <= i; k++) sum += rates.get(k);
                double sma = sum / 7.0;

                double var = 0;
                for (int k = i - 6; k <= i; k++) {
                    double d = rates.get(k) - sma;
                    var += d * d;
                }
                double std = Math.sqrt(var / 7.0);

                sma7 = bd(sma);
                bbLo = bd(sma - 2 * std);
                bbHi = bd(sma + 2 * std);
            }

            out.add(new RichPoint(p.date(), p.rate(), delta, pct, sma7, bbLo, bbHi));
        }

        // 요청 days만 끝에서 잘라서 반환
        return out.size() > days ? out.subList(out.size() - days, out.size()) : out;
    }

    /** 전일 대비 상위 변동 통화 */
    @Transactional(readOnly = true)
    public List<Mover> topMovers(int limit) {
        var rows = repo.findLast2ForAll(); // 각 통화 최근 2일
        var byUnit = new LinkedHashMap<String, List<ForeignRateRepo.ChangeRow>>();
        rows.forEach(r -> byUnit.computeIfAbsent(r.getUnit(), k -> new ArrayList<>()).add(r));

        var movers = new ArrayList<Mover>();
        for (var e : byUnit.entrySet()) {
            var list = e.getValue();
            if (list.size() < 2) continue;
            var y = list.get(0).getRate(); // 어제
            var t = list.get(1).getRate(); // 오늘
            var d = t.subtract(y);
            var p = y.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                    : d.divide(y, 6, java.math.RoundingMode.HALF_UP);
            movers.add(new Mover(e.getKey(), t, y, d, p));
        }
        movers.sort(Comparator.comparing(Mover::pct).reversed());
        return movers.size() > limit ? movers.subList(0, limit) : movers;
    }

    private ForeignRate toEntity(EximClient.Row r, LocalDate observed) {
        if (r.curUnit == null || r.curNm == null || r.dealBasR == null) {
            log.warn("[FX] Skipping incomplete row: curUnit={}, curNm={}", r.curUnit, r.curNm);
            return null;
        }
        return ForeignRate.builder()
                .frCurUnit(r.curUnit)
                .frCurNm(r.curNm)
                .frTtb(Optional.ofNullable(r.ttb).orElse(BigDecimal.ZERO))
                .frTts(Optional.ofNullable(r.tts).orElse(BigDecimal.ZERO))
                .frDealBas(r.dealBasR)
                .frObservedDate(r.date != null ? r.date : observed)
                .build();
    }

    private static BigDecimal bd(double v) {
        return new BigDecimal(v).setScale(6, java.math.RoundingMode.HALF_UP);
    }
}
