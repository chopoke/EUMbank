package com.boot.eumbank.bill.core.impl;

import com.boot.eumbank.bill.core.BillAutopayService;
import com.boot.eumbank.bill.entity.BillAutopay;
import com.boot.eumbank.bill.repo.BillAutopayRepo;
import com.boot.eumbank.bill.repo.UtilityBillRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BillAutopayServiceImpl implements BillAutopayService {

    private final BillAutopayRepo repo;
    private final UtilityBillRepo ubRepo;

    @Override
    public List<BillAutopay> list(Integer ubNo) {
        return repo.findByUbNoOrderByBaNoDesc(ubNo);
    }

    @Override
    @Transactional
    public BillAutopay create(Integer ubNo, Integer aNo, Integer payDay, String payTime, String memo) {
        // 존재 체크(유저 소유 검증은 필요하면 여기서 ubRepo로 수행)
        ubRepo.findById(ubNo).orElseThrow();

        if (aNo == null) throw new IllegalArgumentException("aNo required");
        if (payDay == null || payDay < 1 || payDay > 31) throw new IllegalArgumentException("payDay 1..31");

        // uq_ba(ub_no,a_no) 충돌 시 활성화+값 갱신으로 업서트
        BillAutopay ap = repo.findAll().stream()
                .filter(x -> ubNo.equals(x.getUbNo()) && aNo.equals(x.getANo()))
                .findFirst()
                .orElseGet(BillAutopay::new);

        ap.setUbNo(ubNo);
        ap.setANo(aNo);
        ap.setBaActive("Y");
        ap.setBaPayDay(payDay);
        ap.setBaPayTime((payTime == null || payTime.isBlank()) ? "09:00:00" : payTime);
        ap.setBaMemo(memo == null ? "" : memo.trim());
        if (ap.getBaNo() == null) {
            ap.setBaStartedAt(LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0));
            ap.setBaCreatedAt(LocalDateTime.now());
        }
        ap.setBaUpdatedAt(LocalDateTime.now());
        return repo.save(ap);
    }

    @Override
    @Transactional
    public BillAutopay patch(Integer baNo, String active, Integer payDay, String payTime, String memo) {
        BillAutopay ap = repo.findById(baNo).orElseThrow();

        if (active != null) ap.setBaActive(active.equalsIgnoreCase("Y") ? "Y" : "N");
        if (payDay != null) {
            if (payDay < 1 || payDay > 31) throw new IllegalArgumentException("payDay 1..31");
            ap.setBaPayDay(payDay);
        }
        if (payTime != null && !payTime.isBlank()) ap.setBaPayTime(payTime);
        if (memo != null) ap.setBaMemo(memo.trim());

        ap.setBaUpdatedAt(LocalDateTime.now());
        return repo.save(ap);
    }

    @Override
    @Transactional
    public void delete(Integer baNo) {
        repo.deleteById(baNo);
    }
}
