package com.boot.eumbank.accountCreate.service.account;

import com.boot.eumbank.accountCreate.controller.UserController;
import com.boot.eumbank.customer.entity.QCustomer;
import com.boot.eumbank.accountCreate.dto.VerifyMinSjonRequest;
import com.boot.eumbank.accountCreate.dto.VerifyMinSjonResponse;

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
        System.out.println("reqName = " + reqName);

        QCustomer qCustomer = QCustomer.customer;


        // birthDt(LocalDateTime) → 'yyMMdd' 로 변환해서 6자리 비교
        BooleanExpression rrnMatches =
                Expressions.stringTemplate("DATE_FORMAT({0}, '%y%m%d')", qCustomer.cBirthDt).eq(reqRrn6);

        // 같은 레코드에 (이름, rrn6)에 둘다 일치하는 것이 존재 유무 판단
        boolean bothOk = jpqlQueryFactory.selectOne()
                .from(qCustomer)
                .where(
                        qCustomer.cNameKr.eq(reqName).and(rrnMatches)
                )
                .fetchFirst() != null;

        // 2) 부분 일치(디버깅/UX용): 이름만, rrn6만 일치 여부
        boolean nameOk = bothOk || jpqlQueryFactory.selectOne().from(qCustomer).where(qCustomer.cNameKr.eq(reqName)).fetchFirst() != null;
        boolean rrnOk  = bothOk || jpqlQueryFactory.selectOne().from(qCustomer).where(rrnMatches).fetchFirst() != null;

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
                .build();
    }

    private static String normalizeName(String s) {
        if (s == null) return "";
        return s.replaceAll("\\(.*?\\)", "")  // 괄호 제거
                .replaceAll("[^가-힣A-Za-z]", "")
                .trim();
    }
    private static String digits(String s) { return s == null ? "" : s.replaceAll("\\D", ""); }
    private static String normalizeAddr(String s) {
        if (s == null) return "";
        return s.replaceAll("[\\s-]", "")
                .replace("대한민국","")
                .trim();
    }
    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
}
