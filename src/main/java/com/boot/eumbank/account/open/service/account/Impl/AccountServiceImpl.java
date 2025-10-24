package com.boot.eumbank.account.open.service.account.Impl;

import com.boot.eumbank.account.open.dto.account.CustomerDTO;
import com.boot.eumbank.account.open.jpa.repository.custom.CustomerRepository;
import com.boot.eumbank.account.open.jpa.repository.AccountRepository;
import com.boot.eumbank.account.open.service.account.AccoutService;
import com.boot.eumbank.customer.entity.Customer;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccoutService {

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
        map.put("email", user.getCEmail());
        map.put("phone", user.getCPhoneMobile());

        return map;
    }

}
