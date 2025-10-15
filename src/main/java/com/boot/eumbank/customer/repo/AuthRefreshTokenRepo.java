package com.boot.eumbank.customer.repo;

import com.boot.eumbank.customer.entity.AuthRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface AuthRefreshTokenRepo extends JpaRepository<AuthRefreshToken, Long>, AuthRefreshTokenRepoCustom {
    Optional<AuthRefreshToken> findByRtHashAndDeleteAtIsNull(String rtHash);
    long countByCustomerNoAndExpiresAtAfterAndDeleteAtIsNull(Integer customerNo, Instant now);
//    /** 단일 토큰 소프트 삭제 (로그아웃 등) */
//    @Modifying
//    @Query("update AuthRefreshToken t set t.deleteAt = :now, t.deleteReason = :reason " +
//            "where t.rtHash = :hash and t.deleteAt is null")
//    int markDeleted(@Param("hash") String rtHash,
//                    @Param("now") Instant now,
//                    @Param("reason") String reason);
//
//    /** 특정 고객의 살아있는 토큰 전부 소프트 삭제 (과다 토큰 정리용) */
//    @Modifying
//    @Query("update AuthRefreshToken t set t.deleteAt = :now, t.deleteReason = :reason " +
//            "where t.customerNo = :cno and t.deleteAt is null")
//    int markAllDeletedByCustomer(@Param("cno") Integer customerNo,
//                                 @Param("now") Instant now,
//                                 @Param("reason") String reason);
}
