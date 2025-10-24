package com.boot.eumbank.foreign.service;

import com.boot.eumbank.account.open.model.Account;
import com.boot.eumbank.account.open.repository.AccountRepo;
import com.boot.eumbank.foreign.dto.FxExchangeCalcRespDto;
import com.boot.eumbank.foreign.dto.FxExchangeReqDto;
import com.boot.eumbank.foreign.dto.FxExchangeRespDto;
import com.boot.eumbank.foreign.entity.ForeignHistory;
import com.boot.eumbank.foreign.repo.ForeignHistoryRepo;
import com.boot.eumbank.foreign.service.FxRateService.Rate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForeignExchangeService {

    private final FxRateService fxRateService;
    private final AccountRepo accountRepo;
    private final ForeignHistoryRepo historyRepo;

    // ---------- 정책/유틸 ----------
    private static final String KRW = "KRW";
    /** 일부 공급원이 100단위로 제공할 수 있는 통화 */
    private static final Set<String> HUNDRED_UNITS = Set.of("JPY", "IDR", "VND");
    /** 고정 수수료율: 0.02% (0.0002) */
    private static final BigDecimal FEE_RATE = new BigDecimal("0.0002");
    /** 표시용 수수료율 라벨 */
    private static final String FEE_RATE_LABEL = "0.02%";

    /** 표시용 통화 단위 라벨 */
    private static final Map<String, String> UNIT_LABELS = Map.ofEntries(
            Map.entry("KRW", "원"),
            Map.entry("USD", "달러"),
            Map.entry("EUR", "유로"),
            Map.entry("JPY", "엔"),
            Map.entry("CNY", "위안"),
            Map.entry("GBP", "파운드"),
            Map.entry("AUD", "호주 달러"),
            Map.entry("CAD", "캐나다 달러"),
            Map.entry("CHF", "스위스 프랑"),
            Map.entry("HKD", "홍콩 달러"),
            Map.entry("SGD", "싱가포르 달러"),
            Map.entry("THB", "바트"),
            Map.entry("TWD", "대만 달러"),
            Map.entry("VND", "동"),
            Map.entry("IDR", "루피아"),
            Map.entry("BHD", "바레인 디나르")
    );

    private static String iso3(String cur) {
        if (cur == null) return null;
        String s = cur.trim().toUpperCase(Locale.ROOT);
        int i = s.indexOf('(');
        return (i > 0) ? s.substring(0, i) : s;
    }
    private static BigDecimal nz(BigDecimal v){ return v==null? BigDecimal.ZERO : v; }
    private static BigDecimal s0(BigDecimal v){ return v.setScale(0, RoundingMode.FLOOR); }
    private static BigDecimal s2(BigDecimal v){ return v.setScale(2, RoundingMode.HALF_UP); }
    private static BigDecimal s6(BigDecimal v){ return v.setScale(6, RoundingMode.HALF_UP); }

    /** 통화별 소수점 자리수(수취 외화 금액에 적용) */
    private static int currencyScale(String iso3){
        return switch (iso3) {
            case "JPY", "IDR", "VND" -> 0;
            default -> 2;
        };
    }
    private static String unitLabel(String iso3){
        return UNIT_LABELS.getOrDefault(iso3, iso3);
    }

    /** KRW<->FX 방향성 검증 (BUY: KRW→FX, SELL: FX→KRW) */
    private static void validatePair(String type, String from, String to){
        if ("BUY".equals(type)) {              // KRW -> FX
            if (!KRW.equals(from) || KRW.equals(to))
                throw new IllegalArgumentException("지원하지 않는 통화쌍입니다. (BUY는 KRW→모든 외화)");
        } else if ("SELL".equals(type)) {      // FX -> KRW
            if (KRW.equals(from) || !KRW.equals(to))
                throw new IllegalArgumentException("지원하지 않는 통화쌍입니다. (SELL은 외화→KRW)");
        } else {
            throw new IllegalArgumentException("지원하지 않는 거래유형입니다. (BUY/SELL)");
        }
    }

    /** 1단위 기준(KRW per 1 FX) 레이트를 반환. 공급원이 100단위면 JPY/IDR/VND에 한해 /100 보정 */
    private static final class OneUnitRate {
        final BigDecimal base1; // 기준율 (KRW per 1 FX)
        final BigDecimal ttb1;  // 매입율 (은행이 FX 사는 값, 고객 SELL 기준)
        final BigDecimal tts1;  // 매도율 (은행이 FX 파는 값, 고객 BUY 기준)
        OneUnitRate(BigDecimal base1, BigDecimal ttb1, BigDecimal tts1) {
            this.base1 = base1; this.ttb1 = ttb1; this.tts1 = tts1;
        }
    }
    private OneUnitRate oneUnitRate(String iso3){
        Rate r = fxRateService.get(iso3)
                .orElseThrow(() -> new IllegalArgumentException(iso3 + " 환율 정보를 찾을 수 없습니다."));

        // 기본: 1단위라고 가정. (예: 1 JPY ≈ 9.x KRW)
        BigDecimal base = r.base();
        BigDecimal buy  = r.buy();
        BigDecimal sell = r.sell();

        // 특정 통화만 100단위 수신 시 /100 보정
        if (HUNDRED_UNITS.contains(iso3)) {
            if (base.compareTo(BigDecimal.valueOf(50)) > 0) {
                base = base.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
                buy  = buy.divide (BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
                sell = sell.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
            }
        }

        return new OneUnitRate(s6(base), s6(buy), s6(sell));
    }

    // ---------- preview ----------
    @Transactional(readOnly = true)
    public FxExchangeCalcRespDto calculateExchange(FxExchangeReqDto req) {
        final String from = iso3(req.getFromCurUnit());
        final String to   = iso3(req.getToCurUnit());
        if (from == null || to == null) {
            throw new IllegalArgumentException("통화코드가 유효하지 않습니다.");
        }

        final String type = (req.getTransactionType()==null)
                ? "BUY" : req.getTransactionType().trim().toUpperCase(Locale.ROOT);

        validatePair(type, from, to);

        // 퍼센트 입력(예: 5.0) → 비율 (우대율/마진을 위한 값; 별도의 수수료(FEE_RATE)와는 별개)
        BigDecimal comm = nz(req.getCommissionRate())
                .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);

        BigDecimal appliedRate;     // 최종 적용 환율 (KRW per 1 FX)
        BigDecimal fromAmount;      // 출금 금액
        BigDecimal expectedReceive; // 수취 금액
        BigDecimal feeKrw;          // 고정 수수료(항상 KRW)
        BigDecimal baseForPanel;    // 패널 표시용 기준율

        String inputUnitLabel;      // 입력칸 단위 라벨
        String outputUnitLabel;     // 수취 단위 라벨

        if ("BUY".equals(type)) {
            // KRW -> FX(to)
            OneUnitRate rt = oneUnitRate(to);
            BigDecimal krw = nz(req.getFxAmount());
            if (krw.signum() <= 0) throw new IllegalArgumentException("환전 금액이 올바르지 않습니다.");

            // 은행 TTS 기준, 우대율만큼 (1 - comm)
            appliedRate = s6(rt.tts1.multiply(BigDecimal.ONE.subtract(comm))); // KRW/1FX

            // 수수료(원화) = 입력 KRW * 0.0002
            feeKrw = s2(krw.multiply(FEE_RATE));
            BigDecimal krwNet = krw.subtract(feeKrw).max(BigDecimal.ZERO);

            // 통화별 소수 자리수로 절사
            int scale = currencyScale(to);
            BigDecimal fxAmt = krwNet.divide(appliedRate, scale, RoundingMode.FLOOR);

            fromAmount = krw;            // KRW 출금(수수료 포함 총지출)
            expectedReceive = fxAmt;     // FX 수취
            baseForPanel = rt.base1;

            inputUnitLabel  = unitLabel(KRW);
            outputUnitLabel = unitLabel(to);

        } else { // SELL
            // FX(from) -> KRW
            OneUnitRate rf = oneUnitRate(from);
            BigDecimal fxAmt = nz(req.getFxAmount());
            if (fxAmt.signum() <= 0) throw new IllegalArgumentException("환전 금액이 올바르지 않습니다.");

            // 은행 TTB 기준, (1 + comm)
            appliedRate = s6(rf.ttb1.multiply(BigDecimal.ONE.add(comm))); // KRW/1FX

            // 원화 총액(gross) 계산 후 수수료 0.02% 차감
            BigDecimal grossKrw = fxAmt.multiply(appliedRate);
            feeKrw = s2(grossKrw.multiply(FEE_RATE));
            BigDecimal netKrw = grossKrw.subtract(feeKrw).max(BigDecimal.ZERO);

            fromAmount = fxAmt;           // FX 출금
            expectedReceive = s0(netKrw); // KRW 수취(정수 절사)
            baseForPanel = rf.base1;

            inputUnitLabel  = unitLabel(from);
            outputUnitLabel = unitLabel(KRW);
        }

        return FxExchangeCalcRespDto.builder()
                .fromCurUnit(from)
                .toCurUnit(to)
                .fromAmount(fromAmount)
                .exchangeRate(baseForPanel)
                .finalExchangeRate(appliedRate)
                .expectedCommission(feeKrw)               // 실제 차감되는 수수료(원)
                .expectedReceiveAmount(expectedReceive)   // 수수료 차감 반영된 수취액
                .baseRateToKrw(baseForPanel)
                .inputUnitLabel(inputUnitLabel)
                .outputUnitLabel(outputUnitLabel)
                .feeRateLabel(FEE_RATE_LABEL)             // ★ "0.02%" 표시용
                .build();
    }

    // ---------- execute ----------
    @Transactional
    public FxExchangeRespDto exchange(FxExchangeReqDto req) {
        FxExchangeCalcRespDto calc = calculateExchange(req);

        // 출금 계좌
        Account fromAcc = accountRepo.findByAccountNo(req.getFromAccountNo())
                .orElseThrow(() -> new IllegalArgumentException("출금 계좌를 찾을 수 없습니다."));

        // 입금 계좌
        if (req.getToAccountNo() == null || req.getToAccountNo().isBlank()) {
            throw new IllegalArgumentException("입금 계좌번호가 필요합니다.");
        }
        Account toAcc = accountRepo.findByAccountNo(req.getToAccountNo())
                .orElseThrow(() -> new IllegalArgumentException("입금 계좌를 찾을 수 없습니다."));

        // cNo 보정 (요청 없으면 출금계좌 소유주)
        Integer cNo = (req.getCNo() == null) ? fromAcc.getCNo() : req.getCNo().intValue();
        if (cNo == null) throw new IllegalStateException("고객번호(c_no)를 결정할 수 없습니다.");

        String type = (req.getTransactionType()==null)
                ? "BUY" : req.getTransactionType().trim().toUpperCase(Locale.ROOT);

        // 1) 출금 차감
        if (fromAcc.getBalance() == null) fromAcc.setBalance(BigDecimal.ZERO);
        if (fromAcc.getBalance().compareTo(calc.getFromAmount()) < 0) {
            throw new IllegalArgumentException("출금 계좌 잔액이 부족합니다.");
        }
        fromAcc.setBalance(fromAcc.getBalance().subtract(calc.getFromAmount()));
        accountRepo.save(fromAcc);

        // 2) 입금 가산 (+) 및 통화 검증
        if ("BUY".equals(type)) {
            if (!calc.getToCurUnit().equalsIgnoreCase(toAcc.getCurrency())) {
                throw new IllegalArgumentException("입금 계좌 통화가 선택된 외화(" + calc.getToCurUnit() + ")와 다릅니다.");
            }
            toAcc.setBalance(nz(toAcc.getBalance()).add(calc.getExpectedReceiveAmount())); // 외화 +
        } else {
            if (!"KRW".equalsIgnoreCase(toAcc.getCurrency())) {
                throw new IllegalArgumentException("입금 계좌는 원화(KRW)여야 합니다.");
            }
            toAcc.setBalance(nz(toAcc.getBalance()).add(calc.getExpectedReceiveAmount())); // KRW +
        }
        accountRepo.save(toAcc);

        // 3) 히스토리 적재
        String exId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        String fxCodeForHist = "SELL".equals(type) ? calc.getFromCurUnit() : calc.getToCurUnit();

        ForeignHistory hist = ForeignHistory.builder()
                .fhExId(exId)
                .cNo(cNo)
                .aNo(fromAcc.getANo())
                .fhEventType(type)
                .fhStatus("COMPLETED")
                .fhFxCurCode(fxCodeForHist)
                .fhFxAmtFc("SELL".equals(type) ? calc.getFromAmount()
                        : calc.getExpectedReceiveAmount())
                .fhAmtKrw("SELL".equals(type) ? calc.getExpectedReceiveAmount()
                        : calc.getFromAmount())
                .fhFxRateApplied(calc.getFinalExchangeRate())
                .fhOrderedAt(now)
                .memo(req.getMemo())
                .build();
        historyRepo.save(hist);

        return FxExchangeRespDto.builder()
                .transactionId(exId)
                .fromCurUnit(calc.getFromCurUnit())
                .toCurUnit(calc.getToCurUnit())
                .fromAmount(calc.getFromAmount())
                .toAmount(calc.getExpectedReceiveAmount())
                .exchangeRate(calc.getFinalExchangeRate())
                .commissionKrw(calc.getExpectedCommission()) // 수수료 금액(원)
                .updatedAt(now)
                .status(hist.getFhStatus())
                .build();
    }
}
