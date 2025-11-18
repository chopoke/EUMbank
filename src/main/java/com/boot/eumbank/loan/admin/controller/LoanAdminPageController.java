package com.boot.eumbank.loan.admin.controller;

import com.boot.eumbank.loan.admin.dto.LoanApplyDetailDTO;
import com.boot.eumbank.loan.admin.dto.LoanApplySearchDTO;
import com.boot.eumbank.loan.admin.dto.LoanApplySummaryDTO;
import com.boot.eumbank.loan.admin.dto.LoanApproveComDTO;
import com.boot.eumbank.loan.admin.dto.LoanRejectComDTO;
import com.boot.eumbank.loan.admin.service.LoanAdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Controller
@RequestMapping("/admin/loan")
@RequiredArgsConstructor
public class LoanAdminPageController {

    private final LoanAdminService service;

    // 1) /admin/loan -> 신청 목록으로 리다이렉트
    @GetMapping
    public String loanRoot() {
        return "redirect:/admin/loan/applications";
    }

    // 2) 대출 신청 목록 페이지
    @GetMapping("/applications")
    public String applications(@ModelAttribute("cond") LoanApplySearchDTO cond,
                               Model model) {

        Page<LoanApplySummaryDTO> page = service.findApplications(cond);

        model.addAttribute("page", page);
        model.addAttribute("activeMenu", "loan");          // 사이드바 하이라이트
        model.addAttribute("title", "대출 신청 관리");
        return "loanAdmin/loanApplicationList";            // 아래 템플릿 이름이랑 맞추기
    }

    // 3) 대출 신청 상세 페이지
    @GetMapping("/applications/{laId}")
    public String detail(@PathVariable String laId,
                         Model model) {

        LoanApplyDetailDTO dto = service.getDetail(laId);
        var summary = dto.getSummary();

        // 승인 폼 기본값 설정
        LoanApproveComDTO approveCmd = new LoanApproveComDTO();

        // 승인금액: 기본 = 신청금액
        approveCmd.setApprovedAmount(
                dto.getApprovedAmount() != null
                        ? dto.getApprovedAmount()
                        : summary.getApplyAmount()
        );

        // 승인기간: 기본 = 신청기간
        approveCmd.setApprovedTerm(
                dto.getApprovedTerm() != null
                        ? dto.getApprovedTerm()
                        : summary.getDesiredTerm()
        );

        // 적용금리: 이미 승인된 값이 있으면 그거, 없으면 (있다면) 상품/심사 기본금리
        approveCmd.setApprovedRate(dto.getApprovedRate());

        // 반려 폼 (기본은 비워둠)
        LoanRejectComDTO rejectCmd = new LoanRejectComDTO();

        model.addAttribute("dto", dto);
        model.addAttribute("summary", dto.getSummary());
        model.addAttribute("approveCmd", approveCmd);
        model.addAttribute("rejectCmd", rejectCmd);
        model.addAttribute("activeMenu", "loan");
        model.addAttribute("title", "대출 신청 상세");

        return "loanAdmin/loanApplicationDetail";          // 상세 템플릿 이름
    }

    // 신청 상세페이지 - 심사 시작 (UNDER_REVIEW)
    @PostMapping("/applications/{laId}/start-review")
    public String startReview(@PathVariable String laId) {
        log.info("[ADMIN] startReview called laId={}", laId);
        service.startReview(laId); // 내부에서 현재 SUBMITTED일 때만 UNDER_REVIEW로
        return "redirect:/admin/loan/applications/" + laId;
    }

    // 신청상세페이지 - 승인(APPROVE)
    @PostMapping("/applications/{laId}/approve")
    public String approve(@PathVariable String laId,
                          @ModelAttribute("approveCmd") LoanApproveComDTO cmd) {
        service.approve(laId, cmd); // 상태 APPROVED, 승인값 저장
        return "redirect:/admin/loan/applications/" + laId;
    }

    // 신청상세 페이지 - 반려( REJECT)
    @PostMapping("/applications/{laId}/reject")
    public String reject(@PathVariable String laId,
                         @ModelAttribute("rejectCmd") LoanRejectComDTO cmd) {
        service.reject(laId, cmd); // 상태 REJECTED, 사유 저장
        return "redirect:/admin/loan/applications/" + laId;
    }
}
