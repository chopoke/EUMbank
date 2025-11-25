package com.boot.eumbank.account.select.controller;

import com.boot.eumbank.account.select.dto.TransactionDTO;
import com.boot.eumbank.account.select.entity.TransferHistory;
import com.boot.eumbank.account.select.dto.AccountDetailDTO;
import com.boot.eumbank.account.select.dto.AccountSummaryDTO;
import com.boot.eumbank.account.select.repository.TransferHistoryRepository;
import com.boot.eumbank.account.select.service.AccountSelectService;
import com.boot.eumbank.account.select.service.TransferService;
import com.boot.eumbank.customer.entity.Customer;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "https://eumbank.co.kr")
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountListController {

    private final AccountSelectService accountService;
    private final TransferService transferService;

    // 보유 계좌 목록
    @GetMapping
    public List<AccountSummaryDTO> list(@AuthenticationPrincipal Customer customer){
        int cNo = customer.getCustomerNo();
        return accountService.list(cNo);
    }

    // 페이지버전 -- 현재 프론트 미적용
    @GetMapping("/paged")
    public Page<AccountSummaryDTO> listPaged(
            @RequestParam int c_no,
            @PageableDefault(
                    size = 20, sort = "a_no",
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        return accountService.listpage(c_no, pageable);
    }

    // 계좌 상세 --> 단건조회
    @GetMapping("/{a_no}")
    public ResponseEntity<AccountDetailDTO> detail(@PathVariable int a_no) {
        return accountService.detail(a_no).map(ResponseEntity::ok)
                .orElseGet(()-> ResponseEntity.notFound().build());

    }
    // 계좌 상세 : 예금
    @GetMapping("/deposit/{dNo}")
    public ResponseEntity<AccountDetailDTO> depoDetail(@PathVariable int dNo){
        return accountService.depositDetail(dNo)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 계좌 상세  : 적금
    @GetMapping("/installment/{iNo}")
    public ResponseEntity<AccountDetailDTO> instDetail(@PathVariable int iNo){
        return accountService.installmentDetail(iNo)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 거래내역 목록
    @GetMapping("/{a_no}/transfers")
    public Page<TransactionDTO> search(
            @PathVariable("a_no") int a_no,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            Pageable pageable
    ) {
        return transferService.transactions(a_no, type, from, to, pageable);
    }
    // 예금 거래내역
    @GetMapping("/deposit/{dNo}/transfers")
    public Page<TransactionDTO> depositTransfers(
            @PathVariable int dNo,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            Pageable pageable
    ) {
        return transferService.depositTransactions(dNo, type, from, to, pageable);
    }

    // 적금 거래내역
    @GetMapping("/installment/{iNo}/transfers")
    public Page<TransactionDTO> installmentTransfers(
            @PathVariable int iNo,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            Pageable pageable
    ) {
        return transferService.installmentTransactions(iNo, type, from, to, pageable);
    }

    // 별명 변경
    @PostMapping("/{a_no}/alias")
    public ResponseEntity<?> updateNickname(@PathVariable int a_no, @RequestBody AccountDetailDTO dto){
        accountService.updateNickname(a_no, dto.getA_nickname());
        return ResponseEntity.noContent().build();
    }
}

