package com.boot.eumbank.account.open.jpa.repository.mypage;


import com.boot.eumbank.product.entity.product.DocumentFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentFile, Integer> {
    
    // 고객 번호로 서류 목록 조회 (페이징)
    Page<DocumentFile> findBycNoOrderByCreatedAtDesc(Integer cNo, Pageable pageable);
    
    // 고객 번호로 서류 목록 조회
    List<DocumentFile> findBycNoOrderByCreatedAtDesc(Integer cNo);
}