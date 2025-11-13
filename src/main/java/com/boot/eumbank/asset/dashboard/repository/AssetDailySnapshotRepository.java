package com.boot.eumbank.asset.dashboard.repository;

import com.boot.eumbank.asset.dashboard.entity.AssetDailySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetDailySnapshotRepository extends JpaRepository<AssetDailySnapshot, Integer> {
}
