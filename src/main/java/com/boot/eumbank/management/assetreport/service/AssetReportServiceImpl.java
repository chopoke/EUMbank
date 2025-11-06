package com.boot.eumbank.management.assetreport.service;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.management.assetreport.dto.*;
import com.boot.eumbank.management.assetreport.repository.AssetReportRepositoryCustom;
import com.boot.eumbank.transfer_domain.account.repository.Transfer_AccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 자산 리포트 서비스 구현 클래스
 * 
 * @author 임형욱
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssetReportServiceImpl implements AssetReportService {

    private final AssetReportRepositoryCustom reportRepository;
    private final Transfer_AccountRepository accountRepository;

    @Override
    @Transactional(readOnly = true)
    public AssetReportResponse getMonthlyReport(Integer customerNo, int year, int month) {
        log.info("월별 리포트 조회 시작: customerNo={}, year={}, month={}", customerNo, year, month);
        
        // 1. 고객의 모든 계좌번호 조회
        Set<String> accountNos = reportRepository.findAllAccountNumbersByCustomerNo(customerNo);
        if (accountNos.isEmpty()) {
            log.warn("고객의 활성 계좌가 없습니다: customerNo={}", customerNo);
            return createEmptyResponse(year, month);
        }
        
        // 2. 월의 시작일과 종료일 계산
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        
        // 3. 일별 요약 조회
        List<DailySummaryDto> dailySummaries = reportRepository.getDailySummaries(
                customerNo, accountNos, startDate, endDate);
        
        // 4. 월간 합계 계산
        long totalIncome = dailySummaries.stream()
                .mapToLong(DailySummaryDto::getIncome)
                .sum();
        
        long totalExpense = dailySummaries.stream()
                .mapToLong(DailySummaryDto::getExpense)
                .sum();
        
        long netChange = totalIncome - totalExpense;
        
        // 5. 카테고리별 집계 (지출만)
        List<CategorySummaryDto> categorySummaries = calculateCategorySummaries(
                customerNo, accountNos, startDate, endDate, totalExpense);
        
        return AssetReportResponse.builder()
                .yearMonth(String.format("%d-%02d", year, month))
                .dailySummaries(dailySummaries)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netChange(netChange)
                .categorySummaries(categorySummaries)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DailyTransactionResponse getDailyTransactions(Integer customerNo, LocalDate date) {
        log.info("일별 거래 상세 조회 시작: customerNo={}, date={}", customerNo, date);
        
        // 1. 고객의 모든 계좌번호 조회
        Set<String> accountNos = reportRepository.findAllAccountNumbersByCustomerNo(customerNo);
        if (accountNos.isEmpty()) {
            log.warn("고객의 활성 계좌가 없습니다: customerNo={}", customerNo);
            return createEmptyDailyResponse(date);
        }
        
        // 2. 해당 날짜의 외부 거래 내역 조회
        List<TransferHistory> transfers = reportRepository.findExternalTransfersByDate(
                customerNo, accountNos, date);
        
        // 3. 계좌 정보 매핑을 위한 Map 생성
        Map<Integer, Account> accountMap = getAccountMap(customerNo);
        
        // 4. DTO로 변환
        List<TransactionDetailDto> transactionDetails = transfers.stream()
                .map(t -> convertToTransactionDetailDto(t, accountMap))
                .collect(Collectors.toList());
        
        // 5. 일일 합계 계산
        long totalIncome = transactionDetails.stream()
                .filter(t -> "입금".equals(t.getTransferType()))
                .mapToLong(TransactionDetailDto::getAmount)
                .sum();
        
        long totalExpense = transactionDetails.stream()
                .filter(t -> "출금".equals(t.getTransferType()))
                .mapToLong(TransactionDetailDto::getAmount)
                .sum();
        
        long netChange = totalIncome - totalExpense;
        
        return DailyTransactionResponse.builder()
                .date(date)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .netChange(netChange)
                .transactions(transactionDetails)
                .build();
    }

    /**
     * 카테고리별 지출 집계 계산
     * 메모 내용을 기반으로 카테고리를 분류
     * 
     * @param customerNo 고객번호
     * @param accountNos 계좌번호 Set
     * @param startDate 시작일
     * @param endDate 종료일
     * @param totalExpense 월간 총 지출
     * @return 카테고리별 집계 리스트
     */
    private List<CategorySummaryDto> calculateCategorySummaries(
            Integer customerNo,
            Set<String> accountNos,
            LocalDate startDate,
            LocalDate endDate,
            long totalExpense
    ) {
        // 월별 외부 거래 내역 조회 (지출만)
        List<TransferHistory> transfers = reportRepository.findExternalTransfersByMonth(
                customerNo, accountNos, startDate, endDate);
        
        List<TransferHistory> expenses = transfers.stream()
                .filter(t -> "출금".equals(t.getTransferType()))
                .collect(Collectors.toList());
        
        // 카테고리별 집계 (메모 기반)
        Map<String, Long> categoryMap = new HashMap<>();
        
        for (TransferHistory expense : expenses) {
            String category = categorizeExpense(expense.getMemo());
            categoryMap.merge(category, expense.getAmount().longValue(), Long::sum);
        }
        
        // 비율 계산 및 정렬
        return categoryMap.entrySet().stream()
                .map(entry -> {
                    double percentage = totalExpense > 0
                            ? (entry.getValue().doubleValue() / totalExpense) * 100.0
                            : 0.0;
                    
                    return CategorySummaryDto.builder()
                            .label(entry.getKey())
                            .amount(entry.getValue())
                            .percentage(Math.round(percentage * 10.0) / 10.0) // 소수점 1자리
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getAmount(), a.getAmount())) // 금액 내림차순
                .collect(Collectors.toList());
    }

    /**
     * 지출 메모를 기반으로 카테고리 분류
     * 
     * @param memo 거래 메모
     * @return 카테고리명
     */
    private String categorizeExpense(String memo) {
        if (memo == null || memo.isBlank()) {
            return "기타";
        }
        
        String lowerMemo = memo.toLowerCase();
        
        // 주거·관리비
        if (lowerMemo.contains("월세") || lowerMemo.contains("전세") || lowerMemo.contains("관리비") 
                || lowerMemo.contains("공과금") || lowerMemo.contains("전기") || lowerMemo.contains("가스") 
                || lowerMemo.contains("수도") || lowerMemo.contains("주거") || lowerMemo.contains("아파트")) {
            return "주거 · 관리비";
        }
        
        // 식비
        if (lowerMemo.contains("식비") || lowerMemo.contains("음식") || lowerMemo.contains("카페") 
                || lowerMemo.contains("치킨") || lowerMemo.contains("피자") || lowerMemo.contains("배달") 
                || lowerMemo.contains("마트") || lowerMemo.contains("편의점") || lowerMemo.contains("식당")) {
            return "식비";
        }
        
        // 교통·이동
        if (lowerMemo.contains("교통") || lowerMemo.contains("지하철") || lowerMemo.contains("버스") 
                || lowerMemo.contains("택시") || lowerMemo.contains("주유") || lowerMemo.contains("주차") 
                || lowerMemo.contains("고속도로") || lowerMemo.contains("톨게이트")) {
            return "교통 · 이동";
        }
        
        // 여가·취미
        if (lowerMemo.contains("영화") || lowerMemo.contains("콘서트") || lowerMemo.contains("여행") 
                || lowerMemo.contains("놀이공원") || lowerMemo.contains("게임") || lowerMemo.contains("취미")) {
            return "여가 · 취미";
        }
        
        // 쇼핑
        if (lowerMemo.contains("쇼핑") || lowerMemo.contains("옷") || lowerMemo.contains("의류") 
                || lowerMemo.contains("온라인") || lowerMemo.contains("배송") || lowerMemo.contains("구매")) {
            return "쇼핑";
        }
        
        // 의료
        if (lowerMemo.contains("병원") || lowerMemo.contains("약국") || lowerMemo.contains("의료") 
                || lowerMemo.contains("진료") || lowerMemo.contains("검진")) {
            return "의료";
        }
        
        // 교육
        if (lowerMemo.contains("학원") || lowerMemo.contains("교육") || lowerMemo.contains("수업") 
                || lowerMemo.contains("강의") || lowerMemo.contains("도서")) {
            return "교육";
        }
        
        // 통신
        if (lowerMemo.contains("통신") || lowerMemo.contains("핸드폰") || lowerMemo.contains("요금") 
                || lowerMemo.contains("인터넷")) {
            return "통신";
        }
        
        // 기타
        return "기타";
    }

    /**
     * TransferHistory를 TransactionDetailDto로 변환
     */
    private TransactionDetailDto convertToTransactionDetailDto(
            TransferHistory transfer,
            Map<Integer, Account> accountMap
    ) {
        Account account = accountMap.get(transfer.getAccountNo());
        String myAccountNo = account != null ? maskAccountNumber(account.getAccountNo()) : "***";
        String myAccountNickname = account != null && account.getNickname() != null
                ? account.getNickname() : "계좌";
        
        return TransactionDetailDto.builder()
                .transferId(transfer.getTransferId())
                .transferAt(transfer.getTransferAt())
                .transferType(transfer.getTransferType())
                .amount(transfer.getAmount().longValue())
                .afterBalance(transfer.getAfterBalance() != null 
                        ? transfer.getAfterBalance().longValue() : null)
                .memo(transfer.getMemo() != null ? transfer.getMemo() : "")
                .otherBank(transfer.getOtherBank())
                .otherAccount(transfer.getOtherAccount() != null 
                        ? maskAccountNumber(transfer.getOtherAccount()) : "***")
                .myAccountNo(myAccountNo)
                .myAccountNickname(myAccountNickname)
                .build();
    }

    /**
     * 계좌번호 마스킹 처리 (보안)
     * 예: 110-123-456789 -> 110-***-****89
     */
    private String maskAccountNumber(String accountNo) {
        if (accountNo == null || accountNo.length() < 4) {
            return "***";
        }
        
        if (accountNo.contains("-")) {
            String[] parts = accountNo.split("-");
            if (parts.length == 3) {
                return parts[0] + "-***-****" + parts[2].substring(Math.max(0, parts[2].length() - 2));
            }
        }
        
        // 하이픈이 없는 경우 뒤 4자리만 표시
        return "***" + accountNo.substring(Math.max(0, accountNo.length() - 4));
    }

    /**
     * 고객의 모든 계좌 Map 생성 (계좌번호로 조회 최적화)
     */
    private Map<Integer, Account> getAccountMap(Integer customerNo) {
        List<Account> accounts = accountRepository.findByCNo(customerNo);
        return accounts.stream()
                .collect(Collectors.toMap(Account::getANo, acc -> acc));
    }

    /**
     * 빈 응답 생성 (계좌가 없을 때)
     */
    private AssetReportResponse createEmptyResponse(int year, int month) {
        return AssetReportResponse.builder()
                .yearMonth(String.format("%d-%02d", year, month))
                .dailySummaries(List.of())
                .totalIncome(0L)
                .totalExpense(0L)
                .netChange(0L)
                .categorySummaries(List.of())
                .build();
    }

    /**
     * 빈 일별 응답 생성
     */
    private DailyTransactionResponse createEmptyDailyResponse(LocalDate date) {
        return DailyTransactionResponse.builder()
                .date(date)
                .totalIncome(0L)
                .totalExpense(0L)
                .netChange(0L)
                .transactions(List.of())
                .build();
    }
}

