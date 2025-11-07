package com.boot.eumbank.productadmin.jpa.repository;

import com.boot.eumbank.product.entity.product.ProductInstallmentList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductInstallmentListRepository extends JpaRepository<ProductInstallmentList, Integer> {

}