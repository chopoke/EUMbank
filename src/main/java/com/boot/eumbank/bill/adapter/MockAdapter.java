package com.boot.eumbank.bill.adapter;

import com.boot.eumbank.bill.model.PayCommand;
import com.boot.eumbank.bill.model.PayResult;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/** 데모용. 여러 기관 코드를 한 구현에서 처리. */
@Component
@Profile({"local","dev"})
public class MockAdapter implements BillProviderAdapter {
    private static final Set<String> SUPPORTED = Set.of("KEPCO","K_WATER","GAS","TELCO","TAX","NH_GIRO");

    @Override
    public String providerCode() { return "MOCK"; } // 개별 라우팅은 Gateway에서 SUPPORTED로 판정

    @Override
    public PayResult pay(PayCommand cmd) {
        // 멱등 키가 같으면 같은 거래ID 반환
        String base = cmd.idempotencyKey() != null ? cmd.idempotencyKey() : Long.toHexString(System.nanoTime());
        String txId = "MOCK-TX-" + base.substring(0, Math.min(12, base.length())).toUpperCase();
        String receipt = "RCPT-" + rnd6();
        // 금액 0 이하면 실패 예시
        if (cmd.amount() == null || cmd.amount().signum() <= 0) return PayResult.fail("INVALID_AMOUNT");
        return PayResult.ok(txId, receipt);
    }

    public boolean supports(String code) { return SUPPORTED.contains(code); }

    private static String rnd6() {
        int n = ThreadLocalRandom.current().nextInt(100000, 1000000);
        return Integer.toString(n);
    }
}
