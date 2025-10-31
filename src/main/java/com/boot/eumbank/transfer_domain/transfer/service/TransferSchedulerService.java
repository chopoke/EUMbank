package com.boot.eumbank.transfer_domain.transfer.service;

import com.boot.eumbank.transfer_domain.transfer.entity.TransferOrder;
import com.boot.eumbank.transfer_domain.transfer.exception.TransferException;
import com.boot.eumbank.transfer_domain.transfer.repository.Transfer_TransferOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * [예약 이체 스케줄러 서비스]
 * - 10초마다 예약 이체 실행 및 관리
 * - 주요 기능:
 *   1) 스케줄된 예약 이체 조회
 *   2) 예약 시간 도래 여부 확인
 *   3) 예약 이체 실행
 *   4) 상태 코드로 성공/실패 기록
 *   5) 반복 예약 이체 다음 스케줄 계산 및 업데이트
 */
@Service
@RequiredArgsConstructor
@Slf4j  // 로그 기록을 위한 어노테이션
public class TransferSchedulerService {

    // 의존성 주입
    private final Transfer_TransferOrderRepository transferOrderRepository;  // 예약 이체 조회/저장
    private final TransferService transferService;                  // 실제 이체 실행

    /**
     * [예약 이체 스케줄러]
     * - Spring의 @Scheduled 어노테이션을 사용하여 10초마다 자동 실행
     * - 처리 순서:
     *   1) 스케줄된 상태(SCHEDULED)의 예약 이체 목록 조회
     *   2) 각 예약 이체를 순회하며 실행 시점 확인
     *   3) 실행 시간이 된 예약 이체는 실제 이체 처리
     *   4) 성공 시 COMPLETED, 실패 시 에러 코드 저장 (삭제하지 않음)
     */
    @Scheduled(fixedRate = 10000) // 10초마다 실행 (10000ms = 10초)
    @Transactional  // 예약 이체 실행 및 상태 변경은 트랜잭션 처리 필요
    public void processScheduledTransfers() {
        
        // 로그 기록 - 스케줄러 실행 시작
//        log.info("=== 예약이체 스케줄러 실행 시작 - {} ===", LocalDateTime.now());
        
        try {
            // === 1단계: 스케줄된 예약 이체 목록 조회 (Race Condition 방지) ===
            // SELECT FOR UPDATE SKIP LOCKED를 사용하여 동시 실행 방지
            List<TransferOrder> scheduledTransfers = transferOrderRepository.findByStatusAndStartAtLessThanEqualForUpdate("SCHEDULED", LocalDateTime.now());
            
            // 로그 기록 - 조회된 예약 이체 건수
            //log.info("조회된 예약 이체 건수: {}", scheduledTransfers.size());
            
            if (scheduledTransfers.isEmpty()) {
                //log.info("실행할 예약 이체가 없습니다.");
                return;
            }

            // === 2단계: 각 예약 이체를 순회하며 처리 ===
            for (TransferOrder transferOrder : scheduledTransfers) {
//                log.info("예약 이체 처리 시작 - 주문ID: {}, 시작시간: {}, 현재시간: {}",
//                    transferOrder.getTo_order_id(),
//                    transferOrder.getTo_start_at(),
//                    LocalDateTime.now());

                // 개별 예약 이체 처리 (실행 시점 확인, 이체 실행, 상태 변경)
                processTransferOrder(transferOrder);
            }
            
            // 로그 기록 - 스케줄러 실행 완료
//            log.info("예약 이체 스케줄러 실행 완료 - 처리된 건수: {}", scheduledTransfers.size());
//            log.info("=== 예약이체 스케줄러 실행 완료 - 처리된 건수: {} ===", scheduledTransfers.size());

        } catch (Exception e) {
            // === 예외 처리 ===
            // 스케줄러 실행 중 오류가 발생해도 다음 실행에 영향을 주지 않도록 예외 처리
//            log.error("=== 예약이체 스케줄러 실행 중 오류 발생 ===", e);
        }
    }

    /**
     * [개별 예약 이체 주문 처리 메서드]
     * - 예약 이체의 실행 시점을 확인하고 처리
     * - 처리 순서:
     *   1) 현재 시간과 예약 시작 시간 비교
     *   2) 실행 시간이 된 경우 이체 실행
     *   3) 성공 시 COMPLETED, 실패 시 에러 코드 저장
     *   4) 일회성/반복성 모두 DB에서 삭제하지 않고 유지
     * 
     * @param transferOrder 처리할 예약 이체 주문
     */
    private void processTransferOrder(TransferOrder transferOrder) {
        
        // 현재 시간 조회
        LocalDateTime now = LocalDateTime.now();
        
        log.info("개별 예약 이체 처리 - 주문ID: {}, 상태: {}, 시작시간: {}, 현재시간: {}",
            transferOrder.getTo_order_id(),
            transferOrder.getTo_status(),
            transferOrder.getTo_start_at(),
            now);

        // === 실행 시점 확인 ===
        // 시작 시간이 없거나, 현재 시간이 시작 시간 이후인 경우 실행
        if (transferOrder.getTo_start_at() == null || now.isAfter(transferOrder.getTo_start_at())) {
            log.info("실행 시간 도래 - 주문ID: {}, 시작시간: {}, 현재시간: {}",
                transferOrder.getTo_order_id(),
                transferOrder.getTo_start_at(),
                now);

            try {
                // === 예약 이체 실행 전 상태 변경 (중복 실행 방지) ===
                transferOrder.updateStatus("PROCESSING");
                transferOrderRepository.save(transferOrder);
                //log.info("예약 이체 처리 시작 - 주문ID: {}, 상태: PROCESSING", transferOrder.getTo_order_id());
                
                // === 예약 이체 실행 ===
                log.info("executeReserveTransfer 호출 시작 - 주문ID: {}", transferOrder.getTo_order_id());
                transferService.executeReserveTransfer(transferOrder.getTo_order_id());
                //log.info("executeReserveTransfer 호출 완료 - 주문ID: {}", transferOrder.getTo_order_id());

                // === 성공 처리 ===
                transferOrder.updateStatus("COMPLETED");
                //log.info("예약 이체 성공 - 주문ID: {}, 상태: COMPLETED", transferOrder.getTo_order_id());
                
                // === 반복 예약 이체 처리 ===
                if (transferOrder.isRecurring()) {
                    // 반복 예약은 다음 실행 시간 계산 후 SCHEDULED로 재설정
                    LocalDateTime nextTime = calculateNextExecutionTime(transferOrder);
                    
                    // 종료 시간 확인
                    if (transferOrder.getTo_end_at() != null && nextTime.isAfter(transferOrder.getTo_end_at())) {
                        // 종료 시간 지남 → COMPLETED 유지 (더 이상 실행 안함)
                        log.info("반복 예약 이체 종료 - 주문ID: {}, 종료 시간 도달", transferOrder.getTo_order_id());
                    } else {
                        // 다음 실행 시간으로 업데이트 및 SCHEDULED로 재설정
                        transferOrder.updateNextExecutionTime(nextTime);
                        transferOrder.updateStatus("SCHEDULED");
                        log.info("반복 예약 이체 다음 스케줄 설정 - 주문ID: {}, 다음 실행: {}", 
                                transferOrder.getTo_order_id(), nextTime);
                    }
                }
                // 일회성은 COMPLETED 상태로 유지 (삭제 안함)
                
                transferOrderRepository.save(transferOrder);
                
            } catch (TransferException e) {
                // === 커스텀 예외 처리 (비즈니스 로직 오류) ===
                // 잔액 부족, 한도 초과, 계좌 상태 이상 등
                log.error("예약 이체 실패 - 주문ID: {}, 에러코드: {}, 메시지: {}", 
                        transferOrder.getTo_order_id(), e.getErrorCode(), e.getMessage());
                
                // 실패 사유(에러 코드)를 상태에 저장
                transferOrder.updateStatus(e.getErrorCode());
                transferOrderRepository.save(transferOrder);
                
            } catch (Exception e) {
                // === 일반 예외 처리 (시스템 오류) ===
                log.error("예약 이체 시스템 오류 - 주문ID: {}, 오류: {}", 
                        transferOrder.getTo_order_id(), e.getMessage(), e);
                
                // 시스템 오류는 SYSTEM_ERROR로 저장
                transferOrder.updateStatus("SYSTEM_ERROR");
                transferOrderRepository.save(transferOrder);
            }
            
        } else {
            // === 아직 실행 시간이 되지 않은 경우 ===
            log.debug("실행 시간 대기 중 - 주문ID: {}, 예약시간: {}", 
                    transferOrder.getTo_order_id(), transferOrder.getTo_start_at());
        }
    }

    /**
     * [다음 실행 시간 계산 메서드]
     * - 스케줄 표현식에 따른 다음 실행 시간 계산
     * 
     * @param transferOrder 예약 이체 주문
     * @return 다음 실행 시간
     */
    private LocalDateTime calculateNextExecutionTime(TransferOrder transferOrder) {
        
        LocalDateTime now = LocalDateTime.now();
        String scheduleExpr = transferOrder.getTo_schedule_expr();
        
        // 간단한 스케줄 표현식 처리 (실제로는 Cron 표현식 파서 사용 권장)
        if (scheduleExpr != null) {
            if (scheduleExpr.contains("DAILY")) {
                // 매일 실행
                return now.plusDays(1);
            } else if (scheduleExpr.contains("WEEKLY")) {
                // 매주 실행
                return now.plusWeeks(1);
            } else if (scheduleExpr.contains("MONTHLY")) {
                // 매월 실행
                return now.plusMonths(1);
            }
        }
        
        // 기본값: 1시간 후
        return now.plusHours(1);
    }
}
