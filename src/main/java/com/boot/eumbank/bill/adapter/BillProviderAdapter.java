package com.boot.eumbank.bill.adapter;

import com.boot.eumbank.bill.model.BillInfo;
import com.boot.eumbank.bill.model.PayCommand;
import com.boot.eumbank.bill.model.PayResult;

public interface BillProviderAdapter {
    /** 기관 라우팅 키. 예: "KEPCO", "K_WATER" */
    String providerCode();

    /** 고객 청구 식별 조회(선택). 필요 없으면 기본구현 사용. */
    default BillInfo lookup(String customerNo) { return BillInfo.empty(); }

    /** 결제 실행. 성공 시 거래ID/영수증 반환. */
    PayResult pay(PayCommand cmd);
}
