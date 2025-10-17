package com.boot.eumbank.transfer_domain.transfer.service;

import com.boot.eumbank.transfer_domain.transfer.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * [이체 서비스 인터페이스]
 * - 이체 관련 모든 비즈니스 로직 정의
 * - 주요 기능:
 *   1) 일반 이체 (즉시 이체)
 *   2) 예약 이체 (스케줄 이체)
 *   3) 다건 이체 (일괄 이체)
 *   4) 이체 내역 조회
 *   5) 예약 이체 관리
 *   6) 이체 확인
 */
public interface TransferService {

    /**
     * [일반 이체 처리]
     * - 즉시 이체 실행
     * - 잔액 확인, 한도 확인, 비밀번호 검증 후 이체 실행
     * 
     * @param request 이체 요청 정보
     * @return 이체 결과 정보
     */
    TransferResponseDto processTransfer(TransferRequestDto request);

    /**
     * [예약 이체 등록]
     * - 스케줄된 이체 등록
     * - TransferOrder 테이블에 예약 정보 저장
     * 
     * @param request 예약 이체 요청 정보
     * @return 예약 이체 등록 결과
     */
    TransferOrderDto createReserveTransfer(TransferOrderDto request);

    /**
     * [다건 이체 처리]
     * - 여러 수취인에게 일괄 이체
     * - 하나의 출금 계좌에서 여러 계좌로 이체
     * 
     * @param request 다건 이체 요청 정보
     * @return 다건 이체 결과 정보
     */
    BulkTransferResponseDto processBulkTransfer(BulkTransferRequestDto request);

    /**
     * [이체 내역 조회]
     * - 계좌별 이체 내역 조회 (페이징)
     * - 날짜 범위, 이체 유형별 필터링 지원
     * 
     * @param accountNo 계좌 번호
     * @param type 이체 유형 (선택사항)
     * @param fromDate 시작 날짜 (선택사항)
     * @param toDate 종료 날짜 (선택사항)
     * @param pageable 페이징 정보
     * @return 이체 내역 목록 (페이징)
     */
    Page<TransferHistoryListDto> getTransferHistory(Integer accountNo, String type, 
                                                   String fromDate, String toDate, Pageable pageable);

    /**
     * [예약 이체 목록 조회]
     * - 계좌별 예약 이체 목록 조회
     * 
     * @param accountNo 계좌 번호
     * @return 예약 이체 목록
     */
    List<TransferOrderDto> getReserveTransfers(Integer accountNo);

    /**
     * [예약 이체 취소]
     * - 등록된 예약 이체 취소
     * 
     * @param orderId 예약 이체 주문 ID
     */
    void cancelReserveTransfer(Integer orderId);

    /**
     * [이체 확인]
     * - 이체 전 최종 확인 (잔액, 한도 등)
     * - 실제 이체는 실행하지 않고 확인만 수행
     * 
     * @param request 이체 확인 요청 정보
     * @return 이체 확인 결과
     */
    TransferConfirmDto confirmTransfer(TransferConfirmDto request);

    /**
     * [이체 실행 (내부 메서드)]
     * - 실제 이체 로직 실행
     * - 잔액 차감, 이체 내역 저장 등
     * 
     * @param fromAccountNo 출금 계좌 번호
     * @param toAccountNo 수취 계좌 번호
     * @param toBankName 수취 은행명
     * @param toName 수취인명
     * @param amount 이체 금액
     * @param memo 이체 메모
     * @param password 계좌 비밀번호
     * @return 이체 결과 정보
     */
    TransferResultDto executeTransfer(Integer fromAccountNo, String toAccountNo, 
                                    String toBankName, String toName, Integer amount, 
                                    String memo, String password);

    /**
     * [예약 이체 실행 (스케줄러용)]
     * - 스케줄러에서 호출하는 예약 이체 실행
     * - TransferOrder의 상태를 업데이트하며 이체 실행
     * 
     * @param orderId 예약 이체 주문 ID
     * @return 이체 실행 결과
     */
    TransferResultDto executeReserveTransfer(Integer orderId);

    /**
     * [이체 한도 확인]
     * - 1회 이체 한도, 일일 한도, 월간 한도 확인
     * 
     * @param accountNo 계좌 번호
     * @param amount 이체 금액
     * @return 한도 확인 결과 (통과/실패)
     */
    boolean checkTransferLimit(Integer accountNo, Integer amount);

    /**
     * [계좌 비밀번호 검증]
     * - 계좌 비밀번호 일치 여부 확인
     * 
     * @param accountNo 계좌 번호
     * @param password 입력된 비밀번호
     * @return 비밀번호 일치 여부
     */
    boolean validateAccountPassword(Integer accountNo, String password);

    /**
     * [계좌 상태 확인]
     * - 계좌가 이체 가능한 상태인지 확인
     * 
     * @param accountNo 계좌 번호
     * @return 계좌 상태 확인 결과
     */
    boolean checkAccountStatus(Integer accountNo);
}
