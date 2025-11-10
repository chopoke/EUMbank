package com.boot.eumbank.bill.controller;

import com.boot.eumbank.bill.core.BillPaymentService;
import com.boot.eumbank.bill.core.BillRateService;
import com.boot.eumbank.bill.entity.BillInvoice;
import com.boot.eumbank.bill.entity.BillPayment;
import com.boot.eumbank.bill.entity.ElectricAvg;
import com.boot.eumbank.bill.infra.KepcoAdapter;
import com.boot.eumbank.bill.repo.BillInvoiceRepo;
import com.boot.eumbank.bill.repo.BillPaymentRepo;
import com.boot.eumbank.bill.repo.ElectricAvgRepo;
import com.boot.eumbank.bill.util.PdfUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/bills") @RequiredArgsConstructor
public class BillController {
    private final BillRateService rate;
    private final BillInvoiceRepo invRepo;
    private final BillPaymentService payment;
    private final ElectricAvgRepo elecAvgRepo;
    private final BillPaymentRepo paymentRepo;
    private final KepcoAdapter kepco; // 실제 구현 주입

    // 청구서 목록: 상태 필터 + 페이지(단순 offset)
    @GetMapping("/{ubNo}/invoices")
    public Map<String,Object> listInvoices(
            @PathVariable Integer ubNo,
            @RequestParam(defaultValue="READY,PAID") String statuses,
            @RequestParam(defaultValue="0") int offset,
            @RequestParam(defaultValue="5") int size) {

        List<String> st = Arrays.asList(statuses.split(","));
        List<BillInvoice> all =
                invRepo.findByUbNoAndBiStatusInOrderByBiYearDescBiMonthDesc(ubNo, st);

        int end = Math.min(offset + size, all.size());
        List<BillInvoice> page = all.subList(offset, end);

        return Map.of(
                "rows", page,
                "total", all.size(),
                "offset", offset,
                "size", size
        );
    }

    // 즉시 납부
    @PostMapping("/{ubNo}/pay-now")
    public BillPayment payNow(@PathVariable Integer ubNo, @RequestParam Integer biNo, @RequestParam Integer aNo){
        // ubNo는 보안상 검증만(해당 biNo가 ubNo 소속인지)
        var inv = invRepo.findById(biNo).orElseThrow();
        if (!Objects.equals(inv.getUbNo(), ubNo)) throw new IllegalArgumentException("mismatch");
        return payment.payNow(biNo, aNo);
    }

    // 요금계산: 프론트가 임의 사용량을 전달
    @GetMapping("/calc/water")
    public Map<String,Object> calcWater(@RequestParam BigDecimal usage){ return Map.of("amount", rate.calcWater(usage)); }

    @GetMapping("/calc/gas")
    public Map<String,Object> calcGas(@RequestParam BigDecimal usage){ return Map.of("amount", rate.calcGas(usage)); }

    // 전기 평균단가 조회(or 캐시)
    @GetMapping("/rates/electric/avg")
    public List<ElectricAvg> electricAvg(@RequestParam int year, @RequestParam int month,
                                         @RequestParam(required=false) String areaCd){
        if (areaCd != null) {
            var price = kepco.fetchAvgUnitPrice(year, month, areaCd); // 외부 호출
            // 필요시 캐시 upsert 로직 추가(생략)
            return List.of(); // 프론트는 단일 area일 때 price만 사용
        }
        return elecAvgRepo.findByEaYearAndEaMonth(year, month);
    }

    @PostMapping("/rates/electric/avg/cache")
    public Map<String,Object> upsertElectricAvg(@RequestParam int year, @RequestParam int month,
                                                @RequestParam String areaCd){
        var price = kepco.fetchAvgUnitPrice(year, month, areaCd);
        var row = new ElectricAvg();
        row.setEaYear(year); row.setEaMonth(month);
        row.setEaAreaCd(areaCd); row.setEaAvgUnit(price);
        row.setEaCreatedAt(java.time.LocalDateTime.now());
        // upsert: 동일 key 존재 시 업데이트
        var existing = elecAvgRepo.findByEaYearAndEaMonth(year, month)
                .stream().filter(e -> e.getEaAreaCd().equals(areaCd)).findFirst();
        existing.ifPresent(e -> row.setEaId(e.getEaId()));
        elecAvgRepo.save(row);
        return Map.of("unit", price);
    }

    // 영수증 텍스트 기반 PDF
    @GetMapping(value="/payments/{bpNo}/receipt", produces="application/pdf")
    public @ResponseBody byte[] receiptPdf(@PathVariable Integer bpNo){
        var p = paymentRepo.findById(bpNo).orElseThrow();
        var inv = invRepo.findById(p.getBiNo()).orElseThrow();
        String title = "EUMBANK 공과금 납부 영수증";
        String body = """
            납부ID: %s
            영수증번호: %s
            청구ID: %s
            금액: %, .0f 원
            납부일시: %s
            비고: 공과금 납부 완료
        """.formatted(p.getBpId(), p.getBpReceiptNo(), inv.getBiId(),
                p.getBpAmount().doubleValue(), p.getBpPaidAt());
        return PdfUtil.textReceipt(title, body);
    }
}
