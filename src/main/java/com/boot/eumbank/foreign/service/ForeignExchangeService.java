package com.boot.eumbank.foreign.service;

import com.boot.eumbank.account.Open.model.Account;
import com.boot.eumbank.account.Open.repository.AccountRepo;
import com.boot.eumbank.foreign.dto.FxExchangeCalcRespDto;
import com.boot.eumbank.foreign.dto.FxExchangeReqDto;
import com.boot.eumbank.foreign.dto.FxExchangeRespDto;
import com.boot.eumbank.foreign.entity.ForeignHistory;
import com.boot.eumbank.foreign.entity.ForeignRate;
// (ENUM을 쓰실 경우 주석 해제)
// import com.boot.eumbank.foreign.entity.FxStatus;
import com.boot.eumbank.foreign.repo.ForeignHistoryRepo;
import com.boot.eumbank.foreign.repo.ForeignRateRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForeignExchangeService {

    private final ForeignHistoryRepo historyRepo;
    private final AccountRepo accountRepo;
    private final ForeignRateRepo foreignRateRepo;

    /* ---------------- 공통 상수/유틸 ---------------- */

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final RoundingMode RM = RoundingMode.HALF_UP;

    private record Rate(String code, BigDecimal deal, BigDecimal ttb, BigDecimal tts) {}

    /** KRW 더미 (1.0) */
    private Rate krw() {
        return new Rate("KRW", BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE);
    }

    /** 통화 코드로 최신 환율 가져오기 (DB) */
    private Rate getRate(String cur) {
        if (cur == null) throw new IllegalArgumentException("통화를 선택해 주세요.");
        if ("KRW".equalsIgnoreCase(cur)) return krw();

        ForeignRate r = foreignRateRepo.findTopByFrCurUnitOrderByFrNoDesc(cur)
                .orElseThrow(() -> new IllegalArgumentException(cur + " 환율 정보를 찾을 수 없습니다."));

        return new Rate(
                r.getFrCurUnit(),
                nz(r.getFrDealBas()),
                nz(r.getFrTtb()),
                nz(r.getFrTts())
        );
    }

    /** null-safe Object → BigDecimal */
    private BigDecimal nz(Object v) {
        if (v == null) return BigDecimal.ZERO;
        if (v instanceof BigDecimal bd) return bd;
        return new BigDecimal(String.valueOf(v).trim());
    }

    /** 우대율(%) → 0~0.9 계수 */
    private BigDecimal toFeeRate(BigDecimal commissionRatePct) {
        BigDecimal pct = commissionRatePct == null ? BigDecimal.ZERO : commissionRatePct;
        if (pct.compareTo(BigDecimal.ZERO) < 0 || pct.compareTo(new BigDecimal("90")) > 0) {
            throw new IllegalArgumentException("우대율은 0~90% 범위여야 합니다.");
        }
        return pct.divide(HUNDRED, 8, RM);
    }

    /* ---------------- 계산 로직 (공용) ---------------- */

    private static class CalcOut {
        BigDecimal fromAmount;         // 입력 금액 (From 통화)
        BigDecimal toAmount;           // 수취 금액 (To 통화)
        BigDecimal finalRate;          // 표시용 최종 환율
        BigDecimal commissionKrw;      // 수수료(KRW 환산)
        BigDecimal baseRateToKrw;      // 기준율(표시)
    }

    /** SELL/BUY/CROSS 공통 계산 */
    private CalcOut doCalc(FxExchangeReqDto req) {
        if (req.getFromCurUnit() == null || req.getToCurUnit() == null)
            throw new IllegalArgumentException("통화를 선택해 주세요.");
        if (req.getFxAmount() == null || req.getFxAmount().compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("환전 금액을 올바르게 입력해 주세요.");
        if (req.getTransactionType() == null)
            throw new IllegalArgumentException("거래 유형을 선택해 주세요.");

        BigDecimal amt = req.getFxAmount();
        BigDecimal feeRate = toFeeRate(req.getCommissionRate());

        Rate from = getRate(req.getFromCurUnit());
        Rate to   = getRate(req.getToCurUnit());

        CalcOut out = new CalcOut();
        out.fromAmount = amt;

        String type = req.getTransactionType().toUpperCase();
        switch (type) {
            case "SELL" -> {
                // FX -> KRW : 은행이 FX를 사는 환율 = from.ttb
                BigDecimal ttb = from.ttb();
                BigDecimal krwBefore = amt.multiply(ttb);
                BigDecimal fee = krwBefore.multiply(feeRate);
                BigDecimal take = krwBefore.subtract(fee);

                out.toAmount = take.setScale(0, RM);     // KRW
                out.finalRate = ttb.multiply(BigDecimal.ONE.subtract(feeRate));
                out.commissionKrw = fee.setScale(0, RM);
                out.baseRateToKrw = from.deal();
            }
            case "BUY" -> {
                // KRW -> FX : 은행이 FX를 파는 환율 = to.tts
                BigDecimal tts = to.tts();
                BigDecimal fxBefore = amt.divide(tts, 8, RM);
                BigDecimal feeFx = fxBefore.multiply(feeRate);
                BigDecimal takeFx = fxBefore.subtract(feeFx);

                out.toAmount = takeFx.setScale(4, RM);   // FX
                out.finalRate = tts.multiply(BigDecimal.ONE.add(feeRate));
                out.commissionKrw = feeFx.multiply(tts).setScale(0, RM);
                out.baseRateToKrw = to.deal();
            }
            case "CROSS" -> {
                // FX1 -> FX2 : (FX1→KRW: from.ttb) -> (KRW→FX2: to.tts)
                BigDecimal ttb1 = from.ttb();
                BigDecimal tts2 = to.tts();

                BigDecimal krw1 = amt.multiply(ttb1);
                BigDecimal fee1 = krw1.multiply(feeRate);
                BigDecimal krw2 = krw1.subtract(fee1);

                BigDecimal fx2Before = krw2.divide(tts2, 8, RM);
                BigDecimal fee2 = fx2Before.multiply(feeRate);
                BigDecimal takeFx2 = fx2Before.subtract(fee2);

                out.toAmount = takeFx2.setScale(4, RM);
                out.finalRate = krw2.divide(amt, 8, RM).divide(tts2, 8, RM);
                out.commissionKrw = fee1.add(fee2.multiply(tts2)).setScale(0, RM);
                out.baseRateToKrw = from.deal();
            }
            default -> throw new IllegalArgumentException("지원하지 않는 거래 유형입니다: " + req.getTransactionType());
        }

        if (!"KRW".equalsIgnoreCase(req.getToCurUnit())) {
            out.toAmount = out.toAmount.setScale(4, RM);
        }
        out.finalRate = out.finalRate.setScale(6, RM);
        return out;
    }

    /* ---------------- 공개 메서드 ---------------- */

    /** 미리보기 계산 */
    public FxExchangeCalcRespDto calculateExchange(FxExchangeReqDto req) {
        CalcOut c = doCalc(req);

        return FxExchangeCalcRespDto.builder()
                .fromCurUnit(req.getFromCurUnit())
                .toCurUnit(req.getToCurUnit())
                .fromAmount(c.fromAmount.setScale(4, RM))
                .exchangeRate(c.baseRateToKrw)             // 매매 기준율(표시)
                .finalExchangeRate(c.finalRate)            // 우대율 반영
                .expectedCommission(c.commissionKrw)       // KRW 환산 수수료
                .expectedReceiveAmount(c.toAmount)         // 수취 금액
                .baseRateToKrw(c.baseRateToKrw)
                .build();
    }

    /** 환전 신청(거래 실행) */
    @Transactional
    public FxExchangeRespDto exchange(FxExchangeReqDto req) {
        // 동일 로직으로 금액/환율 산출
        CalcOut c = doCalc(req);

        // 출금 계좌 한 번만 조회해서 aNo / cNo 둘 다 확보
        Account acc = accountRepo.findByAccountNo(req.getFromAccountNo())
                .orElseThrow(() -> new IllegalArgumentException("출금 계좌를 찾을 수 없습니다."));

        Integer aNo = acc.getANo();  // 계좌 PK
        Integer cNo = acc.getCNo();  // 고객 PK (NOT NULL)

        // (선택) BUY 시 원화 잔액 검증
        if ("BUY".equalsIgnoreCase(req.getTransactionType())) {
            if (acc.getBalance().compareTo(c.toAmount) < 0) {
                throw new IllegalArgumentException("출금 계좌 잔액이 부족합니다.");
            }
        }

        String exId = "FX" + System.currentTimeMillis()
                + ThreadLocalRandom.current().nextInt(1000, 9999);

        ForeignHistory h = ForeignHistory.builder()
                .cNo(cNo)                                   // 고객번호 저장 (NULL 아님)
                .aNo(aNo)
                .fhEventType(req.getTransactionType())
                .fhFxCurCode(req.getFromCurUnit())
                .fhFxAmtFc(req.getFxAmount())               // 항상 From 기준
                .fhAmtKrw("KRW".equalsIgnoreCase(req.getToCurUnit()) ? c.toAmount : null)
                .fhFxRateApplied(c.finalRate)
                .memo(req.getMemo())
                .fhOrderedAt(LocalDateTime.now())
                .fhExId(exId)
                // ENUM을 쓰실 경우: .fhStatus(FxStatus.REQUESTED.name())
                .fhStatus("REQUESTED")                      // ★ 신청 상태로 저장
                .build();

        historyRepo.save(h);

        return FxExchangeRespDto.builder()
                .transactionId(exId)
                .fromCurUnit(req.getFromCurUnit())
                .toCurUnit(req.getToCurUnit())
                .fromAmount(req.getFxAmount())
                .toAmount(c.toAmount)               // KRW 또는 FX
                .exchangeRate(c.finalRate)          // 적용 환율
                .commissionKrw(c.commissionKrw)
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
