package com.boot.eumbank.transfer_domain.transfer.exception;

import java.math.BigDecimal;

/**
 * [이체 한도 초과 예외]
 * - 1회 이체 한도, 일일 한도, 월간 한도 초과 시 발생
 */
public class LimitExceededException extends TransferException {
    
    /**
     * 1회 이체 한도 초과
     */
    public static LimitExceededException perTransferLimit(BigDecimal limit, Long amount) {
        return new LimitExceededException("PER_TRANSFER_LIMIT_EXCEEDED",
                String.format("1회 이체 한도를 초과했습니다. (한도: ₩%,d원, 이체 시도: ₩%,d원)",
                             limit.longValue(), amount));
    }
    
    /**
     * 일일 이체 한도 초과
     */
    public static LimitExceededException dailyLimit(BigDecimal limit, Integer todayTotal, Long amount) {
        return new LimitExceededException("DAILY_LIMIT_EXCEEDED",
                String.format("일일 이체 한도를 초과했습니다. (한도: ₩%,d원, 오늘 이체액: ₩%,d원, 추가 시도: ₩%,d원)",
                             limit.longValue(), todayTotal, amount));
    }
    
    /**
     * 월간 이체 한도 초과
     */
    public static LimitExceededException monthlyLimit(BigDecimal limit, Integer monthTotal, Long amount) {
        return new LimitExceededException("MONTHLY_LIMIT_EXCEEDED",
                String.format("월간 이체 한도를 초과했습니다. (한도: ₩%,d원, 이번 달 이체액: ₩%,d원, 추가 시도: ₩%,d원)",
                             limit.longValue(), monthTotal, amount));
    }
    
    private LimitExceededException(String errorCode, String message) {
        super(errorCode, message);
    }
}

