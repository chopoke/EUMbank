package com.boot.eumbank.service.account.Impl;

import com.boot.eumbank.dto.CustomerDTO;
import com.boot.eumbank.model.Account;
import com.boot.eumbank.model.QAccount;
import com.boot.eumbank.repository.custom.AccountCustom;
import com.boot.eumbank.service.account.AccountService;
import com.boot.eumbank.util.AccountIds;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class AccountRepositoryImpl implements AccountCustom {

    private final EntityManager em;

    private final AccountService accountService;

    private final Logger logger = LoggerFactory.getLogger(AccountRepositoryImpl.class);

    private final JPAQueryFactory qf;          // QueryDSL 주입 (Config에서 빈 등록)

    @Override
    @Transactional
    public void registerAccount(CustomerDTO customer, Map<String, Object> body) {

        // 1) payload 파싱
        Map<String, Object> consent = (Map<String, Object>) body.get("consent");
        Map<String, Object> product = (Map<String, Object>) body.get("product");

        String newAccountNo = (String) product.get("newAccountNo");  // "110-xxx-xxxxxx"
        String type         = (String) product.get("type");          // "saving" 등
        String mPin         = (String) product.get("mPin");          // 6자리 등
        String nickname     = (String) product.getOrDefault("nickname", "");

        // 2) 중복 체크 (QueryDSL)
        QAccount a = QAccount.account;
        boolean exists = qf.selectOne()
                .from(a)
                .where(a.accountNo.eq(newAccountNo))
                .fetchFirst() != null;
        if (exists) {
            throw new IllegalStateException("이미 존재하는 계좌번호입니다: " + newAccountNo);
        }

        // 3) 엔티티 생성 (INSERT 대상)
        Account entity = Account.builder()
                .aId(AccountIds.newId())
                .cNo(customer.getCNo())                   // FK 연결: CUSTOMER_TBL.c_no
                .accountNo(newAccountNo)
                .appId(1)
                .productCode(type)                        // 필요시 매핑 테이블 두세요
                .accountType(type)
                .openedAt(LocalDateTime.now())
                .accountPwd(mPin)             // 평문 저장 금지
                .status("ACTIVE")
                .balance(BigDecimal.ZERO)
                .currency("KRW")
                .nickname(nickname)
                .createdBy("SYSTEM")
                .updatedAt(LocalDateTime.now())
                .agreeTerms(toYN(consent, "all"))         // 혹은 eContract/terms 분리
                .agreePrivacy(toYN(consent, "privacy"))
                .agreeMarketing(toYN(consent, "marketing"))
                .rate(BigDecimal.ZERO)
                .build();

        // 4) INSERT
        em.persist(entity);   // <-- 여기서 INSERT 예약
        em.flush();           // 즉시 DB 반영이 필요하면 flush (트랜잭션 커밋 시점에도 반영됨)
    }



    private String toYN(Map<String, Object> m, String k) {
        Object v = (m == null) ? null : m.get(k);
        return Boolean.TRUE.equals(v) ? "Y" : "N";
    }

}
