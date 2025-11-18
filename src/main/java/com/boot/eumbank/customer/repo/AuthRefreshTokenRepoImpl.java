package com.boot.eumbank.customer.repo;

import com.boot.eumbank.customer.entity.QAuthRefreshToken;
import com.querydsl.jpa.impl.JPAUpdateClause;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;

import java.time.Instant;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class AuthRefreshTokenRepoImpl implements AuthRefreshTokenRepoCustom {

    private final EntityManager em;

    // 토큰 소프트 삭제
    @Override
    public int markDeletedWithQueryDsl(String rtHash, Instant now, String reason) {
        QAuthRefreshToken token = QAuthRefreshToken.authRefreshToken;
        return (int) new JPAUpdateClause(em, token)
                .set(token.deleteAt, now)
                .set(token.deleteReason, reason)
                .where(token.rtHash.eq(rtHash).and(token.deleteAt.isNull()))
                .execute();
    }

    // 토큰 일괄 삭제
    @Override
    public int markAllDeletedByCustomerWithQueryDsl(Integer customerNo, Instant now, String reason) {
        QAuthRefreshToken token = QAuthRefreshToken.authRefreshToken;
        return (int) new JPAUpdateClause(em, token)
                .set(token.deleteAt, now)
                .set(token.deleteReason, reason)
                .where(token.customerNo.eq(customerNo).and(token.deleteAt.isNull()))
                .execute();
    }

}
