package com.boot.eumbank.account.open.service.account.Impl;

import com.boot.eumbank.account.open.dto.account.CustomerDTO;
import com.boot.eumbank.account.open.entity.account.Account;
import com.boot.eumbank.account.open.enums.PasswordChangeResult;
import com.boot.eumbank.account.open.enums.PinChangeResult;
import com.boot.eumbank.account.open.jpa.repository.AccountRepository;
import com.boot.eumbank.account.open.jpa.repository.custom.CustomerRepository;
import com.boot.eumbank.account.open.service.account.AccoutService;
import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.entity.QCustomer;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccoutService {

    private final JPAQueryFactory qf;

    private final CustomerRepository customerRepository;

    private final AccountRepository accountRepository;

    private final PasswordEncoder passwordEncoder;

    private Logger logger = LoggerFactory.getLogger(AccoutService.class);


    /**
     * 계좌개설 등록
     * @param customer
     * @param body
     */
    @Override
    @Transactional
    public void registerAccount(CustomerDTO customer, Map<String, Object> body) {
        logger.info("AccountServiceImpl => registerAccount()");

        // 1) payload 파싱
        Map<String, Object> consent = (Map<String, Object>) body.get("consent");
        Map<String, Object> product = (Map<String, Object>) body.get("product");
        Map<String, Object> verification = (Map<String, Object>) body.get("verification");

        accountRepository.registerAccount(customer, consent, product, verification);
    }

    /**
     * 핀등록여부 판단하여, 민증인증 여부 판단하기
     * @return
     */
    @Override
    @Transactional
    public boolean checkPinExists() {
        logger.info("AccountServiceImpl => checkPinExists()");

        // --- 1. 현재 로그인한 사용자(JWT) 정보 가져오기 ---
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer jwtCustomer = (Customer) authentication.getPrincipal();

        // Repository의 QueryDSL 메서드를 호출하여 PIN 존재 여부를 반환
        return customerRepository.existsPinByUsername(jwtCustomer.getCId());
    }

    /**
     * 현재 등록된 사용자의 핀번호 일치 여부
     * @param submittedPin
     * @return
     */
    @Override
    @Transactional
    public Map<String, Object> verifyPin(String submittedPin) {
        logger.info("AccountServiceImpl => verifyPin()");

        // 1. 현재 로그인된 사용자 정보 가져오기
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer jwtCustomer = (Customer) authentication.getPrincipal(); // JWT 토큰 기반이라면 사용자 ID(pk) 또는 이메일일 수 있음

        // 2. DB에서 사용자 정보 조회
        Customer user = customerRepository.findById(jwtCustomer.getCustomerNo()).orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다."));

        // 3. DB에 저장된 해싱된 PIN 가져오기
        String storedHashedPin = user.getPinNumber(); // User 엔티티에 getPin() 메서드가 있다고 가정

        // 4. 입력된 PIN과 저장된 PIN 비교
        // passwordEncoder.matches(평문, 해싱된 값)
        Map<String, Object> map = new HashMap<>();
        //map.put("pinBooleanCheck", passwordEncoder.matches(submittedPin, storedHashedPin));
        map.put("pinBooleanCheck", submittedPin.equals(user.getPinNumber()));
        map.put("name", user.getCNameKr());
        map.put("rrn6", user.getCBirthDt());
        map.put("address", user.getCAddress());
        map.put("rrn13", user.getCRrnHash());
        map.put("email", user.getEmail());
        map.put("phone", user.getCPhoneMobile());

        return map;
    }

    /**
     * pin 번호 변경
     * @param pin
     * @return
     */
    @Override
    @Transactional
    public PinChangeResult changePinNumber(String pin) {
        return accountRepository.changePinNumber(pin);
    }

    /**
     * 비밀번호 변경
     */
    @Override
    @Transactional
    public PasswordChangeResult changePassword(String currentPassword, String newPassword) {

            // 1. 인증 확인
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !(authentication.getPrincipal() instanceof Customer)) {
                logger.error("인증 정보가 없거나 잘못되었습니다.");
                return PasswordChangeResult.CUSTOMER_NOT_FOUND;
            }

            // 2. 고객 정보가져오기
            Customer jwtCustomer = (Customer) authentication.getPrincipal();
            QCustomer a = QCustomer.customer;
            Customer customer = qf.selectFrom(a)
                    .where(a.customerNo.eq(jwtCustomer.getCustomerNo()))
                    .fetchOne();

            // 5. 인증 : 기존 쓰던 패드워드를 알고 있는지 파악
            if (!passwordEncoder.matches(currentPassword, customer.getCPassword())) {
                logger.warn("현재 패스워드랑 일치하지 않습니다.");
                return PasswordChangeResult.DUPLICATE_PASSWORD;
            }

            // 4. 고객 정보
            if (customer == null) {
                logger.error("고객 정보를 찾을 수 없습니다. customerNo: {}", jwtCustomer.getCustomerNo());
                return PasswordChangeResult.CUSTOMER_NOT_FOUND;
            }


            // 5. 새로운 패스워드를 기존과 똑같은지?
            if (passwordEncoder.matches(newPassword, customer.getCPassword())) {
                logger.warn("신규 비밀번호가 기존 패스워드랑 일치합니다..");
                return PasswordChangeResult.DUPLICATE_PASSWORD;
            }

            return accountRepository.changePasswordNumber(jwtCustomer.getCustomerNo(), newPassword);

    }


}
