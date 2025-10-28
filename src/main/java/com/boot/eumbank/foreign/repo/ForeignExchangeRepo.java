package com.boot.eumbank.foreign.repo;

import com.boot.eumbank.foreign.entity.ForeignExchange;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ForeignExchangeRepo extends JpaRepository<ForeignExchange, Integer> {

    Optional<ForeignExchange> findByFeCurCode(String feCurCode);
}