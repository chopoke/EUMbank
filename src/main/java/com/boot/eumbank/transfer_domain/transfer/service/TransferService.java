package com.boot.eumbank.transfer_domain.transfer.service;

import com.boot.eumbank.transfer_domain.transfer.dto.*;
import com.boot.eumbank.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface TransferService {
    
    // 일반 이체
    TransferResponseDto processTransfer(TransferRequestDto request);
    
    // 예약 이체
    TransferOrderDto createReserveTransfer(TransferOrderDto request);
    
    // 자동이체 (매월 지정일 반복)
    AutoTransferResponseDto createAutoTransfer(AutoTransferRequestDto request);
    
    // 다건 이체
    BulkTransferResponseDto processBulkTransfer(BulkTransferRequestDto request);
    
    // 이체 내역 조회
    Page<TransferHistoryListDto> getTransferHistory(Integer accountNo, String type,
                                                   String fromDate, String toDate, Pageable pageable);
    
    // 예약 이체 목록 조회
    List<TransferOrderDto> getReserveTransfers(Integer accountNo);
    
    // 예약 이체 취소
    void cancelReserveTransfer(Integer orderId);
    
    // 예약/자동 이체 상태 일괄 변경
    void updateTransferOrderStatus(List<Integer> orderIds, String targetStatus);
    
    // 이체 확인
    TransferConfirmDto confirmTransfer(TransferConfirmDto request);
    
    // 예약 이체 실행
    void executeReserveTransfer(Integer orderId);
    
    // 계좌 잔액 조회
    Long getAccountBalance(int accountNo, Customer customer);
    
    // 계좌 목록 조회 (JWT 토큰 기반)
    Object getAccounts();
    
    // 계좌 잔액 조회 (JWT 토큰 기반)
    Long getAccountBalance(Integer accountNo);
    
    // 최근 수취인 조회
    List<Map<String, Object>> getRecentRecipients(Integer accountNo);
    
    // 즐겨찾기 계좌 조회
    List<Map<String, Object>> getFavoriteAccounts();
    
    // 이체 수수료 계산
    Map<String, Object> calculateTransferFee(TransferFeeRequestDto request);
    
    // 실제 예금주명 조회
    String getActualAccountHolderName(String accountNumber, String bank);
}