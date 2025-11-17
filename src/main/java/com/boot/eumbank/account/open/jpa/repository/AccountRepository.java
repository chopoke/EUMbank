package com.boot.eumbank.account.open.jpa.repository;

import com.boot.eumbank.account.open.dto.account.CustomerDTO;
import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.open.entity.account.QAccount;
import com.boot.eumbank.account.open.enums.PasswordChangeResult;
import com.boot.eumbank.account.open.enums.PinChangeResult;
import com.boot.eumbank.account.open.util.AccountIds;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.entity.QCustomer;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringTemplate;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Repository
@RequiredArgsConstructor
public class AccountRepository {

    private final JPAQueryFactory qf;          // QueryDSL 주입 (Config에서 빈 등록)

    private final EntityManager em;

    private final BCryptPasswordEncoder passwordEncoder;

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

        if (matcher.find()) {
            // 3. 첫 번째 그룹(숫자 부분)의 값을 가져옵니다. (우편번호)
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

        // 2.5) 고객 테이블에 gender 컬럼에 데이터 넣기
        String gender = "";
        char genderDigit = rrn13FormId.charAt(7);
        // char를 숫자로 직접 비교하기 위해 '1', '3' 과 같이 따옴표로 감싸서 비교합니다.
        if (genderDigit == '1' || genderDigit == '3') {
            gender = "M";
        } else if (genderDigit == '2' || genderDigit == '4') {
            gender = "F";
        } else {
            // 예외 처리 (규칙에 맞지 않는 경우)
            gender = "Unknown";
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

        // 5) pinNumber 암호화
        String encryptedMPin = passwordEncoder.encode(pinNumber);

        // pin_number 넣기
        QCustomer c = QCustomer.customer;

        logger.info("encryptedMPin => " + encryptedMPin);
        logger.info("c.customerNo => " + c.customerNo);
        logger.info("customer.getCNo() => " + customer.getCNo());

        qf.update(c)
                // ▼ c.pinNumber 필드에 대한 조건부 set
                .set(c.pinNumber, new CaseBuilder()
                        // 1. WHEN: c.pinNumber가 NULL일 때 (존재하지 않는다면)
                        .when(c.pinNumber.isNull().or(c.pinNumber.eq("")))
                        // 2. THEN: 새로운 pinNumber 값으로 세팅 (업데이트)
                        .then(pinNumber)
                        // 3. ELSE: 그 외의 경우 (이미 존재한다면)
                        //    c.pinNumber 자신(기존 값)으로 세팅 (업데이트 안 함)
                        .otherwise(c.pinNumber)
                )
                // ▼ 나머지 필드는 항상 업데이트
                .set(c.cGenderCd, gender)
                .set(c.cRrnHash, rrn13FormId)
                .set(c.cAddress, addressFromId)
                .set(c.cZipCode, czipcode)
                .where(c.customerNo.eq(customer.getCNo()))
                .execute();
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

    /**
     * PIN 번호 변경
     * @param pin     새로운 PIN
     */
    public PinChangeResult changePinNumber(String pin) {
        logger.info("AccountRepository => changePinNumber()");

        try {
            // 1. 인증 확인
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !(authentication.getPrincipal() instanceof Customer)) {
                logger.error("인증 정보가 없거나 잘못되었습니다.");
                return PinChangeResult.CUSTOMER_NOT_FOUND;
            }

            Customer jwtCustomer = (Customer) authentication.getPrincipal();
            QCustomer a = QCustomer.customer;
            Instant now = Instant.now();

            // 2. PIN 형식 검증 (6자리 숫자)
            if (pin == null || !pin.matches("^\\d{6}$")) {
                logger.error("잘못된 PIN 형식: {}", pin);
                return PinChangeResult.INVALID_FORMAT;
            }

            // 3. 현재 사용자의 PIN 정보 조회
            Customer customer = qf.selectFrom(a)
                    .where(a.customerNo.eq(jwtCustomer.getCustomerNo()))
                    .fetchOne();

            // 4. 고객 정보 null 체크 (안전하게)
            if (customer == null) {
                logger.error("고객 정보를 찾을 수 없습니다. customerNo: {}", jwtCustomer.getCustomerNo());
                return PinChangeResult.CUSTOMER_NOT_FOUND;
            }

            // 5. 새로운 PIN과 현재 PIN이 같은지 확인
            if (pin.equals(customer.getPinNumber())) {
                logger.warn("새로운 PIN이 현재 PIN과 동일합니다.");
                return PinChangeResult.DUPLICATE_PIN;
            }

            // 6. PIN 변경 (UPDATE)
            long updatedCount = qf.update(a)
                    .set(a.pinNumber, pin)
                    .set(a.cUpdatedAt, now)
                    .where(a.customerNo.eq(jwtCustomer.getCustomerNo()))
                    .execute();

            if (updatedCount > 0) {
                logger.info("PIN 변경 완료. customerNo: {}", jwtCustomer.getCustomerNo());
                return PinChangeResult.SUCCESS;
            } else {
                logger.error("PIN 변경 실패. updatedCount: 0");
                return PinChangeResult.UPDATE_FAILED;
            }

        } catch (ClassCastException e) {
            logger.error("인증 정보 타입 변환 오류: {}", e.getMessage(), e);
            return PinChangeResult.CUSTOMER_NOT_FOUND;

        } catch (Exception e) {
            logger.error("PIN 변경 중 예외 발생: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            return PinChangeResult.ERROR;
        }
    }

    /**
     * 패스워드 번호 변경
     * @param password     새로운 PIN
     */
    @Transactional
    public PasswordChangeResult changePasswordNumber(Integer CustomerNo, String password) {
        logger.info("AccountRepository => changePasswordNumber()");

        QCustomer a = QCustomer.customer;
        Instant now = Instant.now();

        // 6. PIN 변경 (UPDATE)
        long updatedCount = qf.update(a)
                .set(a.cPassword, passwordEncoder.encode(password))
                .set(a.cUpdatedAt, now)
                .where(a.customerNo.eq(CustomerNo))
                .execute();

        if(updatedCount > 0) {
            return PasswordChangeResult.SUCCESS;
        } else {
            return PasswordChangeResult.UPDATE_FAILED;
        }
    }
}