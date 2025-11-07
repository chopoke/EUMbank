package com.boot.eumbank.account.select.repository;

import com.boot.eumbank.product.entity.product.ProductDeposit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepoSelectRepository extends JpaRepository<ProductDeposit, Long> {

    // 예금 계좌 조회
    Optional<List<ProductDeposit>> findByCNo(int c_no);
}
