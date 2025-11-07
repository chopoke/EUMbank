package com.boot.eumbank.bill.repo;

import com.boot.eumbank.bill.entity.BillProvider;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillProviderRepo extends JpaRepository<BillProvider, String> {}
