package com.boot.eumbank.bill.adapter;

import com.boot.eumbank.bill.entity.BillInvoice;
import com.boot.eumbank.bill.entity.UtilityBill;
import com.boot.eumbank.bill.model.PayCommand;
import com.boot.eumbank.bill.model.PayResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** 기관코드 → Adapter 라우팅 */
@Component
@RequiredArgsConstructor
public class BillGateway {
    private final List<BillProviderAdapter> adapters;
    private final MockAdapter mock; // 지원 목록 판정에 사용

    private Map<String, BillProviderAdapter> index() {
        // 명시적 매핑을 우선(실제 어댑터가 있으면 그걸 등록)
        Map<String, BillProviderAdapter> map = adapters.stream()
                .collect(Collectors.toMap(BillProviderAdapter::providerCode, a -> a, (a, b)->a));
        // MOCK 커버리지 추가
        map.putIfAbsent("KEPCO", mock);
        map.putIfAbsent("K_WATER", mock);
        map.putIfAbsent("GAS", mock);
        map.putIfAbsent("TELCO", mock);
        map.putIfAbsent("TAX", mock);
        return map;
    }

    public PayResult pay(UtilityBill bill, BillInvoice inv, BigDecimal amount, String idemKey) {
        String code = bill.getProvider().getBpvCode();
        BillProviderAdapter adapter = index().get(code);
        if (adapter == null) return PayResult.fail("NO_ADAPTER:" + code);
        return adapter.pay(new PayCommand(bill, inv, amount, idemKey));
    }
}
