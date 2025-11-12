package com.boot.eumbank.spot.service.trading;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.account.select.repository.TransferHistoryRepository;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.spot.service.SpotAccountService;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.spot.dto.GoldTblDto;
import com.boot.eumbank.spot.dto.GoldCustomerDto;
import com.boot.eumbank.spot.dto.GoldProductDto;
import com.boot.eumbank.spot.dto.GoldWalletDto;
import com.boot.eumbank.spot.model.GoldCustomer;
import com.boot.eumbank.spot.model.GoldProduct;
import com.boot.eumbank.spot.model.GoldTbl;
import com.boot.eumbank.spot.model.GoldWallet;
import com.boot.eumbank.spot.model.Price;
import com.boot.eumbank.spot.repository.GoldCustomerRepository;
import com.boot.eumbank.spot.repository.GoldProductRepository;
import com.boot.eumbank.spot.repository.GoldTblRepository;
import com.boot.eumbank.spot.repository.GoldTblQueryDSLRepository;
import com.boot.eumbank.spot.repository.GoldWalletRepository;
import com.boot.eumbank.spot.service.price.PriceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;
import java.text.DecimalFormat;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class TradingService {
    
    private final GoldTblRepository goldTblRepository;
    private final GoldTblQueryDSLRepository goldTblQueryDSLRepository;
    private final CustomerRepo customerRepo;
    private final GoldCustomerRepository goldCustomerRepository;
    private final GoldProductRepository goldProductRepository;
    private final PriceService priceService;
    private final GoldWalletRepository goldWalletRepository;
    private final SpotAccountService spotAccountService;
    private final TransferHistoryRepository transferHistoryRepository;
    
    // 기본 수수료 및 세금 요율
    private static final BigDecimal BANK_FEE_RATE = new BigDecimal("0.01"); // 1%
    private static final BigDecimal TAX_RATE = new BigDecimal("0.10"); // 10%
    
    // 상품별 수수료 할인 (대량 구매 시)
    private static final BigDecimal LARGE_QUANTITY_DISCOUNT_RATE = new BigDecimal("0.005"); // 0.5% (100g 이상)
    private static final BigDecimal MEDIUM_QUANTITY_DISCOUNT_RATE = new BigDecimal("0.007"); // 0.7% (10g 이상)

    
    /**
     * 금/은 매수 처리 (계좌 시스템 연동)
     */
    @Transactional
    public GoldTbl buyMetal(Integer customerNo, String productId, BigDecimal quantity, String walletName, String walletPin) {
        // 지갑 PIN 검증 (필수)
        if (walletPin == null || walletPin.trim().isEmpty()) {
            throw new RuntimeException("지갑 PIN이 필요합니다.");
        }
        
        // 지갑 이름 처리: null이면 첫 번째 지갑 사용
        if (walletName == null || walletName.trim().isEmpty()) {
            List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo.longValue());
            if (wallets.isEmpty()) {
                throw new RuntimeException("거래를 위해서는 지갑이 필요합니다. 먼저 지갑을 개설해주세요.");
            }
            walletName = wallets.get(0).getGwWalletName();
        }
        
        try {
            // 고객 정보 조회
            Customer customer = customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            // 상품 정보 조회
            GoldProduct product = goldProductRepository.findByGpId(productId)
                .orElseThrow(() -> new RuntimeException("상품을 찾을 수 없습니다."));
            
            // 현재 시세 조회
            Price currentPrice;
            try {
                currentPrice = priceService.getLatestPrice(product.getGpMetalCode());
            } catch (Exception e) {
                log.error("시세 조회 실패: metalCode={}, error={}", product.getGpMetalCode(), e.getMessage());
                throw new RuntimeException("시세 조회 중 오류가 발생했습니다: " + e.getMessage());
            }
            
            // 수수료 계산
            BigDecimal feeRate = calculateFeeRate(productId, quantity);
            BigDecimal totalPrice = currentPrice.getPBuyPrice().multiply(quantity);
            BigDecimal feeAmount = totalPrice.multiply(feeRate);
            BigDecimal taxAmount = totalPrice.multiply(TAX_RATE);
            BigDecimal finalAmount = totalPrice.add(feeAmount).add(taxAmount).setScale(0, RoundingMode.HALF_UP);
            BigDecimal roundedTotalPrice = totalPrice.setScale(0, RoundingMode.HALF_UP);
            BigDecimal roundedFeeAmount = feeAmount.setScale(0, RoundingMode.HALF_UP);
            BigDecimal roundedTaxAmount = taxAmount.setScale(0, RoundingMode.HALF_UP);
            
            // 지갑 조회 및 PIN 검증
            GoldWallet wallet;
            try {
                wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                    .orElseThrow(() -> new RuntimeException("지갑을 찾을 수 없습니다."));
                
                // 지갑 PIN 검증 (필수)
                if (!walletPin.equals(wallet.getGwPin())) {
                    log.error("지갑 PIN 검증 실패: customerNo={}, walletName={}", customerNo, walletName);
                    throw new RuntimeException("지갑 PIN이 올바르지 않습니다.");
                }
                
            } catch (Exception e) {
                log.error("지갑 조회 실패: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage());
                throw new RuntimeException("지갑 조회 중 오류가 발생했습니다: " + e.getMessage());
            }
            
            if (wallet.getGwCashBalance().compareTo(finalAmount) < 0) {
                log.error("잔액 부족: customerNo={}, 필요금액={}, 보유금액={}", customerNo, finalAmount, wallet.getGwCashBalance());
                BigDecimal formattedFinalAmount = finalAmount.setScale(0, RoundingMode.HALF_UP);
                BigDecimal formattedBalance = wallet.getGwCashBalance().setScale(0, RoundingMode.HALF_UP);
                DecimalFormat df = new DecimalFormat("#,###");
                throw new RuntimeException("잔액이 부족합니다. 필요금액: " + df.format(formattedFinalAmount) + "원, 보유금액: " + df.format(formattedBalance) + "원");
            }
            
            // 거래 생성
            String transactionId = generateTransactionId();
            GoldTbl transaction = GoldTbl.builder()
                .gId(transactionId)
                .goldProduct(product)
                .customer(customer)
                .gTransactionType(GoldTbl.TransactionType.BUY)
                .gQuantity(quantity)
                .gPricePerG(currentPrice.getPBuyPrice())
                .gTotalPrice(roundedTotalPrice)
                .gTaxAmount(roundedTaxAmount)
                .gFeeAmount(roundedFeeAmount)
                .gStatus(GoldTbl.TransactionStatus.COMPLETED)
                .gWalletName(walletName)
                .build();
            
            GoldTbl savedTransaction = goldTblRepository.save(transaction);
            
            // 지갑 잔액 차감 및 금/은 보유량 증가
            wallet.setGwCashBalance(wallet.getGwCashBalance().subtract(finalAmount));
            if ("AU".equals(product.getGpMetalCode())) {
                // 금 보유량 정확한 계산 (소수점 유지)
                BigDecimal newGoldBalance = wallet.getGwGoldBalance().add(quantity);
                wallet.setGwGoldBalance(newGoldBalance);
            } else if ("AG".equals(product.getGpMetalCode())) {
                // 은 보유량 정확한 계산 (소수점 유지)
                BigDecimal newSilverBalance = wallet.getGwSilverBalance().add(quantity);
                wallet.setGwSilverBalance(newSilverBalance);
            }
            
            wallet.setGwTotalBalance(calculateTotalBalance(wallet));
            goldWalletRepository.save(wallet);
            
            log.info("매수 완료: customerNo={}, transactionId={}, amount={}", customerNo, transactionId, finalAmount);
            return savedTransaction;
            
        } catch (Exception e) {
            log.error("매수 처리 중 오류: customerNo={}, productId={}, error={}", customerNo, productId, e.getMessage());
            throw new RuntimeException("매수 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 금/은 매도 처리 (계좌 시스템 연동)
     */
    @Transactional
    public GoldTbl sellMetal(Integer customerNo, String productId, BigDecimal quantity, String walletName, String walletPin) {
        
        // 지갑 PIN 검증 (필수)
        if (walletPin == null || walletPin.trim().isEmpty()) {
            throw new RuntimeException("지갑 PIN이 필요합니다.");
        }
        
        // 지갑 이름 처리: null이면 첫 번째 지갑 사용
        if (walletName == null || walletName.trim().isEmpty()) {
            List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo.longValue());
            if (wallets.isEmpty()) {
                throw new RuntimeException("거래를 위해서는 지갑이 필요합니다. 먼저 지갑을 개설해주세요.");
            }
            walletName = wallets.get(0).getGwWalletName();
        }
        
        try {
            // 고객 정보 조회
            Customer customer = customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            // 상품 정보 조회
            GoldProduct product = goldProductRepository.findByGpId(productId)
                .orElseThrow(() -> new RuntimeException("상품을 찾을 수 없습니다."));
            
            // 현재 시세 조회
            Price currentPrice = priceService.getLatestPrice(product.getGpMetalCode());
            
            // 지갑 보유량 확인
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("지갑을 찾을 수 없습니다."));
            
            // 지갑 PIN 검증 (필수)
            if (!walletPin.equals(wallet.getGwPin())) {
                log.error("지갑 PIN 검증 실패: customerNo={}, walletName={}", customerNo, walletName);
                throw new RuntimeException("지갑 PIN이 올바르지 않습니다.");
            }
            
            BigDecimal currentHoldings = "AU".equals(product.getGpMetalCode()) 
                ? wallet.getGwGoldBalance() 
                : wallet.getGwSilverBalance();
            
            if (currentHoldings.compareTo(quantity) < 0) {
                log.error("보유량 부족: customerNo={}, 필요수량={}, 보유수량={}", customerNo, quantity, currentHoldings);
                throw new RuntimeException("보유량이 부족합니다. 필요수량: " + quantity + "g, 보유수량: " + currentHoldings + "g");
            }
            
            // 수수료 계산
            BigDecimal feeRate = calculateFeeRate(productId, quantity);
            BigDecimal totalPrice = currentPrice.getPSellPrice().multiply(quantity);
            BigDecimal feeAmount = totalPrice.multiply(feeRate);
            BigDecimal taxAmount = totalPrice.multiply(TAX_RATE);
            BigDecimal finalAmount = totalPrice.subtract(feeAmount).subtract(taxAmount);
            
            // 거래 생성
            String transactionId = generateTransactionId();
            GoldTbl transaction = GoldTbl.builder()
                .gId(transactionId)
                .goldProduct(product)
                .customer(customer)
                .gTransactionType(GoldTbl.TransactionType.SELL)
                .gQuantity(quantity)
                .gPricePerG(currentPrice.getPSellPrice())
                .gTotalPrice(totalPrice)
                .gTaxAmount(taxAmount)
                .gFeeAmount(feeAmount)
                .gStatus(GoldTbl.TransactionStatus.COMPLETED)
                .gWalletName(walletName)
                .build();
            
            GoldTbl savedTransaction = goldTblRepository.save(transaction);
            
            // 지갑 잔액 증가 및 금/은 보유량 차감
            wallet.setGwCashBalance(wallet.getGwCashBalance().add(finalAmount));
            if ("AU".equals(product.getGpMetalCode())) {
                // 금 보유량 정확한 계산 (소수점 유지)
                BigDecimal newGoldBalance = wallet.getGwGoldBalance().subtract(quantity);
                wallet.setGwGoldBalance(newGoldBalance);
            } else if ("AG".equals(product.getGpMetalCode())) {
                // 은 보유량 정확한 계산 (소수점 유지)
                BigDecimal newSilverBalance = wallet.getGwSilverBalance().subtract(quantity);
                wallet.setGwSilverBalance(newSilverBalance);
            }
            
            wallet.setGwTotalBalance(calculateTotalBalance(wallet));
            goldWalletRepository.save(wallet);
            
            log.info("매도 완료: customerNo={}, transactionId={}, amount={}", customerNo, transactionId, finalAmount);
            return savedTransaction;
            
        } catch (Exception e) {
            log.error("매도 처리 중 오류: customerNo={}, productId={}, error={}", customerNo, productId, e.getMessage());
            throw new RuntimeException("매도 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    public GoldTblDto buyMetalDto(Long customerNo, String productId, BigDecimal quantity) {
        return toGoldTblDto(buyMetal(customerNo.intValue(), productId, quantity, null, "000000"));
    }

    public GoldTblDto sellMetalDto(Long customerNo, String productId, BigDecimal quantity) {
        return toGoldTblDto(sellMetal(customerNo.intValue(), productId, quantity, null, "000000"));
    }
    
    /**
     * 고객 거래내역 조회
     */
    @Transactional(readOnly = true)
    public List<GoldTbl> getCustomerTransactions(Long customerNo) {
        return goldTblRepository.findByCustomerNo(customerNo);
    }
    
    /**
     * 고객 특정 거래타입 내역 조회
     */
    @Transactional(readOnly = true)
    public List<GoldTbl> getCustomerTransactionsByType(Long customerNo, GoldTbl.TransactionType transactionType) {
        return goldTblRepository.findByCustomerNoAndTransactionType(customerNo, transactionType);
    }

    public List<GoldTblDto> getCustomerTransactionsDto(Long customerNo) {
        return toGoldTblDtos(getCustomerTransactions(customerNo));
    }

    public List<GoldTblDto> getCustomerTransactionsByTypeDto(Long customerNo, GoldTbl.TransactionType transactionType) {
        return toGoldTblDtos(getCustomerTransactionsByType(customerNo, transactionType));
    }
    
    /**
     * 페이징을 통한 거래내역 조회
     */
    @Transactional(readOnly = true)
    public Page<GoldTbl> getCustomerTransactionsWithPaging(Long customerNo, Pageable pageable) {
        return goldTblRepository.findByCustomerNo(customerNo, pageable);
    }
    
    /**
     * 동적 조건으로 거래내역 페이징 조회
     */
    @Transactional(readOnly = true)
    public Page<GoldTbl> getTransactionsWithDynamicConditionsAndPaging(Long customerNo, 
                                                                      String transactionType, 
                                                                      String metalCode, 
                                                                      String walletName,
                                                                      Pageable pageable) {
        return goldTblQueryDSLRepository.findTransactionsWithDynamicConditionsAndPaging(
            customerNo, transactionType, metalCode, walletName, pageable);
    }
    
    /**
     * DTO 페이징 조회
     */
    @Transactional(readOnly = true)
    public Page<GoldTblDto> getCustomerTransactionsDtoWithPaging(Long customerNo, Pageable pageable) {
        Page<GoldTbl> transactions = getCustomerTransactionsWithPaging(customerNo, pageable);
        return transactions.map(this::toGoldTblDto);
    }
    
    /**
     * 동적 조건 DTO 페이징 조회
     */
    @Transactional(readOnly = true)
    public Page<GoldTblDto> getCustomerTransactionsDtoWithPaging(Long customerNo, Pageable pageable, 
                                                                String transactionType, 
                                                                String metalCode, 
                                                                String walletName) {
        Page<GoldTbl> transactions = getTransactionsWithDynamicConditionsAndPaging(
            customerNo, transactionType, metalCode, walletName, pageable);
        return transactions.map(this::toGoldTblDto);
    }
    
    /**
     * 동적 조건 DTO 페이징 조회 (총합 정보 포함)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerTransactionsDtoWithPagingAndSummary(Long customerNo, Pageable pageable, 
                                                                String transactionType, 
                                                                String metalCode, 
                                                                String walletName) {
        Page<GoldTblDto> dtoPage = getCustomerTransactionsDtoWithPaging(customerNo, pageable, transactionType, metalCode, walletName);
        Map<String, Object> summary = calculateTransactionSummary(customerNo, transactionType, metalCode, walletName);
        
        Map<String, Object> result = new HashMap<>();
        result.put("transactions", dtoPage);
        result.put("summary", summary);
        return result;
    }
    
    /**
     * 거래내역 총합 정보 계산
     */
    @Transactional(readOnly = true)
    private Map<String, Object> calculateTransactionSummary(Long customerNo, String transactionType, String metalCode, String walletName) {
        
        // 전체 거래내역 조회 (페이징 없이)
        List<GoldTbl> allTransactions = goldTblQueryDSLRepository.findTransactionsWithDynamicConditionsAndPaging(
            customerNo, transactionType, metalCode, walletName, 
            org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE)).getContent();
        
        Map<String, Object> summary = new HashMap<>();
        
        // 전체 합계
        BigDecimal totalBuyAmount = BigDecimal.ZERO;
        BigDecimal totalSellAmount = BigDecimal.ZERO;
        BigDecimal totalBuyTax = BigDecimal.ZERO;
        BigDecimal totalSellTax = BigDecimal.ZERO;
        BigDecimal totalBuyFee = BigDecimal.ZERO;
        BigDecimal totalSellFee = BigDecimal.ZERO;
        
        // 지갑별 합계
        Map<String, Map<String, BigDecimal>> walletSummary = new HashMap<>();
        
        for (GoldTbl transaction : allTransactions) {
            // 지갑명이 null인 경우 해당 거래를 제외
            if (transaction.getGWalletName() == null || transaction.getGWalletName().trim().isEmpty()) {
                continue;
            }
            
            String wallet = transaction.getGWalletName();
            BigDecimal amount = transaction.getGTotalPrice();
            BigDecimal tax = transaction.getGTaxAmount();
            BigDecimal fee = transaction.getGFeeAmount();
            
            // 지갑별 합계 초기화
            if (!walletSummary.containsKey(wallet)) {
                Map<String, BigDecimal> walletStats = new HashMap<>();
                walletStats.put("buyAmount", BigDecimal.ZERO);
                walletStats.put("sellAmount", BigDecimal.ZERO);
                walletStats.put("buyTax", BigDecimal.ZERO);
                walletStats.put("sellTax", BigDecimal.ZERO);
                walletStats.put("buyFee", BigDecimal.ZERO);
                walletStats.put("sellFee", BigDecimal.ZERO);
                walletSummary.put(wallet, walletStats);
            }
            
            if (transaction.getGTransactionType() == GoldTbl.TransactionType.BUY) {
                totalBuyAmount = totalBuyAmount.add(amount);
                totalBuyTax = totalBuyTax.add(tax);
                totalBuyFee = totalBuyFee.add(fee);
                
                Map<String, BigDecimal> walletStats = walletSummary.get(wallet);
                walletStats.put("buyAmount", walletStats.get("buyAmount").add(amount));
                walletStats.put("buyTax", walletStats.get("buyTax").add(tax));
                walletStats.put("buyFee", walletStats.get("buyFee").add(fee));
            } else {
                totalSellAmount = totalSellAmount.add(amount);
                totalSellTax = totalSellTax.add(tax);
                totalSellFee = totalSellFee.add(fee);
                
                Map<String, BigDecimal> walletStats = walletSummary.get(wallet);
                walletStats.put("sellAmount", walletStats.get("sellAmount").add(amount));
                walletStats.put("sellTax", walletStats.get("sellTax").add(tax));
                walletStats.put("sellFee", walletStats.get("sellFee").add(fee));
            }
        }
        
        // 전체 합계
        summary.put("totalBuyAmount", totalBuyAmount);
        summary.put("totalSellAmount", totalSellAmount);
        summary.put("totalBuyTax", totalBuyTax);
        summary.put("totalSellTax", totalSellTax);
        summary.put("totalBuyFee", totalBuyFee);
        summary.put("totalSellFee", totalSellFee);
        summary.put("netAmount", totalSellAmount.subtract(totalBuyAmount)); // 순손익
        
        // 지갑별 평가손익 및 수익률 계산
        Map<String, Map<String, Object>> walletEvaluation = calculateWalletEvaluation(customerNo, walletSummary);
        
        // 지갑별 합계에 평가손익 정보 추가
        Map<String, Map<String, Object>> enhancedWalletSummary = new HashMap<>();
        for (Map.Entry<String, Map<String, BigDecimal>> entry : walletSummary.entrySet()) {
            String currentWalletName = entry.getKey();
            Map<String, BigDecimal> walletStats = entry.getValue();
            
            // BigDecimal을 Object로 변환하여 평가손익 정보 추가
            Map<String, Object> enhancedStats = new HashMap<>();
            enhancedStats.putAll(walletStats);
            
            if (walletEvaluation.containsKey(currentWalletName)) {
                Map<String, Object> evalData = walletEvaluation.get(currentWalletName);
                enhancedStats.put("evaluationProfit", evalData.get("evaluationProfit"));
                enhancedStats.put("profitRate", evalData.get("profitRate"));
                enhancedStats.put("currentGoldPrice", evalData.get("currentGoldPrice"));
                enhancedStats.put("currentSilverPrice", evalData.get("currentSilverPrice"));
                enhancedStats.put("goldBalance", evalData.get("goldBalance"));
                enhancedStats.put("silverBalance", evalData.get("silverBalance"));
                enhancedStats.put("avgGoldPrice", evalData.get("avgGoldPrice"));
                enhancedStats.put("avgSilverPrice", evalData.get("avgSilverPrice"));
            }
            
            enhancedWalletSummary.put(currentWalletName, enhancedStats);
        }
        
        // 지갑별 합계
        summary.put("walletSummary", enhancedWalletSummary);
        
        return summary;
    }
    
    /**
     * 지갑별 평가손익 및 수익률 계산
     */
    @Transactional(readOnly = true)
    private Map<String, Map<String, Object>> calculateWalletEvaluation(Long customerNo, Map<String, Map<String, BigDecimal>> walletSummary) {
        Map<String, Map<String, Object>> walletEvaluation = new HashMap<>();
        
        try {
            // 현재 시세 조회
            Price goldPrice = priceService.getLatestPrice("AU");
            Price silverPrice = priceService.getLatestPrice("AG");
            
            BigDecimal currentGoldPrice = goldPrice != null ? goldPrice.getPBuyPrice() : BigDecimal.ZERO;
            BigDecimal currentSilverPrice = silverPrice != null ? silverPrice.getPBuyPrice() : BigDecimal.ZERO;
            
            // 각 지갑별 평가손익 계산
            for (String walletName : walletSummary.keySet()) {
                Map<String, Object> evalData = new HashMap<>();
                
                // 지갑별 보유량 조회
                Optional<GoldWallet> walletOpt = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo, walletName);
                if (walletOpt.isPresent()) {
                    GoldWallet wallet = walletOpt.get();
                    BigDecimal goldBalance = wallet.getGwGoldBalance();
                    BigDecimal silverBalance = wallet.getGwSilverBalance();
                    
                    // 지갑별 매수 평균가 계산 (거래내역에서)
                    Map<String, BigDecimal> avgPrices = calculateAverageBuyPrice(customerNo, walletName);
                    BigDecimal avgGoldPrice = avgPrices.get("gold");
                    BigDecimal avgSilverPrice = avgPrices.get("silver");
                    
                    // 평가손익 계산
                    BigDecimal goldEvaluationProfit = BigDecimal.ZERO;
                    BigDecimal silverEvaluationProfit = BigDecimal.ZERO;
                    
                    if (goldBalance.compareTo(BigDecimal.ZERO) > 0 && avgGoldPrice.compareTo(BigDecimal.ZERO) > 0) {
                        goldEvaluationProfit = currentGoldPrice.subtract(avgGoldPrice).multiply(goldBalance);
                    }
                    
                    if (silverBalance.compareTo(BigDecimal.ZERO) > 0 && avgSilverPrice.compareTo(BigDecimal.ZERO) > 0) {
                        silverEvaluationProfit = currentSilverPrice.subtract(avgSilverPrice).multiply(silverBalance);
                    }
                    
                    BigDecimal totalEvaluationProfit = goldEvaluationProfit.add(silverEvaluationProfit);
                    
                    // 수익률 계산 - 총 매수금액 대비 평가손익
                    BigDecimal totalBuyAmount = walletSummary.get(walletName).get("buyAmount");
                    BigDecimal profitRate = BigDecimal.ZERO;
                    if (totalBuyAmount.compareTo(BigDecimal.ZERO) > 0) {
                        profitRate = totalEvaluationProfit.divide(totalBuyAmount, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
                    }
                    
                    evalData.put("evaluationProfit", totalEvaluationProfit);
                    evalData.put("profitRate", profitRate);
                    evalData.put("currentGoldPrice", currentGoldPrice);
                    evalData.put("currentSilverPrice", currentSilverPrice);
                    evalData.put("goldBalance", goldBalance);
                    evalData.put("silverBalance", silverBalance);
                    evalData.put("avgGoldPrice", avgGoldPrice);
                    evalData.put("avgSilverPrice", avgSilverPrice);
                } else {
                    // 지갑이 없는 경우 기본값
                    evalData.put("evaluationProfit", BigDecimal.ZERO);
                    evalData.put("profitRate", BigDecimal.ZERO);
                    evalData.put("currentGoldPrice", currentGoldPrice);
                    evalData.put("currentSilverPrice", currentSilverPrice);
                    evalData.put("goldBalance", BigDecimal.ZERO);
                    evalData.put("silverBalance", BigDecimal.ZERO);
                    evalData.put("avgGoldPrice", BigDecimal.ZERO);
                    evalData.put("avgSilverPrice", BigDecimal.ZERO);
                }
                
                walletEvaluation.put(walletName, evalData);
            }
            
        } catch (Exception e) {
            log.error("지갑별 평가손익 계산 중 오류: {}", e.getMessage());
        }
        
        return walletEvaluation;
    }
    
    /**
     * 지갑별 매수 평균가 계산
     */
    @Transactional(readOnly = true)
    private Map<String, BigDecimal> calculateAverageBuyPrice(Long customerNo, String walletName) {
        Map<String, BigDecimal> avgPrices = new HashMap<>();
        avgPrices.put("gold", BigDecimal.ZERO);
        avgPrices.put("silver", BigDecimal.ZERO);
        
        try {
            // 해당 지갑의 매수 거래만 조회
            List<GoldTbl> allTransactions = goldTblRepository.findByCustomerNo(customerNo);
            List<GoldTbl> buyTransactions = allTransactions.stream()
                .filter(t -> walletName.equals(t.getGWalletName()) && 
                           GoldTbl.TransactionType.BUY.equals(t.getGTransactionType()))
                .collect(Collectors.toList());
            
            BigDecimal totalGoldAmount = BigDecimal.ZERO;
            BigDecimal totalGoldQuantity = BigDecimal.ZERO;
            BigDecimal totalSilverAmount = BigDecimal.ZERO;
            BigDecimal totalSilverQuantity = BigDecimal.ZERO;
            
            for (GoldTbl transaction : buyTransactions) {
                String metalCode = transaction.getGoldProduct().getGpMetalCode();
                BigDecimal quantity = transaction.getGQuantity();
                BigDecimal totalPrice = transaction.getGTotalPrice();
                
                if ("AU".equals(metalCode)) {
                    totalGoldAmount = totalGoldAmount.add(totalPrice);
                    totalGoldQuantity = totalGoldQuantity.add(quantity);
                } else if ("AG".equals(metalCode)) {
                    totalSilverAmount = totalSilverAmount.add(totalPrice);
                    totalSilverQuantity = totalSilverQuantity.add(quantity);
                }
            }
            
            // 평균가 계산
            if (totalGoldQuantity.compareTo(BigDecimal.ZERO) > 0) {
                avgPrices.put("gold", totalGoldAmount.divide(totalGoldQuantity, 2, RoundingMode.HALF_UP));
            }
            
            if (totalSilverQuantity.compareTo(BigDecimal.ZERO) > 0) {
                avgPrices.put("silver", totalSilverAmount.divide(totalSilverQuantity, 2, RoundingMode.HALF_UP));
            }
            
        } catch (Exception e) {
            log.error("지갑별 매수 평균가 계산 중 오류: {}", e.getMessage());
        }
        
        return avgPrices;
    }
    
    /**
     * 지갑 총 보유량 계산 (현금 + 금 평가액 + 은 평가액)
     */
    private BigDecimal calculateTotalBalance(GoldWallet wallet) {
        BigDecimal totalBalance = wallet.getGwCashBalance();
        try {
            if (wallet.getGwGoldBalance().compareTo(BigDecimal.ZERO) > 0) {
                Price goldPrice = priceService.getLatestPrice("AU");
                if (goldPrice != null) {
                    BigDecimal goldValue = goldPrice.getPBuyPrice().multiply(wallet.getGwGoldBalance());
                    totalBalance = totalBalance.add(goldValue);
                }
            }
            if (wallet.getGwSilverBalance().compareTo(BigDecimal.ZERO) > 0) {
                Price silverPrice = priceService.getLatestPrice("AG");
                if (silverPrice != null) {
                    BigDecimal silverValue = silverPrice.getPBuyPrice().multiply(wallet.getGwSilverBalance());
                    totalBalance = totalBalance.add(silverValue);
                }
            }
        } catch (Exception e) {
            log.warn("시세 조회 실패로 현금 잔액만 반영: {}", e.getMessage());
            totalBalance = wallet.getGwCashBalance();
        }
        return totalBalance;
    }
    
    /**
     * 수수료율 계산
     */
    private BigDecimal calculateFeeRate(String productId, BigDecimal quantity) {
        BigDecimal totalWeight = quantity; // 골드바/실버바 무게
        
        if (totalWeight.compareTo(new BigDecimal("100")) >= 0) {
            return LARGE_QUANTITY_DISCOUNT_RATE; // 0.5%
        } else if (totalWeight.compareTo(new BigDecimal("10")) >= 0) {
            return MEDIUM_QUANTITY_DISCOUNT_RATE; // 0.7%
        } else {
            return BANK_FEE_RATE; // 1%
        }
    }
    
    /**
     * 거래 ID 생성
     */
    private String generateTransactionId() {
        return "TXN_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    /** GoldTblDto */
    public GoldTblDto toGoldTblDto(GoldTbl transaction) {
        if (transaction == null) return null;
        
        GoldTblDto dto = new GoldTblDto();
        dto.gNo = transaction.getGNo();
        dto.gId = transaction.getGId();
        dto.transactionType = transaction.getGTransactionType() != null ? transaction.getGTransactionType().name() : null;
        dto.quantity = transaction.getGQuantity();
        dto.pricePerG = transaction.getGPricePerG();
        dto.totalPrice = transaction.getGTotalPrice();
        dto.feeAmount = transaction.getGFeeAmount();
        dto.taxAmount = transaction.getGTaxAmount();  // 세금 정보 추가
        dto.status = transaction.getGStatus() != null ? transaction.getGStatus().name() : null;
        dto.purchasedAt = transaction.getGPurchasedAt();
        dto.metalCode = transaction.getGoldProduct() != null ? transaction.getGoldProduct().getGpMetalCode() : null;
        dto.productId = transaction.getGoldProduct() != null ? transaction.getGoldProduct().getGpId() : null;
        dto.customerNo = transaction.getCustomer() != null ? transaction.getCustomer().getCustomerNo() : null;
        dto.walletName = transaction.getGWalletName();
        
        return dto;
    }
    
    /** GoldTblDto 리스트 */
    public List<GoldTblDto> toGoldTblDtos(List<GoldTbl> transactions) {
        if (transactions == null) return null;
        
        return transactions.stream()
                .map(this::toGoldTblDto)
                .collect(Collectors.toList());
    }
    
    /** GoldCustomerDto */
    public GoldCustomerDto toGoldCustomerDto(GoldCustomer goldCustomer) {
        if (goldCustomer == null) return null;
        
        GoldCustomerDto dto = new GoldCustomerDto();
        dto.gcNo = goldCustomer.getGcNo();
        dto.customerNo = goldCustomer.getCustomer() != null ? goldCustomer.getCustomer().getCustomerNo() : null;
        dto.cash = goldCustomer.getGcCashBalance();
        dto.gold = goldCustomer.getGcGoldBalance();
        dto.silver = goldCustomer.getGcSilverBalance();
        dto.totalInvestment = goldCustomer.getGcTotalInvestment();
        dto.totalProfitLoss = goldCustomer.getGcTotalProfitLoss();
        dto.activeYn = goldCustomer.getGcActiveYn();
        
        return dto;
    }
    
    /** GoldCustomerDto 리스트 */
    public List<GoldCustomerDto> toGoldCustomerDtos(List<GoldCustomer> customers) {
        if (customers == null) return null;
        
        return customers.stream()
                .map(this::toGoldCustomerDto)
                .collect(Collectors.toList());
    }
    
    /** GoldProductDto */
    public GoldProductDto toGoldProductDto(GoldProduct product) {
        if (product == null) return null;
        
        GoldProductDto dto = new GoldProductDto();
        dto.gpNo = product.getGpNo();
        dto.gpId = product.getGpId();
        dto.metalCode = product.getGpMetalCode();
        dto.name = product.getGpName();
        dto.weightG = product.getGpWeightG();
        dto.purity = product.getGpPurity();
        dto.premiumPerG = product.getGpPremiumPerG();
        dto.activeYn = product.getGpActiveYn();
        
        return dto;
    }
    
    /** GoldProductDto 리스트 */
    public List<GoldProductDto> toGoldProductDtos(List<GoldProduct> products) {
        if (products == null) return null;
        
        return products.stream()
                .map(this::toGoldProductDto)
                .collect(Collectors.toList());
    }
    
    /** GoldWalletDto */
    public GoldWalletDto toGoldWalletDto(GoldWallet wallet) {
        if (wallet == null) return null;
        
        GoldWalletDto dto = new GoldWalletDto();
        dto.gwNo = wallet.getGwNo();
        dto.customerNo = wallet.getCustomer() != null ? wallet.getCustomer().getCustomerNo() : null;
        dto.walletName = wallet.getGwWalletName();
        dto.accountNo = wallet.getGwAccountNo();
        dto.pin = wallet.getGwPin();
        dto.cashBalance = wallet.getGwCashBalance();
        dto.goldBalance = wallet.getGwGoldBalance();
        dto.silverBalance = wallet.getGwSilverBalance();
        dto.totalBalance = wallet.getGwTotalBalance();
        dto.activeYn = wallet.getGwActiveYn();
        dto.createdAt = wallet.getGwCreatedAt();
        dto.updatedAt = wallet.getGwUpdatedAt();
        
        return dto;
    }
    
    /** GoldWalletDto 리스트 */
    public List<GoldWalletDto> toGoldWalletDtos(List<GoldWallet> wallets) {
        if (wallets == null) return null;
        
        return wallets.stream()
                .map(this::toGoldWalletDto)
                .collect(Collectors.toList());
    }
    
    /**
     * 고객 잔고 조회 (계좌 + 지갑)
     * @param customerNo 고객번호
     * @param accountNo 선택된 계좌 번호 (null이면 자동 선택)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerBalance(Long customerNo, Integer accountNo) {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 고객 존재 여부 확인
            customerRepo.findById(customerNo.intValue())
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            // 지갑 목록 조회
            List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo);
            
            // 계좌 잔고 (일반 계좌 - SpotAccountService 사용)
            BigDecimal accountBalance = BigDecimal.ZERO;
            try {
                Optional<Account> accountOpt;
                if (accountNo != null) {
                    accountOpt = spotAccountService.getAccountByAccountNo(accountNo);
                    if (accountOpt.isPresent() && !accountOpt.get().getCNo().equals(customerNo.intValue())) {
                        log.warn("선택된 계좌가 해당 고객의 계좌가 아님: customerNo={}, accountNo={}", customerNo, accountNo);
                        accountOpt = Optional.empty();
                    }
                } else {
                    accountOpt = spotAccountService.getActiveAccountByCustomerNo(customerNo.intValue());
                }
                
                if (accountOpt.isPresent()) {
                    accountBalance = accountOpt.get().getBalance();
                    result.put("selectedAccountNo", accountOpt.get().getANo());
                    result.put("selectedAccountNumber", accountOpt.get().getAccountNo());
                }
            } catch (Exception e) {
                log.warn("계좌 잔고 조회 실패: customerNo={}, accountNo={}, error={}", customerNo, accountNo, e.getMessage());
                accountBalance = BigDecimal.ZERO;
            }
            
            // 지갑별 잔고 계산
            BigDecimal totalWalletBalance = BigDecimal.ZERO;
            BigDecimal totalGoldBalance = BigDecimal.ZERO;
            BigDecimal totalSilverBalance = BigDecimal.ZERO;
            
            for (GoldWallet wallet : wallets) {
                totalWalletBalance = totalWalletBalance.add(wallet.getGwCashBalance());
                totalGoldBalance = totalGoldBalance.add(wallet.getGwGoldBalance());
                totalSilverBalance = totalSilverBalance.add(wallet.getGwSilverBalance());
            }
            
            result.put("account", accountBalance);
            result.put("wallet", totalWalletBalance);
            result.put("gold", totalGoldBalance);
            result.put("silver", totalSilverBalance);
            result.put("totalWalletBalance", totalWalletBalance);
            result.put("totalGoldBalance", totalGoldBalance);
            result.put("totalSilverBalance", totalSilverBalance);
            
            return result;
            
        } catch (Exception e) {
            log.error("잔고 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            throw new RuntimeException("잔고 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 고객 지갑 목록 조회 (DTO 반환)
     */
    @Transactional
    public List<GoldWalletDto> getCustomerWalletsDto(Long customerNo) {
        try {
            // 고객 존재 여부 확인
            customerRepo.findById(customerNo.intValue())
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다: " + customerNo));
            
            // 지갑 조회
            List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo);
            
            // 기존 지갑 중 계좌번호가 없는 경우 자동 생성
            for (GoldWallet wallet : wallets) {
                if (wallet.getGwAccountNo() == null || wallet.getGwAccountNo().trim().isEmpty()) {
                    String accountNo = generateAccountNo(wallet.getGwNo());
                    wallet.setGwAccountNo(accountNo);
                    goldWalletRepository.save(wallet);
                }
            }
            
            return toGoldWalletDtos(wallets);
            
        } catch (Exception e) {
            log.error("지갑 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            throw new RuntimeException("지갑 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 고객 지갑 목록 조회 (Map 형태, 기존 호환)
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCustomerWallets(Long customerNo) {
        try {
            List<GoldWalletDto> dtos = getCustomerWalletsDto(customerNo);
            
            return dtos.stream().map(dto -> {
                Map<String, Object> walletInfo = new HashMap<>();
                walletInfo.put("id", dto.gwNo);
                walletInfo.put("name", dto.walletName);
                walletInfo.put("accountNo", dto.accountNo);
                walletInfo.put("pin", dto.pin);
                walletInfo.put("cashBalance", dto.cashBalance);
                walletInfo.put("goldBalance", dto.goldBalance);
                walletInfo.put("silverBalance", dto.silverBalance);
                walletInfo.put("totalBalance", dto.totalBalance);
                walletInfo.put("activeYn", dto.activeYn);
                walletInfo.put("createdAt", dto.createdAt);
                walletInfo.put("updatedAt", dto.updatedAt);
                return walletInfo;
            }).collect(Collectors.toList());
            
        } catch (Exception e) {
            log.error("지갑 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            throw new RuntimeException("지갑 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 6자리 랜덤 PIN 생성
     */
    private String generateRandomPin() {
        Random random = new Random();
        StringBuilder pin = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            pin.append(random.nextInt(10));
        }
        return pin.toString();
    }
    
    /**
     * 현물계좌 통장 계좌번호 생성 (DB 스키마 형식)
     * 형식: WL + 지갑번호(6자리)
     * 예: WL000001 (지갑번호 1)
     * 주의: 지갑 번호는 저장 후에 생성되므로, 저장 후 이 메서드를 호출해야 함
     */
    private String generateAccountNo(Integer walletNo) {
        return "WL" + String.format("%06d", walletNo);
    }
    
    /**
     * 지갑 생성
     */
    @Transactional
    public Map<String, Object> createWallet(Integer customerNo, String walletName, String walletPin) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 입력값 검증
            if (customerNo == null) {
                throw new RuntimeException("고객번호가 필요합니다.");
            }
            if (walletName == null || walletName.trim().isEmpty()) {
                throw new RuntimeException("지갑명이 필요합니다.");
            }
            if (walletPin == null || walletPin.trim().isEmpty()) {
                throw new RuntimeException("PIN 번호가 필요합니다.");
            }
            if (walletPin.length() != 6) {
                throw new RuntimeException("PIN 번호는 6자리여야 합니다.");
            }
            
            // 고객 정보 조회
            Customer customer = customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            // GOLD_CUSTOMER_TBL 자동 생성 (없으면 생성)
            Optional<GoldCustomer> existingGoldCustomer = goldCustomerRepository.findByCustomerCustomerNo(customerNo.longValue());
            if (existingGoldCustomer.isEmpty()) {
                GoldCustomer newGoldCustomer = GoldCustomer.builder()
                    .customer(customer)
                    .gcCashBalance(BigDecimal.ZERO)
                    .gcGoldBalance(BigDecimal.ZERO)
                    .gcSilverBalance(BigDecimal.ZERO)
                    .gcTotalInvestment(BigDecimal.ZERO)
                    .gcTotalProfitLoss(BigDecimal.ZERO)
                    .gcActiveYn("Y")
                    .build();
                goldCustomerRepository.save(newGoldCustomer);
            }
            
            // 지갑명 중복 확인
            if (goldWalletRepository.existsByCustomerNoAndWalletName(customerNo.longValue(), walletName)) {
                result.put("success", false);
                result.put("message", "이미 존재하는 지갑명입니다.");
                log.warn("지갑명 중복: customerNo={}, walletName={}", customerNo, walletName);
                return result;
            }
            
            // 지갑 생성
            GoldWallet wallet = GoldWallet.builder()
                .customer(customer)
                .gwWalletName(walletName.trim())
                .gwAccountNo(null)
                .gwPin(walletPin)
                .gwCashBalance(BigDecimal.ZERO)
                .gwGoldBalance(BigDecimal.ZERO)
                .gwSilverBalance(BigDecimal.ZERO)
                .gwTotalBalance(BigDecimal.ZERO)
                .gwActiveYn("Y")
                .build();
            
            GoldWallet savedWallet = goldWalletRepository.save(wallet);
            
            // 저장 후 지갑 번호로 계좌번호 생성
            String accountNo = generateAccountNo(savedWallet.getGwNo());
            savedWallet.setGwAccountNo(accountNo);
            savedWallet = goldWalletRepository.save(savedWallet);
            
            result.put("success", true);
            result.put("message", "지갑이 생성되었습니다. 설정한 PIN: " + walletPin);
            result.put("gwNo", savedWallet.getGwNo());
            result.put("gwWalletName", savedWallet.getGwWalletName());
            result.put("gwAccountNo", savedWallet.getGwAccountNo());
            result.put("gwPin", savedWallet.getGwPin());
            result.put("generatedPin", walletPin);
            result.put("gwCashBalance", savedWallet.getGwCashBalance());
            result.put("gwGoldBalance", savedWallet.getGwGoldBalance());
            result.put("gwSilverBalance", savedWallet.getGwSilverBalance());
            result.put("gwTotalBalance", savedWallet.getGwTotalBalance());
            result.put("gwActiveYn", savedWallet.getGwActiveYn());
            result.put("gwCreatedAt", savedWallet.getGwCreatedAt());
            result.put("gwUpdatedAt", savedWallet.getGwUpdatedAt());
            
            log.info("지갑 생성 완료: customerNo={}, walletName={}, walletNo={}", customerNo, walletName, savedWallet.getGwNo());
            return result;
            
        } catch (Exception e) {
            log.error("지갑 생성 실패: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage());
            result.put("success", false);
            result.put("message", "지갑 생성 중 오류가 발생했습니다: " + e.getMessage());
            return result;
        }
    }
    
    /**
     * 지갑 PIN 검증
     */
    @Transactional(readOnly = true)
    public boolean validateWalletPin(Integer customerNo, String walletName, String pin) {
        try {
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("지갑을 찾을 수 없습니다."));
            return pin.equals(wallet.getGwPin());
        } catch (Exception e) {
            log.error("지갑 PIN 검증 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage());
            return false;
        }
    }
    
    /**
     * PIN 분실 시 복구 (새로운 PIN 생성)
     */
    @Transactional
    public Map<String, Object> recoverWalletPin(Integer customerNo, String walletName) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            if (customerNo == null) {
                throw new RuntimeException("고객번호가 필요합니다.");
            }
            if (walletName == null || walletName.trim().isEmpty()) {
                throw new RuntimeException("지갑명이 필요합니다.");
            }
            
            customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("지갑을 찾을 수 없습니다."));
            
            String newPin = generateRandomPin();
            wallet.setGwPin(newPin);
            goldWalletRepository.save(wallet);
            
            result.put("success", true);
            result.put("message", "PIN이 복구되었습니다. 새로운 PIN: " + newPin);
            result.put("newPin", newPin);
            result.put("walletName", walletName);
            
            log.info("PIN 복구 완료: customerNo={}, walletName={}", customerNo, walletName);
            return result;
            
        } catch (Exception e) {
            log.error("PIN 복구 실패: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage());
            result.put("success", false);
            result.put("message", "PIN 복구 중 오류가 발생했습니다: " + e.getMessage());
            return result;
        }
    }
    
    /**
     * 지갑 PIN 업데이트
     */
    @Transactional
    public Map<String, Object> updateWalletPin(Integer customerNo, String walletName, String oldPin, String newPin) {
        try {
            Map<String, Object> result = new HashMap<>();
            
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("지갑을 찾을 수 없습니다."));
            
            if (!oldPin.equals(wallet.getGwPin())) {
                throw new RuntimeException("기존 PIN이 올바르지 않습니다.");
            }
            
            wallet.setGwPin(newPin);
            goldWalletRepository.save(wallet);
            
            result.put("success", true);
            result.put("message", "PIN이 성공적으로 업데이트되었습니다.");
            return result;
            
        } catch (Exception e) {
            log.error("지갑 PIN 업데이트 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "PIN 업데이트 중 오류가 발생했습니다: " + e.getMessage());
            return errorResult;
        }
    }

    /**
     * 계좌에서 현물거래 통장으로 이체
     */
    @Transactional
    public Map<String, Object> transferToTradingAccount(Integer customerNo, BigDecimal amount, String walletName, String pin, Integer accountNo) {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 고객 존재 여부 확인
            customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            // 계좌 조회
            Optional<Account> accountOpt;
            if (accountNo != null) {
                accountOpt = spotAccountService.getAccountByAccountNo(accountNo);
                if (accountOpt.isPresent() && !accountOpt.get().getCNo().equals(customerNo)) {
                    log.error("선택된 계좌가 해당 고객의 계좌가 아님: customerNo={}, accountNo={}", customerNo, accountNo);
                    throw new RuntimeException("선택된 계좌가 해당 고객의 계좌가 아닙니다.");
                }
            } else {
                accountOpt = spotAccountService.getActiveAccountByCustomerNo(customerNo);
            }
            
            if (accountOpt.isEmpty()) {
                log.error("활성 계좌를 찾을 수 없음: customerNo={}, accountNo={}", customerNo, accountNo);
                throw new RuntimeException("활성 계좌를 찾을 수 없습니다.");
            }
            
            Account account = accountOpt.get();
            if (account.getBalance().compareTo(amount) < 0) {
                log.error("계좌 잔액 부족: customerNo={}, 현재={}, 필요={}", customerNo, account.getBalance(), amount);
                throw new RuntimeException("계좌 잔액이 부족합니다. 현재: " + account.getBalance() + "원, 필요: " + amount + "원");
            }
            
            // 지갑 선택
            if (walletName == null || walletName.trim().isEmpty()) {
                List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo.longValue());
                if (wallets.isEmpty()) {
                    log.error("이체를 위한 지갑이 없음: customerNo={}", customerNo);
                    throw new RuntimeException("이체를 위해서는 지갑이 필요합니다. 먼저 지갑을 개설해주세요.");
                }
                walletName = wallets.get(0).getGwWalletName();
            }
            
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("지갑을 찾을 수 없습니다."));
            
            // PIN 검증
            if (pin != null && !pin.trim().isEmpty()) {
                if (!pin.equals(wallet.getGwPin())) {
                    log.error("PIN 검증 실패: customerNo={}, walletName={}", customerNo, walletName);
                    throw new RuntimeException("PIN이 올바르지 않습니다.");
                }
            }
            
            // 계좌에서 차감 (선택된 계좌 번호 사용)
            spotAccountService.updateAccountBalanceByAccountNo(account.getANo(), amount.negate());
            
            // 계좌 잔액 조회 (업데이트 후)
            Account updatedAccount = spotAccountService.getAccountByAccountNo(account.getANo())
                .orElseThrow(() -> new RuntimeException("계좌를 찾을 수 없습니다."));
            BigDecimal accountAfterBalance = updatedAccount.getBalance();
            
            // 지갑에 추가
            wallet.setGwCashBalance(wallet.getGwCashBalance().add(amount));
            
            // gw_total_balance 계산 (현금 + 금 평가액 + 은 평가액)
            BigDecimal totalBalance = wallet.getGwCashBalance();
            try {
                // 금 시세 조회 및 평가액 계산
                if (wallet.getGwGoldBalance().compareTo(BigDecimal.ZERO) > 0) {
                    Price goldPrice = priceService.getLatestPrice("AU");
                    if (goldPrice != null) {
                        BigDecimal goldValue = goldPrice.getPBuyPrice().multiply(wallet.getGwGoldBalance());
                        totalBalance = totalBalance.add(goldValue);
                    }
                }
                // 은 시세 조회 및 평가액 계산
                if (wallet.getGwSilverBalance().compareTo(BigDecimal.ZERO) > 0) {
                    Price silverPrice = priceService.getLatestPrice("AG");
                    if (silverPrice != null) {
                        BigDecimal silverValue = silverPrice.getPBuyPrice().multiply(wallet.getGwSilverBalance());
                        totalBalance = totalBalance.add(silverValue);
                    }
                }
            } catch (Exception e) {
                log.warn("시세 조회 실패로 현금 잔액만 반영: {}", e.getMessage());
                // 시세 조회 실패 시 현금만 반영
                totalBalance = wallet.getGwCashBalance();
            }
            wallet.setGwTotalBalance(totalBalance);
            goldWalletRepository.save(wallet);
            BigDecimal walletAfterBalance = wallet.getGwCashBalance();
            
            // ===== 현물 관련 TransferHistory 기록 추가 (계좌 → 현물통장 이체) =====
            // 계좌에서 현물통장으로 이체 시 TRANSFER_HISTORY_TBL에 이체 내역 기록
            // th_account_out: 출금 계좌 번호 (account.getANo())
            // th_account_in: 입금 지갑 번호 (wallet.getGwNo())
            // transferType: "SPOT_OUT" (현물통장 출금)
            // GOLD_WALLET_TBL.gw_cash_balance는 위에서 이미 업데이트됨
            // transferId는 20자 제한이므로 짧게 생성 (SPOT + 타임스탬프 마지막 10자리 + 계좌번호 최대 5자리)
            String timestamp = String.valueOf(System.currentTimeMillis());
            String shortTimestamp = timestamp.substring(timestamp.length() - 10); // 마지막 10자리
            String accountNoStr = String.valueOf(account.getANo());
            String transferId = "SPOT" + shortTimestamp + accountNoStr;
            if (transferId.length() > 20) {
                transferId = transferId.substring(0, 20); // 20자로 제한
            }
            TransferHistory accountHistory = TransferHistory.builder()
                .transferId(transferId)
                .accountNo(account.getANo())
                .amount(amount)
                .memo("현물통장 이체: " + walletName)
                .otherBank("EUM")
                .otherAccount(wallet.getGwAccountNo() != null ? wallet.getGwAccountNo() : walletName)
                .transferType("SPOT_OUT")
                .afterBalance(accountAfterBalance)
                .transactionType("TRANSFER")
                .accountOut(BigDecimal.valueOf(account.getANo())) // 출금 계좌 번호
                .accountIn(BigDecimal.valueOf(wallet.getGwNo())) // 입금 지갑 번호
                .pId(0)
                .build();
            transferHistoryRepository.save(accountHistory);
            // ===== 현물 관련 TransferHistory 기록 추가 완료 =====
            
            result.put("success", true);
            result.put("message", "이체가 완료되었습니다.");
            result.put("amount", amount);
            result.put("walletName", walletName);
            result.put("newAccountBalance", accountAfterBalance);
            result.put("newWalletBalance", walletAfterBalance);
            
            log.info("계좌 → 현물통장 이체 완료: customerNo={}, amount={}, walletName={}", customerNo, amount, walletName);
            return result;
            
        } catch (Exception e) {
            log.error("계좌 → 현물통장 이체 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "이체 중 오류가 발생했습니다: " + e.getMessage());
            return errorResult;
        }
    }
    
    /**
     * 현물거래 통장에서 계좌로 이체
     */
    @Transactional
    public Map<String, Object> transferFromTradingAccount(Integer customerNo, BigDecimal amount, String walletName, String pin, Integer accountNo) {
        try {
            
            Map<String, Object> result = new HashMap<>();
            
            // 고객 존재 여부 확인
            customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            // 지갑 선택 (지정되지 않으면 첫 번째 지갑 사용)
            if (walletName == null || walletName.trim().isEmpty()) {
                List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo.longValue());
                if (wallets.isEmpty()) {
                    throw new RuntimeException("이체를 위해서는 지갑이 필요합니다. 먼저 지갑을 개설해주세요.");
                }
                walletName = wallets.get(0).getGwWalletName();
            }
            
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("지갑을 찾을 수 없습니다."));
            
            // PIN 검증
            if (pin != null && !pin.trim().isEmpty()) {
                if (!pin.equals(wallet.getGwPin())) {
                    log.error("PIN 검증 실패: customerNo={}, walletName={}", customerNo, walletName);
                    throw new RuntimeException("PIN이 올바르지 않습니다.");
                }
            }
            
            // 지갑 잔액 확인
            if (wallet.getGwCashBalance().compareTo(amount) < 0) {
                log.error("지갑 잔액 부족: customerNo={}, 현재={}, 필요={}", customerNo, wallet.getGwCashBalance(), amount);
                throw new RuntimeException("지갑 잔액이 부족합니다. 현재: " + wallet.getGwCashBalance() + "원, 필요: " + amount + "원");
            }
            
            // 계좌 조회
            Optional<Account> accountOpt;
            if (accountNo != null) {
                accountOpt = spotAccountService.getAccountByAccountNo(accountNo);
                if (accountOpt.isPresent() && !accountOpt.get().getCNo().equals(customerNo)) {
                    log.error("선택된 계좌가 해당 고객의 계좌가 아님: customerNo={}, accountNo={}", customerNo, accountNo);
                    throw new RuntimeException("선택된 계좌가 해당 고객의 계좌가 아닙니다.");
                }
            } else {
                accountOpt = spotAccountService.getActiveAccountByCustomerNo(customerNo);
            }
            
            if (accountOpt.isEmpty()) {
                log.error("활성 계좌를 찾을 수 없음: customerNo={}, accountNo={}", customerNo, accountNo);
                throw new RuntimeException("활성 계좌를 찾을 수 없습니다.");
            }
            
            Account account = accountOpt.get();
            
            // 지갑에서 차감
            wallet.setGwCashBalance(wallet.getGwCashBalance().subtract(amount));
            
            // gw_total_balance 계산 (현금 + 금 평가액 + 은 평가액)
            BigDecimal totalBalance = wallet.getGwCashBalance();
            try {
                // 금 시세 조회 및 평가액 계산
                if (wallet.getGwGoldBalance().compareTo(BigDecimal.ZERO) > 0) {
                    Price goldPrice = priceService.getLatestPrice("AU");
                    if (goldPrice != null) {
                        BigDecimal goldValue = goldPrice.getPBuyPrice().multiply(wallet.getGwGoldBalance());
                        totalBalance = totalBalance.add(goldValue);
                    }
                }
                // 은 시세 조회 및 평가액 계산
                if (wallet.getGwSilverBalance().compareTo(BigDecimal.ZERO) > 0) {
                    Price silverPrice = priceService.getLatestPrice("AG");
                    if (silverPrice != null) {
                        BigDecimal silverValue = silverPrice.getPBuyPrice().multiply(wallet.getGwSilverBalance());
                        totalBalance = totalBalance.add(silverValue);
                    }
                }
            } catch (Exception e) {
                log.warn("시세 조회 실패로 현금 잔액만 반영: {}", e.getMessage());
                // 시세 조회 실패 시 현금만 반영
                totalBalance = wallet.getGwCashBalance();
            }
            wallet.setGwTotalBalance(totalBalance);
            goldWalletRepository.save(wallet);
            BigDecimal walletAfterBalance = wallet.getGwCashBalance();
            
            // 계좌에 추가 (선택된 계좌 번호 사용)
            spotAccountService.updateAccountBalanceByAccountNo(account.getANo(), amount);
            
            // 계좌 잔액 조회 (업데이트 후)
            Account updatedAccount = spotAccountService.getAccountByAccountNo(account.getANo())
                .orElseThrow(() -> new RuntimeException("계좌를 찾을 수 없습니다."));
            BigDecimal accountAfterBalance = updatedAccount.getBalance();
            
            // ===== 현물 관련 TransferHistory 기록 추가 (현물통장 → 계좌 이체) =====
            // 현물통장에서 계좌로 이체 시 TRANSFER_HISTORY_TBL에 이체 내역 기록
            // th_account_out: 출금 지갑 번호 (wallet.getGwNo())
            // th_account_in: 입금 계좌 번호 (account.getANo())
            // transferType: "SPOT_IN" (현물통장 입금)
            // GOLD_WALLET_TBL.gw_cash_balance는 위에서 이미 업데이트됨
            // transferId는 20자 제한이므로 짧게 생성 (SPOT + 타임스탬프 마지막 10자리 + 계좌번호 최대 5자리)
            String timestamp = String.valueOf(System.currentTimeMillis());
            String shortTimestamp = timestamp.substring(timestamp.length() - 10); // 마지막 10자리
            String accountNoStr = String.valueOf(account.getANo());
            String transferId = "SPOT" + shortTimestamp + accountNoStr;
            if (transferId.length() > 20) {
                transferId = transferId.substring(0, 20); // 20자로 제한
            }
            TransferHistory accountHistory = TransferHistory.builder()
                .transferId(transferId)
                .accountNo(account.getANo())
                .amount(amount)
                .memo("현물통장에서 이체: " + walletName)
                .otherBank("EUM")
                .otherAccount(wallet.getGwAccountNo() != null ? wallet.getGwAccountNo() : walletName)
                .transferType("SPOT_IN")
                .afterBalance(accountAfterBalance)
                .transactionType("TRANSFER")
                .accountOut(BigDecimal.valueOf(wallet.getGwNo())) // 출금 지갑 번호
                .accountIn(BigDecimal.valueOf(account.getANo())) // 입금 계좌 번호
                .pId(0)
                .build();
            transferHistoryRepository.save(accountHistory);
            // ===== 현물 관련 TransferHistory 기록 추가 완료 =====
            
            result.put("success", true);
            result.put("message", "이체가 완료되었습니다.");
            result.put("amount", amount);
            result.put("walletName", walletName);
            result.put("newAccountBalance", accountAfterBalance);
            result.put("newWalletBalance", walletAfterBalance);
            
            log.info("현물통장 → 계좌 이체 완료: customerNo={}, amount={}, walletName={}", customerNo, amount, walletName);
            return result;
            
        } catch (Exception e) {
            log.error("현물통장 → 계좌 이체 중 오류: customerNo={}, error={}", customerNo, e.getMessage());
            throw new RuntimeException("이체 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 지갑 삭제
     */
    @Transactional
    public boolean deleteWallet(Long walletId) {
        try {
            log.info("지갑 삭제 시작: walletId={}", walletId);
            
            GoldWallet wallet = goldWalletRepository.findById(walletId.intValue())
                .orElseThrow(() -> new RuntimeException("지갑을 찾을 수 없습니다."));
            
            log.info("지갑 정보: id={}, name={}, cashBalance={}, goldBalance={}, silverBalance={}", 
                wallet.getGwNo(), wallet.getGwWalletName(), 
                wallet.getGwCashBalance(), wallet.getGwGoldBalance(), wallet.getGwSilverBalance());
            
            // 지갑에 잔액이 있으면 삭제 불가
            if (wallet.getGwCashBalance().compareTo(BigDecimal.ZERO) > 0 ||
                wallet.getGwGoldBalance().compareTo(BigDecimal.ZERO) > 0 ||
                wallet.getGwSilverBalance().compareTo(BigDecimal.ZERO) > 0) {
                log.warn("지갑에 잔액이 있어 삭제 불가: walletId={}", walletId);
                throw new RuntimeException("지갑에 잔액이 있어 삭제할 수 없습니다.");
            }
            
            goldWalletRepository.delete(wallet);
            log.info("지갑 삭제 완료: walletId={}", walletId);
            return true;
            
        } catch (Exception e) {
            log.error("지갑 삭제 중 오류: walletId={}, error={}", walletId, e.getMessage());
            return false;
        }
    }
    
    /**
     * 모든 상품 목록 조회 (DTO 반환)
     */
    @Transactional(readOnly = true)
    public List<GoldProductDto> getAllProductsDto() {
        try {
            log.info("상품 목록 조회 시작");
            List<GoldProduct> products = goldProductRepository.findAll();
            log.info("상품 조회 완료: 개수={}", products.size());
            return toGoldProductDtos(products);
        } catch (Exception e) {
            log.error("상품 목록 조회 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("상품 목록 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 특정 상품 조회 (DTO 반환)
     */
    @Transactional(readOnly = true)
    public GoldProductDto getProductDto(String productId) {
        try {
            log.info("상품 조회 시작: productId={}", productId);
            GoldProduct product = goldProductRepository.findByGpId(productId)
                .orElse(null);
            if (product == null) {
                log.warn("상품을 찾을 수 없음: productId={}", productId);
                return null;
            }
            log.info("상품 조회 완료: productId={}", productId);
            return toGoldProductDto(product);
        } catch (Exception e) {
            log.error("상품 조회 중 오류: productId={}, error={}", productId, e.getMessage(), e);
            throw new RuntimeException("상품 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 고객 정보 조회 (GoldCustomer → DTO)
     */
    @Transactional(readOnly = true)
    public GoldCustomerDto getCustomerInfoDto(Long customerNo) {
        try {
            log.info("고객 정보 조회 시작: customerNo={}", customerNo);
            
            // GoldCustomer 조회
            GoldCustomer goldCustomer = goldCustomerRepository.findByCustomerCustomerNo(customerNo)
                .orElse(null);
            
            if (goldCustomer == null) {
                log.warn("고객 정보를 찾을 수 없음: customerNo={}", customerNo);
                return null;
            }
            
            log.info("고객 정보 조회 완료: customerNo={}", customerNo);
            return toGoldCustomerDto(goldCustomer);
        } catch (Exception e) {
            log.error("고객 정보 조회 중 오류: customerNo={}, error={}", customerNo, e.getMessage(), e);
            throw new RuntimeException("고객 정보 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
