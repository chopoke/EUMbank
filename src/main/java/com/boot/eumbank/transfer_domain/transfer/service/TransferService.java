package com.boot.eumbank.transfer_domain.transfer.service;

import com.boot.eumbank.transfer_domain.transfer.dto.*;
import com.boot.eumbank.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TransferService {
    
    // 일반 이체
    TransferResponseDto processTransfer(TransferRequestDto request);
    
    // 예약 이체
    TransferOrderDto createReserveTransfer(TransferOrderDto request);
    
    // 다건 이체
    BulkTransferResponseDto processBulkTransfer(BulkTransferRequestDto request);
    
    // 이체 내역 조회
    Page<TransferHistoryListDto> getTransferHistory(Integer accountNo, String type,
                                                   String fromDate, String toDate, Pageable pageable);
    
    // 예약 이체 목록 조회
    List<TransferOrderDto> getReserveTransfers(Integer accountNo);
    
    // 예약 이체 취소
    void cancelReserveTransfer(Integer orderId);
    
    // 이체 확인
    TransferConfirmDto confirmTransfer(TransferConfirmDto request);
    
    // 예약 이체 실행
    void executeReserveTransfer(Integer orderId);
    
    // 계좌 잔액 조회
    Long getAccountBalance(int accountNo, Customer customer);
    
    // 계좌 목록 조회
    List<Object> getAccounts(Customer customer);
}