package com.boot.eumbank.account.open.jpa.repository;

import com.boot.eumbank.account.open.dto.account.CustomerDTO;
import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.open.entity.account.QAccount;
import com.boot.eumbank.account.open.util.AccountIds;

import com.boot.eumbank.customer.entity.QCustomer;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringTemplate;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Repository
@RequiredArgsConstructor
public class AccountRepository {

    private final JPAQueryFactory qf;          // QueryDSL 주입 (Config에서 빈 등록)

    private final EntityManager em;

    private final PasswordEncoder passwordEncoder;

    private final Logger logger = LoggerFactory.getLogger(AccountRepository.class);

    public void registerAccount(CustomerDTO customer, Map<String, Object> consent,  Map<String, Object> product, Map<String, Object> verification) {
        logger.info("AccountRepositoryImpl => registerAccount()");

        String newAccountNo = (String) product.get("newAccountNo");  // "110-xxx-xxxxxx"
        String type         = (String) product.get("type");          // "saving" 등
        String mPin         = (String) product.get("mPin");          // 6자리 등
        String nickname     = (String) product.getOrDefault("nickname", "");
        String rrn13FormId  = (String) verification.get("rrn13FormId");
        String addressFromId =  (String) verification.get("addressFromId");
        String pinNumber    =  (String)verification.get("pinNumber");
        String czipcode = "";
        Pattern pattern = Pattern.compile("\\((\\d+)\\)$");
        Matcher matcher = pattern.matcher(addressFromId);

        // 성별 체크하는 곳...
        System.out.println("rrn13FormId" + rrn13FormId);

        if (matcher.find()) {
            // 3. 첫 번째 그룹(숫자 부분)의 값을 가져옵니다.
            czipcode = matcher.group(1);
        }

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
        // account_tbl에 계좌개설에 대한 값 넣기
        Account accountEntity = Account.builder()
                .aId(AccountIds.newId())
                .cNo(Math.toIntExact(customer.getCNo()))                   // FK 연결: CUSTOMER_TBL.c_no
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
        em.persist(accountEntity);   // <-- 여기서 INSERT 예약

        // 고객 테이블

        // 5) pinNumber 암호화
        String encryptedMPin = passwordEncoder.encode(pinNumber);

        // pin_number 넣기
        QCustomer c = QCustomer.customer;

        logger.info("encryptedMPin => " + encryptedMPin);
        logger.info("c.customerNo => " + c.customerNo);
        logger.info("customer.getCNo() => " + customer.getCNo());

        qf.update(c)
                .set(c.pinNumber, pinNumber)
                .set(c.cRrnHash, rrn13FormId)
                .set(c.cAddress, addressFromId)
                .set(c.cZipCode, czipcode)
                .where(c.customerNo.eq(customer.getCNo())).execute();
    }



    private String toYN(Map<String, Object> m, String k) {
        Object v = (m == null) ? null : m.get(k);
        return Boolean.TRUE.equals(v) ? "Y" : "N";
    }

    /**
     *
     * FK 값을 가져오기 위함
     * @param map
     * @return
     */
    public CustomerDTO getAccount(Map<String, Object> map) {
        logger.info("CustomRepositoryImpl => getAccount()");

        QCustomer qCustomer = QCustomer.customer;

        Map<String, Object> product = (Map<String, Object>) map.get("verification");
        String nameFromId = product != null ? (String) product.get("nameFromId") : null;
        String rrn6FromId = product != null ? (String) product.get("rrn6FromId") : null;

        System.out.println("rrn6FromId => " + rrn6FromId);

        StringTemplate birthDateFormatted = Expressions.stringTemplate(
                "DATE_FORMAT({0}, '%y%m%d')",
                qCustomer.cBirthDt
        );

        StringTemplate rrn6FromIdFormatted = Expressions.stringTemplate(
                "DATE_FORMAT({0}, '%y%m%d')",rrn6FromId
        );

        // 2. QueryDSL을 사용하여 DTO로 직접 조회
        logger.info("QueryDSL을 사용하여 DTO로 직접 조회");
        CustomerDTO customer = qf
                .select(Projections.constructor(CustomerDTO.class,
                        qCustomer.customerNo,
                        qCustomer.cNameKr,
                        qCustomer.cBirthDt,
                        qCustomer.email,
                        qCustomer.cPhoneMobile
                ))
                .from(qCustomer)
                .where(
                        qCustomer.cNameKr.eq(nameFromId),       // 조건 1: 이름 일치
                        birthDateFormatted.eq(rrn6FromIdFormatted)       // 조건 2: 생년월일 6자리 일치
                )
                .fetchOne(); // 단일 건 조회 (결과가 없거나 1건)

        return customer;
    }

}
