package com.boot.eumbank.bill.service;

import com.boot.eumbank.bill.entity.BillAutopay;
import com.boot.eumbank.bill.entity.QBillAutopay;
import com.boot.eumbank.bill.entity.UtilityBill;
import com.boot.eumbank.bill.repo.BillAutopayRepo;
import com.boot.eumbank.bill.repo.UtilityBillRepo;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class BillAutopayService {
    private final BillAutopayRepo apRepo;
    private final UtilityBillRepo billRepo;
    private final JPAQueryFactory qf;

    public BillAutopay create(Integer ubNo, Integer aNo, Integer payDay, String payTime,
                              LocalDate startDate, LocalDate endDateOrNull, String memo) {
        UtilityBill bill = billRepo.findById(ubNo).orElseThrow();

        // 겹침 검사: [start, end) with TIMESTAMP
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDateOrNull==null ? null : endDateOrNull.atStartOfDay();

        QBillAutopay A = QBillAutopay.billAutopay;
        BooleanExpression active = A.baActive.eq("Y").and(A.bill.ubNo.eq(ubNo));
        BooleanExpression overlaps = A.baStartedAt.before(end==null? LocalDateTime.of(9999,12,31,0,0): end)
                .and(A.baEndedAt.isNull().or(A.baEndedAt.after(start)));

        boolean exists = qf.selectOne().from(A).where(active.and(overlaps)).fetchFirst()!=null;
        if (exists) throw new IllegalStateException("스케줄 겹침");

        BillAutopay ap = new BillAutopay();
        ap.setBill(bill);
        ap.setANo(aNo);
        ap.setBaActive("Y");
        ap.setBaPayDay(payDay);
        ap.setBaPayTime(payTime);          // "HH:MM:SS"
        ap.setBaStartedAt(start);
        ap.setBaEndedAt(end);
        ap.setBaMemo(memo);
        return apRepo.save(ap);
    }
}

