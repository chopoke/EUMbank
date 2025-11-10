package com.boot.eumbank.bill.core.impl;

import com.boot.eumbank.bill.core.BillRateService;
import com.boot.eumbank.bill.repo.GasRateRepo;
import com.boot.eumbank.bill.repo.WaterRateRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class BillRateServiceImpl implements BillRateService {
    private final WaterRateRepo waterRepo; private final GasRateRepo gasRepo;
    @Override public BigDecimal calcWater(BigDecimal usage) {
        var r = waterRepo.latest();
        return r.getWrBaseCharge().add(r.getWrUnitPrice().multiply(usage)).setScale(0, RoundingMode.HALF_UP);
    }
    @Override public BigDecimal calcGas(BigDecimal usage) {
        var r = gasRepo.latest();
        return r.getGrBaseCharge().add(r.getGrUnitPrice().multiply(usage)).setScale(0, RoundingMode.HALF_UP);
    }
    @Override public BigDecimal calcElectric(BigDecimal usage, BigDecimal avgUnit) {
        return avgUnit.multiply(usage).setScale(0, RoundingMode.HALF_UP);
    }
}
