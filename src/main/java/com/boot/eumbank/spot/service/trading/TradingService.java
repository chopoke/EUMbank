package com.boot.eumbank.spot.service.trading;

import com.boot.eumbank.account.open.entity.account.Account;
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
        log.info("=== TradingService.buyMetal 시작 ===");
        log.info("입력 파라미터 - customerNo: {}, productId: {}, quantity: {}, walletName: {}, walletPin: {}", 
                customerNo, productId, quantity, walletName, walletPin);
        
        // 월렛 PIN 검증 (필수)
        if (walletPin == null || walletPin.trim().isEmpty()) {
            throw new RuntimeException("월렛 PIN이 필요합니다.");
        }
        
        // 월렛 이름 처리: null이면 첫 번째 월렛 사용
        if (walletName == null || walletName.trim().isEmpty()) {
            log.info("월렛 이름이 없음 - 첫 번째 월렛 조회 시작");
            List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo.longValue());
            log.info("조회된 월렛 수: {}", wallets.size());
            if (wallets.isEmpty()) {
                log.error("월렛이 없음 - 오류 발생");
                throw new RuntimeException("거래를 위해서는 월렛이 필요합니다. 먼저 월렛을 개설해주세요.");
            }
            walletName = wallets.get(0).getGwWalletName();
            log.info("첫 번째 월렛 선택: {}", walletName);
        } else {
            log.info("지정된 월렛 사용: {}", walletName);
        }
        
        try {
            // 고객 정보 조회
            log.info("고객 정보 조회 시작 - customerNo: {}", customerNo);
            Customer customer = customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            log.info("고객 정보 조회 완료 - customerName: {}", customer.getCNameKr());
            
            // 상품 정보 조회
            log.info("상품 정보 조회 시작 - productId: {}", productId);
            GoldProduct product = goldProductRepository.findByGpId(productId)
                .orElseThrow(() -> new RuntimeException("상품을 찾을 수 없습니다."));
            log.info("상품 정보 조회 완료 - productName: {}, metalCode: {}", 
                    product.getGpName(), product.getGpMetalCode());
            
            // 현재 시세 조회
            log.info("현재 시세 조회 시작 - metalCode: {}", product.getGpMetalCode());
            Price currentPrice;
            try {
                currentPrice = priceService.getLatestPrice(product.getGpMetalCode());
                log.info("현재 시세 조회 완료 - buyPrice: {}, sellPrice: {}", 
                        currentPrice.getPBuyPrice(), currentPrice.getPSellPrice());
            } catch (Exception e) {
                log.error("시세 조회 실패 - metalCode: {}, error: {}", product.getGpMetalCode(), e.getMessage(), e);
                throw new RuntimeException("시세 조회 중 오류가 발생했습니다: " + e.getMessage());
            }
            
            // 수수료 계산
            log.info("수수료 계산 시작 - productId: {}, quantity: {}", productId, quantity);
            BigDecimal feeRate = calculateFeeRate(productId, quantity);
            // 각 단계를 정밀하게 계산한 후 마지막에만 반올림 (프론트엔드와 일치시키기 위해)
            BigDecimal totalPrice = currentPrice.getPBuyPrice().multiply(quantity);
            BigDecimal feeAmount = totalPrice.multiply(feeRate);
            BigDecimal taxAmount = totalPrice.multiply(TAX_RATE);
            // 최종 금액만 반올림 (각 단계를 반올림하면 누적 오차 발생)
            BigDecimal finalAmount = totalPrice.add(feeAmount).add(taxAmount).setScale(0, RoundingMode.HALF_UP);
            // DB 저장용으로는 각 단계도 반올림
            BigDecimal roundedTotalPrice = totalPrice.setScale(0, RoundingMode.HALF_UP);
            BigDecimal roundedFeeAmount = feeAmount.setScale(0, RoundingMode.HALF_UP);
            BigDecimal roundedTaxAmount = taxAmount.setScale(0, RoundingMode.HALF_UP);
            log.info("수수료 계산 완료 - feeRate: {}, totalPrice: {}, feeAmount: {}, taxAmount: {}, finalAmount: {}", 
                    feeRate, roundedTotalPrice, roundedFeeAmount, roundedTaxAmount, finalAmount);
            
            // 월렛 조회 및 PIN 검증
            log.info("월렛 조회 시작 - customerNo: {}, walletName: {}", customerNo, walletName);
            GoldWallet wallet;
            try {
                wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                    .orElseThrow(() -> new RuntimeException("월렛을 찾을 수 없습니다."));
                log.info("월렛 조회 완료 - walletNo: {}, cashBalance: {}", wallet.getGwNo(), wallet.getGwCashBalance());
                
                // 월렛 PIN 검증 (필수)
                if (!walletPin.equals(wallet.getGwPin())) {
                    log.error("월렛 PIN 검증 실패 - 입력PIN: {}, 저장PIN: {}", walletPin, wallet.getGwPin());
                    throw new RuntimeException("월렛 PIN이 올바르지 않습니다.");
                }
                log.info("월렛 PIN 검증 성공");
                
            } catch (Exception e) {
                log.error("월렛 조회 실패 - customerNo: {}, walletName: {}, error: {}", customerNo, walletName, e.getMessage(), e);
                throw new RuntimeException("월렛 조회 중 오류가 발생했습니다: " + e.getMessage());
            }
            
            if (wallet.getGwCashBalance().compareTo(finalAmount) < 0) {
                log.error("잔액 부족 - 필요금액: {}, 보유금액: {}", finalAmount, wallet.getGwCashBalance());
                // 금액을 정수로 반올림하고 콤마 포맷팅
                BigDecimal formattedFinalAmount = finalAmount.setScale(0, RoundingMode.HALF_UP);
                BigDecimal formattedBalance = wallet.getGwCashBalance().setScale(0, RoundingMode.HALF_UP);
                DecimalFormat df = new DecimalFormat("#,###");
                throw new RuntimeException("잔액이 부족합니다. 필요금액: " + df.format(formattedFinalAmount) + "원, 보유금액: " + df.format(formattedBalance) + "원");
            }
            log.info("잔액 확인 완료 - 거래 가능");
            
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
            
            // 월렛 잔액 차감 및 금/은 보유량 증가
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
            goldWalletRepository.save(wallet);
            
            log.info("매수 완료: 거래ID={}, 금액={}", transactionId, finalAmount);
            return savedTransaction;
            
        } catch (Exception e) {
            log.error("매수 처리 중 오류 발생: {}", e.getMessage());
            throw new RuntimeException("매수 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 금/은 매도 처리 (계좌 시스템 연동)
     */
    @Transactional
    public GoldTbl sellMetal(Integer customerNo, String productId, BigDecimal quantity, String walletName, String walletPin) {
        log.info("매도 요청: 고객={}, 상품={}, 수량={}, 월렛={}, PIN={}", customerNo, productId, quantity, walletName, walletPin);
        
        // 월렛 PIN 검증 (필수)
        if (walletPin == null || walletPin.trim().isEmpty()) {
            throw new RuntimeException("월렛 PIN이 필요합니다.");
        }
        
        // 월렛 이름 처리: null이면 첫 번째 월렛 사용
        if (walletName == null || walletName.trim().isEmpty()) {
            List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo.longValue());
            if (wallets.isEmpty()) {
                throw new RuntimeException("거래를 위해서는 월렛이 필요합니다. 먼저 월렛을 개설해주세요.");
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
            
            // 월렛 보유량 확인
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("월렛을 찾을 수 없습니다."));
            
            // 월렛 PIN 검증 (필수)
            if (!walletPin.equals(wallet.getGwPin())) {
                log.error("월렛 PIN 검증 실패 - 입력PIN: {}, 저장PIN: {}", walletPin, wallet.getGwPin());
                throw new RuntimeException("월렛 PIN이 올바르지 않습니다.");
            }
            log.info("월렛 PIN 검증 성공");
            
            BigDecimal currentHoldings = "AU".equals(product.getGpMetalCode()) 
                ? wallet.getGwGoldBalance() 
                : wallet.getGwSilverBalance();
            
            if (currentHoldings.compareTo(quantity) < 0) {
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
            
            // 월렛 잔액 증가 및 금/은 보유량 차감
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
            goldWalletRepository.save(wallet);
            
            log.info("매도 완료: 거래ID={}, 금액={}", transactionId, finalAmount);
            return savedTransaction;
            
        } catch (Exception e) {
            log.error("매도 처리 중 오류 발생: {}", e.getMessage());
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
        log.info("동적 조건 페이징 조회: customerNo={}, transactionType={}, metalCode={}, walletName={}", 
                customerNo, transactionType, metalCode, walletName);
        
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
        log.info("=== 거래내역 DTO 페이징 조회 시작 ===");
        log.info("조회 조건 - customerNo: {}, transactionType: {}, metalCode: {}, walletName: {}", 
                customerNo, transactionType, metalCode, walletName);
        
        Page<GoldTbl> transactions = getTransactionsWithDynamicConditionsAndPaging(
            customerNo, transactionType, metalCode, walletName, pageable);
        
        log.info("원본 거래내역 조회 결과 - 총 개수: {}, 현재 페이지: {}, 총 페이지: {}", 
                transactions.getTotalElements(), transactions.getNumber(), transactions.getTotalPages());
        log.info("원본 거래내역 데이터 개수: {}", transactions.getContent().size());
        
        Page<GoldTblDto> dtoPage = transactions.map(this::toGoldTblDto);
        
        log.info("DTO 변환 완료 - 총 개수: {}, 현재 페이지: {}, 총 페이지: {}", 
                dtoPage.getTotalElements(), dtoPage.getNumber(), dtoPage.getTotalPages());
        log.info("DTO 데이터 개수: {}", dtoPage.getContent().size());
        
        if (!dtoPage.getContent().isEmpty()) {
            log.info("첫 번째 DTO: {}", dtoPage.getContent().get(0));
        }
        
        log.info("=== 거래내역 DTO 페이징 조회 완료 ===");
        return dtoPage;
    }
    
    /**
     * 동적 조건 DTO 페이징 조회 (총합 정보 포함)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerTransactionsDtoWithPagingAndSummary(Long customerNo, Pageable pageable, 
                                                                String transactionType, 
                                                                String metalCode, 
                                                                String walletName) {
        log.info("=== 거래내역 DTO 페이징 조회 및 총합 시작 ===");
        log.info("조회 조건 - customerNo: {}, transactionType: {}, metalCode: {}, walletName: {}", 
                customerNo, transactionType, metalCode, walletName);
        
        // 거래내역 페이징 조회
        Page<GoldTblDto> dtoPage = getCustomerTransactionsDtoWithPaging(customerNo, pageable, transactionType, metalCode, walletName);
        
        // 총합 정보 계산
        Map<String, Object> summary = calculateTransactionSummary(customerNo, transactionType, metalCode, walletName);
        
        // 결과 구성
        Map<String, Object> result = new HashMap<>();
        result.put("transactions", dtoPage);
        result.put("summary", summary);
        
        log.info("=== 거래내역 DTO 페이징 조회 및 총합 완료 ===");
        return result;
    }
    
    /**
     * 거래내역 총합 정보 계산
     */
    @Transactional(readOnly = true)
    private Map<String, Object> calculateTransactionSummary(Long customerNo, String transactionType, String metalCode, String walletName) {
        log.info("거래내역 총합 계산: customerNo={}, transactionType={}, metalCode={}, walletName={}", 
                customerNo, transactionType, metalCode, walletName);
        
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
        
        // 월렛별 합계
        Map<String, Map<String, BigDecimal>> walletSummary = new HashMap<>();
        
        for (GoldTbl transaction : allTransactions) {
            // 월렛명이 null인 경우 해당 거래를 제외
            if (transaction.getGWalletName() == null || transaction.getGWalletName().trim().isEmpty()) {
                continue;
            }
            
            String wallet = transaction.getGWalletName();
            BigDecimal amount = transaction.getGTotalPrice();
            BigDecimal tax = transaction.getGTaxAmount();
            BigDecimal fee = transaction.getGFeeAmount();
            
            // 월렛별 합계 초기화
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
        
        // 월렛별 평가손익 및 수익률 계산
        Map<String, Map<String, Object>> walletEvaluation = calculateWalletEvaluation(customerNo, walletSummary);
        
        // 월렛별 합계에 평가손익 정보 추가
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
        
        // 월렛별 합계
        summary.put("walletSummary", enhancedWalletSummary);
        
        log.info("총합 계산 완료: 매수={}, 매도={}, 순손익={}", totalBuyAmount, totalSellAmount, totalSellAmount.subtract(totalBuyAmount));
        
        return summary;
    }
    
    /**
     * 월렛별 평가손익 및 수익률 계산
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
            
            // 각 월렛별 평가손익 계산
            for (String walletName : walletSummary.keySet()) {
                Map<String, Object> evalData = new HashMap<>();
                
                // 월렛별 보유량 조회
                Optional<GoldWallet> walletOpt = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo, walletName);
                if (walletOpt.isPresent()) {
                    GoldWallet wallet = walletOpt.get();
                    BigDecimal goldBalance = wallet.getGwGoldBalance();
                    BigDecimal silverBalance = wallet.getGwSilverBalance();
                    
                    // 월렛별 매수 평균가 계산 (거래내역에서)
                    Map<String, BigDecimal> avgPrices = calculateAverageBuyPrice(customerNo, walletName);
                    BigDecimal avgGoldPrice = avgPrices.get("gold");
                    BigDecimal avgSilverPrice = avgPrices.get("silver");
                    
                    // 평가손익 계산
                    BigDecimal goldEvaluationProfit = BigDecimal.ZERO;
                    BigDecimal silverEvaluationProfit = BigDecimal.ZERO;
                    
                    if (goldBalance.compareTo(BigDecimal.ZERO) > 0 && avgGoldPrice.compareTo(BigDecimal.ZERO) > 0) {
                        goldEvaluationProfit = currentGoldPrice.subtract(avgGoldPrice).multiply(goldBalance);
                        log.info("금 평가손익 계산: 월렛={}, 보유량={}, 현재가={}, 평균가={}, 평가손익={}", 
                                walletName, goldBalance, currentGoldPrice, avgGoldPrice, goldEvaluationProfit);
                    }
                    
                    if (silverBalance.compareTo(BigDecimal.ZERO) > 0 && avgSilverPrice.compareTo(BigDecimal.ZERO) > 0) {
                        silverEvaluationProfit = currentSilverPrice.subtract(avgSilverPrice).multiply(silverBalance);
                        log.info("은 평가손익 계산: 월렛={}, 보유량={}, 현재가={}, 평균가={}, 평가손익={}", 
                                walletName, silverBalance, currentSilverPrice, avgSilverPrice, silverEvaluationProfit);
                    }
                    
                    BigDecimal totalEvaluationProfit = goldEvaluationProfit.add(silverEvaluationProfit);
                    
                    // 수익률 계산 - 총 매수금액 대비 평가손익
                    BigDecimal totalBuyAmount = walletSummary.get(walletName).get("buyAmount");
                    BigDecimal profitRate = BigDecimal.ZERO;
                    if (totalBuyAmount.compareTo(BigDecimal.ZERO) > 0) {
                        profitRate = totalEvaluationProfit.divide(totalBuyAmount, 4, RoundingMode.HALF_UP).multiply(new BigDecimal("100"));
                    }
                    
                    log.info("월렛 평가손익 계산 완료: 월렛={}, 총매수금액={}, 평가손익={}, 수익률={}%", 
                            walletName, totalBuyAmount, totalEvaluationProfit, profitRate);
                    
                    evalData.put("evaluationProfit", totalEvaluationProfit);
                    evalData.put("profitRate", profitRate);
                    evalData.put("currentGoldPrice", currentGoldPrice);
                    evalData.put("currentSilverPrice", currentSilverPrice);
                    evalData.put("goldBalance", goldBalance);
                    evalData.put("silverBalance", silverBalance);
                    evalData.put("avgGoldPrice", avgGoldPrice);
                    evalData.put("avgSilverPrice", avgSilverPrice);
                } else {
                    // 월렛이 없는 경우 기본값
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
            log.error("월렛별 평가손익 계산 중 오류: {}", e.getMessage(), e);
        }
        
        return walletEvaluation;
    }
    
    /**
     * 월렛별 매수 평균가 계산
     */
    @Transactional(readOnly = true)
    private Map<String, BigDecimal> calculateAverageBuyPrice(Long customerNo, String walletName) {
        Map<String, BigDecimal> avgPrices = new HashMap<>();
        avgPrices.put("gold", BigDecimal.ZERO);
        avgPrices.put("silver", BigDecimal.ZERO);
        
        try {
            // 해당 월렛의 매수 거래만 조회
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
            log.error("월렛별 매수 평균가 계산 중 오류: {}", e.getMessage(), e);
        }
        
        return avgPrices;
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
     * 고객 잔고 조회 (계좌 + 월렛)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getCustomerBalance(Long customerNo) {
        try {
            log.info("잔고 조회 시작: customerNo={}", customerNo);
            
            Map<String, Object> result = new HashMap<>();
            
            // 고객 정보 조회
            Customer customer = customerRepo.findById(customerNo.intValue())
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            // 월렛 목록 조회
            List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo);
            
            // 계좌 잔고 (일반 계좌 - SpotAccountService 사용)
            BigDecimal accountBalance = BigDecimal.ZERO;
            try {
                Optional<Account> accountOpt = spotAccountService.getActiveAccountByCustomerNo(customerNo.intValue());
                if (accountOpt.isPresent()) {
                    accountBalance = accountOpt.get().getBalance();
                }
            } catch (Exception e) {
                log.warn("계좌 잔고 조회 실패: customerNo={}, error={}", customerNo, e.getMessage());
                accountBalance = BigDecimal.ZERO;
            }
            
            // 월렛별 잔고 계산
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
            
            log.info("잔고 조회 완료: account={}, wallet={}, gold={}, silver={}", 
                accountBalance, totalWalletBalance, totalGoldBalance, totalSilverBalance);
            
            return result;
            
        } catch (Exception e) {
            log.error("잔고 조회 중 오류 발생: customerNo={}, error={}", customerNo, e.getMessage(), e);
            throw new RuntimeException("잔고 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 고객 월렛 목록 조회 (DTO 반환)
     */
    @Transactional
    public List<GoldWalletDto> getCustomerWalletsDto(Long customerNo) {
        try {
            log.info("월렛 조회 시작 (DTO): customerNo={}", customerNo);
            
            // 고객 존재 여부 확인
            Customer customer = customerRepo.findById(customerNo.intValue())
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다: " + customerNo));
            
            // 월렛 조회
            List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo);
            log.info("월렛 조회 성공: customerNo={}, 조회된 월렛 수={}", customerNo, wallets.size());
            
            // 기존 월렛 중 계좌번호가 없는 경우 자동 생성
            for (GoldWallet wallet : wallets) {
                if (wallet.getGwAccountNo() == null || wallet.getGwAccountNo().trim().isEmpty()) {
                    log.info("계좌번호가 없는 월렛 발견, 자동 생성: walletNo={}", wallet.getGwNo());
                    String accountNo = generateAccountNo(wallet.getGwNo());
                    wallet.setGwAccountNo(accountNo);
                    goldWalletRepository.save(wallet);
                    log.info("계좌번호 생성 완료: walletNo={}, accountNo={}", wallet.getGwNo(), accountNo);
                }
            }
            
            // DTO 변환
            return toGoldWalletDtos(wallets);
            
        } catch (Exception e) {
            log.error("월렛 조회 중 오류 발생: customerNo={}, error={}", customerNo, e.getMessage(), e);
            throw new RuntimeException("월렛 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 고객 월렛 목록 조회 (Map 형태, 기존 호환)
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCustomerWallets(Long customerNo) {
        try {
            log.info("월렛 조회 시작 (Map): customerNo={}", customerNo);
            
            // DTO로 먼저 조회
            List<GoldWalletDto> dtos = getCustomerWalletsDto(customerNo);
            
            // DTO를 Map으로 변환
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
            log.error("월렛 조회 중 오류 발생: customerNo={}, error={}", customerNo, e.getMessage(), e);
            throw new RuntimeException("월렛 조회 중 오류가 발생했습니다: " + e.getMessage());
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
     * 형식: WL + 월렛번호(6자리)
     * 예: WL000001 (월렛번호 1)
     * 주의: 월렛 번호는 저장 후에 생성되므로, 저장 후 이 메서드를 호출해야 함
     */
    private String generateAccountNo(Integer walletNo) {
        return "WL" + String.format("%06d", walletNo);
    }
    
    /**
     * 월렛 생성
     */
    @Transactional
    public Map<String, Object> createWallet(Integer customerNo, String walletName, String walletPin) {
        log.info("=== 월렛 생성 시작 ===");
        log.info("입력 파라미터 - customerNo: {}, walletName: {}, walletPin: {}", customerNo, walletName, walletPin);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 입력값 검증
            if (customerNo == null) {
                throw new RuntimeException("고객번호가 필요합니다.");
            }
            if (walletName == null || walletName.trim().isEmpty()) {
                throw new RuntimeException("월렛명이 필요합니다.");
            }
            
            // 사용자가 입력한 PIN 사용
            if (walletPin == null || walletPin.trim().isEmpty()) {
                throw new RuntimeException("PIN 번호가 필요합니다.");
            }
            if (walletPin.length() != 6) {
                throw new RuntimeException("PIN 번호는 6자리여야 합니다.");
            }
            log.info("사용자 입력 월렛 PIN: {}", walletPin);
            
            // 고객 정보 조회
            log.info("고객 정보 조회 시작 - customerNo: {}", customerNo);
            Customer customer = customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            log.info("고객 정보 조회 완료 - customerName: {}", customer.getCNameKr());
            
            // 월렛명 중복 확인
            log.info("월렛명 중복 확인 시작 - customerNo: {}, walletName: {}", customerNo, walletName);
            try {
                boolean exists = goldWalletRepository.existsByCustomerNoAndWalletName(customerNo.longValue(), walletName);
                log.info("월렛명 중복 확인 결과: {}", exists);
                
                if (exists) {
                    result.put("success", false);
                    result.put("message", "이미 존재하는 월렛명입니다.");
                    log.warn("월렛명 중복으로 생성 실패: {}", walletName);
                    return result;
                }
            } catch (Exception e) {
                log.error("월렛명 중복 확인 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage(), e);
                throw new RuntimeException("월렛명 중복 확인 중 오류가 발생했습니다: " + e.getMessage());
            }
            
            // 월렛 생성 (계좌번호는 저장 후 생성)
            log.info("월렛 객체 생성 시작");
            GoldWallet wallet = GoldWallet.builder()
                .customer(customer)
                .gwWalletName(walletName.trim())
                .gwAccountNo(null) // 저장 후 월렛 번호로 생성
                .gwPin(walletPin)
                .gwCashBalance(BigDecimal.ZERO)
                .gwGoldBalance(BigDecimal.ZERO)
                .gwSilverBalance(BigDecimal.ZERO)
                .gwTotalBalance(BigDecimal.ZERO)
                .gwActiveYn("Y")
                .build();
            log.info("월렛 객체 생성 완료");
            
            // 월렛 저장
            log.info("월렛 저장 시작");
            GoldWallet savedWallet;
            try {
                savedWallet = goldWalletRepository.save(wallet);
                log.info("월렛 저장 완료 - walletNo: {}", savedWallet.getGwNo());
                
                // 저장 후 월렛 번호로 계좌번호 생성 (DB 스키마 형식: WL + 월렛번호)
                String accountNo = generateAccountNo(savedWallet.getGwNo());
                log.info("생성된 계좌번호: {}", accountNo);
                
                // 계좌번호 업데이트
                savedWallet.setGwAccountNo(accountNo);
                savedWallet = goldWalletRepository.save(savedWallet);
                log.info("계좌번호 업데이트 완료 - walletNo: {}, accountNo: {}", savedWallet.getGwNo(), accountNo);
            } catch (Exception e) {
                log.error("월렛 저장 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage(), e);
                throw new RuntimeException("월렛 저장 중 오류가 발생했습니다: " + e.getMessage());
            }
            
            result.put("success", true);
            result.put("message", "월렛이 생성되었습니다. 설정한 PIN: " + walletPin);
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
            
            log.info("=== 월렛 생성 성공 ===");
            return result;
            
        } catch (Exception e) {
            log.error("=== 월렛 생성 실패 ===");
            log.error("오류 상세: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage(), e);
            result.put("success", false);
            result.put("message", "월렛 생성 중 오류가 발생했습니다: " + e.getMessage());
            return result;
        }
    }
    
    /**
     * 월렛 PIN 검증
     */
    @Transactional(readOnly = true)
    public boolean validateWalletPin(Integer customerNo, String walletName, String pin) {
        try {
            log.info("월렛 PIN 검증 시작: customerNo={}, walletName={}", customerNo, walletName);
            
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("월렛을 찾을 수 없습니다."));
            
            boolean isValid = pin.equals(wallet.getGwPin());
            log.info("월렛 PIN 검증 결과: customerNo={}, walletName={}, isValid={}", customerNo, walletName, isValid);
            
            return isValid;
        } catch (Exception e) {
            log.error("월렛 PIN 검증 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * PIN 분실 시 복구 (새로운 PIN 생성)
     */
    @Transactional
    public Map<String, Object> recoverWalletPin(Integer customerNo, String walletName) {
        log.info("=== PIN 복구 시작 ===");
        log.info("입력 파라미터 - customerNo: {}, walletName: {}", customerNo, walletName);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 입력값 검증
            if (customerNo == null) {
                throw new RuntimeException("고객번호가 필요합니다.");
            }
            if (walletName == null || walletName.trim().isEmpty()) {
                throw new RuntimeException("월렛명이 필요합니다.");
            }
            
            // 고객 정보 조회
            Customer customer = customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            // 월렛 조회
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("월렛을 찾을 수 없습니다."));
            
            // 새로운 PIN 생성
            String newPin = generateRandomPin();
            log.info("새로운 PIN 생성: {}", newPin);
            
            // PIN 업데이트
            wallet.setGwPin(newPin);
            goldWalletRepository.save(wallet);
            
            result.put("success", true);
            result.put("message", "PIN이 복구되었습니다. 새로운 PIN: " + newPin);
            result.put("newPin", newPin);
            result.put("walletName", walletName);
            
            log.info("=== PIN 복구 성공 ===");
            return result;
            
        } catch (Exception e) {
            log.error("=== PIN 복구 실패 ===");
            log.error("오류 상세: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage(), e);
            result.put("success", false);
            result.put("message", "PIN 복구 중 오류가 발생했습니다: " + e.getMessage());
            return result;
        }
    }
    
    /**
     * 월렛 PIN 업데이트
     */
    @Transactional
    public Map<String, Object> updateWalletPin(Integer customerNo, String walletName, String oldPin, String newPin) {
        try {
            log.info("월렛 PIN 업데이트 시작: customerNo={}, walletName={}", customerNo, walletName);
            
            Map<String, Object> result = new HashMap<>();
            
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("월렛을 찾을 수 없습니다."));
            
            // 기존 PIN 검증
            if (!oldPin.equals(wallet.getGwPin())) {
                throw new RuntimeException("기존 PIN이 올바르지 않습니다.");
            }
            
            // 새 PIN 설정
            wallet.setGwPin(newPin);
            goldWalletRepository.save(wallet);
            
            result.put("success", true);
            result.put("message", "PIN이 성공적으로 업데이트되었습니다.");
            
            log.info("월렛 PIN 업데이트 완료: customerNo={}, walletName={}", customerNo, walletName);
            return result;
            
        } catch (Exception e) {
            log.error("월렛 PIN 업데이트 중 오류: customerNo={}, walletName={}, error={}", customerNo, walletName, e.getMessage(), e);
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
    public Map<String, Object> transferToTradingAccount(Integer customerNo, BigDecimal amount, String walletName, String pin) {
        try {
            log.info("계좌 → 현물거래통장 이체 시작: customerNo={}, amount={}, walletName={}", customerNo, amount, walletName);
            
            Map<String, Object> result = new HashMap<>();
            
            // 고객 정보 조회
            Customer customer = customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            // 계좌 잔액 확인
            log.info("계좌 조회 시작: customerNo={}", customerNo);
            Optional<Account> accountOpt = spotAccountService.getActiveAccountByCustomerNo(customerNo);
            if (accountOpt.isEmpty()) {
                log.error("활성 계좌를 찾을 수 없습니다: customerNo={}", customerNo);
                throw new RuntimeException("활성 계좌를 찾을 수 없습니다.");
            }
            log.info("계좌 조회 성공: customerNo={}, accountNo={}, balance={}", customerNo, accountOpt.get().getANo(), accountOpt.get().getBalance());
            
            Account account = accountOpt.get();
            if (account.getBalance().compareTo(amount) < 0) {
                throw new RuntimeException("계좌 잔액이 부족합니다. 현재: " + account.getBalance() + "원, 필요: " + amount + "원");
            }
            
            // 월렛 선택 (지정되지 않으면 첫 번째 월렛 사용)
            log.info("월렛 조회 시작: customerNo={}, walletName={}", customerNo, walletName);
            if (walletName == null || walletName.trim().isEmpty()) {
                List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo.longValue());
                log.info("고객의 월렛 목록: customerNo={}, walletCount={}", customerNo, wallets.size());
                if (wallets.isEmpty()) {
                    log.error("이체를 위한 월렛이 없습니다: customerNo={}", customerNo);
                    throw new RuntimeException("이체를 위해서는 월렛이 필요합니다. 먼저 월렛을 개설해주세요.");
                }
                walletName = wallets.get(0).getGwWalletName();
                log.info("기본 월렛 선택: walletName={}", walletName);
            }
            
            final Integer finalCustomerNo = customerNo;
            final String finalWalletName = walletName;
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> {
                    log.error("월렛을 찾을 수 없습니다: customerNo={}, walletName={}", finalCustomerNo, finalWalletName);
                    return new RuntimeException("월렛을 찾을 수 없습니다.");
                });
            log.info("월렛 조회 성공: walletNo={}, walletName={}, cashBalance={}", wallet.getGwNo(), wallet.getGwWalletName(), wallet.getGwCashBalance());
            
            // PIN 검증 (PIN이 제공된 경우에만)
            if (pin != null && !pin.trim().isEmpty()) {
                if (!pin.equals(wallet.getGwPin())) {
                    throw new RuntimeException("PIN이 올바르지 않습니다.");
                }
                log.info("PIN 검증 성공: walletName={}", walletName);
            } else {
                log.info("PIN 검증 건너뜀: walletName={}", walletName);
            }
            
            // 계좌에서 차감
            spotAccountService.updateAccountBalance(customerNo, amount.negate());
            
            // 월렛에 추가
            wallet.setGwCashBalance(wallet.getGwCashBalance().add(amount));
            goldWalletRepository.save(wallet);
            
            result.put("success", true);
            result.put("message", "이체가 완료되었습니다.");
            result.put("amount", amount);
            result.put("walletName", walletName);
            result.put("newAccountBalance", account.getBalance().subtract(amount));
            result.put("newWalletBalance", wallet.getGwCashBalance());
            
            log.info("계좌 → 현물거래통장 이체 완료: amount={}, walletName={}", amount, walletName);
            return result;
            
        } catch (Exception e) {
            log.error("계좌 → 현물거래통장 이체 중 오류: customerNo={}, error={}", customerNo, e.getMessage(), e);
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
    public Map<String, Object> transferFromTradingAccount(Integer customerNo, BigDecimal amount, String walletName, String pin) {
        try {
            log.info("현물거래통장 → 계좌 이체 시작: customerNo={}, amount={}, walletName={}", customerNo, amount, walletName);
            
            Map<String, Object> result = new HashMap<>();
            
            // 고객 정보 조회
            Customer customer = customerRepo.findById(customerNo)
                .orElseThrow(() -> new RuntimeException("고객을 찾을 수 없습니다."));
            
            // 월렛 선택 (지정되지 않으면 첫 번째 월렛 사용)
            if (walletName == null || walletName.trim().isEmpty()) {
                List<GoldWallet> wallets = goldWalletRepository.findByCustomerCustomerNo(customerNo.longValue());
                if (wallets.isEmpty()) {
                    throw new RuntimeException("이체를 위해서는 월렛이 필요합니다. 먼저 월렛을 개설해주세요.");
                }
                walletName = wallets.get(0).getGwWalletName();
            }
            
            GoldWallet wallet = goldWalletRepository.findByCustomerCustomerNoAndGwWalletName(customerNo.longValue(), walletName)
                .orElseThrow(() -> new RuntimeException("월렛을 찾을 수 없습니다."));
            
            // PIN 검증 (PIN이 제공된 경우에만)
            if (pin != null && !pin.trim().isEmpty()) {
                if (!pin.equals(wallet.getGwPin())) {
                    throw new RuntimeException("PIN이 올바르지 않습니다.");
                }
                log.info("PIN 검증 성공: walletName={}", walletName);
            } else {
                log.info("PIN 검증 건너뜀: walletName={}", walletName);
            }
            
            // 월렛 잔액 확인
            if (wallet.getGwCashBalance().compareTo(amount) < 0) {
                throw new RuntimeException("월렛 잔액이 부족합니다. 현재: " + wallet.getGwCashBalance() + "원, 필요: " + amount + "원");
            }
            
            // 계좌 잔액 확인
            Optional<Account> accountOpt = spotAccountService.getActiveAccountByCustomerNo(customerNo);
            if (accountOpt.isEmpty()) {
                throw new RuntimeException("활성 계좌를 찾을 수 없습니다.");
            }
            
            Account account = accountOpt.get();
            
            // 월렛에서 차감
            wallet.setGwCashBalance(wallet.getGwCashBalance().subtract(amount));
            goldWalletRepository.save(wallet);
            
            // 계좌에 추가
            spotAccountService.updateAccountBalance(customerNo, amount);
            
            result.put("success", true);
            result.put("message", "이체가 완료되었습니다.");
            result.put("amount", amount);
            result.put("walletName", walletName);
            result.put("newAccountBalance", account.getBalance().add(amount));
            result.put("newWalletBalance", wallet.getGwCashBalance());
            
            log.info("현물거래통장 → 계좌 이체 완료: amount={}, walletName={}", amount, walletName);
            return result;
            
        } catch (Exception e) {
            log.error("현물거래통장 → 계좌 이체 중 오류: customerNo={}, error={}", customerNo, e.getMessage(), e);
            throw new RuntimeException("이체 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    /**
     * 월렛 삭제
     */
    @Transactional
    public boolean deleteWallet(Long walletId) {
        try {
            log.info("월렛 삭제 시작: walletId={}", walletId);
            
            GoldWallet wallet = goldWalletRepository.findById(walletId.intValue())
                .orElseThrow(() -> new RuntimeException("월렛을 찾을 수 없습니다."));
            
            log.info("월렛 정보: id={}, name={}, cashBalance={}, goldBalance={}, silverBalance={}", 
                wallet.getGwNo(), wallet.getGwWalletName(), 
                wallet.getGwCashBalance(), wallet.getGwGoldBalance(), wallet.getGwSilverBalance());
            
            // 월렛에 잔액이 있으면 삭제 불가
            if (wallet.getGwCashBalance().compareTo(BigDecimal.ZERO) > 0 ||
                wallet.getGwGoldBalance().compareTo(BigDecimal.ZERO) > 0 ||
                wallet.getGwSilverBalance().compareTo(BigDecimal.ZERO) > 0) {
                log.warn("월렛에 잔액이 있어 삭제 불가: walletId={}", walletId);
                throw new RuntimeException("월렛에 잔액이 있어 삭제할 수 없습니다.");
            }
            
            goldWalletRepository.delete(wallet);
            log.info("월렛 삭제 완료: walletId={}", walletId);
            return true;
            
        } catch (Exception e) {
            log.error("월렛 삭제 중 오류: walletId={}, error={}", walletId, e.getMessage(), e);
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
