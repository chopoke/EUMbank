package com.boot.eumbank.account.select.repository;

import com.boot.eumbank.product.entity.product.ProductDeposit;
import com.boot.eumbank.product.entity.product.ProductInstallment;
import org.apache.ibatis.annotations.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InstSelectRepository extends JpaRepository<ProductInstallment, Long> {

    // 적금 계좌 조회
    @Query("select i from ProductInstallment i where i.cNo = :cNo")
    List<ProductInstallment> findByCNo(@Param("cNo") int cNo);

}
