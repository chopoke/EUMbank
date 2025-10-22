package com.boot.eumbank.account.open.util;

import com.boot.eumbank.customer.entity.Customer;
import com.boot.eumbank.customer.entity.QCustomer;
import com.boot.eumbank.account.open.dto.account.VerifyMinSjonRequest;
import com.boot.eumbank.account.open.dto.account.VerifyMinSjonResponse;

import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPQLQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class KycVerify {

    private final JPQLQueryFactory jpqlQueryFactory;

    private Logger logger = LoggerFactory.getLogger(KycVerify.class);

    public VerifyMinSjonResponse verify(VerifyMinSjonRequest req) {
        // --- 1. 현재 로그인한 사용자(JWT) 정보 가져오기 ---
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Customer jwtCustomer = (Customer) authentication.getPrincipal();

        // --- 2. OCR 정보로 DB에서 사용자 조회 ---
        String reqName = normalizeName(req.getName());
        String reqRrn6 = digits(req.getRrn6());

        QCustomer qCustomer = QCustomer.customer;
        BooleanExpression rrnMatches = Expressions.stringTemplate("DATE_FORMAT({0}, '%y%m%d')", qCustomer.cBirthDt).eq(reqRrn6);

        // OCR 정보와 DB와 일치하는지
        Tuple ocrCustomerData = jpqlQueryFactory
                .select(qCustomer.cEmail, qCustomer.cPhoneMobile)
                .from(qCustomer)
                .where(qCustomer.cNameKr.eq(reqName).and(rrnMatches))
                .fetchOne();

        // --- 3. OCR 조회 결과와 JWT 사용자 정보 비교 ---
        // OCR 정보로 DB에서 사용자를 찾지 못한 경우
        if (ocrCustomerData == null) {
            logger.warn("OCR data does not match any user in DB. Name: {}, RRN6: {}", reqName, reqRrn6);
            return VerifyMinSjonResponse.builder()
                    .ok(false)
                    .message("신분증 정보와 일치하는 사용자가 없습니다.")
                    .build();
        }

        // ✅ 핵심 검증: OCR로 찾은 사용자의 이메일과 JWT 사용자의 이메일이 일치하는가?
        boolean isNameKrVerified = jwtCustomer.getCNameKr().equals(reqName);
        // 1. 'yyMMdd' 포맷터 생성
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyMMdd");
        // 2. JWT 사용자의 생년월일 정보를 포맷팅
        String jwtRrn6 = jwtCustomer.getCBirthDt().format(formatter);
        // 3. 포맷팅된 문자열과 OCR에서 받은 문자열을 비교
        boolean isreqRrn6Verified = jwtRrn6.equals(reqRrn6);

        String email = ocrCustomerData.get(qCustomer.cEmail);
        String phone = ocrCustomerData.get(qCustomer.cPhoneMobile);

        boolean ok = isNameKrVerified && isreqRrn6Verified; // 동일 레코드 우선, 아니면 가중치 룰

        return VerifyMinSjonResponse.builder()
                .ok(ok)
                .message(ok ? "본인 확인 완료" : "본인 정보가 일치하지 않습니다.")
                .matched(VerifyMinSjonResponse.Match.builder()
                        .name(isNameKrVerified)
                        .rrn6(isreqRrn6Verified)
                        .build())
                .email(email)
                .phone(phone)
                .build();
    }

    private static String normalizeName(String s) {
        if (s == null) return "";
        return s.replaceAll("\\(.*?\\)", "")  // 괄호 제거
                .replaceAll("[^가-힣A-Za-z]", "")
                .trim();
    }
    private static String digits(String s) { return s == null ? "" : s.replaceAll("\\D", ""); }
}
