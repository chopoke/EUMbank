package com.boot.eumbank.account.select.service;

import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.select.dto.AccountDetailDTO;
import com.boot.eumbank.account.select.dto.AccountSummaryDTO;
import com.boot.eumbank.account.select.repository.AccountSelectRepository;
import com.boot.eumbank.account.select.repository.DepoSelectRepository;
import com.boot.eumbank.account.select.repository.InstSelectRepository;
import com.boot.eumbank.product.entity.product.ProductDeposit;
import com.boot.eumbank.product.entity.product.ProductInstallment;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountSelectServiceImpl implements AccountSelectService {

    private final AccountSelectRepository accountRepository;
    private final InstSelectRepository instRepo;
    private final DepoSelectRepository depoRepo;

    @Override
    public List<AccountSummaryDTO> list(int c_no) {
        // 기본 입출금계좌들 (Account)
        List<AccountSummaryDTO> basicAcc = accountRepository.findAccountsByCustomer(c_no).stream()
                .map(this::toSummaryDTO).toList();
        // 적금
        List<AccountSummaryDTO> instAcc = instRepo.findByCNo(c_no).stream()
                .map(this::toInstDTO).toList();
        //예금
        List<AccountSummaryDTO> depoAcc = depoRepo.findByCNo(c_no).stream()
                .map(this::toDepoDTO).toList();
        return Stream.of(basicAcc, instAcc, depoAcc).flatMap(List::stream).toList();
    }

    // 페이지네이션
    @Override
    public Page<AccountSummaryDTO> listpage(int c_no, Pageable pageable){
        Page<Account> page = accountRepository
                .findAccountsByCustomer(c_no, pageable);
        return page.map(this::toSummaryDTO);
    }

    @Override
    public Optional<AccountDetailDTO> detail(int a_no) {
        return accountRepository.findById(a_no)
                .map(this::toDetailDTO);
    }
    
    // 예금 상세
    @Override
    public Optional<AccountDetailDTO> depositDetail(int dNo) {
        return depoRepo.findById((long) dNo)
                .map(this::toDepositDetailDTO);
    }

    // 적금 상세
    @Override
    public Optional<AccountDetailDTO> installmentDetail(int iNo) {
        return instRepo.findById((long) iNo)
                .map(this::toInstallmentDetailDTO);
    }

    @Override
    @Transactional
    public void updateNickname(int a_no, String nickName) {
        String trimName = (nickName == null) ?  "" : nickName.trim();
        if(trimName.isEmpty()){
            throw new IllegalArgumentException("별명은 공백일 수 없습니다.");
        }
        if(trimName.length() > 10) {
            throw new IllegalArgumentException("별명은 30자 이내로 입력해주세요.");
        }

        long updateCnt = accountRepository.updateNickname(a_no, trimName);
        if(updateCnt != 1){
            throw new IllegalArgumentException("별명 변경 오류 ");
        }
    }

    // --------- mapping ---------
    private AccountSummaryDTO toSummaryDTO(Account a) {
        AccountSummaryDTO dto = new AccountSummaryDTO();
        dto.setANo(a.getANo());
        dto.setAId(a.getAId());
        dto.setAccountNo(a.getAccountNo());
        dto.setAccountType(a.getAccountType());
        dto.setProductCode(a.getProductCode());
        dto.setCurrency(a.getCurrency());
        dto.setBalance(a.getBalance());
        dto.setNickname(a.getNickname());
        dto.setStatus(a.getStatus());
        dto.setLastTransferAt(a.getLastTxAt());
        return dto;
    }

    // 적금
    private AccountSummaryDTO toInstDTO(ProductInstallment inst){
        AccountSummaryDTO dto = new AccountSummaryDTO();

        dto.setANo(inst.getINo());      //ㅂ ㅓㄴ호
        dto.setAId(inst.getIId());      // 유니크
        dto.setAccountNo(inst.getIAccountNo());     //계좌번호
        dto.setProductCode(inst.getIpNo() != null ? String.valueOf(inst.getIpNo()) : null);
        dto.setAccountType("적금");
        dto.setCurrency(inst.getICurrency() != null ? inst.getICurrency() : "KRW");
        // 타입변환
        long balanceSrc = inst.getIAmount();
        dto.setBalance(BigDecimal.valueOf(balanceSrc));
        dto.setNickname(null);
        dto.setStatus(inst.getIStatus());
        dto.setLastTransferAt(inst.getIUpdatedAt() != null ? inst.getIUpdatedAt() : inst.getIJoinDate());
        return dto;
    }
    // 예금
    private AccountSummaryDTO toDepoDTO(ProductDeposit depo){
        AccountSummaryDTO dto = new AccountSummaryDTO();

        dto.setANo(depo.getDNo());      //ㅂ ㅓㄴ호
        dto.setAId(depo.getDId());      // 유니크
        dto.setAccountNo(depo.getDAccountNo());     //계좌번호
        dto.setProductCode(depo.getDpNo() != null ? String.valueOf(depo.getDpNo()) : null);
        dto.setAccountType("예금");
        dto.setCurrency("KRW");
        long balanceSrc = depo.getDAmount();
        dto.setBalance(BigDecimal.valueOf(balanceSrc));
        dto.setNickname(null);
        dto.setStatus(depo.getDStatus());
        dto.setLastTransferAt(depo.getDUpdatedAt());
        return dto;
    }

    // ========================================= 매핑 DTO 모음
    // 일반계좌
    private AccountDetailDTO toDetailDTO(Account a) {
        AccountDetailDTO dto = new AccountDetailDTO();
        dto.setA_no(a.getANo());
        dto.setA_id(a.getAId());
        dto.setC_no(a.getCNo());
        dto.setA_product_code(a.getProductCode());
        dto.setA_account_no(a.getAccountNo());
        dto.setA_account_type(a.getAccountType());
        dto.setA_currency(a.getCurrency());
        dto.setA_balance(a.getBalance());
        dto.setA_status(a.getStatus());
        dto.setA_rate(a.getRate());
        dto.setA_nickname(a.getNickname());
        dto.setA_opened_at(a.getOpenedAt());
        dto.setA_closed_at(a.getClosedAt());
        dto.setA_last_tx_at(a.getLastTxAt());
        return dto;
    }

    // 예금 상세
    private AccountDetailDTO toDepositDetailDTO(ProductDeposit d) {
        AccountDetailDTO dto = new AccountDetailDTO();
        dto.setA_no(d.getDNo());                           // 화면에서 식별용
        dto.setC_no(d.getCNo());
        dto.setA_product_code(d.getDpNo() != null ? String.valueOf(d.getDpNo()) : null);
        dto.setA_id(d.getDId());
        dto.setA_account_no(d.getDAccountNo());
        dto.setA_account_type("예금");
        dto.setA_currency("KRW");                          // 필요 시 d.getCurrency() 로
        long balanceSrc = d.getDAmount();
        dto.setA_balance(BigDecimal.valueOf(balanceSrc));
        dto.setA_rate(d.getDInterestRate());
        dto.setA_status(d.getDStatus());
        dto.setA_nickname(null);
        dto.setA_rate(d.getDInterestRate());
        dto.setA_opened_at(d.getDJoinDate());
        dto.setA_closed_at(d.getDMaturityDate());
        dto.setA_last_tx_at(d.getDUpdatedAt());
        return dto;
    }

    // 적금 상세
    private AccountDetailDTO toInstallmentDetailDTO(ProductInstallment i) {
        AccountDetailDTO dto = new AccountDetailDTO();
        dto.setA_no(i.getINo());                           // 화면에서 식별용
        dto.setC_no(i.getCNo());
        dto.setA_product_code(i.getIpNo() != null ? String.valueOf(i.getIpNo()) : null);
        dto.setA_id(i.getIId());
        dto.setA_account_no(i.getIAccountNo());
        dto.setA_account_type("적금");
        dto.setA_currency(i.getICurrency() != null ? i.getICurrency() : "KRW");
        long balanceSrc = i.getIAmount();
        dto.setA_balance(BigDecimal.valueOf(balanceSrc));
        dto.setA_rate(i.getIInterestRate());
        dto.setA_status(i.getIStatus());
        dto.setA_rate(i.getIInterestRate());
        dto.setA_nickname(null);
        dto.setA_opened_at(i.getIJoinDate());
        dto.setA_closed_at(i.getIMaturityDate());
        dto.setA_last_tx_at(i.getIUpdatedAt());
        return dto;
    }
}