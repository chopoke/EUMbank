package com.boot.eumbank.account.Open.service;

import com.boot.eumbank.account.Open.controller.UserController;
import com.boot.eumbank.customer.entity.QCustomer;
import com.boot.eumbank.account.Open.dto.VerifyMinSjonRequest;
import com.boot.eumbank.account.Open.dto.VerifyMinSjonResponse;

import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPQLQueryFactory;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KycVerifyService {

    private final JPQLQueryFactory jpqlQueryFactory;

    private Logger logger = LoggerFactory.getLogger(UserController.class);

    public VerifyMinSjonResponse verify(VerifyMinSjonRequest req) {
        String reqName = normalizeName(req.getName());
        String reqRrn6 = digits(req.getRrn6());

        System.out.println("reqRrn6 = " + reqRrn6);
        logger.info("reqRrn6 = " + reqRrn6);
        System.out.println("reqName = " + reqName);
        logger.info("reqName = " + reqName);

        QCustomer qCustomer = QCustomer.customer;

        // birthDt(LocalDateTime) → 'yyMMdd' 로 변환해서 6자리 비교
        BooleanExpression rrnMatches =
                Expressions.stringTemplate("DATE_FORMAT({0}, '%y%m%d')", qCustomer.cBirthDt).eq(reqRrn6);

        // ✅ 1. 쿼리를 한 번만 실행하여 필요한 정보를 모두 가져오도록 최적화합니다.
        Tuple customerData = jpqlQueryFactory
                .select(
                        qCustomer.cEmail,
                        qCustomer.cPhoneMobile
                )
                .from(qCustomer)
                .where(
                        qCustomer.cNameKr.eq(reqName).and(rrnMatches)
                )
                .fetchOne(); // fetchFirst() 대신 fetchOne() 사용, 결과가 없으면 null 반환

        // ✅ 2. 조회된 결과를 바탕으로 응답 객체를 구성합니다.
        boolean bothOk = (customerData != null);

        // 2) 부분 일치(디버깅/UX용): 이름만, rrn6만 일치 여부
        boolean nameOk = bothOk || jpqlQueryFactory.selectOne().from(qCustomer).where(qCustomer.cNameKr.eq(reqName)).fetchFirst() != null;
        boolean rrnOk  = bothOk || jpqlQueryFactory.selectOne().from(qCustomer).where(rrnMatches).fetchFirst() != null;
        String email = customerData.get(qCustomer.cEmail);
        String phone = customerData.get(qCustomer.cPhoneMobile);
        double score = (nameOk ? 0.5 : 0) + (rrnOk ? 0.5 : 0);

        boolean ok = bothOk || score >= 0.8; // 동일 레코드 우선, 아니면 가중치 룰

        return VerifyMinSjonResponse.builder()
                .ok(ok)
                .message(ok ? "본인 확인 완료" : "본인 정보가 일치하지 않습니다.")
                .matched(VerifyMinSjonResponse.Match.builder()
                        .name(nameOk)
                        .rrn6(rrnOk)
                        .build())
                .score(score)
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
