package com.boot.eumbank.bill.core.impl;

import com.boot.eumbank.account.open.enums.FileType;
import com.boot.eumbank.account.open.service.mypage.DocumentMyPageService;
import com.boot.eumbank.bill.core.BillPaymentService;
import com.boot.eumbank.bill.entity.BillPayment;
import com.boot.eumbank.bill.repo.BillInvoiceRepo;
import com.boot.eumbank.bill.repo.BillPaymentRepo;
import com.boot.eumbank.bill.util.PdfUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BillPaymentServiceImpl implements BillPaymentService {
    private final BillInvoiceRepo invoiceRepo;
    private final BillPaymentRepo paymentRepo;
    private final JdbcTemplate jdbc; // 계좌 차감 및 거래내역 기록용(기존 스키마에 맞춤)
    private final DocumentMyPageService documentMyPageService;

    @Transactional
    @Override
    public BillPayment payNow(Integer biNo, Integer aNo) {
        var inv = invoiceRepo.findById(biNo).orElseThrow();
        if (!"READY".equals(inv.getBiStatus())) throw new IllegalStateException("이미 처리됨");

        BigDecimal amt = inv.getBiAmount();

        // 1) 계좌 잔액 차감
        int debited = jdbc.update(
                "UPDATE account_tbl SET a_balance = a_balance - ? " +
                        "WHERE a_no = ? AND a_balance >= ?",
                amt, aNo, amt
        );
        if (debited != 1) throw new IllegalStateException("잔액 부족");

        // 2) 거래내역 INSERT: 출금 표시
        jdbc.update("""
      INSERT INTO transfer_history_tbl
      (a_no, th_account_in, th_account_out, th_after_balance, th_amount,
       th_transfer_at, th_transfer_id, th_transfer_type, th_memo, th_other_account, th_other_bank, th_transaction_type)
      SELECT ?, NULL, ?, a_balance, ?, NOW(6), ?, '출금',
             ?, NULL, NULL, 'WITHDRAWAL'
      FROM account_tbl WHERE a_no = ?
    """,
                aNo, amt,               // a_no, th_account_out
                amt,                    // th_amount는 절대값 보관
                "BP-" + biNo + "-" + UUID.randomUUID().toString().substring(0, 8),
                memoFor(inv.getUbNo()),
                aNo
        );

        // 3) 납부 이력 저장
        var p = new BillPayment();
        p.setBiNo(biNo);
        p.setANo(aNo);
        p.setBpId("BP-" + biNo + "-" + System.currentTimeMillis());
        p.setBpAmount(amt);
        p.setBpStatus("COMPLETED");
        p.setBpReceiptNo("RC-" + UUID.randomUUID().toString().substring(0, 12));
        p.setBpPaidAt(LocalDateTime.now());
        p.setBpCreatedAt(LocalDateTime.now());
        var saved = paymentRepo.save(p);

        // 4) 청구 상태 갱신
        inv.setBiStatus("PAID");
        invoiceRepo.save(inv);

        // 5) 영수증 저장 로직 (실패해도 결제는 성공하도록 try-catch 처리)
        try {
            // 5-1) 계좌에 연결된 고객번호 조회
            Integer cNo = jdbc.queryForObject(
                    "SELECT c_no FROM account_tbl WHERE a_no = ?",
                    Integer.class,
                    aNo
            );
            if (cNo == null) {
                throw new IllegalStateException("계좌에 연결된 고객번호(c_no)를 찾을 수 없습니다.");
            }

            // 5-2) 영수증 PDF 본문 구성 ("라벨: 값" 형식)
            String providerLabel = memoFor(inv.getUbNo()); // 예: "공과금 납부(전기)" 등
            String body = """
                청구번호: %d
                납부금액: %s원
                납부계좌: %d
                공급자: %s
                납부일시: %s
                영수증번호: %s
                """.formatted(
                    inv.getBiNo(),
                    amt.toPlainString(),
                    aNo,
                    providerLabel,
                    saved.getBpPaidAt(),
                    saved.getBpReceiptNo()
            );

            // 5-3) PDF 생성 (PdfUtil.textReceipt 사용)
            byte[] pdfBytes = PdfUtil.textReceipt("공과금 납부 영수증", body);

            // 5-4) 증빙서류용 논리 파일명 설정 (화면에 보일 이름)
            String fileName = "공과금_영수증_" + saved.getBpReceiptNo() + ".pdf";

            // 5-5) 증빙서류(document_tbl)에 저장 (FileType.공과금영수증)
            documentMyPageService.saveGeneratedDocument(
                    pdfBytes,
                    FileType.공과금영수증,
                    cNo,        // 고객번호
                    aNo,        // 계좌번호
                    fileName
            );
        } catch (Exception e) {
            // 여기서 예외가 나도 결제는 이미 완료된 상태이므로, 로그만 남기고 흘려보낸다.
            // (필요하면 logger 주입해서 info/error 로 남겨도 됨)
            System.err.println("공과금 영수증 저장 중 예외 발생 (결제는 성공 상태): " + e.getMessage());
            e.printStackTrace();
        }

        return saved;
    }



    private String memoFor(Integer ubNo){
        // ub_no -> 공급자 종류를 조인해 "공과금 납부(전기/수도/가스)" 메모 생성 (간단화)
        String kind = jdbc.queryForObject("""
      SELECT bp.bp_kind FROM utility_bill_tbl ub
      JOIN bill_provider_tbl bp ON bp.bp_code = ub.bp_code
      WHERE ub.ub_no = ?
    """, String.class, ubNo);
        return switch (kind) {
            case "ELEC" -> "공과금 납부(전기)";
            case "WATER"-> "공과금 납부(수도)";
            case "GAS"  -> "공과금 납부(가스)";
            default     -> "공과금 납부";
        };
    }
}
