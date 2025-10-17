package com.boot.eumbank.transfer_domain.transfer.service;

import com.boot.eumbank.account.Open.model.Account;
import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.transfer_domain.account.entity.AccountLimit;
import com.boot.eumbank.transfer_domain.account.repository.Transfer_AccountLimitRepository;
import com.boot.eumbank.transfer_domain.account.repository.Transfer_AccountRepository;
import com.boot.eumbank.transfer_domain.transfer.dto.*;
import com.boot.eumbank.transfer_domain.transfer.entity.TransferOrder;
import com.boot.eumbank.transfer_domain.transfer.exception.*;
import com.boot.eumbank.transfer_domain.transfer.repository.Transfer_TransferHistoryRepository;
import com.boot.eumbank.transfer_domain.transfer.repository.Transfer_TransferOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * [이체 서비스 구현체]
 * - 이체 관련 모든 비즈니스 로직 구현
 * - 기존 Entity들을 사용하여 구성이 완전히 동일한 이체 로직 구현
 */
@Service("transferDomainService")
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TransferServiceImpl implements TransferService {

    private final Transfer_AccountRepository accountRepository;
    private final Transfer_AccountLimitRepository accountLimitRepository;
    private final Transfer_TransferHistoryRepository transferHistoryRepository;
    private final Transfer_TransferOrderRepository transferOrderRepository;

    @Override
    @Transactional
    public TransferResponseDto processTransfer(TransferRequestDto request) {
        log.info("일반 이체 처리 시작 - 출금계좌: {}, 수취계좌: {}, 금액: {}", 
                request.getFromAccountNo(), request.getToAccount(), request.getAmount());

        // 1. 기본 검증
        validateTransferRequest(request);

        // 2. 계좌 상태 확인
        if (!checkAccountStatus(request.getFromAccountNo().intValue())) {
            throw new AccountStatusException("계좌가 이체 불가능한 상태입니다.");
        }

        // 3. 비밀번호 검증
        if (!validateAccountPassword(request.getFromAccountNo().intValue(), request.getPassword())) {
            throw new PasswordMismatchException();
        }

        // 4. 이체 한도 확인
        if (!checkTransferLimit(request.getFromAccountNo().intValue(), request.getAmount())) {
            throw LimitExceededException.perTransferLimit(BigDecimal.valueOf(1000000), request.getAmount());
        }

        // 5. 이체 실행
        TransferResultDto result = executeTransfer(
                request.getFromAccountNo().intValue(),
                request.getToAccount(),
                request.getToBank(),
                request.getToName(),
                request.getAmount(),
                request.getMemo(),
                request.getPassword()
        );

        // 6. 응답 DTO 생성
        return TransferResponseDto.builder()
                .transferId(result.getTransferId())
                .transferNo(result.getTransferNo().longValue())
                .accountId(request.getFromAccountId())
                .amount(BigDecimal.valueOf(request.getAmount()))
                .memo(request.getMemo())
                .transferAt(LocalDateTime.now())
                .otherBank(request.getToBank())
                .otherAccount(request.getToAccount())
                .transferType("TRANSFER")
                .afterBalance(result.getAfterBalance())
                .transactionType("OUT")
                .accountOut(BigDecimal.valueOf(request.getAmount()))
                .accountIn(BigDecimal.ZERO)
                .build();
    }

    @Override
    @Transactional
    public TransferOrderDto createReserveTransfer(TransferOrderDto request) {
        log.info("예약 이체 등록 시작 - 출금계좌: {}, 수취계좌: {}, 금액: {}, 예약시간: {}", 
                request.getAccountNo(), request.getDestAccountNo(), request.getAmount(), request.getStartAt());

        // 1. 기본 검증
        validateReserveTransferRequest(request);

        // 2. 계좌 상태 확인
        if (!checkAccountStatus(request.getAccountNo())) {
            throw new AccountStatusException("계좌가 이체 불가능한 상태입니다.");
        }

        // 3. 예약 이체 엔티티 생성
        TransferOrder transferOrder = TransferOrder.builder()
                .to_order_id(generateOrderId())
                .a_no(request.getAccountNo())
                .to_bank_code(request.getBankCode())
                .to_dest_account_no(request.getDestAccountNo())
                .to_amount(BigDecimal.valueOf(request.getAmount()))
                .to_schedule_type(request.getScheduleType())
                .to_schedule_expr(request.getScheduleExpr())
                .to_start_at(parseDateTime(request.getStartAt()))
                .to_end_at(parseDateTime(request.getEndAt()))
                .to_status("SCHEDULED")
                .to_memo(request.getMemo())
                .build();

        // 4. 예약 이체 저장
        TransferOrder savedOrder = transferOrderRepository.save(transferOrder);

        // 5. 응답 DTO 생성
        return TransferOrderDto.builder()
                .orderId(savedOrder.getTo_order_id())
                .accountNo(savedOrder.getA_no())
                .bankCode(savedOrder.getTo_bank_code())
                .destAccountNo(savedOrder.getTo_dest_account_no())
                .amount(savedOrder.getTo_amount().intValue())
                .scheduleType(savedOrder.getTo_schedule_type())
                .scheduleExpr(savedOrder.getTo_schedule_expr())
                .startAt(formatDateTime(savedOrder.getTo_start_at()))
                .endAt(formatDateTime(savedOrder.getTo_end_at()))
                .status(savedOrder.getTo_status())
                .memo(savedOrder.getTo_memo())
                .createdAt(formatDateTime(savedOrder.getTo_created_at()))
                .build();
    }

    @Override
    @Transactional
    public BulkTransferResponseDto processBulkTransfer(BulkTransferRequestDto request) {
        log.info("다건 이체 처리 시작 - 출금계좌: {}, 수취인 수: {}", 
                request.getFromAccountNo(), request.getRecipients().size());

        // 1. 기본 검증
        validateBulkTransferRequest(request);

        // 2. 계좌 상태 확인
        if (!checkAccountStatus(request.getFromAccountNo().intValue())) {
            throw new AccountStatusException("계좌가 이체 불가능한 상태입니다.");
        }

        // 3. 비밀번호 검증
        if (!validateAccountPassword(request.getFromAccountNo().intValue(), request.getPassword())) {
            throw new PasswordMismatchException();
        }

        // 4. 총 이체 금액 계산
        int totalAmount = request.getRecipients().stream()
                .mapToInt(RecipientDto::getAmount)
                .sum();

        // 5. 총 이체 한도 확인
        if (!checkTransferLimit(request.getFromAccountNo().intValue(), totalAmount)) {
            throw LimitExceededException.perTransferLimit(BigDecimal.valueOf(1000000), totalAmount);
        }

        // 6. 각 수취인별 이체 실행
        List<TransferResultDto> results = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (RecipientDto recipient : request.getRecipients()) {
            try {
                TransferResultDto result = executeTransfer(
                        request.getFromAccountNo().intValue(),
                        recipient.getAccountNo(),
                        recipient.getBankName(),
                        recipient.getName(),
                        recipient.getAmount(),
                        recipient.getMemo(),
                        request.getPassword()
                );
                results.add(result);
            } catch (Exception e) {
                log.error("다건 이체 중 오류 발생 - 수취인: {}, 오류: {}", 
                        recipient.getName(), e.getMessage());
                errors.add(recipient.getName() + ": " + e.getMessage());
            }
        }

        // 7. 응답 DTO 생성
        return BulkTransferResponseDto.builder()
                .totalCount(request.getRecipients().size())
                .successCount(results.size())
                .failCount(errors.size())
                .results(results)
                .errors(errors)
                .totalAmount(totalAmount)
                .build();
    }

    @Override
    public Page<TransferHistoryListDto> getTransferHistory(Integer accountNo, String type, 
                                                         String fromDate, String toDate, Pageable pageable) {
        log.info("이체 내역 조회 - 계좌: {}, 유형: {}, 시작일: {}, 종료일: {}", 
                accountNo, type, fromDate, toDate);

        // TransferHistory 조회 (간단한 구현)
        List<TransferHistory> allHistory = transferHistoryRepository.findAll();
        List<TransferHistory> filteredHistory = allHistory.stream()
                .filter(h -> h.getAccountNo().equals(accountNo))
                .filter(h -> type == null || h.getTransferType().equals(type))
                .toList();
        
        // 페이징 처리
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredHistory.size());
        List<TransferHistory> pageContent = filteredHistory.subList(start, end);
        
        Page<TransferHistory> historyPage = new org.springframework.data.domain.PageImpl<>(
                pageContent, pageable, filteredHistory.size());

        // TransferHistory를 TransferHistoryListDto로 변환
        return historyPage.map(this::convertToHistoryListDto);
    }

    @Override
    public List<TransferOrderDto> getReserveTransfers(Integer accountNo) {
        log.info("예약 이체 목록 조회 - 계좌: {}", accountNo);

        List<TransferOrder> orders = transferOrderRepository.findByA_noOrderByTo_created_atDesc(accountNo);
        
        return orders.stream()
                .map(this::convertToTransferOrderDto)
                .toList();
    }

    @Override
    @Transactional
    public void cancelReserveTransfer(Integer orderId) {
        log.info("예약 이체 취소 - 주문ID: {}", orderId);

        TransferOrder order = transferOrderRepository.findById(orderId)
                .orElseThrow(() -> new AccountNotFoundException("예약 이체를 찾을 수 없습니다."));

        if (order.isCompleted()) {
            throw new TransferException("TRANSFER_ERROR", "이미 완료된 예약 이체는 취소할 수 없습니다.");
        }

        order.cancel();
        transferOrderRepository.save(order);
    }

    @Override
    public TransferConfirmDto confirmTransfer(TransferConfirmDto request) {
        log.info("이체 확인 - 출금계좌: {}, 수취계좌: {}, 금액: {}", 
                request.getFromAccountNo(), request.getToAccount(), request.getAmount());

        // 1. 계좌 상태 확인
        if (!checkAccountStatus(request.getFromAccountNo().intValue())) {
            throw new AccountStatusException("계좌가 이체 불가능한 상태입니다.");
        }

        // 2. 잔액 확인
        Account account = accountRepository.findByAccountNo(request.getFromAccountNo().toString())
                .orElseThrow(() -> new AccountNotFoundException("계좌를 찾을 수 없습니다."));

        if (!account.hasSufficientBalance(BigDecimal.valueOf(request.getAmount()))) {
            throw new InsufficientBalanceException(account.getBalance(), request.getAmount());
        }

        // 3. 이체 한도 확인
        if (!checkTransferLimit(request.getFromAccountNo().intValue(), request.getAmount())) {
            throw LimitExceededException.perTransferLimit(BigDecimal.valueOf(1000000), request.getAmount());
        }

        // 4. 응답 DTO 생성
        return TransferConfirmDto.builder()
                .fromAccountNo(request.getFromAccountNo())
                .toAccount(request.getToAccount())
                .amount(request.getAmount())
                .currentBalance(account.getBalance())
                .availableBalance(account.getBalance())
                .transferLimit(getTransferLimit(request.getFromAccountNo()))
                .canTransfer(true)
                .message("이체 가능합니다.")
                .build();
    }

    @Override
    @Transactional
    public TransferResultDto executeTransfer(Integer fromAccountNo, String toAccountNo, 
                                           String toBankName, String toName, Integer amount, 
                                           String memo, String password) {
        log.info("이체 실행 - 출금계좌: {}, 수취계좌: {}, 금액: {}", fromAccountNo, toAccountNo, amount);

        // 1. 출금 계좌 조회
        Account fromAccount = accountRepository.findByAccountNo(fromAccountNo.toString())
                .orElseThrow(() -> new AccountNotFoundException("출금 계좌를 찾을 수 없습니다."));

        // 2. 잔액 확인
        if (!fromAccount.hasSufficientBalance(BigDecimal.valueOf(amount))) {
            throw new InsufficientBalanceException(fromAccount.getBalance(), amount);
        }

        // 3. 이체 실행 (잔액 차감)
        fromAccount.withdraw(BigDecimal.valueOf(amount));
        accountRepository.save(fromAccount);

        // 4. 이체 내역 저장
        String transferId = generateTransferId();
        TransferHistory transferHistory = TransferHistory.builder()
                .transferId(transferId)
                .accountNo(fromAccountNo)
                .amount(BigDecimal.valueOf(amount))
                .memo(memo)
                .otherBank(toBankName)
                .otherAccount(toAccountNo)
                .transferType("TRANSFER")
                .afterBalance(fromAccount.getBalance())
                .transactionType("OUT")
                .accountOut(BigDecimal.valueOf(amount))
                .accountIn(BigDecimal.ZERO)
                .build();

        TransferHistory savedHistory = transferHistoryRepository.save(transferHistory);

        // 5. 결과 반환
        return TransferResultDto.builder()
                .transferId(transferId)
                .transferNo(savedHistory.getTransferNo())
                .fromAccountNo(fromAccountNo)
                .toAccountNo(toAccountNo)
                .amount(amount)
                .afterBalance(fromAccount.getBalance())
                .transferAt(LocalDateTime.now())
                .success(true)
                .message("이체가 완료되었습니다.")
                .build();
    }

    @Override
    @Transactional
    public TransferResultDto executeReserveTransfer(Integer orderId) {
        log.info("예약 이체 실행 - 주문ID: {}", orderId);

        TransferOrder order = transferOrderRepository.findById(orderId)
                .orElseThrow(() -> new AccountNotFoundException("예약 이체를 찾을 수 없습니다."));

        if (!order.isScheduled()) {
            throw new TransferException("TRANSFER_ERROR", "실행 가능한 예약 이체가 아닙니다.");
        }

        try {
            // 이체 실행
            TransferResultDto result = executeTransfer(
                    order.getA_no(),
                    order.getTo_dest_account_no(),
                    order.getTo_bank_code(),
                    "수취인", // 실제로는 수취인명을 별도로 저장해야 함
                    order.getTo_amount().intValue(),
                    order.getTo_memo(),
                    null // 예약 이체는 비밀번호 검증 생략
            );

            // 예약 이체 상태 업데이트
            order.complete();
            transferOrderRepository.save(order);

            return result;

        } catch (Exception e) {
            // 실패 시 상태 업데이트
            order.updateStatus("FAILED");
            transferOrderRepository.save(order);
            throw e;
        }
    }

    @Override
    public boolean checkTransferLimit(Integer accountNo, Integer amount) {
        // 계좌 한도 정보 조회
        Optional<AccountLimit> limitOpt = accountLimitRepository.findByAccountNo(accountNo);
        
        if (limitOpt.isEmpty()) {
            // 한도 정보가 없으면 기본 한도 적용 (예: 1,000만원)
            return amount <= 10_000_000;
        }

        AccountLimit limit = limitOpt.get();
        
        // 1회 이체 한도 확인
        if (amount > limit.getPerTransferLimit().intValue()) {
            return false;
        }

        // 일일 이체 한도 확인 (실제로는 오늘 이체액을 계산해야 함)
        // 여기서는 간단히 1회 한도의 10배로 설정
        if (amount > limit.getPerTransferLimit().multiply(BigDecimal.TEN).intValue()) {
            return false;
        }

        return true;
    }

    @Override
    public boolean validateAccountPassword(Integer accountNo, String password) {
        Account account = accountRepository.findByAccountNo(accountNo.toString())
                .orElseThrow(() -> new AccountNotFoundException("계좌를 찾을 수 없습니다."));

        // 실제로는 BCrypt 등으로 암호화된 비밀번호를 비교해야 함
        return password.equals(account.getAccountPwd());
    }

    @Override
    public boolean checkAccountStatus(Integer accountNo) {
        Account account = accountRepository.findByAccountNo(accountNo.toString())
                .orElseThrow(() -> new AccountNotFoundException("계좌를 찾을 수 없습니다."));

        return account.isActive();
    }

    // === 유틸리티 메서드들 ===

    private void validateTransferRequest(TransferRequestDto request) {
        if (request.getAmount() <= 0) {
            throw new InvalidAmountException("이체 금액은 0보다 커야 합니다.");
        }
        if (request.getFromAccountNo().equals(request.getToAccount())) {
            throw new SameAccountTransferException("자기 계좌로는 이체할 수 없습니다.");
        }
    }

    private void validateReserveTransferRequest(TransferOrderDto request) {
        if (request.getAmount() <= 0) {
            throw new InvalidAmountException("이체 금액은 0보다 커야 합니다.");
        }
    }

    private void validateBulkTransferRequest(BulkTransferRequestDto request) {
        if (request.getRecipients().isEmpty()) {
            throw new InvalidAmountException("수취인 목록이 비어있습니다.");
        }
    }

    private String generateTransferId() {
        return "T" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8);
    }

    private Integer generateOrderId() {
        return (int) System.currentTimeMillis() % 1000000;
    }

    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (!StringUtils.hasText(dateTimeStr)) {
            return null;
        }
        return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }

    private java.sql.Timestamp parseTimestamp(String dateStr) {
        if (!StringUtils.hasText(dateStr)) {
            return null;
        }
        return java.sql.Timestamp.valueOf(dateStr + " 00:00:00");
    }

    private TransferHistoryListDto convertToHistoryListDto(TransferHistory history) {
        return TransferHistoryListDto.builder()
                .transferNo(history.getTransferNo())
                .transferId(history.getTransferId())
                .amount(history.getAmount())
                .memo(history.getMemo())
                .transferAt(history.getTransferAt())
                .otherBank(history.getOtherBank())
                .otherAccount(history.getOtherAccount())
                .transferType(history.getTransferType())
                .afterBalance(history.getAfterBalance())
                .transactionType(history.getTransactionType())
                .accountOut(history.getAccountOut())
                .accountIn(history.getAccountIn())
                .build();
    }

    private TransferOrderDto convertToTransferOrderDto(TransferOrder order) {
        return TransferOrderDto.builder()
                .orderId(order.getTo_order_id())
                .accountNo(order.getA_no())
                .bankCode(order.getTo_bank_code())
                .destAccountNo(order.getTo_dest_account_no())
                .amount(order.getTo_amount().intValue())
                .scheduleType(order.getTo_schedule_type())
                .scheduleExpr(order.getTo_schedule_expr())
                .startAt(formatDateTime(order.getTo_start_at()))
                .endAt(formatDateTime(order.getTo_end_at()))
                .status(order.getTo_status())
                .memo(order.getTo_memo())
                .createdAt(formatDateTime(order.getTo_created_at()))
                .build();
    }

    private BigDecimal getTransferLimit(Integer accountNo) {
        return accountLimitRepository.findByAccountNo(accountNo)
                .map(AccountLimit::getPerTransferLimit)
                .orElse(BigDecimal.valueOf(10_000_000)); // 기본 한도
    }
}
