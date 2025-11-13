package com.boot.eumbank.asset.peer.repository;

import com.boot.eumbank.asset.peer.entity.AssetPeerData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AssetPeerDataRepository extends JpaRepository<AssetPeerData, Integer> {
}
