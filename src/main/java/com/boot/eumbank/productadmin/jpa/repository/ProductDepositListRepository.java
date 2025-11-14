package com.boot.eumbank.productadmin.jpa.repository;

import com.boot.eumbank.product.entity.product.ProductDepositList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductDepositListRepository extends JpaRepository<ProductDepositList, Integer> {

}


