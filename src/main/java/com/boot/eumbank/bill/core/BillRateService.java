package com.boot.eumbank.bill.core;

import java.math.BigDecimal;

public interface BillRateService {
    BigDecimal calcWater(BigDecimal usageM3); // 요금 = 7000 + 164*usage
    BigDecimal calcGas(BigDecimal usageM3);   // 요금 = 2000 + 19.5*usage
    // 전기는 OO구간제일 수 있으나 본 과제는 외부 API 평균단가 * 사용량으로 단순화
    BigDecimal calcElectric(BigDecimal usageKwh, BigDecimal avgUnitPrice);
}
