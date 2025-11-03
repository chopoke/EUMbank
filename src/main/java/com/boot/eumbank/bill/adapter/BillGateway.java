// com.boot.eumbank.bill.adapter.BillGateway
package com.boot.eumbank.bill.adapter;

import com.boot.eumbank.bill.entity.BillInvoice;
import com.boot.eumbank.bill.entity.UtilityBill;
import com.boot.eumbank.bill.model.PayCommand;
import com.boot.eumbank.bill.model.PayResult;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class BillGateway {
    private final List<BillProviderAdapter> adapters;
    private final ObjectProvider<MockAdapter> mockOpt; // ← 선택 주입

    private Map<String, BillProviderAdapter> index() {
        Map<String, BillProviderAdapter> map = adapters.stream()
                .collect(Collectors.toMap(BillProviderAdapter::providerCode, a -> a, (a, b) -> a));

        MockAdapter mock = mockOpt.getIfAvailable();
        if (mock != null) {
            map.putIfAbsent("KEPCO", mock);
            map.putIfAbsent("K_WATER", mock);
            map.putIfAbsent("GAS", mock);
            map.putIfAbsent("TELCO", mock);
            map.putIfAbsent("TAX", mock);
        }
        return map;
    }

    public PayResult pay(UtilityBill bill, BillInvoice inv, BigDecimal amount, String idempotencyKey) {
        String code = bill.getProvider().getBpvCode();
        BillProviderAdapter adapter = index().get(code);
        if (adapter == null) return new PayResult(false, null, null, "NO_ADAPTER:" + code);
        return adapter.pay(new PayCommand(bill, inv, amount, idempotencyKey));
    }
}
