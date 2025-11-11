package com.boot.eumbank.asset.peer.repository;

import com.boot.eumbank.asset.peer.entity.AssetManagementData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssetManagementDataRepository extends JpaRepository<AssetManagementData, Integer> {

}
