package com.boot.eumbank.asset.peer.repository;

import com.boot.eumbank.asset.peer.entity.AssetManagementData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssetManagementDataRepository extends JpaRepository<AssetManagementData, Integer> {
    Optional<AssetManagementData> findByCno(Integer cno);
}
