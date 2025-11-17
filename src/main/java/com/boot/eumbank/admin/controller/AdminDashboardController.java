package com.boot.eumbank.admin.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;
import java.util.Map;

/**
 * 관리자 대시보드 컨트롤러
 * 
 * @author Admin Team
 */
@Controller
public class AdminDashboardController {
    
    /**
     * 관리자 대시보드 페이지를 렌더링합니다.
     * 
     * 현재는 더미 데이터를 사용하고 있으며, 백엔드 개발자가 실제 데이터로 교체해야 합니다.
     * 
     * @param model 뷰에 전달할 데이터를 담는 모델 객체
     * @return 관리자 대시보드 템플릿 경로
     */
    @GetMapping("/admin/dashboard")
    public String dashboard(Model model) {
        // ============================================
        // 통계 카드 데이터 구성 (8개 항목)
        // ============================================
        // TODO: 백엔드 개발자 작업 필요
        // 아래 더미 데이터를 실제 데이터베이스 조회 결과로 교체해야 합니다.
        
        var stats = List.of(
                // 1. 회원 수
                // TODO: CustomerRepo.count() 또는 CustomerRepository.count() 사용
                // 예: long memberCount = customerRepo.count();
                //     String formattedCount = String.format("%,d", memberCount);
                Map.of("title", "회원 수", 
                       "value", "1,200", 
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
                       "icon", "ri-safe-line", 
                       "color", "text-purple-600",
                       "iconColor", ""),
                
                // 6. 등록된 대출 상품 갯수
                // TODO: LoanProductRepository.count() 사용
                // 예: long loanProductCount = loanProductRepository.count();
                //     String formattedCount = String.format("%,d", loanProductCount);
                Map.of("title", "대출 상품 수", 
                       "value", "8", 
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
                       "icon", "ri-stack-line", 
                       "color", "text-yellow-600",
                       "iconColor", "gold"),
                
                // 8. 은 보유량
                // TODO: 은 보유량 관련 엔티티/Repository 확인 필요
                // 예: spot 관련 엔티티나 별도 테이블에서 조회
                //     BigDecimal silverAmount = silverRepository.sumSilverAmount();
                //     String formattedValue = String.format("%,.2f kg", silverAmount);
                Map.of("title", "은 보유량", 
                       "value", "5,430.75 kg", 
                       "icon", "ri-stack-line", 
                       "color", "text-gray-600",
                       "iconColor", "silver")
        );
        
        model.addAttribute("stats", stats);
        return "admin/dashboard";
    }
}
