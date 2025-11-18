package com.boot.eumbank.spot.admin.service;

import com.boot.eumbank.spot.admin.dto.SpotAdminStatisticsDTO;
import com.boot.eumbank.spot.admin.dto.SpotUserHoldingsDTO;
import com.boot.eumbank.spot.model.GoldCustomer;
import com.boot.eumbank.spot.model.GoldTbl;
import com.boot.eumbank.spot.model.GoldWallet;
import com.boot.eumbank.spot.model.Price;
import com.boot.eumbank.spot.repository.GoldCustomerRepository;
import com.boot.eumbank.spot.repository.GoldTblRepository;
import com.boot.eumbank.spot.repository.GoldWalletRepository;
import com.boot.eumbank.spot.service.price.PriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 현물 관리자 서비스 구현체
 * 관리자 대시보드에서 사용할 현물 통계 데이터 제공
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SpotAdminServiceImpl implements SpotAdminService {
    
    private final GoldWalletRepository goldWalletRepository;
    private final GoldTblRepository goldTblRepository;
    private final GoldCustomerRepository goldCustomerRepository;
    private final PriceService priceService;
    
    @Override
    public SpotAdminStatisticsDTO getSpotStatistics() {
        try {
            // 1. 지갑 통계 (한 번만 조회하여 재사용)
            List<GoldWallet> allWallets = goldWalletRepository.findAll();
            Long totalWalletCount = (long) allWallets.size();
            
            BigDecimal totalCashBalance = BigDecimal.ZERO;
            BigDecimal totalGoldBalance = BigDecimal.ZERO;
            BigDecimal totalSilverBalance = BigDecimal.ZERO;
            
            for (GoldWallet wallet : allWallets) {
                if (wallet.getGwCashBalance() != null) {
                    totalCashBalance = totalCashBalance.add(wallet.getGwCashBalance());
                }
                if (wallet.getGwGoldBalance() != null) {
                    totalGoldBalance = totalGoldBalance.add(wallet.getGwGoldBalance());
                }
                if (wallet.getGwSilverBalance() != null) {
                    totalSilverBalance = totalSilverBalance.add(wallet.getGwSilverBalance());
                }
            }
            
            // 2. 현재 시세 조회
            BigDecimal currentGoldPrice = BigDecimal.ZERO;
            BigDecimal currentSilverPrice = BigDecimal.ZERO;
            try {
                Price goldPrice = priceService.getLatestPrice("AU");
                if (goldPrice != null) {
                    currentGoldPrice = goldPrice.getPBuyPrice();
                }
            } catch (Exception e) {
                log.warn("금 시세 조회 실패: {}", e.getMessage());
            }
            
            try {
                Price silverPrice = priceService.getLatestPrice("AG");
                if (silverPrice != null) {
                    currentSilverPrice = silverPrice.getPBuyPrice();
                }
            } catch (Exception e) {
                log.warn("은 시세 조회 실패: {}", e.getMessage());
            }
            
            // 3. 평가액 계산
            BigDecimal totalGoldEvaluation = currentGoldPrice.multiply(totalGoldBalance)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalSilverEvaluation = currentSilverPrice.multiply(totalSilverBalance)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal totalSpotAssets = totalCashBalance
                    .add(totalGoldEvaluation)
                    .add(totalSilverEvaluation)
                    .setScale(2, RoundingMode.HALF_UP);
            
            // 4. 거래 통계 (한 번만 조회하여 재사용)
            List<GoldTbl> allTransactions = goldTblRepository.findAll();
            Long totalTransactionCount = (long) allTransactions.size();
            BigDecimal totalTransactionAmount = BigDecimal.ZERO;
            for (GoldTbl transaction : allTransactions) {
                if (transaction.getGTotalPrice() != null) {
                    totalTransactionAmount = totalTransactionAmount.add(transaction.getGTotalPrice());
                }
            }
            totalTransactionAmount = totalTransactionAmount.setScale(2, RoundingMode.HALF_UP);
            
            // 5. 고객 통계 (한 번만 조회하여 재사용)
            List<GoldCustomer> allCustomers = goldCustomerRepository.findAll();
            Long totalSpotCustomerCount = (long) allCustomers.size();
            BigDecimal totalInvestment = BigDecimal.ZERO;
            BigDecimal totalProfitLoss = BigDecimal.ZERO;
            for (GoldCustomer customer : allCustomers) {
                if (customer.getGcTotalInvestment() != null) {
                    totalInvestment = totalInvestment.add(customer.getGcTotalInvestment());
                }
                if (customer.getGcTotalProfitLoss() != null) {
                    totalProfitLoss = totalProfitLoss.add(customer.getGcTotalProfitLoss());
                }
            }
            totalInvestment = totalInvestment.setScale(2, RoundingMode.HALF_UP);
            totalProfitLoss = totalProfitLoss.setScale(2, RoundingMode.HALF_UP);
            
            return SpotAdminStatisticsDTO.builder()
                    .totalWalletCount(totalWalletCount)
                    .totalCashBalance(totalCashBalance.setScale(2, RoundingMode.HALF_UP))
                    .totalGoldBalance(totalGoldBalance.setScale(3, RoundingMode.HALF_UP))
                    .totalSilverBalance(totalSilverBalance.setScale(3, RoundingMode.HALF_UP))
                    .currentGoldPrice(currentGoldPrice.setScale(2, RoundingMode.HALF_UP))
                    .currentSilverPrice(currentSilverPrice.setScale(2, RoundingMode.HALF_UP))
                    .totalGoldEvaluation(totalGoldEvaluation)
                    .totalSilverEvaluation(totalSilverEvaluation)
                    .totalSpotAssets(totalSpotAssets)
                    .totalTransactionCount(totalTransactionCount)
                    .totalTransactionAmount(totalTransactionAmount)
                    .totalSpotCustomerCount(totalSpotCustomerCount)
                    .totalInvestment(totalInvestment)
                    .totalProfitLoss(totalProfitLoss)
                    .build();
                    
        } catch (Exception e) {
            log.error("현물 통계 조회 중 오류 발생: {}", e.getMessage(), e);
            // 오류 발생 시 기본값 반환
            return SpotAdminStatisticsDTO.builder()
                    .totalWalletCount(0L)
                    .totalCashBalance(BigDecimal.ZERO)
                    .totalGoldBalance(BigDecimal.ZERO)
                    .totalSilverBalance(BigDecimal.ZERO)
                    .currentGoldPrice(BigDecimal.ZERO)
                    .currentSilverPrice(BigDecimal.ZERO)
                    .totalGoldEvaluation(BigDecimal.ZERO)
                    .totalSilverEvaluation(BigDecimal.ZERO)
                    .totalSpotAssets(BigDecimal.ZERO)
                    .totalTransactionCount(0L)
                    .totalTransactionAmount(BigDecimal.ZERO)
                    .totalSpotCustomerCount(0L)
                    .totalInvestment(BigDecimal.ZERO)
                    .totalProfitLoss(BigDecimal.ZERO)
                    .build();
        }
    }

    @Override
    public List<SpotUserHoldingsDTO> getUserHoldings() {
        try {
            Map<Long, SpotUserHoldingsDTO> holdingsMap = new HashMap<>();
            List<GoldWallet> wallets = goldWalletRepository.findAllWithCustomer();
            
            for (GoldWallet wallet : wallets) {
                if (wallet.getCustomer() == null || wallet.getCustomer().getCustomerNo() == null) {
                    continue;
                }
                
                Long customerNo = wallet.getCustomer().getCustomerNo().longValue();
                String userId = wallet.getCustomer().getUserId();
                
                SpotUserHoldingsDTO dto = holdingsMap.computeIfAbsent(customerNo, k -> {
                    SpotUserHoldingsDTO newDto = new SpotUserHoldingsDTO();
                    newDto.setCustomerNo(k);
                    newDto.setUserId(userId);
                    newDto.setGold(BigDecimal.ZERO);
                    newDto.setSilver(BigDecimal.ZERO);
                    return newDto;
                });
                
                if (wallet.getGwGoldBalance() != null) {
                    dto.setGold(dto.getGold().add(wallet.getGwGoldBalance()));
                }
                if (wallet.getGwSilverBalance() != null) {
                    dto.setSilver(dto.getSilver().add(wallet.getGwSilverBalance()));
                }
            }
            
            return new ArrayList<>(holdingsMap.values());
            
        } catch (Exception e) {
            log.error("회원별 현물 보유량 조회 중 오류 발생: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }
}

