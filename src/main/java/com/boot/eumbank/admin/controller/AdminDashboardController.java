package com.boot.eumbank.admin.controller;

import com.boot.eumbank.account.select.repository.AccountSelectRepository;
import com.boot.eumbank.customer.repo.CustomerRepo;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import com.boot.eumbank.product.jpa.repository.DepositQueryRepository;
import com.boot.eumbank.product.jpa.repository.InstallQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

/**
 * 관리자 대시보드 컨트롤러
 */
@Controller
@RequiredArgsConstructor
public class AdminDashboardController {

    // CUSTOMER_TBL 레포지토리
    private final CustomerRepo customerRepo;

    // ACCOUNT_TBL 레포지토리
    private final AccountSelectRepository accountSelectRepository;

    // 예금 / 적금 / 대출 상품 레포지토리
    private final DepositQueryRepository depositQueryRepository;
    private final InstallQueryRepository installQueryRepository;
    private final LoanProductRepository loanProductRepository;

    /**
     * 관리자 대시보드 페이지
     */
    @GetMapping("/admin/dashboard")
    public String dashboard(Model model) {

        /* 1. 회원 수 (CUSTOMER_TBL 행 개수) */
        long memberCount = customerRepo.count();
        String formattedMemberCount = String.format("%,d", memberCount);

        /* 2. 원화 자산 총액 (입출금/예적금/대출 등, 외환계좌 제외) */
        BigDecimal krwTotal = accountSelectRepository.sumKrwAssetsExcludingFx();
        String formattedKrwTotal = formatKrwAmount(krwTotal);   // 예: 122,055,685원

        /* 3. 외화 자산 총액 (외환계좌만, 환율 기준으로 원화 환산) */
        BigDecimal fxTotalInKrw = accountSelectRepository.sumForeignAssetsInKrw();
        String formattedFxTotal = formatKrwAmount(fxTotalInKrw); // 예: 300,000,000원

        /* 4. 예금 / 적금 / 대출 상품 개수 */
        long depositProductCount = depositQueryRepository.countActiveDepositProducts();
        String formattedDepositProductCount = String.format("%,d", depositProductCount);

        long installmentProductCount = installQueryRepository.countActiveInstallmentProducts();
        String formattedInstallmentProductCount = String.format("%,d", installmentProductCount);

        long loanProductCount = loanProductRepository.countByIsActiveTrue();
        String formattedLoanProductCount = String.format("%,d", loanProductCount);

        /* 5. 통계 카드 데이터 구성 */
        var stats = List.of(

                // 1. 회원 수
                // TODO: CustomerRepo.count() 또는 CustomerRepository.count() 사용
                // 예: long memberCount = customerRepo.count();
                //     String formattedCount = String.format("%,d", memberCount);
                Map.of("title", "회원 수", 
                       "value", "1,200",
                        "img", "",
                       "icon", "ri-group-line", 
                       "color", "text-blue-600",
                       "iconColor", ""),
                
                // 2. 고객들의 원화 자산 총액
                // TODO: Account 테이블에서 원화(currency = 'KRW') 계좌들의 잔액 합계 조회 필요
                // 예: 
                //     BigDecimal krwTotal = accountRepository.sumBalanceByCurrency("KRW");
                //     String formattedValue = formatCurrency(krwTotal, "KRW");
                //     // 또는 "1,500억원" 형식으로 포맷팅
                Map.of("title", "원화 자산 총액", 
                       "value", "1,500억원",
                        "img", "",
                       "icon", "fa-solid fa-won-sign", 
                       "color", "text-green-600",
                       "iconColor", ""),
                
                // 3. 고객들의 외화 자산 총액
                // TODO: Account 테이블에서 외화(currency != 'KRW') 계좌들의 잔액 합계 조회 필요
                // - 환율 적용이 필요할 수 있음 (원화로 환산하여 표시)
                // 예: 
                //     BigDecimal foreignTotal = accountRepository.sumForeignBalance();
                //     // 환율 적용 후 원화로 환산하거나, 각 통화별로 합계 표시
                //     String formattedValue = formatCurrency(foreignTotal, "FOREIGN");
                //     // 또는 "300억원" 형식으로 포맷팅 (원화 환산 기준)
                Map.of("title", "외화 자산 총액", 
                       "value", "300억원",
                        "img", "",
                       "icon", "ri-exchange-dollar-line", 
                       "color", "text-emerald-600",
                       "iconColor", ""),
                
                // 4. 등록된 예금 상품 갯수
                // TODO: DepositProduct 관련 Repository 사용
                // 예: long depositProductCount = depositProductRepository.count();
                //     String formattedCount = String.format("%,d", depositProductCount);
                // 참고: ProductDeposit 엔티티 또는 DepositProduct 엔티티 확인 필요
                Map.of("title", "예금 상품 수", 
                       "value", "15",
                        "img", "",
                       "icon", "ri-bank-card-line", 
                       "color", "text-indigo-600",
                       "iconColor", ""),
                
                // 5. 등록된 적금 상품 갯수
                // TODO: InstallmentProduct 관련 Repository 사용
                // 예: long installmentProductCount = installmentProductRepository.count();
                //     String formattedCount = String.format("%,d", installmentProductCount);
                // 참고: ProductInstallment 엔티티 또는 InstallmentProduct 엔티티 확인 필요
                Map.of("title", "적금 상품 수", 
                       "value", "12",
                        "img", "",
                       "icon", "ri-safe-line", 
                       "color", "text-purple-600",
                       "iconColor", ""),
                
                // 6. 등록된 대출 상품 갯수
                // TODO: LoanProductRepository.count() 사용
                // 예: long loanProductCount = loanProductRepository.count();
                //     String formattedCount = String.format("%,d", loanProductCount);
                Map.of("title", "대출 상품 수", 
                       "value", "8",
                        "img", "",
                       "icon", "ri-bank-card-2-line", 
                       "color", "text-orange-600",
                       "iconColor", ""),
                
                // 7. 금 보유량
                // TODO: 금 보유량 관련 엔티티/Repository 확인 필요
                // 예: spot 관련 엔티티나 별도 테이블에서 조회
                //     BigDecimal goldAmount = goldRepository.sumGoldAmount();
                //     String formattedValue = String.format("%,.2f kg", goldAmount);
                Map.of("title", "금 보유량", 
                       "value", "1,250.50 kg",
                       "img", "/img/goldbar.png",
                       "icon", "",
                       "color", "text-yellow-600",
                       "iconColor", "gold"),
                
                // 8. 은 보유량
                // TODO: 은 보유량 관련 엔티티/Repository 확인 필요
                // 예: spot 관련 엔티티나 별도 테이블에서 조회
                //     BigDecimal silverAmount = silverRepository.sumSilverAmount();
                //     String formattedValue = String.format("%,.2f kg", silverAmount);
                Map.of("title", "은 보유량", 
                       "value", "5,430.75 kg",
                        "img", "/img/silverbar.png",
                       "icon", "",
                       "color", "text-gray-600",
                       "iconColor", "silver")
        );

        model.addAttribute("stats", stats);
        return "admin/dashboard";
    }

    /** BigDecimal 금액을 "1,234원" 형식으로 포맷 */
    private String formatKrwAmount(BigDecimal amount) {
        if (amount == null) return "0원";
        BigDecimal noDecimal = amount.setScale(0, RoundingMode.DOWN);
        return String.format("%,d원", noDecimal.longValue());
    }
}
