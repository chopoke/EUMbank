package com.boot.eumbank.asset.assetreport.repository;

import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.asset.assetreport.dto.DailySummaryDto;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.boot.eumbank.account.open.entity.account.QAccount.account;
import static com.boot.eumbank.account.select.entity.QTransferHistory.transferHistory;

/**
 * 자산 리포트 QueryDSL 구현 Repository
 * 타인과의 거래만 필터링하여 조회
 * 
 * @author 임형욱
 */
@Slf4j
@Repository
@RequiredArgsConstructor
public class AssetReportRepositoryImpl implements AssetReportRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Set<String> findAllAccountNumbersByCustomerNo(Integer customerNo) {
        log.debug("고객 계좌번호 조회: customerNo={}", customerNo);
        
        List<String> accountNumbers = queryFactory
                .select(account.accountNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.eq("ACTIVE"))
                )
                .fetch();
        
        return Set.copyOf(accountNumbers);
    }

    @Override
    public List<TransferHistory> findExternalTransfersByMonth(
            Integer customerNo,
            Set<String> accountNos,
            LocalDate startDate,
            LocalDate endDate
    ) {
        log.debug("월별 외부 거래 조회: customerNo={}, startDate={}, endDate={}", 
                customerNo, startDate, endDate);
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
        
        // 고객의 모든 계좌 PK 조회
        List<Integer> accountIds = queryFactory
                .select(account.aNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.eq("ACTIVE"))
                )
                .fetch();
        
        if (accountIds.isEmpty()) {
            return List.of();
        }
        
        // 해당 계좌들의 거래 내역 중
        // otherAccount가 내 계좌 목록에 없는 것만 조회 (타인과의 거래)
        // otherAccount가 null이면 외부 거래로 간주 (입금의 경우 등)
        List<TransferHistory> transfers = queryFactory
                .selectFrom(transferHistory)
                .where(
                        transferHistory.accountNo.in(accountIds)
                                .and(transferHistory.transferAt.between(startDateTime, endDateTime))
                                // otherAccount가 null이거나, 내 계좌 목록에 없어야 함
                                .and(
                                        transferHistory.otherAccount.isNull()
                                                .or(transferHistory.otherAccount.notIn(accountNos))
                                )
                )
                .orderBy(transferHistory.transferAt.asc())
                .fetch();
        
        log.debug("조회된 외부 거래 건수: {}", transfers.size());
        return transfers;
    }

    @Override
    public List<TransferHistory> findExternalTransfersByDate(
            Integer customerNo,
            Set<String> accountNos,
            LocalDate date
    ) {
        log.debug("일별 외부 거래 조회: customerNo={}, date={}", customerNo, date);
        
        LocalDateTime startDateTime = date.atStartOfDay();
        LocalDateTime endDateTime = date.atTime(LocalTime.MAX);
        
        // 고객의 모든 계좌 PK 조회
        List<Integer> accountIds = queryFactory
                .select(account.aNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.eq("ACTIVE"))
                )
                .fetch();
        
        if (accountIds.isEmpty()) {
            return List.of();
        }
        
        // 해당 날짜의 거래 내역 중 타인과의 거래만 조회
        // otherAccount가 null이면 외부 거래로 간주
        List<TransferHistory> transfers = queryFactory
                .selectFrom(transferHistory)
                .where(
                        transferHistory.accountNo.in(accountIds)
                                .and(transferHistory.transferAt.between(startDateTime, endDateTime))
                                .and(
                                        transferHistory.otherAccount.isNull()
                                                .or(transferHistory.otherAccount.notIn(accountNos))
                                )
                )
                .orderBy(transferHistory.transferAt.asc())
                .fetch();
        
        log.debug("조회된 일별 외부 거래 건수: {}", transfers.size());
        return transfers;
    }

    @Override
    public List<DailySummaryDto> getDailySummaries(
            Integer customerNo,
            Set<String> accountNos,
            LocalDate startDate,
            LocalDate endDate
    ) {
        log.debug("일별 요약 조회: customerNo={}, startDate={}, endDate={}", 
                customerNo, startDate, endDate);
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);
        
        // 고객의 모든 계좌 PK 조회
        List<Integer> accountIds = queryFactory
                .select(account.aNo)
                .from(account)
                .where(
                        account.cNo.eq(customerNo)
                                .and(account.status.eq("ACTIVE"))
                )
                .fetch();
        
        if (accountIds.isEmpty()) {
            return List.of();
        }
        
        // 전체 거래 내역 조회 (메모리에서 그룹화)
        List<TransferHistory> transfers = queryFactory
                .selectFrom(transferHistory)
                .where(
                        transferHistory.accountNo.in(accountIds)
                                .and(transferHistory.transferAt.between(startDateTime, endDateTime))
                                .and(
                                        transferHistory.otherAccount.isNull()
                                                .or(transferHistory.otherAccount.notIn(accountNos))
                                )
                )
                .orderBy(transferHistory.transferAt.asc())
                .fetch();
        
        // 날짜별로 그룹화하여 집계
        Map<LocalDate, DailySummaryDto> dailyMap = new HashMap<>();
        
        for (TransferHistory transfer : transfers) {
            LocalDate date = transfer.getTransferAt().toLocalDate();
            DailySummaryDto summary = dailyMap.computeIfAbsent(date, d ->
                    DailySummaryDto.builder()
                            .date(d)
                            .income(0L)
                            .expense(0L)
                            .netChange(0L)
                            .transactionCount(0)
                            .build()
            );
            
            // 수입/지출 합계
            if ("입금".equals(transfer.getTransferType())) {
                summary.setIncome(summary.getIncome() + transfer.getAmount().longValue());
            } else if ("출금".equals(transfer.getTransferType())) {
                summary.setExpense(summary.getExpense() + transfer.getAmount().longValue());
            }
            
            // 거래 건수 증가
            summary.setTransactionCount(summary.getTransactionCount() + 1);
            
            // 순변동 계산
            summary.setNetChange(summary.getIncome() - summary.getExpense());
        }
        
        // 날짜순으로 정렬하여 반환
        return dailyMap.values().stream()
                .sorted(Comparator.comparing(DailySummaryDto::getDate))
                .collect(Collectors.toList());
    }
}

