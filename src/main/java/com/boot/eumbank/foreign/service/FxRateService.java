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
import java.math.RoundingMode;
import java.time.DayOfWeek;
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

    /** EXIM이 '(100)' 단위로 공시하는 통화 목록 */
    private static final Set<String> PER_100 = Set.of(
            "JPY", "IDR", "VND", "KHR", "LAK"
    );

    /** 화면/계산에서 사용하는 최신 스냅샷 캐시 (ISO3 키 → 1단위 환율 Rate) */
    private volatile Map<String, Rate> cacheByIso = Map.of();
    private volatile LocalDateTime updatedAt = null;

    /** 목록/상세 응답 DTO (모두 1단위 기준 환율) */
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

    /* ------------------------- 유틸/정규화 ------------------------- */

    /** "JPY(100)" → "JPY", "JPY" → "JPY" */
    private static String isoOf(String cur) {
        if (cur == null) return null;
        String s = cur.toUpperCase(Locale.ROOT).trim();
        int i = s.indexOf('(');
        return (i > 0) ? s.substring(0, i) : s;
    }

    /** ISO를 EXIM 코드로 변환: JPY → JPY(100) (해당되는 경우) */
    private static String isoToEximUnit(String iso) {
        if (iso == null) return null;
        String s = isoOf(iso);
        return PER_100.contains(s) ? s + "(100)" : s;
    }

    /** EXIM 코드가 (100) 단위인지 */
    private static boolean isPer100Unit(String eximUnit) {
        return eximUnit != null && eximUnit.endsWith("(100)");
    }

    /** (100) 단위 → 1단위 보정 */
    private static BigDecimal perOne(BigDecimal v, boolean per100) {
        if (v == null) return null;
        return per100 ? v.divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP) : v;
    }

    private static BigDecimal bd(double v) {
        return new BigDecimal(v).setScale(6, RoundingMode.HALF_UP);
    }

    /* --------------------------- 퍼블릭 API --------------------------- */

    /** 기동 직후 1회 워밍업 */
    public void warmupIfEmpty() {
        if (this.cacheByIso.isEmpty() && updatedAt == null) {
            log.info("[FX] Cache is empty. Running initial warmup.");
            refreshRates();
        }
    }

    /** 최신 스냅샷 목록 (ISO3 오름차순, 1단위 기준 환율) */
    public List<Rate> list() {
        if (cacheByIso.isEmpty() && updatedAt == null) return List.of();
        return cacheByIso.values().stream()
                .sorted(Comparator.comparing(Rate::cur))
                .collect(Collectors.toList());
    }

    /** 특정 통화 최신 스냅샷 한 건 (1단위 기준) */
    public Optional<Rate> get(String cur) {
        String iso = isoOf(cur);
        return Optional.ofNullable(cacheByIso.get(iso));
    }

    public LocalDateTime getLastUpdated() { return updatedAt; }

    /** 컨트롤러에서 바로 사용 가능한 조회: ISO3 입력 → 내부에서 EXIM코드 매칭 + 1단위 보정 후 반환 */
    @Transactional(readOnly = true)
    public Optional<Rate> getLatestRateFor(String isoCur) {
        String eximUnit = isoToEximUnit(isoCur); // JPY -> JPY(100)
        return repo.findTopByFrCurUnitOrderByFrNoDesc(eximUnit)
                .map(fr -> {
                    boolean per100 = isPer100Unit(fr.getFrCurUnit());
                    return new Rate(
                            isoOf(fr.getFrCurUnit()),     // ISO3
                            fr.getFrCurNm(),
                            perOne(fr.getFrDealBas(), per100),
                            perOne(fr.getFrTtb(), per100),
                            perOne(fr.getFrTts(), per100)
                    );
                });
    }

    /** 실시간 갱신 + DB 업서트 + 캐시 최신화(덮어쓰기) */
    @Transactional
    public int refreshRates() {
        try {
            var rows = eximClient.fetchLatest();
            if (rows.isEmpty()) {
                log.warn("[FX] refresh returned 0 rows; keeping previous snapshot.");
                return 0;
            }

            LocalDate observed = rows.get(0).date != null
                    ? rows.get(0).date
                    : LocalDate.now(KST);

            List<ForeignRate> entities = rows.stream()
                    .map(r -> toEntity(r, observed))
                    .filter(Objects::nonNull)
                    .toList();

            if (entities.isEmpty()) {
                log.warn("[FX] All fetched rows were incomplete after conversion; keeping previous snapshot.");
                return 0;
            }

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

            reloadCacheFromDb();
            log.info("[FX] refreshed {} rows", affected);
            return affected;

        } catch (Exception e) {
            log.error("[FX] Parse/Store error during refresh.", e);
            return 0;
        }
    }

    /** 최근 N영업일 시계열 — 항상 (1)ASC 정렬 (2)중복 날짜 제거 */
    @Transactional(readOnly = true)
    public List<SeriesPoint> getSeries(String cur, int days) {
        String unit = isoOf(cur); // "JPY(100)" → "JPY"
        var rows = repo.findRecentSeriesNormalized(unit, PageRequest.of(0, days));
        if (rows.isEmpty()) return List.of();

        // 1) 매핑
        var points = rows.stream()
                .map(r -> new SeriesPoint(r.getDate(), r.getRate()))
                .collect(Collectors.toList());

        // 2) 정렬(ASC)
        points.sort(Comparator.comparing(SeriesPoint::date));

        // 3) 같은 날짜가 여러 개면 마지막 하나만 유지
        Map<LocalDate, SeriesPoint> uniq = new LinkedHashMap<>();
        for (SeriesPoint p : points) uniq.put(p.date(), p);

        return new ArrayList<>(uniq.values());
    }

    /** 파생지표 포함 시리즈 (Δ, %변화, SMA7, 볼린저밴드) — getSeries 기반 */
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

            BigDecimal delta = BigDecimal.ZERO;
            BigDecimal pct = BigDecimal.ZERO;
            if (i > 0) {
                var prev = base.get(i - 1).rate();
                delta = p.rate().subtract(prev);
                pct = prev.compareTo(BigDecimal.ZERO) == 0
                        ? BigDecimal.ZERO
                        : delta.divide(prev, 6, RoundingMode.HALF_UP);
            }

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

        return out.size() > days ? out.subList(out.size() - days, out.size()) : out;
    }

    /** 전일 대비 상위 변동 통화 */
    @Transactional(readOnly = true)
    public List<Mover> topMovers(int limit) {
        var rows = repo.findLast2ForAll(); // 각 통화 최근 2일 (ORDER BY unit, date ASC)
        var byUnit = new LinkedHashMap<String, List<ForeignRateRepo.ChangeRow>>();
        rows.forEach(r -> byUnit.computeIfAbsent(isoOf(r.getUnit()), k -> new ArrayList<>()).add(r));

        var movers = new ArrayList<Mover>();
        for (var e : byUnit.entrySet()) {
            var list = e.getValue();
            if (list.size() < 2) continue;
            var y = list.get(0).getRate(); // 어제
            var t = list.get(1).getRate(); // 오늘
            var d = t.subtract(y);
            var p = y.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                    : d.divide(y, 6, RoundingMode.HALF_UP);
            movers.add(new Mover(e.getKey(), t, y, d, p));
        }
        movers.sort(Comparator.comparing(Mover::pct).reversed());
        return movers.size() > limit ? movers.subList(0, limit) : movers;
    }

    /* --------------------------- 백필 & 캐시 리로드 --------------------------- */

    /** 과거 구간(포함) 백필: 주말/공휴일은 자동 skip */
    @Transactional
    public int backfill(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) return 0;

        int total = 0;
        LocalDate d = from;

        while (!d.isAfter(to)) {
            // 주말 skip
            DayOfWeek dw = d.getDayOfWeek();
            if (dw == DayOfWeek.SATURDAY || dw == DayOfWeek.SUNDAY) {
                d = d.plusDays(1);
                continue;
            }

            try {
                var rows = eximClient.fetchBy(d); // ← 특정 일자 조회(프로젝트에 맞게 메서드명 유지)
                if (rows == null || rows.isEmpty()) {
                    d = d.plusDays(1);
                    continue;
                }

                //  람다 캡처용 불변 복사본
                final LocalDate obs = d;

                List<ForeignRate> entities = rows.stream()
                        .map(r -> toEntity(r, obs))   // d 대신 obs 사용
                        .filter(Objects::nonNull)
                        .toList();

                for (ForeignRate e : entities) {
                    total += repo.upsertOne(
                            e.getFrCurUnit(),
                            e.getFrCurNm(),
                            e.getFrTtb(),
                            e.getFrTts(),
                            e.getFrDealBas(),
                            e.getFrObservedDate()
                    );
                }
            } catch (Exception ex) {
                log.warn("[FX] backfill fail {}: {}", d, ex.toString());
            }

            d = d.plusDays(1);
        }

        reloadCacheFromDb();
        //log.info("[FX] backfilled rows={}", total);
        return total;
    }

    /** DB의 최신 스냅샷으로 메모리 캐시만 재구성 */
    @Transactional(readOnly = true)
    public void reloadCacheFromDb() {
        List<ForeignRate> latest = repo.findLatestSnapshot();

        Map<String, ForeignRate> byEximUnit = new LinkedHashMap<>();
        for (ForeignRate fr : latest) {
            byEximUnit.put(fr.getFrCurUnit(), fr);
        }

        Map<String, Rate> fresh = new TreeMap<>();
        for (ForeignRate fr : byEximUnit.values()) {
            String iso = isoOf(fr.getFrCurUnit());
            boolean per100 = isPer100Unit(fr.getFrCurUnit());
            Rate r = new Rate(
                    iso,
                    fr.getFrCurNm(),
                    perOne(fr.getFrDealBas(), per100),
                    perOne(fr.getFrTtb(), per100),
                    perOne(fr.getFrTts(), per100)
            );
            fresh.put(iso, r);
        }

        this.cacheByIso = Collections.unmodifiableMap(fresh);
        this.updatedAt = LocalDateTime.now();
        //log.info("[FX] cache reloaded at {} ({} currencies)", this.updatedAt, this.cacheByIso.size());
    }

    /* --------------------------- 내부 변환 --------------------------- */

    private ForeignRate toEntity(EximClient.Row r, LocalDate observed) {
        if (r.curUnit == null || r.curNm == null || r.dealBasR == null) {
            log.warn("[FX] Skipping incomplete row: curUnit={}, curNm={}", r.curUnit, r.curNm);
            return null;
        }
        return ForeignRate.builder()
                .frCurUnit(r.curUnit) // EXIM 원문 보관 (예: JPY(100))
                .frCurNm(r.curNm)
                .frTtb(Optional.ofNullable(r.ttb).orElse(BigDecimal.ZERO))
                .frTts(Optional.ofNullable(r.tts).orElse(BigDecimal.ZERO))
                .frDealBas(r.dealBasR)
                .frObservedDate(r.date != null ? r.date : observed)
                .build();
    }
}
