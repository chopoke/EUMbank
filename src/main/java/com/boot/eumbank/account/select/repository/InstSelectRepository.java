package com.boot.eumbank.account.select.repository;

import com.boot.eumbank.product.entity.product.ProductDeposit;
import com.boot.eumbank.product.entity.product.ProductInstallment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InstSelectRepository extends JpaRepository<ProductInstallment, Long> {

    // 적금 계좌 조회
    Optional<List<ProductInstallment>> findByCNo(int c_no);

}
