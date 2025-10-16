package com.boot.eumbank.mypage.repository;

import com.boot.eumbank.mypage.entity.MypageCustomer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MypageRepository extends JpaRepository<MypageCustomer, Integer> {

}
