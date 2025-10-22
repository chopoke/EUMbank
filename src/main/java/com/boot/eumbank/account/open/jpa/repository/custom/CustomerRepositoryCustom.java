package com.boot.eumbank.account.open.jpa.repository.custom;

public interface CustomerRepositoryCustom {
    boolean existsPinByUsername(String userId);
}
