package com.boot.eumbank.mypage.service;

import com.boot.eumbank.mypage.dto.MypageSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.boot.eumbank.mypage.repository.MypageSummaryRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MypageSummaryService {

    private final MypageSummaryRepository repo;

    public MypageSummaryDto getSummary(int cNo) {
        Object[] row = repo.sumInstallmentForCustomer(cNo);
        long total = num(row[0]);
        long paid  = num(row[1]);
        BigDecimal target = bd(row[2]);
        BigDecimal acc    = bd(row[3]);

        double percent = (total > 0) ? (paid * 100.0 / total) : 0.0;
        String nextDue = calcNextDueDate(repo.findDistinctPayDays(cNo));

        var tops = repo.topInstallments(cNo).stream()
                .map(r -> new MypageSummaryDto.TopAccount(
                        String.valueOf(r[0]),
                        String.valueOf(r[1]),
                        String.valueOf(r[2]),
                        bd(r[3])
                ))
                .toList();

        return new MypageSummaryDto(percent, (int) paid, (int) total, acc, target, nextDue, tops);
    }

    private static long num(Object o){ return (o==null)?0L:((Number)o).longValue(); }
    private static BigDecimal bd(Object o){ return (o==null)?BigDecimal.ZERO:new BigDecimal(o.toString()); }

    // i_pay_day(1~31) 기준으로 오늘 이후 가장 빠른 납입일
    private static String calcNextDueDate(List<Integer> payDays){
        if (payDays==null || payDays.isEmpty()) return null;
        LocalDate today = LocalDate.now();
        YearMonth ym = YearMonth.from(today);

        var candidates = payDays.stream().flatMap(day -> {
            LocalDate thisMonth = clamp(ym, day);
            LocalDate nextMonth = clamp(ym.plusMonths(1), day);
            return List.of(thisMonth, nextMonth).stream();
        }).filter(d -> !d.isBefore(today)).sorted().toList();

        return candidates.isEmpty()? null : candidates.get(0).toString();
    }
    private static LocalDate clamp(YearMonth ym, int day){
        int last = ym.lengthOfMonth();
        int d = Math.max(1, Math.min(day, last));
        return ym.atDay(d);
    }
}
