package com.boot.eumbank.loan.admin.controller;

import com.boot.eumbank.loan.admin.dto.LoanProductSearchDTO;
import com.boot.eumbank.loan.entity.LoanProduct;
import com.boot.eumbank.loan.repository.LoanProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/admin/loan/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class LoanProductAdminPageController {

    private final LoanProductRepository loanProductRepository;

    // 유틸
    private boolean containsIgnoreCase(String src, String keyword) {
        return src != null && src.toLowerCase().contains(keyword.toLowerCase());
    }
    private boolean isEmpty(String s) {
        return s == null || s.isBlank();
    }
    private String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    // 목록
    @GetMapping
    public String list(@ModelAttribute("dto") LoanProductSearchDTO dto, Model model) {

        int page = dto.getPage() == null || dto.getPage() < 0 ? 0 : dto.getPage();
        int size = dto.getSize() == null || dto.getSize() < 1 ? 20 : dto.getSize();

        List<LoanProduct> filtered = loanProductRepository.findAll().stream()
                .filter(p -> isEmpty(dto.getKeyword())
                        || containsIgnoreCase(p.getLoanCode(), dto.getKeyword())
                        || containsIgnoreCase(p.getLoanName(), dto.getKeyword()))
                .filter(p -> isEmpty(dto.getLoanType())
                        || dto.getLoanType().equalsIgnoreCase(nullToEmpty(p.getLoanType())))
                .filter(p -> isEmpty(dto.getStatus())
                        || dto.getStatus().equalsIgnoreCase(nullToEmpty(p.getStatus())))
                .filter(p -> dto.getActive() == null
                        || (p.getIsActive() != null && p.getIsActive().equals(dto.getActive())))
                .sorted((a, b) -> Long.compare(
                        b.getLoanNo() == null ? 0L : b.getLoanNo(),
                        a.getLoanNo() == null ? 0L : a.getLoanNo())
                )
                .collect(Collectors.toList());

        int from = page * size;
        int to = Math.min(from + size, filtered.size());
        List<LoanProduct> content = from >= filtered.size()
                ? Collections.emptyList()
                : filtered.subList(from, to);

        Page<LoanProduct> pageResult =
                new PageImpl<>(content, PageRequest.of(page, size), filtered.size());

        model.addAttribute("page", pageResult);
        model.addAttribute("products", content);
        model.addAttribute("activeMenu", "loan");
        model.addAttribute("title", "대출 상품 관리");

        return "loanAdmin/loanProductList";
    }

    // 신규 등록 폼
    @GetMapping("/new")
    public String createForm(Model model) {
        LoanProduct product = new LoanProduct();
        product.setStatus("DRAFT");
        product.setIsActive(true);
        product.setSourceType("ADMIN");

        model.addAttribute("product", product);
        model.addAttribute("activeMenu", "loan");
        model.addAttribute("title", "대출 상품 등록");
        return "loanAdmin/loanProductForm";
    }

    // 신규 등록 처리
    @PostMapping
    public String create(@ModelAttribute("product") LoanProduct product, Model model) {

        // 상품코드 중복 체크
        if (product.getLoanCode() != null && !product.getLoanCode().isBlank()) {
            if (loanProductRepository.existsByLoanCode(product.getLoanCode())) {
                model.addAttribute("product", product);
                model.addAttribute("activeMenu", "loan");
                model.addAttribute("title", "대출 상품 등록");
                model.addAttribute("codeError", "이미 사용 중인 상품코드입니다. 다른 코드로 입력해주세요.");
                return "loanAdmin/loanProductForm";
            }
        }

        // 기본값 세팅
        if (product.getStatus() == null) product.setStatus("DRAFT");
        if (product.getIsActive() == null) product.setIsActive(true);
        if (product.getSourceType() == null) product.setSourceType("ADMIN");
        if (product.getBankName() == null || product.getBankName().isBlank()) {
            product.setBankName("EumBank");
        }
        if (isEmpty(product.getFinCoNo())) {
            product.setFinCoNo("0000001");
        }

        loanProductRepository.save(product);
        return "redirect:/admin/loan/products";
    }

    // 수정 폼
    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable("id") Long id, Model model) {
        LoanProduct product = loanProductRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품 없음: " + id));

        model.addAttribute("product", product);
        model.addAttribute("activeMenu", "loan");
        model.addAttribute("title", "대출 상품 수정");
        return "loanAdmin/loanProductForm";
    }

    // 수정 처리
    @PostMapping("/{id}")
    public String update(@PathVariable("id") Long id,
                         @ModelAttribute("product") LoanProduct form,
                         Model model) {

        LoanProduct product = loanProductRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("상품 없음: " + id));

        // 상품코드 중복 체크 (자기 자신 제외)
        String newCode = form.getLoanCode();
        if (newCode != null && !newCode.isBlank()) {
            Optional<LoanProduct> other = loanProductRepository.findByLoanCode(newCode);
            if (other.isPresent() && !other.get().getLoanNo().equals(id)) {
                model.addAttribute("product", form);
                model.addAttribute("activeMenu", "loan");
                model.addAttribute("title", "대출 상품 수정");
                model.addAttribute("codeError", "이미 다른 상품에서 사용 중인 코드입니다.");
                return "loanAdmin/loanProductForm";
            }
        }

        // 은행명
        if (form.getBankName() != null && !form.getBankName().isBlank()) {
            product.setBankName(form.getBankName());
        } else if (product.getBankName() == null || product.getBankName().isBlank()) {
            product.setBankName("EumBank");
        }

        // 금융회사 코드
        if (!isEmpty(form.getFinCoNo())) {
            product.setFinCoNo(form.getFinCoNo());
        } else if (isEmpty(product.getFinCoNo())) {
            product.setFinCoNo("0000001");
        }

        // 나머지 필드
        product.setLoanCode(form.getLoanCode());
        product.setLoanName(form.getLoanName());
        product.setLoanType(form.getLoanType());
        product.setRateMin(form.getRateMin());
        product.setRateMax(form.getRateMax());
        product.setLimitMax(form.getLimitMax());
        product.setLtvMax(form.getLtvMax());
        product.setStatus(form.getStatus());
        product.setIsActive(form.getIsActive());
        product.setSourceType(form.getSourceType());
        product.setSummary(form.getSummary());

        loanProductRepository.save(product);
        return "redirect:/admin/loan/products";
    }

    // 삭제
    @PostMapping("/{id}/delete")
    public String delete(@PathVariable("id") Long id) {
        loanProductRepository.deleteById(id);
        return "redirect:/admin/loan/products";
    }

}
