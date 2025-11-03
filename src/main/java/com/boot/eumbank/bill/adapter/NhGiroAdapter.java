// src/main/java/com/boot/eumbank/bill/adapter/NhGiroAdapter.java
package com.boot.eumbank.bill.adapter;

import com.boot.eumbank.bill.config.NhGiroProperties;
import com.boot.eumbank.bill.model.PayCommand;
import com.boot.eumbank.bill.model.PayResult;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Component
@Profile({"nh","prod"}) // dev/local에서는 MockAdapter만 활성화
@RequiredArgsConstructor
public class NhGiroAdapter implements BillProviderAdapter {

    private final NhGiroProperties prop;
    private final @Qualifier("billRestTemplate") RestTemplate billRestTemplate;

    @Override
    public String providerCode() {
        return "NH_GIRO"; // BILL_PROVIDER_TBL.bpv_code 와 일치
    }

    private HttpHeaders headers(String apiName, String idempotencyKey) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("Api-Name", apiName);
        h.set("Api-Key", prop.apiKey());
        h.set("Org-Code", prop.orgCode());
        h.set("Idempotency-Key",
                (idempotencyKey != null && !idempotencyKey.isBlank())
                        ? idempotencyKey
                        : UUID.randomUUID().toString());
        return h;
    }

    @Override
    public PayResult pay(PayCommand cmd) {
        var inv    = cmd.invoice();
        var bill   = cmd.bill();
        var amount = cmd.amount();
        var idem   = cmd.idempotencyKey();

        // 0) 필수값 검증 → 명확한 실패 사유 반환
        if (inv == null)   return new PayResult(false, null, null, "invoice is null");
        if (bill == null)  return new PayResult(false, null, null, "bill is null");
        if (amount == null)return new PayResult(false, null, null, "amount is null");
        String giroNo = inv.getBiProviderBillId();
        if (giroNo == null || giroNo.isBlank())
            return new PayResult(false, null, null, "provider bill id is empty");
        String contractNo = bill.getUbCustomerNum(); // 계약/고객번호
        if (contractNo == null || contractNo.isBlank())
            return new PayResult(false, null, null, "contract/customer number is empty");

        // 1) 요청 바디 구성: Map.of 금지(null 허용 가능한 구조 사용)
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("giroNo", giroNo);
        body.put("amount", amount);
        body.put("contractNo", contractNo);
        // 선택 필드는 존재할 때만 추가
        if (inv.getBiBillYm() != null) body.put("ym", inv.getBiBillYm());
        if (inv.getBiDueAt()  != null) body.put("dueAt", inv.getBiDueAt().toString());

        HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, headers("GIRO_PAY", idem));

        try {
            ResponseEntity<Map> res = billRestTemplate.postForEntity(
                    prop.baseUrl() + "/giro/pay", req, Map.class);

            boolean ok = res.getStatusCode().is2xxSuccessful();
            Map m = res.getBody();
            String txId    = m != null ? String.valueOf(m.getOrDefault("txId", "")) : "";
            String receipt = m != null ? String.valueOf(m.getOrDefault("receiptNo", "")) : "";

            return new PayResult(ok, txId, receipt, ok ? "OK" : "FAIL");
        } catch (Exception e) {
            // 외부 오류는 메세지 포함해 실패로 반환
            return new PayResult(false, null, null, "nh gateway error: " + e.getMessage());
        }
    }
}
