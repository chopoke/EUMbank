package com.boot.eumbank.account.select.repository;

import com.boot.eumbank.product.entity.product.ProductDeposit;
import org.apache.ibatis.annotations.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface DepoSelectRepository extends JpaRepository<ProductDeposit, Long> {

    // 예금 계좌 조회
    @Query("select d from ProductDeposit d where d.cNo = :cNo")
    List<ProductDeposit> findByCNo(@Param("cNo") int cNo);
}
