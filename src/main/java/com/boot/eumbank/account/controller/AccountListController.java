package com.boot.eumbank.account.controller;

import com.boot.eumbank.account.entity.TransferHistory;
import com.boot.eumbank.account.dto.AccountDetailDTO;
import com.boot.eumbank.account.dto.AccountSummaryDTO;
import com.boot.eumbank.account.repository.TransferHistoryRepository;
import com.boot.eumbank.account.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountListController {

    private final AccountService accountService;
    private final TransferHistoryRepository transferHistoryRepository;

    // 보유 계좌 목록
    @GetMapping
    public List<AccountSummaryDTO> list(@RequestParam int c_no){
        return accountService.list(c_no);
    }

    // 페이지버전 -- 현재 프론트 미적용
    @GetMapping("/paged")
    public Page<AccountSummaryDTO> listPaged(
            @RequestParam int c_no,
            @PageableDefault(
                    size = 20, sort = "a_no",
                    direction = org.springframework.data.domain.Sort.Direction.DESC
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

     // 거래내역 목록
     @GetMapping("/{a_no}/transfers")
    public Page<TransferHistory> search(
            @PathVariable("a_no") int a_no,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "from", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(value = "to", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            Pageable pageable
    ) {
        Timestamp from_at = (from != null) ? Timestamp.valueOf(from) : null;
        Timestamp to_at   = (to   != null) ? Timestamp.valueOf(to)   : null;
        return transferHistoryRepository.search(a_no, type, from_at, to_at, pageable);
    }
}
