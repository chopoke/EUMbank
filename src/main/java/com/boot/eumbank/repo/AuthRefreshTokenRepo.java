package com.boot.eumbank.repo;

import com.boot.eumbank.entity.AuthRefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthRefreshTokenRepo extends JpaRepository<AuthRefreshToken, Long> {
    Optional<AuthRefreshToken> findByRtHash(String rtHash);
    void deleteByRtHash(String rtHash);
}
