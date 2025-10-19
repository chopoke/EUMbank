package com.boot.eumbank.transfer_domain.transfer.service;

import com.boot.eumbank.account.Open.model.Account;
import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.transfer_domain.account.entity.AccountLimit;
import com.boot.eumbank.transfer_domain.account.repository.Transfer_AccountLimitRepository;
import com.boot.eumbank.transfer_domain.account.repository.Transfer_AccountRepository;
import com.boot.eumbank.transfer_domain.customer.repository.Transfer_CustomerRepository;
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
import jakarta.persistence.LockModeType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    private final Transfer_CustomerRepository transferCustomerRepository;

    @Override
    @Transactional
    public TransferResponseDto processTransfer(TransferRequestDto request) {
        log.info("일반 이체 처리 시작 - 출금계좌: {}, 수취계좌: {}, 금액: {}", 
                request.getFromAccountNo(), request.getToAccount(), request.getAmount());

        // 1. 기본 검증
        validateTransferRequest(request);

        // 2. 계좌 상태 확인
        if (!checkAccountStatus(request.getFromAccountNo())) {
            throw new AccountStatusException("계좌가 이체 불가능한 상태입니다.");
        }

        // 3. 비밀번호 검증
        if (!validateAccountPassword(request.getFromAccountNo(), request.getPassword())) {
            throw new PasswordMismatchException();
        }

        // 4. 이체 한도 확인
        if (!checkTransferLimit(request.getFromAccountNo(), request.getAmount())) {
            throw LimitExceededException.perTransferLimit(BigDecimal.valueOf(1000000), request.getAmount());
        }

        // 5. 이체 실행
        TransferResultDto result = executeTransfer(
                request.getFromAccountNo(),
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
        log.info("=== TransferServiceImpl.createReserveTransfer 시작 ===");
        log.info("요청 데이터 상세: {}", request);
        log.info("예약 이체 등록 시작 - 출금계좌: {}, 수취계좌: {}, 금액: {}, 예약시간: {}", 
                request.getAccountNo(), request.getDestAccountNo(), request.getAmount(), request.getStartAt());

        try {
            // 1. 기본 검증
            log.info("1. 기본 검증 시작");
            validateReserveTransferRequest(request);
            log.info("1. 기본 검증 완료");

            // 2. 계좌 상태 확인
            log.info("2. 계좌 상태 확인 시작 - 계좌번호: {}", request.getAccountNo());
            if (!checkAccountStatus(request.getAccountNo())) {
                log.error("계좌 상태 확인 실패 - 계좌가 이체 불가능한 상태입니다.");
                throw new AccountStatusException("계좌가 이체 불가능한 상태입니다.");
            }
            log.info("2. 계좌 상태 확인 완료");

            // 3. 예약 이체 엔티티 생성
            log.info("3. 예약 이체 엔티티 생성 시작");
            log.info("3-1. OrderId 생성 시작");
            Integer orderId = generateOrderId();
            log.info("3-1. OrderId 생성 완료: {}", orderId);
            
            log.info("3-2. 날짜 파싱 시작 - startAt: {}, endAt: {}", request.getStartAt(), request.getEndAt());
            LocalDateTime startAt = parseDateTime(request.getStartAt());
            LocalDateTime endAt = parseDateTime(request.getEndAt());
            log.info("3-2. 날짜 파싱 완료 - startAt: {}, endAt: {}", startAt, endAt);
            
            log.info("3-3. 현재 시간 생성 시작");
            LocalDateTime now = LocalDateTime.now();
            log.info("3-3. 현재 시간 생성 완료: {}", now);
            
            log.info("3-4. TransferOrder Builder 호출 시작");
            TransferOrder transferOrder = TransferOrder.builder()
                    .to_order_id(orderId)
                    .a_no(request.getAccountNo())
                    .to_bank_code(request.getBankCode())
                    .to_dest_account_no(request.getDestAccountNo())
                    .to_amount(BigDecimal.valueOf(request.getAmount()))
                    .to_schedule_type(request.getScheduleType())
                    .to_schedule_expr(request.getScheduleExpr())
                    .to_start_at(startAt)
                    .to_end_at(endAt)
                    .to_status("SCHEDULED")
                    .to_memo(request.getMemo())
                    .to_created_at(now)  // 명시적으로 현재 시간 전달
                    .build();
            log.info("3-4. TransferOrder Builder 호출 완료");
            log.info("3. 예약 이체 엔티티 생성 완료: {}", transferOrder);
            log.info("3-5. to_created_at 값 확인: {}", transferOrder.getTo_created_at());

            // 4. 예약 이체 저장
            log.info("4. 예약 이체 저장 시작");
            TransferOrder savedOrder = transferOrderRepository.save(transferOrder);
            log.info("4. 예약 이체 저장 완료 - ID: {}", savedOrder.getTo_order_id());

            // 5. 응답 DTO 생성
            log.info("5. 응답 DTO 생성 시작");
            TransferOrderDto response = TransferOrderDto.builder()
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
            log.info("5. 응답 DTO 생성 완료: {}", response);
            log.info("=== TransferServiceImpl.createReserveTransfer 성공 완료 ===");
            
            return response;
            
        } catch (Exception e) {
            log.error("=== TransferServiceImpl.createReserveTransfer 실패 ===");
            log.error("예약 이체 등록 중 오류 발생", e);
            log.error("에러 타입: {}", e.getClass().getSimpleName());
            log.error("에러 메시지: {}", e.getMessage());
            if (e.getCause() != null) {
                log.error("원인 에러: {}", e.getCause().getMessage());
            }
            throw e;
        }
    }

    @Override
    @Transactional
    public BulkTransferResponseDto processBulkTransfer(BulkTransferRequestDto request) {
        log.info("다건 이체 처리 시작 - 출금계좌: {}, 수취인 수: {}", 
                request.getFromAccountNo(), request.getRecipients().size());

        // 1. 기본 검증
        validateBulkTransferRequest(request);

        // 2. 계좌 상태 확인
        if (!checkAccountStatus(request.getFromAccountNo())) {
            throw new AccountStatusException("계좌가 이체 불가능한 상태입니다.");
        }

        // 3. 비밀번호 검증
        if (!validateAccountPassword(request.getFromAccountNo(), request.getPassword())) {
            throw new PasswordMismatchException();
        }

        // 4. 총 이체 금액 계산
        int totalAmount = request.getRecipients().stream()
                .mapToInt(RecipientDto::getAmount)
                .sum();

        // 5. 총 이체 한도 확인
        if (!checkTransferLimit(request.getFromAccountNo(), totalAmount)) {
            throw LimitExceededException.perTransferLimit(BigDecimal.valueOf(1000000), totalAmount);
        }

        // 6. 각 수취인별 이체 실행
        List<TransferResultDto> results = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (RecipientDto recipient : request.getRecipients()) {
            try {
                TransferResultDto result = executeTransfer(
                        request.getFromAccountNo(),
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

        List<TransferOrder> orders = transferOrderRepository.findByAccountNoOrderByCreatedAtDesc(accountNo);
        
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
        if (!checkAccountStatus(request.getFromAccountNo())) {
            throw new AccountStatusException("계좌가 이체 불가능한 상태입니다.");
        }

        // 2. 잔액 확인
        Account account = accountRepository.findById(request.getFromAccountNo())
                .orElseThrow(() -> new AccountNotFoundException("계좌를 찾을 수 없습니다."));

        if (!account.hasSufficientBalance(BigDecimal.valueOf(request.getAmount()))) {
            throw new InsufficientBalanceException(account.getBalance(), request.getAmount());
        }

        // 3. 이체 한도 확인
        if (!checkTransferLimit(request.getFromAccountNo(), request.getAmount())) {
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

    @Transactional
    private TransferResultDto executeTransfer(Integer fromAccountNo, String toAccountNo,
                                           String toBankName, String toName, Integer amount,
                                           String memo, String password) {
        
        log.info("이체 실행 시작 - 출금계좌: {}, 수취은행: {}, 수취계좌: {}, 금액: {}", 
                fromAccountNo, toBankName, toAccountNo, amount);
        
        // === 1단계: 이체 금액 검증 ===
        if (amount == null || amount <= 0) {
            log.warn("이체 금액이 음수이거나 0입니다 - 금액: {}", amount);
            throw new InvalidAmountException(amount);
        }
        
        BigDecimal transferAmount = BigDecimal.valueOf(amount);
        
        // === 1-1단계: 자기 계좌 이체 방지 (이음은행 내부 이체만) ===
        if ("이음은행".equals(toBankName) || "EUM".equals(toBankName)) {
            Account tempFromAccount = accountRepository.findById(fromAccountNo).orElse(null);
            if (tempFromAccount != null && tempFromAccount.getAccountNo().equals(toAccountNo)) {
                log.warn("자기 계좌 이체 시도 - 계좌: {}", toAccountNo);
                throw new SameAccountTransferException(toAccountNo);
            }
        }
        
        // === 2단계: 출금 계좌 조회 및 존재 여부 확인 ===
        Account fromAccount = accountRepository.findByIdWithLock(fromAccountNo)
                .orElseThrow(() -> new AccountNotFoundException("출금 계좌를 찾을 수 없습니다."));

        log.info("출금 계좌 조회 완료 - 계좌ID: {}, 현재 잔액: {}", fromAccount.getANo(), fromAccount.getBalance());
        
        // === 2-1단계: 계좌 상태 검증 ===
        if (!"ACTIVE".equals(fromAccount.getStatus())) {
            log.warn("계좌 상태 이상 - 계좌: {}, 상태: {}", fromAccount.getAccountNo(), fromAccount.getStatus());
            throw new AccountStatusException(fromAccount.getAccountNo(), fromAccount.getStatus());
        }

        // === 3단계: 계좌 비밀번호 검증 (password가 null이면 검증 생략) ===
        if (password != null && !fromAccount.getAccountPwd().equals(password)) {
            log.warn("계좌 비밀번호 불일치 - 계좌: {}", fromAccountNo);
            throw new PasswordMismatchException(fromAccount.getAccountNo());
        }
        
        if (password == null) {
            log.info("비밀번호 검증 생략 - 계좌: {} (예약이체 자동 실행)", fromAccountNo);
        }

        // === 4단계: 잔액 검증 ===
        if (fromAccount.getBalance().compareTo(transferAmount) < 0) {
            log.warn("잔액 부족 - 현재 잔액: {}, 이체 금액: {}", fromAccount.getBalance(), transferAmount);
            throw new InsufficientBalanceException(fromAccount.getBalance(), amount);
        }

        // === 5단계: 계좌 한도 조회 및 검증 ===
        // TODO: AccountService를 통한 한도 검증 구현 필요
        // 현재는 기본적인 검증만 수행
        
        // === 6단계: 출금 처리 (잔액 차감) ===
        fromAccount.withdraw(transferAmount);
        BigDecimal afterBalance = fromAccount.getBalance();
        
        log.info("출금 처리 완료 - 차감 금액: {}, 이체 후 잔액: {}", transferAmount, afterBalance);

        // === 7단계: 입금 처리 (이음은행 내부 계좌인 경우만) ===
        Account toAccount = null;
        if ("이음은행".equals(toBankName) || "EUM".equals(toBankName)) {
            // 계좌번호로 입금 계좌 조회
            toAccount = accountRepository.findByAccountNoWithLock(toAccountNo).orElse(null);
            
            // 입금 계좌가 존재하는 경우에만 입금 처리
            if (toAccount != null) {
                BigDecimal currentBalance = toAccount.getBalance();
                BigDecimal newBalance = currentBalance.add(transferAmount);
                
                // 오버플로우 방지
                if (newBalance.compareTo(new BigDecimal("999999999999999999.99")) > 0) {
                    log.error("입금 계좌 잔액 오버플로우 위험 - 현재: {}, 입금액: {}", currentBalance, transferAmount);
                    throw new IllegalArgumentException("입금 후 잔액이 시스템 최대값을 초과합니다.");
                }
                
                toAccount.deposit(transferAmount);
                
                log.info("입금 처리 완료 - 계좌: {}, 입금액: {}, 입금 후 잔액: {}", 
                    toAccountNo, transferAmount, toAccount.getBalance());
            } else {
                log.warn("입금 계좌를 찾을 수 없음 - 계좌번호: {}", toAccountNo);
            }
        }

        // === 8단계: 출금 이체 내역 저장 ===
        String transferId = generateTransferId();
        
        TransferHistory transferHistory = TransferHistory.builder()
                .transferId(transferId)
                .accountNo(fromAccountNo)
                .amount(transferAmount)
                .memo(memo)
                .otherBank(toBankName)
                .otherAccount(toAccountNo)
                .transferType("출금")
                .afterBalance(afterBalance)
                .transactionType("WITHDRAW")
                .accountOut(transferAmount)
                .accountIn(BigDecimal.ZERO)
                .build();

        TransferHistory savedHistory = transferHistoryRepository.save(transferHistory);
        
        // === 9단계: 입금 내역 저장 (이음은행 내부 계좌인 경우만) ===
        if (toAccount != null) {
            String depositTransferId = generateTransferId();
            
            TransferHistory depositHistory = TransferHistory.builder()
                    .transferId(depositTransferId)
                    .accountNo(toAccount.getANo())
                    .amount(transferAmount)
                    .memo(memo)
                    .otherBank("이음은행")
                    .otherAccount(fromAccount.getAccountNo())
                    .transferType("입금")
                    .afterBalance(toAccount.getBalance())
                    .transactionType("DEPOSIT")
                    .accountOut(BigDecimal.ZERO)
                    .accountIn(transferAmount)
                    .build();
            
            transferHistoryRepository.save(depositHistory);
            
            log.info("입금 내역 저장 완료 - 이체ID: {}", depositTransferId);
        }
        
        log.info("이체 완료 - 이체ID: {}, 출금계좌: {}, 금액: {}, 수취은행: {}, 수취계좌: {}", 
                transferId, fromAccountNo, amount, toBankName, toAccountNo);
        
        // === 10단계: 결과 반환 ===
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
    public void executeReserveTransfer(Integer orderId) {
        log.info("예약 이체 실행 - 주문ID: {}", orderId);

        TransferOrder order = transferOrderRepository.findById(orderId)
                .orElseThrow(() -> new AccountNotFoundException("예약 이체를 찾을 수 없습니다."));

        if (!order.isScheduled()) {
            throw new TransferException("TRANSFER_ERROR", "실행 가능한 예약 이체가 아닙니다.");
        }

        try {
            // 이체 실행
            executeTransfer(
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

        } catch (Exception e) {
            // 실패 시 상태 업데이트
            order.updateStatus("FAILED");
            transferOrderRepository.save(order);
            throw e;
        }
    }

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

    public boolean validateAccountPassword(Integer accountNo, String password) {
        Account account = accountRepository.findById(accountNo)
                .orElseThrow(() -> new AccountNotFoundException("계좌를 찾을 수 없습니다."));

        // 실제로는 BCrypt 등으로 암호화된 비밀번호를 비교해야 함
        return password.equals(account.getAccountPwd());
    }

    public boolean checkAccountStatus(Integer accountNo) {
        log.info("checkAccountStatus 시작 - 계좌번호: {}", accountNo);
        
        try {
            Account account = accountRepository.findById(accountNo)
                    .orElseThrow(() -> new AccountNotFoundException("계좌를 찾을 수 없습니다."));
            
            boolean isActive = account.isActive();
            log.info("계좌 상태 확인 완료 - 계좌번호: {}, 활성상태: {}", accountNo, isActive);
            
            return isActive;
        } catch (Exception e) {
            log.error("계좌 상태 확인 중 오류 발생 - 계좌번호: {}, 에러: {}", accountNo, e.getMessage());
            throw e;
        }
    }

    // === 유틸리티 메서드들 ===

    private void validateTransferRequest(TransferRequestDto request) {
        if (request.getAmount() <= 0) {
            throw new InvalidAmountException("이체 금액은 0보다 커야 합니다.");
        }
        // 같은 계좌 이체 방지 (Integer와 String 비교)
        if (request.getFromAccountNo().toString().equals(request.getToAccount())) {
            throw new SameAccountTransferException("자기 계좌로는 이체할 수 없습니다.");
        }
    }

    private void validateReserveTransferRequest(TransferOrderDto request) {
        log.info("validateReserveTransferRequest 시작 - 요청: {}", request);
        
        if (request == null) {
            log.error("요청 데이터가 null입니다.");
            throw new IllegalArgumentException("요청 데이터가 null입니다.");
        }
        
        if (request.getAccountNo() == null) {
            log.error("계좌번호가 null입니다.");
            throw new IllegalArgumentException("계좌번호는 필수입니다.");
        }
        
        if (request.getAmount() == null || request.getAmount() <= 0) {
            log.error("이체 금액이 유효하지 않습니다: {}", request.getAmount());
            throw new InvalidAmountException("이체 금액은 0보다 커야 합니다.");
        }
        
        if (!StringUtils.hasText(request.getDestAccountNo())) {
            log.error("수취 계좌번호가 비어있습니다.");
            throw new IllegalArgumentException("수취 계좌번호는 필수입니다.");
        }
        
        if (!StringUtils.hasText(request.getStartAt())) {
            log.error("시작 시간이 비어있습니다.");
            throw new IllegalArgumentException("시작 시간은 필수입니다.");
        }
        
        log.info("validateReserveTransferRequest 완료 - 검증 통과");
    }

    private void validateBulkTransferRequest(BulkTransferRequestDto request) {
        if (request.getRecipients().isEmpty()) {
            throw new InvalidAmountException("수취인 목록이 비어있습니다.");
        }
    }

    private String generateTransferId() {
        // TRX(3자) + 타임스탬프(13자) + 랜덤(3자) = 19자
        long timestamp = System.currentTimeMillis();
        String random = UUID.randomUUID().toString().substring(0, 3).toUpperCase();
        return "TRX" + timestamp + random;
    }


    private Integer generateOrderId() {
        return (int) System.currentTimeMillis() % 1000000;
    }

    private LocalDateTime parseDateTime(String dateTimeStr) {
        log.info("parseDateTime 시작 - 입력값: '{}'", dateTimeStr);
        
        if (!StringUtils.hasText(dateTimeStr)) {
            log.warn("날짜 문자열이 비어있습니다.");
            return null;
        }
        
        // ISO 8601 형식 (2025-10-18T16:56:00) 또는 일반 형식 (2025-10-18 16:56:00) 모두 지원
        try {
            log.info("ISO 8601 형식으로 파싱 시도: {}", dateTimeStr);
            LocalDateTime result = LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
            log.info("ISO 8601 형식 파싱 성공: {}", result);
            return result;
        } catch (DateTimeParseException e) {
            log.warn("ISO 8601 형식 파싱 실패, 일반 형식으로 시도: {}", e.getMessage());
            try {
                LocalDateTime result = LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                log.info("일반 형식 파싱 성공: {}", result);
                return result;
            } catch (DateTimeParseException e2) {
                log.error("모든 형식 파싱 실패 - 입력값: '{}', ISO 에러: {}, 일반 에러: {}", 
                         dateTimeStr, e.getMessage(), e2.getMessage());
                throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다: " + dateTimeStr);
            }
        }
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

    @Override
    public List<Object> getAccounts(Customer customer) {
        log.info("계좌 목록 조회 - 고객: {}", customer.getCId());
        
        // 고객의 계좌 목록 조회
        List<Account> accounts = accountRepository.findByCNo(customer.getCustomerNo());
        
        return accounts.stream()
                .map(account -> {
                    Map<String, Object> accountInfo = new HashMap<>();
                    accountInfo.put("accountNo", account.getAccountNo());
                    accountInfo.put("accountId", account.getAId());
                    accountInfo.put("balance", account.getBalance());
                    accountInfo.put("accountType", account.getAccountType());
                    accountInfo.put("status", account.getStatus());
                    return (Object) accountInfo;
                })
                .toList();
    }

    @Override
    public Long getAccountBalance(int accountNo, Customer customer) {
        log.info("계좌 잔액 조회 - 계좌: {}, 고객: {}", accountNo, customer.getCId());
        
        Account account = accountRepository.findByAccountNo(String.valueOf(accountNo))
                .orElseThrow(() -> new AccountNotFoundException("계좌를 찾을 수 없습니다."));
        
        // 본인 계좌인지 확인
        if (!account.getCNo().equals(customer.getCustomerNo())) {
            throw new UnauthorizedException("본인 계좌가 아닙니다.");
        }
        
        return account.getBalance().longValue();
    }
    
    @Override
    public Object getAccounts() {
        log.info("계좌 목록 조회 (JWT 토큰 기반)");
        
        try {
            // SecurityContext에서 현재 인증된 사용자 정보 가져오기
            org.springframework.security.core.Authentication authentication = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !(authentication.getPrincipal() instanceof Customer)) {
                log.warn("인증된 사용자 정보를 찾을 수 없습니다.");
                return Map.of("accounts", List.of());
            }
            
            Customer customer = (Customer) authentication.getPrincipal();
            log.info("인증된 고객: {}", customer.getCId());
            
            // 고객의 실제 계좌 목록 조회
            List<Account> accounts = accountRepository.findByCNo(customer.getCustomerNo());
            log.info("조회된 계좌 수: {}", accounts.size());
            
            List<Map<String, Object>> accountList = accounts.stream()
                .map(account -> {
                    Map<String, Object> accountInfo = new HashMap<>();
                    accountInfo.put("aId", account.getAId());
                    accountInfo.put("aNo", account.getANo());
                    accountInfo.put("accountNo", account.getAccountNo());
                    accountInfo.put("balance", account.getBalance());
                    accountInfo.put("accountType", account.getAccountType());
                    accountInfo.put("status", account.getStatus());
                    accountInfo.put("cNo", account.getCNo());
                    return accountInfo;
                })
                .toList();
            
            return Map.of("accounts", accountList);
            
        } catch (Exception e) {
            log.error("계좌 목록 조회 중 오류 발생", e);
            return Map.of("accounts", List.of());
        }
    }
    
    @Override
    public Integer getAccountBalance(Integer accountNo) {
        log.info("계좌 잔액 조회 - 계좌: {}", accountNo);
        
        try {
            // SecurityContext에서 현재 인증된 사용자 정보 가져오기
            org.springframework.security.core.Authentication authentication = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !(authentication.getPrincipal() instanceof Customer)) {
                log.warn("인증된 사용자 정보를 찾을 수 없습니다.");
                throw new UnauthorizedException("인증이 필요합니다.");
            }
            
            Customer customer = (Customer) authentication.getPrincipal();
            log.info("인증된 고객: {}", customer.getCId());
            
            // 계좌 조회
            Optional<Account> accountOpt = accountRepository.findById(accountNo);
            if (accountOpt.isEmpty()) {
                throw new AccountNotFoundException("계좌를 찾을 수 없습니다: " + accountNo);
            }
            
            Account account = accountOpt.get();
            
            // 본인 계좌인지 확인
            if (!account.getCNo().equals(customer.getCustomerNo())) {
                throw new UnauthorizedException("본인 계좌가 아닙니다.");
            }
            
            return account.getBalance().intValue();
            
        } catch (Exception e) {
            log.error("계좌 잔액 조회 중 오류 발생", e);
            throw e;
        }
    }
    
    @Override
    public List<Map<String, Object>> getRecentRecipients(Integer accountNo) {
        log.info("최근 수취인 조회 - 계좌: {}", accountNo);
        
        // 최근 이체 내역에서 수취인 정보 추출 (출금 내역만)
        List<TransferHistory> recentTransfers = transferHistoryRepository
            .findByAccountNoOrderByTransferAtDescList(accountNo, 
                org.springframework.data.domain.PageRequest.of(0, 50));
        
        // 중복 제거를 위한 LinkedHashMap (순서 유지)
        java.util.LinkedHashMap<String, Map<String, Object>> uniqueRecipients = new java.util.LinkedHashMap<>();
        
        for (TransferHistory transfer : recentTransfers) {
            // 출금(송금) 내역만 처리
            if ("WITHDRAW".equals(transfer.getTransactionType())) {
                String accountKey = transfer.getOtherAccount();
                
                // 중복이 아닌 경우만 추가 (최근 순서 유지, 최대 10개)
                if (!uniqueRecipients.containsKey(accountKey) && uniqueRecipients.size() < 10) {
                    Map<String, Object> recipient = new HashMap<>();
                    
                    // 실제 예금주명 조회
                    String accountHolderName = getActualAccountHolderName(transfer.getOtherAccount(), transfer.getOtherBank());
                    
                    recipient.put("name", accountHolderName);
                    recipient.put("bank", transfer.getOtherBank() != null ? transfer.getOtherBank() : "이음은행");
                    recipient.put("account", transfer.getOtherAccount());
                    recipient.put("memo", transfer.getMemo());
                    recipient.put("amount", transfer.getAmount().intValue());
                    recipient.put("lastTransferDate", transfer.getTransferAt().toString());
                    uniqueRecipients.put(accountKey, recipient);
                }
            }
        }
        
        return new ArrayList<>(uniqueRecipients.values());
    }
    
    /**
     * 실제 예금주명 조회 (DB에서 실제 고객 정보 조회)
     */
    private String getActualAccountHolderName(String accountNumber, String bank) {
        try {
            // 이음은행 내부 계좌인 경우 실제 DB에서 조회
            if ("이음은행".equals(bank) || bank == null) {
                Optional<Account> account = accountRepository.findByAccountNo(accountNumber);
                if (account.isPresent()) {
                    return transferCustomerRepository.findById(account.get().getCNo())
                        .map(Customer::getCNameKr)
                        .orElse("이음은행 고객");
                }
            }
            
            // 타행 계좌이거나 조회 실패한 경우
            return "타행 계좌";
            
        } catch (Exception e) {
            log.error("예금주명 조회 중 오류 발생 - 계좌: {}, 은행: {}", accountNumber, bank, e);
            return "타행 계좌";
        }
    }
    
    @Override
    public List<Map<String, Object>> getFavoriteAccounts() {
        log.info("즐겨찾기 계좌 조회");
        
        // TODO: 실제 즐겨찾기 테이블에서 조회
        // 현재는 임시 하드코딩된 데이터 반환
        return List.of(
            Map.of("accountNo", "9876543210", "bankCode", "002", "bankName", "신한은행", "holderName", "김철수"),
            Map.of("accountNo", "9876543211", "bankCode", "003", "bankName", "우리은행", "holderName", "이영희")
        );
    }
    
    @Override
    public Map<String, Object> calculateTransferFee(TransferFeeRequestDto request) {
        log.info("이체 수수료 계산 - 출금계좌: {}, 수취계좌: {}, 금액: {}", 
                request.getFromAccountNo(), request.getToAccount(), request.getAmount());
        
        // 간단한 수수료 계산 로직
        Integer amount = request.getAmount();
        Integer fee = 0;
        
        // 금액에 따른 수수료 계산
        if (amount <= 100000) {
            fee = 0; // 10만원 이하는 무료
        } else if (amount <= 1000000) {
            fee = 500; // 100만원 이하는 500원
        } else {
            fee = 1000; // 100만원 초과는 1000원
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("amount", amount);
        result.put("fee", fee);
        result.put("totalAmount", amount + fee);
        result.put("feeType", "일반이체");
        
        return result;
    }
}
