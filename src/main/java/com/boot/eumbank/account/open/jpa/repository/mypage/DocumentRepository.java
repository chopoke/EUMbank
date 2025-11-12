package com.boot.eumbank.account.open.jpa.repository.mypage;


import com.boot.eumbank.account.open.enums.FileType;
import com.boot.eumbank.product.entity.product.DocumentFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<DocumentFile, Integer> {

    // 모든 문서 조회
    Page<DocumentFile> findBycNo(Long cNo, Pageable pageable);

    // 주민등록증 최신 1건
    Optional<DocumentFile> findFirstBycNoAndTypeOrderByCreatedAtDesc(Long cNo, FileType type);

    // 특정 타입 제외
    Page<DocumentFile> findBycNoAndTypeNot(Long cNo, FileType type, Pageable pageable);
}