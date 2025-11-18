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
                // 1) 회원 수
                Map.of("title", "회원 수",
                        "value", formattedMemberCount,
                        "icon", "ri-group-line",
                        "color", "text-blue-600",
                        "iconColor", ""),

                // 2) 원화 자산 총액
                Map.of("title", "원화 자산 총액",
                        "value", formattedKrwTotal,
                        "icon", "fa-solid fa-won-sign",
                        "color", "text-green-600",
                        "iconColor", ""),

                // 3) 외화 자산 총액 (원화 환산)
                Map.of("title", "외화 자산 총액",
                        "value", formattedFxTotal,
                        "icon", "ri-exchange-dollar-line",
                        "color", "text-emerald-600",
                        "iconColor", ""),

                // 4) 예금 상품 수
                Map.of("title", "예금 상품 수",
                        "value", formattedDepositProductCount,
                        "icon", "ri-bank-card-line",
                        "color", "text-indigo-600",
                        "iconColor", ""),

                // 5) 적금 상품 수
                Map.of("title", "적금 상품 수",
                        "value", formattedInstallmentProductCount,
                        "icon", "ri-safe-line",
                        "color", "text-purple-600",
                        "iconColor", ""),

                // 6) 대출 상품 수
                Map.of("title", "대출 상품 수",
                        "value", formattedLoanProductCount,
                        "icon", "ri-bank-card-2-line",
                        "color", "text-orange-600",
                        "iconColor", "")
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
