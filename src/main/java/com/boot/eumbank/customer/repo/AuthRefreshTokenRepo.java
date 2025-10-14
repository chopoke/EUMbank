package com.boot.eumbank.customer.repo;

import com.boot.eumbank.customer.entity.AuthRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface AuthRefreshTokenRepo extends JpaRepository<AuthRefreshToken, Long> {
    Optional<AuthRefreshToken> findByRtHashAndDeleteAtIsNull(String rtHash);
    void deleteByRtHash(String rtHash);
    void deleteByCustomerNo(Integer customerNo);
    long countByCustomerNoAndExpiresAtAfterAndDeleteAtIsNull(Integer customerNo, Instant now);
}
