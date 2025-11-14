package com.boot.eumbank.loan.admin.controller;

import com.boot.eumbank.loan.admin.dto.LoanProductSearchDTO;
import com.boot.eumbank.loan.admin.service.ProductAdminService;
import com.boot.eumbank.loan.entity.LoanProduct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@Controller
@RequestMapping("/admin/loan/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class LoanProductAdminPageController {

    private final ProductAdminService productAdminService;


    // 목록
    @GetMapping
    public String list(@ModelAttribute("dto") LoanProductSearchDTO dto, Model model) {
        Page<LoanProduct> page = productAdminService.searchProducts(dto);
        model.addAttribute("page", page);
        model.addAttribute("products", page.getContent());
        model.addAttribute("activeMenu", "loan");
        model.addAttribute("title", "대출 상품 관리");
        return "loanAdmin/loanProductList";
    }

    // 신규 등록 폼
    @GetMapping("/new")
    public String createForm(Model model) {
        model.addAttribute("product", productAdminService.prepareNewProduct());
        model.addAttribute("activeMenu", "loan");
        model.addAttribute("title", "대출 상품 등록");
        return "loanAdmin/loanProductForm";
    }

    // 신규 등록 처리
    @PostMapping
    public String create(@ModelAttribute("product") LoanProduct product,
                         @RequestParam(required = false) List<String> optRpayTypeNmList,
                         @RequestParam(required = false) List<String> optLendRateTypeNmList,
                         @RequestParam(required = false) List<BigDecimal> optLendRateMinList,
                         @RequestParam(required = false) List<BigDecimal> optLendRateMaxList,
                         @RequestParam(required = false) List<String> optNoteList,
                         Model model) {

        productAdminService.createProduct(product, optRpayTypeNmList,optLendRateTypeNmList,
                optLendRateMinList,optLendRateMaxList,optNoteList);
        return "redirect:/admin/loan/products";
    }

    // 수정 폼
    @GetMapping("/{id}/edit")
    public String editForm(@PathVariable("id") Long id, Model model) {
        LoanProduct product = productAdminService.getProductOrThrow(id);
        model.addAttribute("product", product);
        model.addAttribute("rateOptions", productAdminService.getRateOptions(id)); // th:each로 그리면 됨
        model.addAttribute("activeMenu", "loan");
        model.addAttribute("title", "대출 상품 수정");
        return "loanAdmin/loanProductForm";
    }

    // 수정 처리
    @PostMapping("/{id}")
    public String update(@PathVariable("id") Long id,
                         @ModelAttribute("product") LoanProduct form,
                         @RequestParam(required = false) List<String> optRpayTypeNmList,
                         @RequestParam(required = false) List<String> optLendRateTypeNmList,
                         @RequestParam(required = false) List<BigDecimal> optLendRateMinList,
                         @RequestParam(required = false) List<BigDecimal> optLendRateMaxList,
                         @RequestParam(required = false) List<String> optNoteList,
                         Model model) {

        productAdminService.updateProduct(
                id,
                form,
                optRpayTypeNmList,
                optLendRateTypeNmList,
                optLendRateMinList,
                optLendRateMaxList,
                optNoteList
        );
        return "redirect:/admin/loan/products";
    }

    // 삭제
    @PostMapping("/{id}/delete")
    public String delete(@PathVariable("id") Long id) {
        productAdminService.deleteProduct(id);
        return "redirect:/admin/loan/products";
    }

}
