package com.boot.eumbank.customer.service;

public interface CustomerService {
    // 이메일이 DB에 존재하면 true
    boolean emailExists(String email);
}
