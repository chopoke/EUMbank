package com.boot.eumbank.bill.controller;

import com.boot.eumbank.bill.core.BillPaymentService;
import com.boot.eumbank.bill.core.BillRateService;
import com.boot.eumbank.bill.dto.UtilityBillDto;
import com.boot.eumbank.bill.entity.BillInvoice;
import com.boot.eumbank.bill.entity.BillPayment;
import com.boot.eumbank.bill.entity.ElectricAvg;
import com.boot.eumbank.bill.infra.KepcoAdapter;
import com.boot.eumbank.bill.infra.KepcoProps;
import com.boot.eumbank.bill.repo.BillInvoiceRepo;
import com.boot.eumbank.bill.repo.BillPaymentRepo;
import com.boot.eumbank.bill.repo.ElectricAvgRepo;
import com.boot.eumbank.bill.repo.UtilityBillRepo;
import com.boot.eumbank.bill.util.PdfUtil;
import com.boot.eumbank.customer.entity.Customer;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Year;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
public class BillController {
    private final BillRateService rate;
    private final BillPaymentService payment;
    private final BillInvoiceRepo invRepo;
    private final UtilityBillRepo utilityBillRepo;
    private final ElectricAvgRepo elecAvgRepo;
    private final BillPaymentRepo paymentRepo;
    private final KepcoAdapter kepco; // 실제 구현 주입
    private final JdbcTemplate jdbc;

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

    // 엔드포인트 추가
    @GetMapping("/utility-bills")
    public ResponseEntity<?> myBills(@AuthenticationPrincipal Customer me) {
        if (me == null) return ResponseEntity.status(401).body(Map.of("error","UNAUTHORIZED"));
        var rows = utilityBillRepo.findByCNo(me.getCustomerNo())
                .stream().map(UtilityBillDto::from).toList();
        return ResponseEntity.ok(Map.of("rows", rows));
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
    public Map<String,Object> electricAvg(
            @RequestParam(required=false) Integer year,
            @RequestParam(required=false) Integer month,
            @RequestParam(required=false) String areaCd) {

        int y = (year  == null || year  < 2000) ? Year.now().getValue()         : year;
        int m = (month == null || month < 1 || month > 12) ? LocalDate.now().getMonthValue() : month;

        if (areaCd != null && !areaCd.isBlank()) {
            var unit = kepco.fetchAvgUnitPrice(y, m, areaCd);
            return Map.of("mode","live","rows", List.of(Map.of(
                    "eaYear", y, "eaMonth", m, "eaAreaCd", areaCd, "eaAvgUnit", unit
            )));
        }
        var rows = elecAvgRepo.findByEaYearAndEaMonth(y, m);
        return Map.of("mode","cache","rows", rows);
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

    @GetMapping("/rates/water/latest")
    public Map<String,Object> waterLatest(){
        var row = jdbc.queryForMap("""
        SELECT wr_base_charge AS base_charge,
               wr_unit_price  AS unit_price,
               wr_eff_from    AS eff_from
        FROM WATER_RATE_TBL
        WHERE wr_eff_from <= CURRENT_TIMESTAMP
        ORDER BY wr_eff_from DESC, wr_id DESC
        LIMIT 1
    """);
        return Map.of("rows", List.of(row));
    }

    @GetMapping("/rates/gas/latest")
    public Map<String,Object> gasLatest(){
        var row = jdbc.queryForMap("""
        SELECT gr_base_charge AS base_charge,
               gr_unit_price  AS unit_price,
               gr_eff_from    AS eff_from
        FROM GAS_RATE_TBL
        WHERE gr_eff_from <= CURRENT_TIMESTAMP
        ORDER BY gr_eff_from DESC, gr_id DESC
        LIMIT 1
    """);
        return Map.of("rows", List.of(row));
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
