package com.boot.eumbank.customer.service;

public interface EmailService {
    void sendCode(String toEmail);
    boolean verify(String email, String code);
}
