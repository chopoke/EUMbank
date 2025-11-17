package com.boot.eumbank.asset.dashboard.repository;

import com.boot.eumbank.asset.dashboard.entity.AssetDailySnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface AssetDailySnapshotRepository extends JpaRepository<AssetDailySnapshot, Integer> {
    Optional<AssetDailySnapshot> findByCnoAndAdsYmd(Integer cNo, LocalDate adsYmd);
}
