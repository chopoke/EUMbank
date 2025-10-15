package com.boot.eumbank.customer.repo;

import java.time.Instant;

public interface AuthRefreshTokenRepoCustom {
    int markDeletedWithQueryDsl(String rtHash, Instant now, String reason);
    int markAllDeletedByCustomerWithQueryDsl(Integer customerNo, Instant now, String reason);
}